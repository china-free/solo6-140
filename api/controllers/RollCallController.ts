import type { Request, Response } from 'express';
import { rollCallService } from '../services/RollCallService';
import type { Server as IOServer } from 'socket.io';

export class RollCallController {
  private io: IOServer | null = null;

  setSocketServer(io: IOServer) {
    this.io = io;
  }

  performRollCall = (req: Request, res: Response) => {
    try {
      const { classroomId } = req.params;
      const result = rollCallService.performRollCall(classroomId);
      if (this.io) {
        this.io.to(`classroom:${classroomId}`).emit('rollcall:start', { classroomId });
        setTimeout(() => {
          this.io?.to(`classroom:${classroomId}`).emit('rollcall:result', {
            classroomId,
            student: result.student,
            log: result.log
          });
        }, 1800);
      }
      res.json({ success: true, data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '点名失败';
      res.status(400).json({ success: false, message });
    }
  };

  getLogs = (req: Request, res: Response) => {
    const { classroomId } = req.params;
    const logs = rollCallService.getLogsByClassroom(classroomId);
    res.json({ success: true, data: logs });
  };
}

export const rollCallController = new RollCallController();
