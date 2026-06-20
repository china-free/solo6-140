import type { Classroom } from '../models/Classroom';
import { store } from './MemoryStore';
import { generateId, generateClassroomCode, generateTeacherToken } from '../utils/helpers';

export class ClassroomRepository {
  create(name: string, className: string): Classroom {
    const id = generateId();
    let code = generateClassroomCode();
    while (store.getClassroomIdByCode(code)) {
      code = generateClassroomCode();
    }
    const classroom: Classroom = {
      id,
      name,
      className,
      code,
      status: 'active',
      createdAt: new Date(),
      teacherToken: generateTeacherToken()
    };
    store.classrooms.set(id, classroom);
    store.linkCodeToClassroom(code, id);
    return classroom;
  }

  findById(id: string): Classroom | undefined {
    return store.classrooms.get(id);
  }

  findByCode(code: string): Classroom | undefined {
    const classroomId = store.getClassroomIdByCode(code);
    return classroomId ? store.classrooms.get(classroomId) : undefined;
  }

  findAll(): Classroom[] {
    return Array.from(store.classrooms.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  update(id: string, updates: Partial<Omit<Classroom, 'id' | 'createdAt'>>): Classroom | undefined {
    const classroom = store.classrooms.get(id);
    if (!classroom) return undefined;
    const updated = { ...classroom, ...updates };
    store.classrooms.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    const classroom = store.classrooms.get(id);
    if (!classroom) return false;
    store.unlinkCode(classroom.code);
    return store.classrooms.delete(id);
  }
}

export const classroomRepository = new ClassroomRepository();
