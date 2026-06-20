import type { Classroom } from '../models/Classroom';
import type { Student } from '../models/Student';
import type { RollCallLog } from '../models/RollCallLog';
import type { Quiz, QuizSubmission } from '../models/Quiz';

export class MemoryStore {
  private static instance: MemoryStore;
  public classrooms: Map<string, Classroom> = new Map();
  public students: Map<string, Student> = new Map();
  public rollCallLogs: Map<string, RollCallLog> = new Map();
  public quizzes: Map<string, Quiz> = new Map();
  public quizSubmissions: Map<string, QuizSubmission> = new Map();
  private codeToClassroomId: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): MemoryStore {
    if (!MemoryStore.instance) {
      MemoryStore.instance = new MemoryStore();
    }
    return MemoryStore.instance;
  }

  public linkCodeToClassroom(code: string, classroomId: string): void {
    this.codeToClassroomId.set(code, classroomId);
  }

  public getClassroomIdByCode(code: string): string | undefined {
    return this.codeToClassroomId.get(code);
  }

  public unlinkCode(code: string): void {
    this.codeToClassroomId.delete(code);
  }
}

export const store = MemoryStore.getInstance();
