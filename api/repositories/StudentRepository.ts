import type { Student, CreateStudentDto, ImportStudentRow } from '../models/Student';
import { store } from './MemoryStore';
import { generateId, generateAvatar } from '../utils/helpers';

export class StudentRepository {
  create(classroomId: string, dto: CreateStudentDto): Student {
    const id = generateId();
    const student: Student = {
      id,
      classroomId,
      name: dto.name,
      studentNo: dto.studentNo || '',
      avatar: dto.avatar || generateAvatar(dto.name),
      rollCallCount: 0,
      isOnline: false
    };
    store.students.set(id, student);
    return student;
  }

  bulkCreate(classroomId: string, rows: ImportStudentRow[]): Student[] {
    return rows.map(row => this.create(classroomId, row));
  }

  findById(id: string): Student | undefined {
    return store.students.get(id);
  }

  findByClassroomId(classroomId: string): Student[] {
    return Array.from(store.students.values())
      .filter(s => s.classroomId === classroomId)
      .sort((a, b) => a.studentNo.localeCompare(b.studentNo) || a.name.localeCompare(b.name));
  }

  findByClassroomAndName(classroomId: string, name: string): Student | undefined {
    return Array.from(store.students.values())
      .find(s => s.classroomId === classroomId && s.name === name);
  }

  update(id: string, updates: Partial<Omit<Student, 'id' | 'classroomId'>>): Student | undefined {
    const student = store.students.get(id);
    if (!student) return undefined;
    const updated = { ...student, ...updates };
    store.students.set(id, updated);
    return updated;
  }

  incrementRollCallCount(id: string): Student | undefined {
    const student = store.students.get(id);
    if (!student) return undefined;
    const updated = { ...student, rollCallCount: student.rollCallCount + 1 };
    store.students.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return store.students.delete(id);
  }

  deleteByClassroomId(classroomId: string): void {
    const toDelete = Array.from(store.students.values())
      .filter(s => s.classroomId === classroomId)
      .map(s => s.id);
    toDelete.forEach(id => store.students.delete(id));
  }
}

export const studentRepository = new StudentRepository();
