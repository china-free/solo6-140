import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Users, MonitorPlay, LogOut, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StudentPanel from '../../components/teacher/StudentPanel';
import RollCallPanel from '../../components/teacher/RollCallPanel';
import QuizPanel from '../../components/teacher/QuizPanel';
import { classroomApi, studentApi, rollCallApi, quizApi } from '../../services/api';
import { connectSocket, disconnectSocket, emitTeacherJoin, onEvent } from '../../sockets';
import { useAppStore } from '../../stores/appStore';
import type { Student, RollCallLog, Quiz, QuizStats } from '../../types';

export default function TeacherClassroom() {
  const { classroomId = '' } = useParams();
  const currentClassroom = useAppStore(s => s.currentClassroom);
  const setCurrentClassroom = useAppStore(s => s.setCurrentClassroom);
  const setStudents = useAppStore(s => s.setStudents);
  const setRollCallLogs = useAppStore(s => s.setRollCallLogs);
  const setCurrentQuiz = useAppStore(s => s.setCurrentQuiz);
  const setCurrentQuizStats = useAppStore(s => s.setCurrentQuizStats);
  const setLastRollCall = useAppStore(s => s.setLastRollCall);
  const setIsRolling = useAppStore(s => s.setIsRolling);
  const onlineCount = useAppStore(s => s.onlineCount);
  const setOnlineCount = useAppStore(s => s.setOnlineCount);
  const reset = useAppStore(s => s.reset);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rollcall' | 'quiz'>('rollcall');

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const cr = await classroomApi.getById(classroomId);
        if (!cancelled && cr.data) {
          setCurrentClassroom(cr.data);
          const [stu, logs, qz] = await Promise.all([
            studentApi.list(classroomId),
            rollCallApi.logs(classroomId),
            quizApi.getCurrent(classroomId)
          ]);
          setStudents(stu.data || []);
          setRollCallLogs(logs.data || []);
          if (qz.data) {
            setCurrentQuiz(qz.data);
            const s = await quizApi.getStats(classroomId, qz.data.id);
            if (s.data) setCurrentQuizStats(s.data.stats);
          }
          setOnlineCount((stu.data || []).filter(s => s.isOnline).length);
          connectSocket();
          emitTeacherJoin(classroomId);
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
      disconnectSocket();
      reset();
    };
  }, [classroomId, setCurrentClassroom, setStudents, setRollCallLogs, setCurrentQuiz, setCurrentQuizStats, setOnlineCount, reset]);

  useEffect(() => {
    if (!classroomId) return;
    const off1 = onEvent('student:online', ({ studentId, onlineCount: n }) => {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, isOnline: true } : s));
      setOnlineCount(n);
    });
    const off2 = onEvent('student:offline', ({ studentId, onlineCount: n }) => {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, isOnline: false } : s));
      setOnlineCount(n);
    });
    const off3 = onEvent('rollcall:start', () => { setIsRolling(true); setLastRollCall(null); });
    const off4 = onEvent('rollcall:result', ({ student, log }: { student: Student; log: RollCallLog }) => {
      setIsRolling(false);
      setLastRollCall({ student, log });
      setRollCallLogs(prev => {
        const exists = prev.some(p => p.id === log.id);
        return exists ? prev : [{ ...log, student }, ...prev];
      });
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, rollCallCount: student.rollCallCount } : s));
    });
    const off5 = onEvent('quiz:published', ({ quiz }) => {
      setCurrentQuiz({ ...quiz, status: 'ongoing' } as Quiz);
      setCurrentQuizStats(null);
    });
    const off6 = onEvent('quiz:update', ({ stats }: { stats: QuizStats }) => {
      setCurrentQuizStats(stats);
    });
    const off7 = onEvent('quiz:finished', ({ correctAnswer, stats }) => {
      setCurrentQuiz(prev => prev ? { ...prev, status: 'finished', correctAnswer, finishedAt: new Date().toISOString() } : null);
      setCurrentQuizStats(stats);
    });
    return () => { off1(); off2(); off3(); off4(); off5(); off6(); off7(); };
  }, [classroomId, setStudents, setOnlineCount, setIsRolling, setLastRollCall, setRollCallLogs, setCurrentQuiz, setCurrentQuizStats]);

  const copyCode = () => {
    if (!currentClassroom) return;
    navigator.clipboard.writeText(currentClassroom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1c3f] via-[#1a2d5c] to-[#0f1c3f] flex items-center justify-center text-white">
        <div className="animate-pulse text-lg">加载课堂中...</div>
      </div>
    );
  }

  if (error || !currentClassroom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1c3f] via-[#1a2d5c] to-[#0f1c3f] flex items-center justify-center text-white">
        <div className="text-center p-10 bg-white/5 rounded-3xl border border-white/10 max-w-md">
          <LogOut className="w-12 h-12 mx-auto mb-4 text-red-400 opacity-70" />
          <h2 className="text-xl font-bold mb-2">加载出错</h2>
          <p className="text-white/60 text-sm mb-5">{error || '课堂不存在'}</p>
          <Link to="/teacher" className="inline-block px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition">
            返回教师首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1c3f] via-[#1a2d5c] to-[#0f1c3f] text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-teal-400/5 blur-3xl" />
      </div>
      <div className="relative">
        <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#0f1c3f]/70 border-b border-white/10">
          <div className="max-w-[1600px] mx-auto px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/teacher" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">{currentClassroom.name}</h1>
                <div className="text-xs text-white/60 flex items-center gap-2">
                  <span>{currentClassroom.className}</span>
                  <span className="w-1 h-1 bg-white/30 rounded-full" />
                  <span className="flex items-center gap-1 text-green-300">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <Users className="w-3 h-3" />在线 {onlineCount}
                  </span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={copyCode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/90 to-pink-500/90 hover:from-orange-500 hover:to-pink-500 shadow-lg shadow-orange-500/25 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">课堂码</span>
              <span className="font-mono font-bold tracking-widest">{currentClassroom.code}</span>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </motion.button>
          </div>
        </header>

        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-green-500/90 text-sm font-medium shadow-2xl shadow-green-500/30"
            >
              课堂码已复制
            </motion.div>
          )}
        </AnimatePresence>

        <main className="max-w-[1600px] mx-auto px-5 py-5">
          <div className="grid grid-cols-12 gap-5 h-[calc(100vh-88px)]">
            <div className="col-span-12 lg:col-span-3 h-full">
              <StudentPanel />
            </div>

            <div className="col-span-12 lg:col-span-5 h-full flex flex-col">
              <div className="flex gap-2 mb-4 p-1 rounded-2xl bg-white/5 border border-white/10 w-fit mx-auto">
                <button
                  onClick={() => setActiveTab('rollcall')}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'rollcall'
                      ? 'bg-gradient-to-r from-orange-500/80 to-pink-500/80 shadow-lg shadow-orange-500/20 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🎯 随机点名
                </button>
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'quiz'
                      ? 'bg-gradient-to-r from-purple-500/80 to-blue-500/80 shadow-lg shadow-purple-500/20 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  📝 答题互动
                </button>
                <button
                  onClick={() => document.documentElement.requestFullscreen?.()}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-1.5"
                  title="投屏全屏"
                >
                  <MonitorPlay className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="h-full"
                  >
                    {activeTab === 'rollcall' ? <RollCallPanel /> : <QuizPanel />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 h-full">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-full flex flex-col">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <MonitorPlay className="w-5 h-5 text-cyan-400" />
                  实时大屏 / 投屏区
                </h3>
                <div className="flex-1 rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/10 p-5 overflow-hidden relative">
                  <TeacherDisplayBoard />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function TeacherDisplayBoard() {
  const currentClassroom = useAppStore(s => s.currentClassroom);
  const lastRollCall = useAppStore(s => s.lastRollCall);
  const currentQuiz = useAppStore(s => s.currentQuiz);
  const currentQuizStats = useAppStore(s => s.currentQuizStats);
  const isRolling = useAppStore(s => s.isRolling);
  const students = useAppStore(s => s.students);
  const onlineCount = useAppStore(s => s.onlineCount);
  const rollCallLogs = useAppStore(s => s.rollCallLogs);

  const hasContent = lastRollCall || currentQuiz;

  if (!hasContent) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/40 text-center p-4">
        <div className="text-6xl mb-4 opacity-40">📺</div>
        <h3 className="text-xl font-bold mb-1">投屏显示区</h3>
        <p className="text-sm">发起点名或发布题目后，这里会实时展示结果</p>
        <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-2xl font-black text-teal-300">{students.length}</div>
            <div className="text-xs text-white/50 mt-1">学生总数</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-2xl font-black text-orange-300">{onlineCount}</div>
            <div className="text-xs text-white/50 mt-1">在线人数</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-2xl font-black text-pink-300">{rollCallLogs.length}</div>
            <div className="text-xs text-white/50 mt-1">累计点名</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-2xl font-black text-cyan-300">{currentClassroom?.code || '------'}</div>
            <div className="text-xs text-white/50 mt-1">课堂码</div>
          </div>
        </div>
      </div>
    );
  }

  if (lastRollCall && !currentQuiz) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        {isRolling ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="text-center"
          >
            <div className="w-28 h-28 rounded-full border-8 border-dashed border-orange-400/60 flex items-center justify-center text-4xl">
              🎲
            </div>
            <p className="mt-5 text-xl font-bold tracking-wider text-orange-300">抽取中...</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
              className="relative inline-block"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 blur-3xl opacity-50 scale-110" />
              <img
                src={lastRollCall.student.avatar}
                alt=""
                className="relative w-36 h-36 rounded-full border-4 border-white/20 shadow-2xl"
              />
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8"
            >
              <p className="text-sm text-white/50 mb-2">🎉 恭喜被点名</p>
              <h2 className="text-5xl font-black tracking-wider bg-gradient-to-r from-orange-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                {lastRollCall.student.name}
              </h2>
              <p className="mt-3 text-xs text-white/50">
                第 {lastRollCall.log.sequenceNo} 次点名 · {new Date(lastRollCall.log.calledAt).toLocaleTimeString('zh-CN')}
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    );
  }

  if (currentQuiz && currentQuizStats) {
    const total = currentQuizStats.submittedCount || 1;
    return (
      <div className="h-full flex flex-col">
        <div className="mb-4">
          <p className="text-xs text-white/50 mb-1">{currentQuiz.type === 'choice' ? '选择题' : '判断题'}</p>
          <h4 className="font-bold text-lg">{currentQuiz.question}</h4>
        </div>
        <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
          {currentQuiz.options.map((opt) => {
            const count = currentQuizStats.optionCounts[opt.key] || 0;
            const percent = Math.round((count / total) * 100);
            const isCorrect = currentQuiz.status === 'finished' && opt.key === currentQuiz.correctAnswer;
            return (
              <motion.div
                key={opt.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative overflow-hidden rounded-xl border p-3"
                style={{
                  backgroundColor: isCorrect ? 'rgba(62, 207, 142, 0.15)' : 'rgba(255,255,255,0.04)',
                  borderColor: isCorrect ? 'rgba(62, 207, 142, 0.5)' : 'rgba(255,255,255,0.1)'
                }}
              >
                <motion.div
                  className={`absolute inset-y-0 left-0 ${isCorrect ? 'bg-green-500/20' : 'bg-orange-500/15'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isCorrect ? 'bg-green-500 text-white' : 'bg-white/10 text-white/70'
                    }`}>
                      {opt.key}
                    </span>
                    <span className="text-sm truncate">{opt.content}</span>
                    {isCorrect && <span className="text-green-400 text-xs">✓</span>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-black">{count}</div>
                    <div className="text-[10px] text-white/50">{percent}%</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        {currentQuiz.status === 'finished' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-teal-500/15 to-blue-500/15 border border-teal-400/30 flex items-center justify-between gap-4"
          >
            <div>
              <div className="text-xs text-white/60">正确率</div>
              <div className="text-3xl font-black text-teal-300">{currentQuizStats.accuracyRate}%</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60">正确/提交</div>
              <div className="text-xl font-bold">{currentQuizStats.correctCount} / {currentQuizStats.submittedCount}</div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return null;
}
