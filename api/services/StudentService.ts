import XLSX from 'xlsx';
import { studentRepository } from '../repositories/StudentRepository';
import type { Student, CreateStudentDto, ImportStudentRow } from '../models/Student';
import { classroomRepository } from '../repositories/ClassroomRepository';

export class StudentService {
  addStudent(classroomId: string, dto: CreateStudentDto): Student {
    const classroom = classroomRepository.findById(classroomId);
    if (!classroom) {
      throw new Error('课堂不存在');
    }
    if (!dto.name || !dto.name.trim()) {
      throw new Error('学生姓名不能为空');
    }
    return studentRepository.create(classroomId, {
      ...dto,
      name: dto.name.trim()
    });
  }

  importFromExcel(classroomId: string, fileBuffer: Buffer): Student[] {
    const classroom = classroomRepository.findById(classroomId);
    if (!classroom) {
      throw new Error('课堂不存在');
    }
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[];
    const importRows: ImportStudentRow[] = [];
    for (const row of rows) {
      const name = String(row['姓名'] || row['name'] || row['Name'] || '').trim();
      if (name) {
        const studentNo = String(row['学号'] || row['编号'] || row['studentNo'] || row['id'] || '').trim();
        importRows.push({ name, studentNo });
      }
    }
    if (importRows.length === 0) {
      throw new Error('未读取到有效学生数据');
    }
    return studentRepository.bulkCreate(classroomId, importRows);
  }

  getStudentsByClassroom(classroomId: string): Student[] {
    return studentRepository.findByClassroomId(classroomId);
  }

  getStudentById(id: string): Student | undefined {
    return studentRepository.findById(id);
  }

  findOrCreateByName(classroomId: string, name: string): Student {
    if (!name || !name.trim()) {
      throw new Error('姓名不能为空');
    }
    const trimmed = name.trim();
    const existing = studentRepository.findByClassroomAndName(classroomId, trimmed);
    if (existing) return existing;
    return studentRepository.create(classroomId, { name: trimmed });
  }

  updateStudentOnlineStatus(studentId: string, isOnline: boolean): Student | undefined {
    return studentRepository.update(studentId, { isOnline });
  }

  deleteStudent(classroomId: string, studentId: string): boolean {
    const classroom = classroomRepository.findById(classroomId);
    if (!classroom) return false;
    const student = studentRepository.findById(studentId);
    if (!student || student.classroomId !== classroomId) return false;
    return studentRepository.delete(studentId);
  }
}

export const studentService = new StudentService();
