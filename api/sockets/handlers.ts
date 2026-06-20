import type { Server as IOServer, Socket } from 'socket.io';
import { studentService } from '../services/StudentService';
import { classroomService } from '../services/ClassroomService';

export function setupSocketHandlers(io: IOServer) {
  io.on('connection', (socket: Socket) => {
    socket.on('teacher:join', ({ classroomId }: { classroomId: string }) => {
      const classroom = classroomService.getClassroomById(classroomId);
      if (classroom) {
        socket.join(`classroom:${classroomId}`);
        socket.data.classroomId = classroomId;
        socket.data.role = 'teacher';
      }
    });

    socket.on('student:join', ({ classroomId, studentId, studentName }: { classroomId: string; studentId?: string; studentName?: string }) => {
      const classroom = classroomService.getClassroomById(classroomId);
      if (!classroom) {
        socket.emit('student:join:error', { message: '课堂不存在' });
        return;
      }
      let finalStudentId = studentId;
      if (!finalStudentId && studentName) {
        try {
          const student = studentService.findByName(classroomId, studentName);
          finalStudentId = student.id;
        } catch (e: unknown) {
          socket.emit('student:join:error', {
            message: e instanceof Error ? e.message : '加入课堂失败'
          });
          return;
        }
      }
      if (!finalStudentId) {
        socket.emit('student:join:error', { message: '学生信息无效' });
        return;
      }
      studentService.updateStudentOnlineStatus(finalStudentId, true);
      socket.join(`classroom:${classroomId}`);
      socket.data.classroomId = classroomId;
      socket.data.studentId = finalStudentId;
      socket.data.role = 'student';
      socket.emit('student:joined', { studentId: finalStudentId, classroomId });
      io.to(`classroom:${classroomId}`).emit('student:online', {
        studentId: finalStudentId,
        onlineCount: studentService.getStudentsByClassroom(classroomId).filter(s => s.isOnline).length
      });
    });

    socket.on('disconnect', () => {
      const { classroomId, studentId, role } = socket.data;
      if (role === 'student' && studentId && classroomId) {
        studentService.updateStudentOnlineStatus(studentId, false);
        io.to(`classroom:${classroomId}`).emit('student:offline', {
          studentId,
          onlineCount: studentService.getStudentsByClassroom(classroomId).filter(s => s.isOnline).length
        });
      }
    });
  });
}
