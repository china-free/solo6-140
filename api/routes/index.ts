import { Router } from 'express';
import multer from 'multer';
import { ClassroomController } from '../controllers/ClassroomController';
import { StudentController } from '../controllers/StudentController';
import { rollCallController } from '../controllers/RollCallController';
import { QuizController } from '../controllers/QuizController';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/classrooms', ClassroomController.createClassroom);
router.get('/classrooms', ClassroomController.listClassrooms);
router.get('/classrooms/:classroomId', ClassroomController.getClassroom);
router.get('/classrooms/code/:code', ClassroomController.getClassroomByCode);
router.put('/classrooms/:classroomId/end', ClassroomController.endClassroom);
router.delete('/classrooms/:classroomId', ClassroomController.deleteClassroom);

router.post('/classrooms/:classroomId/students', StudentController.addStudent);
router.post('/classrooms/:classroomId/students/import', upload.single('file'), StudentController.importStudents);
router.get('/classrooms/:classroomId/students', StudentController.listStudents);
router.post('/classrooms/:classroomId/students/join', StudentController.joinByName);
router.delete('/classrooms/:classroomId/students/:studentId', StudentController.deleteStudent);

router.post('/classrooms/:classroomId/rollcall', rollCallController.performRollCall);
router.get('/classrooms/:classroomId/rollcall/logs', rollCallController.getLogs);

router.post('/classrooms/:classroomId/quizzes', QuizController.publishQuiz);
router.get('/classrooms/:classroomId/quizzes/current', QuizController.getOngoingQuiz);
router.get('/classrooms/:classroomId/quizzes/history', QuizController.getQuizHistory);
router.post('/classrooms/:classroomId/quizzes/submit', QuizController.submitAnswer);
router.post('/classrooms/:classroomId/quizzes/:quizId/finish', QuizController.forceFinishQuiz);
router.get('/classrooms/:classroomId/quizzes/:quizId/stats', QuizController.getQuizStats);
router.get('/classrooms/:classroomId/quizzes/:quizId/submissions/:studentId', QuizController.getStudentSubmission);

export default router;
