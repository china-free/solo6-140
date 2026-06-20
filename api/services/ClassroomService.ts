import { classroomRepository } from '../repositories/ClassroomRepository';
import { studentRepository } from '../repositories/StudentRepository';
import { rollCallRepository } from '../repositories/RollCallRepository';
import { quizRepository } from '../repositories/QuizRepository';
import type { Classroom } from '../models/Classroom';

export class ClassroomService {
  createClassroom(name: string, className: string): Classroom {
    if (!name || !name.trim()) {
      throw new Error('课程名不能为空');
    }
    if (!className || !className.trim()) {
      throw new Error('班级名不能为空');
    }
    return classroomRepository.create(name.trim(), className.trim());
  }

  getClassroomById(id: string): Classroom | undefined {
    return classroomRepository.findById(id);
  }

  getClassroomByCode(code: string): Classroom | undefined {
    return classroomRepository.findByCode(code?.toUpperCase() || '');
  }

  getAllClassrooms(): Classroom[] {
    return classroomRepository.findAll();
  }

  endClassroom(id: string): Classroom | undefined {
    return classroomRepository.update(id, { status: 'ended' });
  }

  deleteClassroom(id: string): boolean {
    studentRepository.deleteByClassroomId(id);
    rollCallRepository.deleteByClassroomId(id);
    quizRepository.deleteByClassroomId(id);
    return classroomRepository.delete(id);
  }

  verifyTeacherToken(classroomId: string, token: string): boolean {
    const classroom = classroomRepository.findById(classroomId);
    return classroom ? classroom.teacherToken === token : false;
  }
}

export const classroomService = new ClassroomService();
