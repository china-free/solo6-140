import type { Request, Response } from 'express';
import { quizService } from '../services/QuizService';
import type { CreateQuizDto } from '../models/Quiz';

export const QuizController = {
  publishQuiz: (req: Request, res: Response) => {
    try {
      const { classroomId } = req.params;
      const dto = req.body as CreateQuizDto;
      const quiz = quizService.createAndPublish(classroomId, dto);
      res.status(201).json({ success: true, data: quiz });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '发布题目失败';
      res.status(400).json({ success: false, message });
    }
  },

  forceFinishQuiz: (req: Request, res: Response) => {
    try {
      const { classroomId, quizId } = req.params;
      const quiz = quizService.forceFinishQuiz(quizId, classroomId);
      if (!quiz) {
        return res.status(404).json({ success: false, message: '题目不存在' });
      }
      res.json({ success: true, data: quiz });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '结束答题失败';
      res.status(400).json({ success: false, message });
    }
  },

  submitAnswer: (req: Request, res: Response) => {
    try {
      const { classroomId } = req.params;
      const { quizId, studentId, answer, startTimeMs } = req.body as {
        quizId: string; studentId: string; answer: string; startTimeMs: number;
      };
      const result = quizService.submitAnswer(quizId, studentId, answer, startTimeMs);
      if (!result) {
        return res.status(400).json({ success: false, message: '提交失败或已提交' });
      }
      res.json({ success: true, data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '提交失败';
      res.status(400).json({ success: false, message });
    }
  },

  getOngoingQuiz: (req: Request, res: Response) => {
    const { classroomId } = req.params;
    const quiz = quizService.getOngoingQuiz(classroomId);
    if (!quiz) {
      return res.json({ success: true, data: null });
    }
    res.json({
      success: true,
      data: {
        id: quiz.id,
        type: quiz.type,
        question: quiz.question,
        options: quiz.options,
        durationSeconds: quiz.durationSeconds,
        publishedAt: quiz.publishedAt
      }
    });
  },

  getQuizStats: (req: Request, res: Response) => {
    const { classroomId, quizId } = req.params;
    const stats = quizService.getQuizStats(quizId);
    const quiz = quizService.getOngoingQuiz(classroomId) ||
      quizService.getQuizHistory(classroomId).find(q => q.id === quizId);
    res.json({
      success: true,
      data: {
        stats,
        correctAnswer: quiz?.status === 'finished' ? quiz.correctAnswer : null
      }
    });
  },

  getQuizHistory: (req: Request, res: Response) => {
    const { classroomId } = req.params;
    const quizzes = quizService.getQuizHistory(classroomId);
    res.json({ success: true, data: quizzes });
  },

  getStudentSubmission: (req: Request, res: Response) => {
    const { quizId, studentId } = req.params;
    const submission = quizService.getSubmissionForStudent(quizId, studentId);
    res.json({ success: true, data: submission || null });
  }
};
