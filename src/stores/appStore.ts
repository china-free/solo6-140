import { create } from 'zustand';
import type { Classroom, Student, RollCallLog, Quiz, QuizStats } from '../types';

type SetValue<T> = T | ((prev: T) => T);

interface AppState {
  currentClassroom: Classroom | null;
  students: Student[];
  rollCallLogs: RollCallLog[];
  currentQuiz: Quiz | null;
  currentQuizStats: QuizStats | null;
  lastRollCall: { student: Student; log: RollCallLog } | null;
  isRolling: boolean;
  onlineCount: number;
  currentStudent: Student | null;
  setCurrentClassroom: (c: SetValue<Classroom | null>) => void;
  setStudents: (s: SetValue<Student[]>) => void;
  addStudent: (s: Student) => void;
  removeStudent: (id: string) => void;
  setRollCallLogs: (logs: SetValue<RollCallLog[]>) => void;
  setCurrentQuiz: (q: SetValue<Quiz | null>) => void;
  setCurrentQuizStats: (s: SetValue<QuizStats | null>) => void;
  setLastRollCall: (r: SetValue<{ student: Student; log: RollCallLog } | null>) => void;
  setIsRolling: (r: SetValue<boolean>) => void;
  setOnlineCount: (n: SetValue<number>) => void;
  setCurrentStudent: (s: SetValue<Student | null>) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentClassroom: null,
  students: [],
  rollCallLogs: [],
  currentQuiz: null,
  currentQuizStats: null,
  lastRollCall: null,
  isRolling: false,
  onlineCount: 0,
  currentStudent: null,
  setCurrentClassroom: (c) =>
    set((state) => ({ currentClassroom: typeof c === 'function' ? (c as (p: Classroom | null) => Classroom | null)(state.currentClassroom) : c })),
  setStudents: (s) =>
    set((state) => ({ students: typeof s === 'function' ? (s as (p: Student[]) => Student[])(state.students) : s })),
  addStudent: (s) => set((state) => ({ students: [...state.students, s] })),
  removeStudent: (id) => set((state) => ({ students: state.students.filter((st) => st.id !== id) })),
  setRollCallLogs: (logs) =>
    set((state) => ({ rollCallLogs: typeof logs === 'function' ? (logs as (p: RollCallLog[]) => RollCallLog[])(state.rollCallLogs) : logs })),
  setCurrentQuiz: (q) =>
    set((state) => ({ currentQuiz: typeof q === 'function' ? (q as (p: Quiz | null) => Quiz | null)(state.currentQuiz) : q })),
  setCurrentQuizStats: (s) =>
    set((state) => ({ currentQuizStats: typeof s === 'function' ? (s as (p: QuizStats | null) => QuizStats | null)(state.currentQuizStats) : s })),
  setLastRollCall: (r) =>
    set((state) => ({ lastRollCall: typeof r === 'function' ? (r as (p: { student: Student; log: RollCallLog } | null) => { student: Student; log: RollCallLog } | null)(state.lastRollCall) : r })),
  setIsRolling: (r) =>
    set((state) => ({ isRolling: typeof r === 'function' ? (r as (p: boolean) => boolean)(state.isRolling) : r })),
  setOnlineCount: (n) =>
    set((state) => ({ onlineCount: typeof n === 'function' ? (n as (p: number) => number)(state.onlineCount) : n })),
  setCurrentStudent: (s) =>
    set((state) => ({ currentStudent: typeof s === 'function' ? (s as (p: Student | null) => Student | null)(state.currentStudent) : s })),
  reset: () => set({
    currentClassroom: null,
    students: [],
    rollCallLogs: [],
    currentQuiz: null,
    currentQuizStats: null,
    lastRollCall: null,
    isRolling: false,
    onlineCount: 0,
    currentStudent: null
  })
}));
