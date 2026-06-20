import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import TeacherHome from '@/pages/teacher/TeacherHome';
import TeacherClassroom from '@/pages/teacher/TeacherClassroom';
import StudentJoin from '@/pages/student/StudentJoin';
import StudentClassroom from '@/pages/student/StudentClassroom';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teacher" element={<TeacherHome />} />
        <Route path="/teacher/classroom/:classroomId" element={<TeacherClassroom />} />
        <Route path="/student" element={<StudentJoin />} />
        <Route path="/student/classroom/:classroomId" element={<StudentClassroom />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
