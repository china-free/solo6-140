import type { Request, Response } from 'express';
import { studentService } from '../services/StudentService';
import type { CreateStudentDto } from '../models/Student';

export const StudentController = {
  addStudent: (req: Request, res: Response) => {
    try {
      const { classroomId } = req.params;
      const dto = req.body as CreateStudentDto;
      const student = studentService.addStudent(classroomId, dto);
      res.status(201).json({ success: true, data: student });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '添加学生失败';
      res.status(400).json({ success: false, message });
    }
  },

  importStudents: (req: Request, res: Response) => {
    try {
      const { classroomId } = req.params;
      if (!req.file) {
        return res.status(400).json({ success: false, message: '请上传Excel文件' });
      }
      const students = studentService.importFromExcel(classroomId, req.file.buffer);
      res.json({ success: true, data: students, count: students.length });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '导入学生失败';
      res.status(400).json({ success: false, message });
    }
  },

  listStudents: (req: Request, res: Response) => {
    const { classroomId } = req.params;
    const students = studentService.getStudentsByClassroom(classroomId);
    res.json({ success: true, data: students });
  },

  joinByName: (req: Request, res: Response) => {
    try {
      const { classroomId } = req.params;
      const { name } = req.body as { name: string };
      const student = studentService.findOrCreateByName(classroomId, name);
      res.json({ success: true, data: student });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '加入课堂失败';
      res.status(400).json({ success: false, message });
    }
  },

  deleteStudent: (req: Request, res: Response) => {
    const { classroomId, studentId } = req.params;
    const deleted = studentService.deleteStudent(classroomId, studentId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: '学生不存在' });
    }
    res.json({ success: true });
  }
};
