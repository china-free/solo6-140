export type QuizType = 'choice' | 'judge';
export type QuizStatus = 'draft' | 'ongoing' | 'finished';

export interface QuizOption {
  key: string;
  content: string;
}

export interface Quiz {
  id: string;
  classroomId: string;
  type: QuizType;
  question: string;
  options: QuizOption[];
  durationSeconds: number;
  correctAnswer: string;
  status: QuizStatus;
  publishedAt: Date | null;
  finishedAt: Date | null;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  studentId: string;
  answer: string;
  isCorrect: boolean;
  submittedAt: Date;
  timeTakenMs: number;
  isAutoSubmitted: boolean;
}

export interface CreateQuizDto {
  type: QuizType;
  question: string;
  options: QuizOption[];
  durationSeconds: number;
  correctAnswer: string;
}

export interface QuizStats {
  quizId: string;
  totalStudents: number;
  submittedCount: number;
  autoSubmittedCount: number;
  missedCount: number;
  correctCount: number;
  accuracyRate: number;
  optionCounts: Record<string, number>;
}
