import type { RollCallLog } from '../models/RollCallLog';
import { store } from './MemoryStore';
import { generateId } from '../utils/helpers';

export class RollCallRepository {
  create(classroomId: string, studentId: string): RollCallLog {
    const logsForClassroom = Array.from(store.rollCallLogs.values())
      .filter(l => l.classroomId === classroomId);
    const sequenceNo = logsForClassroom.length + 1;
    const log: RollCallLog = {
      id: generateId(),
      classroomId,
      studentId,
      calledAt: new Date(),
      sequenceNo
    };
    store.rollCallLogs.set(log.id, log);
    return log;
  }

  findByClassroomId(classroomId: string): RollCallLog[] {
    return Array.from(store.rollCallLogs.values())
      .filter(l => l.classroomId === classroomId)
      .sort((a, b) => b.calledAt.getTime() - a.calledAt.getTime());
  }

  deleteByClassroomId(classroomId: string): void {
    const toDelete = Array.from(store.rollCallLogs.values())
      .filter(l => l.classroomId === classroomId)
      .map(l => l.id);
    toDelete.forEach(id => store.rollCallLogs.delete(id));
  }
}

export const rollCallRepository = new RollCallRepository();
