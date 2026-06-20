import { io, type Socket } from 'socket.io-client';
import type { Student, RollCallLog, Quiz, QuizStats } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false
    });
  }
  return socketInstance;
}

export interface SocketEvents {
  'rollcall:start': { classroomId: string };
  'rollcall:result': { classroomId: string; student: Student; log: RollCallLog };
  'quiz:published': { quiz: Omit<Quiz, 'correctAnswer' | 'status' | 'finishedAt'> & { publishedAt: string | null } };
  'quiz:update': { quizId: string; stats: QuizStats };
  'quiz:finished': { quizId: string; correctAnswer: string; stats: QuizStats };
  'student:online': { studentId: string; onlineCount: number };
  'student:offline': { studentId: string; onlineCount: number };
  'student:joined': { studentId: string; classroomId: string };
}

export function emitTeacherJoin(classroomId: string) {
  getSocket().emit('teacher:join', { classroomId });
}

export function emitStudentJoin(classroomId: string, studentId?: string, studentName?: string) {
  getSocket().emit('student:join', { classroomId, studentId, studentName });
}

export function connectSocket(): Socket {
  const sock = getSocket();
  if (!sock.connected) sock.connect();
  return sock;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function onEvent<K extends keyof SocketEvents>(event: K, handler: (payload: SocketEvents[K]) => void): () => void {
  const sock = getSocket();
  const wrapped = (payload: unknown) => {
    handler(payload as SocketEvents[K]);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sock.on(event as any, wrapped);
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sock.off(event as any, wrapped);
  };
}
