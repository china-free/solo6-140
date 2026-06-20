export interface Student {
  id: string;
  classroomId: string;
  name: string;
  studentNo: string;
  avatar: string;
  rollCallCount: number;
  isOnline: boolean;
}

export interface CreateStudentDto {
  name: string;
  studentNo?: string;
  avatar?: string;
}

export interface ImportStudentRow {
  name: string;
  studentNo?: string;
}
