import type { Request, Response } from 'express';
import { classroomService } from '../services/ClassroomService';

export const ClassroomController = {
  createClassroom: (req: Request, res: Response) => {
    try {
      const { name, className } = req.body as { name: string; className: string };
      const classroom = classroomService.createClassroom(name, className);
      res.status(201).json({ success: true, data: classroom });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '创建课堂失败';
      res.status(400).json({ success: false, message });
    }
  },

  getClassroom: (req: Request, res: Response) => {
    const { classroomId } = req.params;
    const classroom = classroomService.getClassroomById(classroomId);
    if (!classroom) {
      return res.status(404).json({ success: false, message: '课堂不存在' });
    }
    res.json({ success: true, data: classroom });
  },

  getClassroomByCode: (req: Request, res: Response) => {
    const { code } = req.params;
    const classroom = classroomService.getClassroomByCode(code);
    if (!classroom) {
      return res.status(404).json({ success: false, message: '课堂码无效' });
    }
    res.json({ success: true, data: { id: classroom.id, name: classroom.name, className: classroom.className, code: classroom.code } });
  },

  listClassrooms: (_req: Request, res: Response) => {
    const classrooms = classroomService.getAllClassrooms();
    res.json({ success: true, data: classrooms });
  },

  endClassroom: (req: Request, res: Response) => {
    const { classroomId } = req.params;
    const classroom = classroomService.endClassroom(classroomId);
    if (!classroom) {
      return res.status(404).json({ success: false, message: '课堂不存在' });
    }
    res.json({ success: true, data: classroom });
  },

  deleteClassroom: (req: Request, res: Response) => {
    const { classroomId } = req.params;
    const deleted = classroomService.deleteClassroom(classroomId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: '课堂不存在' });
    }
    res.json({ success: true });
  }
};
