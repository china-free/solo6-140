import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Volume2, CheckCircle2, AlertCircle, Clock, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { classroomApi, quizApi, studentApi } from '../../services/api';
import { connectSocket, disconnectSocket, emitStudentJoin, onEvent } from '../../sockets';
import { useAppStore } from '../../stores/appStore';
import type { Quiz, QuizStats, Student, RollCallLog } from '../../types';

interface QuizViewState {
  quiz: Quiz;
  startTime: number;
  remaining: number;
  selectedAnswer: string | null;
  submitted: boolean;
  mySubmission: { answer: string; isCorrect: boolean } | null;
  correctAnswer: string | null;
  stats: QuizStats | null;
  isAutoSubmitting: boolean;
}

export default function StudentClassroom() {
  const { classroomId = '' } = useParams();
  const location = useLocation() as { state?: { name?: string } };
  const navigate = useNavigate();

  const currentClassroom = useAppStore(s => s.currentClassroom);
  const setCurrentClassroom = useAppStore(s => s.setCurrentClassroom);
  const setCurrentStudent = useAppStore(s => s.setCurrentStudent);
  const currentStudent = useAppStore(s => s.currentStudent);
  const onlineCount = useAppStore(s => s.onlineCount);
  const setOnlineCount = useAppStore(s => s.setOnlineCount);
  const isRolling = useAppStore(s => s.isRolling);
  const setIsRolling = useAppStore(s => s.setIsRolling);
  const reset = useAppStore(s => s.reset);

  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Student | null>(null);
  const [rollCallCalled, setRollCallCalled] = useState<{ student: Student; log: RollCallLog } | null>(null);
  const [showRollCallModal, setShowRollCallModal] = useState(false);
  const [quizView, setQuizView] = useState<QuizViewState | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const key = `student_${classroomId}`;
    const saved = localStorage.getItem(key);
    let initialName = location.state?.name;
    if (!initialName && saved) {
      initialName = JSON.parse(saved).name;
    }
    if (!initialName) {
      navigate('/student');
      return;
    }
    setStudentName(initialName);

    let cancelled = false;
    const init = async () => {
      try {
        const cr = await classroomApi.getById(classroomId);
        if (!cancelled && cr.data) {
          setCurrentClassroom(cr.data);
          const sr = await studentApi.joinByName(classroomId, initialName!);
          if (sr.data) {
            setMe(sr.data);
            setCurrentStudent(sr.data);
            localStorage.setItem(key, JSON.stringify({ name: initialName, joinedAt: Date.now() }));
          }
          connectSocket();
          if (sr.data) emitStudentJoin(classroomId, sr.data.id, sr.data.name);
          const qz = await quizApi.getCurrent(classroomId);
          if (qz.data) {
            const published = qz.data.publishedAt ? new Date(qz.data.publishedAt).getTime() : Date.now();
            const duration = qz.data.durationSeconds * 1000;
            const start = published;
            const end = published + duration;
            const remain = Math.max(0, Math.ceil((end - Date.now()) / 1000));
            let mySub = null;
            if (sr.data) {
              const subRes = await quizApi.getStudentSubmission(classroomId, qz.data.id, sr.data.id);
              mySub = subRes.data;
            }
            setQuizView({
              quiz: qz.data,
              startTime: start,
              remaining: remain,
              selectedAnswer: mySub?.answer || null,
              submitted: !!mySub,
              mySubmission: mySub ? { answer: mySub.answer, isCorrect: mySub.isCorrect } : null,
              correctAnswer: null,
              stats: null,
              isAutoSubmitting: false
            });
          }
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加入课堂失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
      disconnectSocket();
      reset();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [classroomId, location.state, navigate, setCurrentClassroom, setCurrentStudent, reset]);

  useEffect(() => {
    if (!classroomId || !me) return;
    const off1 = onEvent('student:online', ({ onlineCount: n }) => setOnlineCount(n));
    const off2 = onEvent('student:offline', ({ onlineCount: n }) => setOnlineCount(n));
    const off3 = onEvent('student:joined', () => {});
    const off4 = onEvent('student:join:error', ({ message }) => { setError(message); });
    const off5 = onEvent('rollcall:start', () => { setIsRolling(true); setRollCallCalled(null); setShowRollCallModal(true); });
    const off6 = onEvent('rollcall:result', ({ student, log }: { student: Student; log: RollCallLog }) => {
      setIsRolling(false);
      setRollCallCalled({ student, log });
      setShowRollCallModal(true);
      if (student.id === me.id) {
        navigator.vibrate?.(300);
      }
      setTimeout(() => { setShowRollCallModal(false); }, 6000);
    });
    const off7 = onEvent('quiz:published', ({ quiz }) => {
      const start = Date.now();
      setQuizView({
        quiz: { ...quiz, status: 'ongoing' },
        startTime: start,
        remaining: quiz.durationSeconds,
        selectedAnswer: null,
        submitted: false,
        mySubmission: null,
        correctAnswer: null,
        stats: null,
        isAutoSubmitting: false
      });
    });
    const off8 = onEvent('quiz:update', ({ stats }) => {
      setQuizView(prev => prev ? { ...prev, stats } : prev);
    });
    const off9 = onEvent('quiz:finished', ({ correctAnswer, stats }) => {
      setQuizView(prev => {
        if (!prev) return prev;
        const updated: QuizViewState = {
          ...prev,
          correctAnswer,
          stats,
          quiz: { ...prev.quiz, status: 'finished', correctAnswer, finishedAt: new Date().toISOString() },
          mySubmission: prev.selectedAnswer ? { answer: prev.selectedAnswer, isCorrect: prev.selectedAnswer === correctAnswer } : prev.mySubmission
        };
        return updated;
      });
    });
    return () => { off1(); off2(); off3(); off4(); off5(); off6(); off7(); off8(); off9(); };
  }, [classroomId, me, setOnlineCount, setIsRolling]);

  const autoSubmitRef = useRef(false);

  const doSubmitAnswer = async (answer: string | null, isAuto: boolean = false) => {
    if (!quizView || !me) return;
    setQuizView(prev => prev ? {
      ...prev,
      submitted: true,
      selectedAnswer: answer,
      isAutoSubmitting: isAuto
    } : prev);
    try {
      const finalAnswer = answer || '';
      const res = await quizApi.submitAnswer(classroomId, {
        quizId: quizView.quiz.id,
        studentId: me.id,
        answer: finalAnswer,
        startTimeMs: quizView.startTime
      });
      if (res.data) {
        setQuizView(prev => prev ? {
          ...prev,
          stats: res.data!.stats,
          mySubmission: {
            answer: res.data!.submission.answer,
            isCorrect: res.data!.submission.isCorrect
          },
          isAutoSubmitting: false
        } : prev);
      }
    } catch (err: unknown) {
      console.error('Submit answer failed:', err);
      setQuizView(prev => prev ? { ...prev, isAutoSubmitting: false } : prev);
    }
  };

  const selectAnswer = (answer: string) => {
    if (!quizView || quizView.submitted || quizView.quiz.status !== 'ongoing') return;
    setQuizView(prev => prev ? { ...prev, selectedAnswer: answer } : prev);
  };

  const confirmSubmit = () => {
    if (!quizView || quizView.submitted || quizView.quiz.status !== 'ongoing' || quizView.isAutoSubmitting) return;
    if (!quizView.selectedAnswer) {
      alert('请先选择一个答案');
      return;
    }
    if (!confirm('确认提交答案？提交后无法修改。')) return;
    doSubmitAnswer(quizView.selectedAnswer, false);
  };

  useEffect(() => {
    if (!quizView || quizView.submitted) return;
    if (quizView.quiz.status !== 'ongoing') return;
    timerRef.current = window.setInterval(() => {
      setQuizView(prev => {
        if (!prev) return prev;
        const next = prev.remaining - 1;
        if (next <= 0 && !autoSubmitRef.current) {
          autoSubmitRef.current = true;
          setTimeout(() => {
            doSubmitAnswer(prev.selectedAnswer, true);
          }, 0);
          return { ...prev, remaining: 0 };
        }
        return { ...prev, remaining: Math.max(0, next) };
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      autoSubmitRef.current = false;
    };
  }, [quizView?.quiz.id, quizView?.submitted, quizView?.quiz.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1c3f] via-[#1a2d5c] to-[#0f1c3f] flex items-center justify-center text-white">
        <div className="animate-pulse text-lg">加入课堂中...</div>
      </div>
    );
  }

  if (error || !currentClassroom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1c3f] via-[#1a2d5c] to-[#0f1c3f] flex items-center justify-center text-white p-4">
        <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400 opacity-70" />
          <h2 className="text-xl font-bold mb-2">出错了</h2>
          <p className="text-white/60 text-sm mb-5">{error || '课堂不存在'}</p>
          <Link to="/student" className="inline-block px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition">
            返回加入页
          </Link>
        </div>
      </div>
    );
  }

  const progressPercent = quizView ? (quizView.remaining / quizView.quiz.durationSeconds) * 100 : 0;
  const timeDanger = quizView && quizView.remaining <= 10 && !quizView.submitted;

  const amICalled = rollCallCalled && me && rollCallCalled.student.id === me.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1c3f] via-[#1a2d5c] to-[#0f1c3f] text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#0f1c3f]/70 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => navigate('/student')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <h1 className="text-base font-bold truncate">{currentClassroom.name}</h1>
            <div className="text-xs text-white/60 flex items-center justify-center gap-2">
              <span>{currentClassroom.className}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="text-orange-300 font-mono">{currentClassroom.code}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {me && <img src={me.avatar} alt="" className="w-8 h-8 rounded-full border border-white/10" />}
            <div className="hidden sm:block text-right">
              <div className="text-xs text-white/60 flex items-center gap-1"><Users className="w-3 h-3" />在线</div>
              <div className="text-sm font-bold text-green-300">{onlineCount}</div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showRollCallModal && rollCallCalled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className={`relative max-w-md w-full rounded-3xl p-10 text-center shadow-2xl ${
                amICalled
                  ? 'bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-purple-500/20 border-2 border-orange-400/60'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {amICalled && (
                <>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ y: 0, x: 0, opacity: 1 }}
                      animate={{
                        y: [-30, -200 + Math.random() * 100],
                        x: (Math.random() - 0.5) * 300,
                        opacity: [1, 1, 0],
                        rotate: Math.random() * 720 - 360
                      }}
                      transition={{ duration: 2.2 + Math.random(), repeat: Infinity, delay: i * 0.05 }}
                      className="absolute top-1/2 left-1/2 w-2 h-2 rounded-sm"
                      style={{ backgroundColor: ['#FF6B35', '#4ECDC4', '#FFE66D', '#FF6B6B', '#96CEB4'][i % 5] }}
                    />
                  ))}
                </>
              )}

              {isRolling ? (
                <motion.div className="flex flex-col items-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    className="w-24 h-24 rounded-full border-8 border-dashed border-orange-400/60 flex items-center justify-center text-3xl mb-6"
                  >
                    🎯
                  </motion.div>
                  <h2 className="text-3xl font-black text-orange-300 mb-2">随机点名中...</h2>
                  <p className="text-sm text-white/60">屏住呼吸</p>
                </motion.div>
              ) : (
                <div>
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className={`inline-block relative ${amICalled ? 'mb-4' : 'mb-2'}`}
                  >
                    {amICalled && (
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 blur-2xl"
                      />
                    )}
                    <img
                      src={rollCallCalled.student.avatar}
                      alt=""
                      className={`relative w-32 h-32 rounded-full border-4 ${
                        amICalled ? 'border-orange-400 shadow-2xl shadow-orange-500/50' : 'border-white/20'
                      }`}
                    />
                  </motion.div>

                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`text-4xl font-black tracking-wider mb-2 ${
                      amICalled
                        ? 'bg-gradient-to-r from-orange-300 via-pink-300 to-purple-300 bg-clip-text text-transparent'
                        : ''
                    }`}
                  >
                    {rollCallCalled.student.name}
                  </motion.h2>

                  {amICalled ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mt-2"
                    >
                      <p className="text-lg font-bold text-orange-300 flex items-center justify-center gap-2">
                        <Target className="w-5 h-5" /> 恭喜你被点名！
                      </p>
                      <p className="text-xs text-white/50 mt-1">请做好回答准备</p>
                    </motion.div>
                  ) : (
                    <p className="text-sm text-white/60 mt-1">
                      第 {rollCallCalled.log.sequenceNo} 次点名
                    </p>
                  )}

                  {me && !amICalled && (
                    <p className="text-xs text-white/40 mt-4">
                      不是你？继续加油，下一个可能就是你 ✨
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {me && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4"
          >
            <img src={me.avatar} alt="" className="w-14 h-14 rounded-2xl border border-white/10" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold">{me.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />已连接
                </span>
              </div>
              {me.studentNo && <div className="text-xs text-white/50 font-mono mt-0.5">学号: {me.studentNo}</div>}
              <div className="text-xs text-white/50 mt-0.5">已被点名 {me.rollCallCount} 次</div>
            </div>
            <Volume2 className="w-5 h-5 text-white/30" />
          </motion.div>
        )}

        {quizView ? (
          <motion.div
            key={quizView.quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  quizView.quiz.status === 'ongoing'
                    ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                    : 'bg-green-500/15 text-green-300 border-green-500/30'
                }`}>
                  {quizView.quiz.status === 'ongoing' ? '答题中' : '已结束'}
                </span>
                <span className="text-xs text-white/50">{quizView.quiz.type === 'choice' ? '选择题' : '判断题'}</span>
              </div>
              <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${timeDanger && !quizView.submitted ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                <Clock className="w-4 h-4" />
                {quizView.remaining}s
              </div>
            </div>

            <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-5">
              <motion.div
                initial={{ width: '100%' }}
                animate={{
                  width: `${progressPercent}%`,
                  backgroundColor: timeDanger && !quizView.submitted ? '#FF6B6B' : quizView.remaining <= quizView.quiz.durationSeconds / 3 ? '#FFE66D' : '#4ECDC4'
                }}
                transition={{ duration: 0.6 }}
                className="h-full rounded-full"
              />
            </div>

            <h3 className="text-xl font-bold mb-6 leading-relaxed">{quizView.quiz.question}</h3>

            <div className="space-y-3 mb-4">
              {quizView.quiz.options.map((opt) => {
                const isSelected = quizView.selectedAnswer === opt.key;
                const isCorrectOption = quizView.correctAnswer === opt.key;
                const showResult = quizView.quiz.status === 'finished';
                const isWrongSelected = showResult && quizView.mySubmission?.answer === opt.key && !quizView.mySubmission?.isCorrect;
                const canInteract = !quizView.submitted && quizView.quiz.status === 'ongoing' && !quizView.isAutoSubmitting;
                let baseClass = 'w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ';
                if (showResult) {
                  if (isCorrectOption) baseClass += 'bg-green-500/15 border-green-500/60 text-green-200';
                  else if (isWrongSelected) baseClass += 'bg-red-500/15 border-red-500/60 text-red-200';
                  else baseClass += 'bg-white/5 border-white/10 text-white/60';
                } else if (quizView.submitted) {
                  baseClass += isSelected
                    ? 'bg-teal-500/20 border-teal-400/60 text-teal-100'
                    : 'bg-white/5 border-white/10 text-white/40 opacity-60';
                } else {
                  baseClass += isSelected
                    ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 border-orange-400/60 shadow-lg shadow-orange-500/10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20';
                }
                return (
                  <button
                    key={opt.key}
                    disabled={!canInteract}
                    onClick={() => selectAnswer(opt.key)}
                    className={baseClass}
                  >
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      showResult && isCorrectOption
                        ? 'bg-green-500 text-white'
                        : showResult && isWrongSelected
                        ? 'bg-red-500 text-white'
                        : isSelected
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/10 text-white/70'
                    }`}>
                      {showResult && isCorrectOption ? '✓' : showResult && isWrongSelected ? '✗' : opt.key}
                    </span>
                    <span className="flex-1 text-sm">{opt.content}</span>
                  </button>
                );
              })}
            </div>

            {!quizView.submitted && quizView.quiz.status === 'ongoing' && (
              <div className="space-y-2 mb-4">
                <motion.button
                  whileHover={!quizView.selectedAnswer || quizView.isAutoSubmitting ? {} : { scale: 1.02 }}
                  whileTap={!quizView.selectedAnswer || quizView.isAutoSubmitting ? {} : { scale: 0.98 }}
                  onClick={confirmSubmit}
                  disabled={!quizView.selectedAnswer || quizView.isAutoSubmitting}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                    !quizView.selectedAnswer || quizView.isAutoSubmitting
                      ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 text-white'
                  }`}
                >
                  {quizView.isAutoSubmitting ? (
                    <>⏳ 自动提交中...</>
                  ) : quizView.selectedAnswer ? (
                    <>✓ 确认提交答案</>
                  ) : (
                    <>请先选择一个选项</>
                  )}
                </motion.button>
                <p className="text-center text-xs text-white/40">
                  选择后可修改，点击「确认提交」后无法更改 · 倒计时结束系统将自动收卷
                </p>
              </div>
            )}

            {quizView.isAutoSubmitting && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-400/30 text-center text-sm text-orange-200">
                ⏰ 时间到，正在自动提交答案...
              </motion.div>
            )}

            {quizView.submitted && quizView.mySubmission && quizView.quiz.status === 'finished' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl flex items-center gap-3 ${
                  quizView.mySubmission.isCorrect
                    ? 'bg-gradient-to-r from-green-500/15 to-teal-500/15 border border-green-500/40'
                    : 'bg-gradient-to-r from-red-500/15 to-orange-500/15 border border-red-500/40'
                }`}
              >
                <CheckCircle2 className={`w-6 h-6 ${quizView.mySubmission.isCorrect ? 'text-green-400' : 'text-red-400'}`} />
                <div className="flex-1">
                  <div className="font-bold">
                    {quizView.mySubmission.isCorrect
                      ? '🎉 回答正确！'
                      : quizView.mySubmission.answer
                      ? '😅 回答错误'
                      : '⌛ 未作答（超时自动收卷）'}
                  </div>
                  <div className="text-xs text-white/60 mt-0.5">
                    正确答案: <span className="font-bold text-green-300">{quizView.correctAnswer}</span>
                    {quizView.stats && (
                      <span className="ml-3">
                        全班正确率: <span className="font-bold text-orange-300">{quizView.stats.accuracyRate}%</span>
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {quizView.submitted && quizView.quiz.status === 'ongoing' && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 ${
                quizView.isAutoSubmitting
                  ? 'bg-orange-500/10 border border-orange-400/30'
                  : 'bg-teal-500/10 border border-teal-400/30'
              }`}>
                <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${quizView.isAutoSubmitting ? 'text-orange-400' : 'text-teal-400'}`} />
                <div className={`text-sm ${quizView.isAutoSubmitting ? 'text-orange-200' : 'text-teal-200'}`}>
                  {quizView.isAutoSubmitting
                    ? '系统正在自动提交您的答案...'
                    : '答案已提交，等待其他同学作答中...'}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-10 text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="inline-block mb-4"
            >
              <div className="text-6xl">✨</div>
            </motion.div>
            <h3 className="text-2xl font-black mb-2">课堂已连接</h3>
            <p className="text-white/60">你好，<span className="text-orange-300 font-bold">{studentName}</span>！</p>
            <p className="text-white/50 text-sm mt-2">等待老师发起互动...</p>

            <div className="mt-8 grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xs text-white/50 mb-1">🎯 随机点名</div>
                <div className="text-lg">随时准备</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xs text-white/50 mb-1">📝 答题互动</div>
                <div className="text-lg">即时作答</div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-xs text-white/40 space-y-1">
              <p>💡 小提示：保持页面打开以接收通知</p>
              <p>📱 手机端允许振动，被点名时会振动提醒</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
