export type ClassroomStatus = 'active' | 'ended' | 'paused';

export interface Classroom {
  id: string;
  name: string;
  className: string;
  code: string;
  status: ClassroomStatus;
  createdAt: Date;
  teacherToken: string;
}
