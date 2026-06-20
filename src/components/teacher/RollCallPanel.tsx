import { useEffect, useRef, useState } from 'react';
import { Target, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Student, RollCallLog } from '../../types';
import { useAppStore } from '../../stores/appStore';
import { rollCallApi } from '../../services/api';

function Confetti() {
  const pieces = Array.from({ length: 50 });
  const colors = ['#FF6B35', '#4ECDC4', '#FFE66D', '#FF6B6B', '#96CEB4', '#85C1E9'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const rot = Math.random() * 720 - 360;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 8;
        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: `${left}%`, rotate: 0, opacity: 1 }}
            animate={{ y: '120%', rotate: rot, opacity: 0 }}
            transition={{ duration: 1.8 + Math.random(), delay, ease: 'easeIn' }}
            className="absolute top-0 rounded-sm"
            style={{ width: size, height: size * 0.6, backgroundColor: color }}
          />
        );
      })}
    </div>
  );
}

export default function RollCallPanel() {
  const currentClassroom = useAppStore(s => s.currentClassroom);
  const students = useAppStore(s => s.students);
  const rollCallLogs = useAppStore(s => s.rollCallLogs);
  const lastRollCall = useAppStore(s => s.lastRollCall);
  const setLastRollCall = useAppStore(s => s.setLastRollCall);
  const setRollCallLogs = useAppStore(s => s.setRollCallLogs);
  const isRolling = useAppStore(s => s.isRolling);
  const setIsRolling = useAppStore(s => s.setIsRolling);

  const [displayName, setDisplayName] = useState<string>('');
  const [displayAvatar, setDisplayAvatar] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const rollIntervalRef = useRef<number | null>(null);
  const idxRef = useRef(0);

  useEffect(() => {
    if (students.length === 0 || !isRolling) return;
    idxRef.current = 0;
    let speed = 40;
    const tick = () => {
      const idx = idxRef.current % students.length;
      setDisplayName(students[idx].name);
      setDisplayAvatar(students[idx].avatar);
      idxRef.current++;
      speed += 4;
      if (speed < 260) {
        rollIntervalRef.current = window.setTimeout(tick, speed);
      }
    };
    tick();
    return () => {
      if (rollIntervalRef.current) clearTimeout(rollIntervalRef.current);
    };
  }, [isRolling, students]);

  const handleRollCall = async () => {
    if (!currentClassroom || isRolling) return;
    if (students.length === 0) {
      alert('请先添加学生');
      return;
    }
    setIsRolling(true);
    setShowConfetti(false);
    setLastRollCall(null);
    try {
      const res = await rollCallApi.perform(currentClassroom.id);
      if (res.data) {
        setTimeout(async () => {
          setIsRolling(false);
          const { student, log } = res.data!;
          setDisplayName(student.name);
          setDisplayAvatar(student.avatar);
          setLastRollCall({ student, log });
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2500);
          try {
            const logsRes = await rollCallApi.logs(currentClassroom.id);
            if (logsRes.data) setRollCallLogs(logsRes.data);
          } catch (_e) { /* ignore */ }
        }, 2000);
      }
    } catch (err: unknown) {
      setIsRolling(false);
      alert(err instanceof Error ? err.message : '点名失败');
    }
  };

  const displayStudent = lastRollCall?.student;
  const displayLog = lastRollCall?.log;

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-400" />
          随机点名
        </h3>
        <div className="text-xs text-white/50">公平加权算法</div>
      </div>

      <div className="relative flex-1 rounded-3xl bg-gradient-to-br from-white/8 via-white/4 to-transparent border border-white/10 overflow-hidden flex flex-col items-center justify-center p-8 mb-5 min-h-[320px]">
        {showConfetti && <Confetti />}

        <AnimatePresence mode="wait">
          {!displayStudent && !isRolling ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-white/40"
            >
              <div className="text-5xl mb-3">🎯</div>
              <p className="text-lg">点击下方按钮开始随机点名</p>
              <p className="text-sm mt-2 opacity-70">被点名次数越少，概率越高</p>
            </motion.div>
          ) : (
            <motion.div
              key="student"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <motion.div
                animate={!isRolling && displayStudent ? {
                  scale: [1, 1.08, 1],
                  transition: { duration: 0.6, repeat: Infinity, repeatType: 'reverse' }
                } : {}}
                className="relative inline-block"
              >
                {!isRolling && displayStudent && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6, scale: [1, 1.5] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 blur-2xl"
                  />
                )}
                <img
                  src={displayAvatar}
                  alt=""
                  className={`relative w-32 h-32 rounded-full border-4 ${
                    isRolling
                      ? 'border-white/20'
                      : 'border-gradient-to-br from-orange-400 to-pink-500 shadow-2xl shadow-orange-500/40'
                  }`}
                  style={!isRolling && displayStudent ? {
                    borderImage: 'linear-gradient(135deg, #FF6B35, #FF4D6D) 1'
                  } : {}}
                />
              </motion.div>
              <motion.h2
                animate={isRolling ? {
                  color: ['#ffffff', '#FF6B35', '#4ECDC4', '#FFE66D', '#ffffff'],
                  transition: { duration: 0.4, repeat: Infinity }
                } : {}}
                className="mt-6 text-4xl font-black tracking-wider"
              >
                {displayName}
              </motion.h2>
              {!isRolling && displayLog && (
                <div className="mt-4 flex justify-center gap-4 text-xs text-white/60">
                  <span className="px-3 py-1 rounded-full bg-white/10">第 {displayLog.sequenceNo} 次点名</span>
                  <span className="px-3 py-1 rounded-full bg-white/10">
                    {new Date(displayLog.calledAt).toLocaleTimeString('zh-CN')}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={!isRolling ? { scale: 1.02 } : {}}
        whileTap={!isRolling ? { scale: 0.98 } : {}}
        onClick={handleRollCall}
        disabled={isRolling}
        className={`relative w-full py-5 rounded-2xl font-bold text-xl transition-all ${
          isRolling
            ? 'bg-white/10 text-white/40 cursor-not-allowed'
            : 'bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 text-white'
        }`}
      >
        {isRolling && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.6 }}
            className="absolute inset-0 rounded-2xl ring-4 ring-orange-400/60"
          />
        )}
        {isRolling ? '🎲 抽取中...' : '🎯 随机点名'}
      </motion.button>

      <div className="mt-5 pt-4 border-t border-white/10">
        <h4 className="text-sm font-bold text-white/70 mb-2 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" />
          点名记录
        </h4>
        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
          {rollCallLogs.length === 0 ? (
            <p className="text-xs text-white/40 py-4 text-center">暂无点名记录</p>
          ) : (
            rollCallLogs.slice(0, 20).map((log: RollCallLog) => {
              const s = log.student;
              return (
                <div key={log.id} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-white/5 transition">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] flex items-center justify-center text-white/50">
                    {log.sequenceNo}
                  </span>
                  {s && <img src={s.avatar} alt="" className="w-5 h-5 rounded-full" />}
                  <span className="font-medium">{s?.name || '未知'}</span>
                  <span className="ml-auto text-white/40">
                    {new Date(log.calledAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
