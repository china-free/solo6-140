import type { Student } from '../models/Student';
import type { RollCallLog } from '../models/RollCallLog';
import { studentRepository } from '../repositories/StudentRepository';
import { rollCallRepository } from '../repositories/RollCallRepository';
import { classroomRepository } from '../repositories/ClassroomRepository';

export interface RollCallResult {
  student: Student;
  log: RollCallLog;
}

export class RollCallService {
  pickWeightedRandomStudent(students: Student[]): Student {
    if (students.length === 0) {
      throw new Error('没有学生可选');
    }
    const maxCount = Math.max(...students.map(s => s.rollCallCount));
    const weighted = students.map(s => ({
      student: s,
      weight: Math.pow(maxCount - s.rollCallCount + 1, 2)
    }));
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    for (const item of weighted) {
      random -= item.weight;
      if (random <= 0) return item.student;
    }
    return weighted[weighted.length - 1].student;
  }

  performRollCall(classroomId: string): RollCallResult {
    const classroom = classroomRepository.findById(classroomId);
    if (!classroom) {
      throw new Error('课堂不存在');
    }
    const students = studentRepository.findByClassroomId(classroomId);
    if (students.length === 0) {
      throw new Error('请先添加学生');
    }
    const picked = this.pickWeightedRandomStudent(students);
    const updated = studentRepository.incrementRollCallCount(picked.id);
    const log = rollCallRepository.create(classroomId, picked.id);
    return {
      student: updated || picked,
      log
    };
  }

  getLogsByClassroom(classroomId: string): (RollCallLog & { student?: Student })[] {
    const logs = rollCallRepository.findByClassroomId(classroomId);
    return logs.map(log => ({
      ...log,
      student: studentRepository.findById(log.studentId)
    }));
  }
}

export const rollCallService = new RollCallService();
