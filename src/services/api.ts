import type { Classroom, Student, RollCallLog, Quiz, QuizStats, QuizSubmission, ApiResponse, QuizOption } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { success: false, message: '响应解析失败' };
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || `请求失败: ${res.status}`);
  }
  return data as T;
}

export const classroomApi = {
  create: (name: string, className: string) =>
    request<ApiResponse<Classroom>>('/classrooms', {
      method: 'POST',
      body: JSON.stringify({ name, className })
    }),
  getById: (id: string) =>
    request<ApiResponse<Classroom>>(`/classrooms/${id}`),
  getByCode: (code: string) =>
    request<ApiResponse<{ id: string; name: string; className: string; code: string }>>(`/classrooms/code/${code}`),
  list: () =>
    request<ApiResponse<Classroom[]>>('/classrooms'),
  end: (id: string) =>
    request<ApiResponse<Classroom>>(`/classrooms/${id}/end`, { method: 'PUT' }),
  delete: (id: string) =>
    request<ApiResponse<void>>(`/classrooms/${id}`, { method: 'DELETE' })
};

export const studentApi = {
  add: (classroomId: string, dto: { name: string; studentNo?: string }) =>
    request<ApiResponse<Student>>(`/classrooms/${classroomId}/students`, {
      method: 'POST',
      body: JSON.stringify(dto)
    }),
  importExcel: async (classroomId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${API_BASE}/classrooms/${classroomId}/students/import`;
    const res = await fetch(url, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '导入失败');
    }
    return data as ApiResponse<Student[]>;
  },
  list: (classroomId: string) =>
    request<ApiResponse<Student[]>>(`/classrooms/${classroomId}/students`),
  joinByName: (classroomId: string, name: string) =>
    request<ApiResponse<Student>>(`/classrooms/${classroomId}/students/join`, {
      method: 'POST',
      body: JSON.stringify({ name })
    }),
  delete: (classroomId: string, studentId: string) =>
    request<ApiResponse<void>>(`/classrooms/${classroomId}/students/${studentId}`, { method: 'DELETE' })
};

export const rollCallApi = {
  perform: (classroomId: string) =>
    request<ApiResponse<{ student: Student; log: RollCallLog }>>(`/classrooms/${classroomId}/rollcall`, {
      method: 'POST'
    }),
  logs: (classroomId: string) =>
    request<ApiResponse<RollCallLog[]>>(`/classrooms/${classroomId}/rollcall/logs`)
};

export const quizApi = {
  publish: (classroomId: string, dto: {
    type: 'choice' | 'judge';
    question: string;
    options: QuizOption[];
    durationSeconds: number;
    correctAnswer: string;
  }) =>
    request<ApiResponse<Quiz>>(`/classrooms/${classroomId}/quizzes`, {
      method: 'POST',
      body: JSON.stringify(dto)
    }),
  getCurrent: (classroomId: string) =>
    request<ApiResponse<Quiz | null>>(`/classrooms/${classroomId}/quizzes/current`),
  submitAnswer: (classroomId: string, dto: {
    quizId: string;
    studentId: string;
    answer: string;
    startTimeMs: number;
  }) =>
    request<ApiResponse<{ submission: QuizSubmission; stats: QuizStats }>>(`/classrooms/${classroomId}/quizzes/submit`, {
      method: 'POST',
      body: JSON.stringify(dto)
    }),
  forceFinish: (classroomId: string, quizId: string) =>
    request<ApiResponse<Quiz>>(`/classrooms/${classroomId}/quizzes/${quizId}/finish`, {
      method: 'POST'
    }),
  getStats: (classroomId: string, quizId: string) =>
    request<ApiResponse<{ stats: QuizStats; correctAnswer: string | null }>>(`/classrooms/${classroomId}/quizzes/${quizId}/stats`),
  history: (classroomId: string) =>
    request<ApiResponse<Quiz[]>>(`/classrooms/${classroomId}/quizzes/history`),
  getStudentSubmission: (classroomId: string, quizId: string, studentId: string) =>
    request<ApiResponse<QuizSubmission | null>>(`/classrooms/${classroomId}/quizzes/${quizId}/submissions/${studentId}`)
};
