export type ClassroomStatus = 'active' | 'ended' | 'paused';

export interface Classroom {
  id: string;
  name: string;
  className: string;
  code: string;
  status: ClassroomStatus;
  createdAt: string;
  teacherToken: string;
}

export interface Student {
  id: string;
  classroomId: string;
  name: string;
  studentNo: string;
  avatar: string;
  rollCallCount: number;
  isOnline: boolean;
}

export interface RollCallLog {
  id: string;
  classroomId: string;
  studentId: string;
  calledAt: string;
  sequenceNo: number;
  student?: Student;
}

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
  correctAnswer?: string;
  status: QuizStatus;
  publishedAt: string | null;
  finishedAt?: string | null;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  studentId: string;
  answer: string;
  isCorrect: boolean;
  submittedAt: string;
  timeTakenMs: number;
}

export interface QuizStats {
  quizId: string;
  totalStudents: number;
  submittedCount: number;
  correctCount: number;
  accuracyRate: number;
  optionCounts: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}
