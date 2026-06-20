import type { Quiz, QuizSubmission, CreateQuizDto, QuizStats } from '../models/Quiz';
import { store } from './MemoryStore';
import { generateId } from '../utils/helpers';
import { studentRepository } from './StudentRepository';

export class QuizRepository {
  create(classroomId: string, dto: CreateQuizDto): Quiz {
    const quiz: Quiz = {
      id: generateId(),
      classroomId,
      type: dto.type,
      question: dto.question,
      options: dto.options,
      durationSeconds: dto.durationSeconds,
      correctAnswer: dto.correctAnswer,
      status: 'draft',
      publishedAt: null,
      finishedAt: null
    };
    store.quizzes.set(quiz.id, quiz);
    return quiz;
  }

  findById(id: string): Quiz | undefined {
    return store.quizzes.get(id);
  }

  findOngoingByClassroomId(classroomId: string): Quiz | undefined {
    return Array.from(store.quizzes.values())
      .find(q => q.classroomId === classroomId && q.status === 'ongoing');
  }

  findAllByClassroomId(classroomId: string): Quiz[] {
    return Array.from(store.quizzes.values())
      .filter(q => q.classroomId === classroomId)
      .sort((a, b) => {
        const aTime = a.publishedAt?.getTime() || 0;
        const bTime = b.publishedAt?.getTime() || 0;
        return bTime - aTime;
      });
  }

  update(id: string, updates: Partial<Omit<Quiz, 'id' | 'classroomId'>>): Quiz | undefined {
    const quiz = store.quizzes.get(id);
    if (!quiz) return undefined;
    const updated = { ...quiz, ...updates };
    store.quizzes.set(id, updated);
    return updated;
  }

  publish(id: string): Quiz | undefined {
    return this.update(id, {
      status: 'ongoing',
      publishedAt: new Date()
    });
  }

  finish(id: string): Quiz | undefined {
    return this.update(id, {
      status: 'finished',
      finishedAt: new Date()
    });
  }

  getStats(quizId: string): QuizStats {
    const quiz = this.findById(quizId);
    if (!quiz) {
      return {
        quizId,
        totalStudents: 0,
        submittedCount: 0,
        autoSubmittedCount: 0,
        missedCount: 0,
        correctCount: 0,
        accuracyRate: 0,
        optionCounts: {}
      };
    }
    const studentsInClass = studentRepository.findByClassroomId(quiz.classroomId);
    const submissions = this.getSubmissionsByQuizId(quizId);
    const submittedCount = submissions.filter(s => !s.isAutoSubmitted).length;
    const autoSubmittedCount = submissions.filter(s => s.isAutoSubmitted).length;
    const correctCount = submissions.filter(s => s.isCorrect && !s.isAutoSubmitted).length;
    const optionCounts: Record<string, number> = {};
    quiz.options.forEach(opt => { optionCounts[opt.key] = 0; });
    submissions.filter(s => !s.isAutoSubmitted).forEach(s => {
      if (optionCounts[s.answer] !== undefined) {
        optionCounts[s.answer]++;
      }
    });
    const totalStudents = studentsInClass.length;
    const accuracyRate = totalStudents > 0
      ? Math.round((correctCount / totalStudents) * 10000) / 100
      : 0;
    return {
      quizId,
      totalStudents,
      submittedCount,
      autoSubmittedCount,
      missedCount: autoSubmittedCount,
      correctCount,
      accuracyRate,
      optionCounts
    };
  }

  createSubmission(
    quizId: string,
    studentId: string,
    answer: string,
    timeTakenMs: number,
    isAutoSubmitted: boolean = false
  ): QuizSubmission | null {
    const quiz = this.findById(quizId);
    if (!quiz) return null;
    const existing = Array.from(store.quizSubmissions.values())
      .find(s => s.quizId === quizId && s.studentId === studentId);
    if (existing) return null;
    const submission: QuizSubmission = {
      id: generateId(),
      quizId,
      studentId,
      answer,
      isCorrect: answer === quiz.correctAnswer,
      submittedAt: new Date(),
      timeTakenMs,
      isAutoSubmitted
    };
    store.quizSubmissions.set(submission.id, submission);
    return submission;
  }

  getSubmissionsByQuizId(quizId: string): QuizSubmission[] {
    return Array.from(store.quizSubmissions.values())
      .filter(s => s.quizId === quizId);
  }

  bulkCreateAutoSubmissions(quizId: string): { count: number; total: number } {
    const quiz = this.findById(quizId);
    if (!quiz) return { count: 0, total: 0 };
    const allStudents = studentRepository.findByClassroomId(quiz.classroomId);
    const existingSubs = this.getSubmissionsByQuizId(quizId);
    const submittedStudentIds = new Set(existingSubs.map(s => s.studentId));
    const totalDuration = quiz.durationSeconds * 1000;
    let createdCount = 0;
    for (const student of allStudents) {
      if (submittedStudentIds.has(student.id)) continue;
      this.createSubmission(quizId, student.id, '', totalDuration, true);
      createdCount++;
    }
    return { count: createdCount, total: allStudents.length };
  }

  deleteByClassroomId(classroomId: string): void {
    const quizzes = this.findAllByClassroomId(classroomId);
    quizzes.forEach(q => {
      const subs = this.getSubmissionsByQuizId(q.id);
      subs.forEach(s => store.quizSubmissions.delete(s.id));
      store.quizzes.delete(q.id);
    });
  }
}

export const quizRepository = new QuizRepository();
