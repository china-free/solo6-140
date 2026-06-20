import type { Server as IOServer } from 'socket.io';
import { quizRepository } from '../repositories/QuizRepository';
import { classroomRepository } from '../repositories/ClassroomRepository';
import type { Quiz, QuizSubmission, CreateQuizDto, QuizStats } from '../models/Quiz';

export class QuizService {
  private io: IOServer | null = null;
  private quizTimers: Map<string, NodeJS.Timeout> = new Map();

  setSocketServer(io: IOServer) {
    this.io = io;
  }

  private broadcastStats(classroomId: string, quizId: string) {
    if (!this.io) return;
    const stats = quizRepository.getStats(quizId);
    this.io.to(`classroom:${classroomId}`).emit('quiz:update', { quizId, stats });
  }

  createAndPublish(classroomId: string, dto: CreateQuizDto): Quiz {
    const classroom = classroomRepository.findById(classroomId);
    if (!classroom) {
      throw new Error('课堂不存在');
    }
    if (!dto.question || !dto.question.trim()) {
      throw new Error('题目内容不能为空');
    }
    if (!Array.isArray(dto.options) || dto.options.length < 2) {
      throw new Error('至少需要2个选项');
    }
    if (!dto.correctAnswer || !dto.options.some(o => o.key === dto.correctAnswer)) {
      throw new Error('正确答案必须是有效选项');
    }
    if (dto.durationSeconds < 10 || dto.durationSeconds > 600) {
      throw new Error('答题时间需在10-600秒之间');
    }
    const existing = quizRepository.findOngoingByClassroomId(classroomId);
    if (existing) {
      this.forceFinishQuiz(existing.id, classroomId);
    }
    const quiz = quizRepository.create(classroomId, dto);
    const published = quizRepository.publish(quiz.id)!;
    if (this.io) {
      this.io.to(`classroom:${classroomId}`).emit('quiz:published', {
        quiz: {
          id: published.id,
          type: published.type,
          question: published.question,
          options: published.options,
          durationSeconds: published.durationSeconds,
          publishedAt: published.publishedAt
        }
      });
    }
    this.scheduleFinish(quiz.id, classroomId, dto.durationSeconds);
    return published;
  }

  private scheduleFinish(quizId: string, classroomId: string, durationSeconds: number) {
    const existingTimer = this.quizTimers.get(quizId);
    if (existingTimer) clearTimeout(existingTimer);
    const timer = setTimeout(() => {
      this.forceFinishQuiz(quizId, classroomId);
    }, durationSeconds * 1000);
    this.quizTimers.set(quizId, timer);
  }

  forceFinishQuiz(quizId: string, classroomId: string): Quiz | undefined {
    const timer = this.quizTimers.get(quizId);
    if (timer) {
      clearTimeout(timer);
      this.quizTimers.delete(quizId);
    }
    const quiz = quizRepository.finish(quizId);
    if (quiz && this.io) {
      const stats = quizRepository.getStats(quizId);
      this.io.to(`classroom:${classroomId}`).emit('quiz:finished', {
        quizId,
        correctAnswer: quiz.correctAnswer,
        stats
      });
    }
    return quiz;
  }

  submitAnswer(
    quizId: string,
    studentId: string,
    answer: string,
    startTimeMs: number
  ): { submission: QuizSubmission; stats: QuizStats } | null {
    const quiz = quizRepository.findById(quizId);
    if (!quiz || quiz.status !== 'ongoing') return null;
    const timeTakenMs = Math.max(0, Date.now() - startTimeMs);
    const submission = quizRepository.createSubmission(quizId, studentId, answer, timeTakenMs);
    if (!submission) return null;
    this.broadcastStats(quiz.classroomId, quizId);
    const stats = quizRepository.getStats(quizId);
    return { submission, stats };
  }

  getOngoingQuiz(classroomId: string): Quiz | undefined {
    return quizRepository.findOngoingByClassroomId(classroomId);
  }

  getQuizStats(quizId: string): QuizStats {
    return quizRepository.getStats(quizId);
  }

  getQuizHistory(classroomId: string): Quiz[] {
    return quizRepository.findAllByClassroomId(classroomId);
  }

  getSubmissionForStudent(quizId: string, studentId: string): QuizSubmission | undefined {
    const subs = quizRepository.getSubmissionsByQuizId(quizId);
    return subs.find(s => s.studentId === studentId);
  }
}

export const quizService = new QuizService();
