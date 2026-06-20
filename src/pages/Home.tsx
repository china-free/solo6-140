import { Link } from 'react-router-dom';
import { GraduationCap, Users, Sparkles, Target, ListChecks, BarChart3, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1c3f] via-[#1a2d5c] to-[#0f1c3f] text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-teal-400/10 blur-3xl" />
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: Math.random() * 100 }}
            animate={{
              opacity: [0.1, 0.6, 0.1],
              y: [Math.random() * 800, -100]
            }}
            transition={{
              duration: 8 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: 'linear'
            }}
            className="absolute w-1 h-1 rounded-full bg-white"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-10 min-h-screen flex flex-col">
        <header className="flex items-center justify-between mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-orange-500/40">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">ClassSpark</h1>
              <p className="text-xs text-white/50">课堂互动教学平台</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden sm:flex items-center gap-2 text-xs text-white/50"
          >
            <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">v1.0</span>
            <span>让每堂课都充满互动 ✨</span>
          </motion.div>
        </header>

        <main className="flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-14"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              全新互动教学体验
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-tight">
              <span className="bg-gradient-to-r from-orange-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                让课堂活起来
              </span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              随机点名、实时答题、可视化统计 — <br className="hidden sm:block" />
              用技术连接每一位学生，让互动课堂成为常态
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full mb-16"
          >
            <Link to="/teacher" className="group block">
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="relative h-56 rounded-3xl p-7 overflow-hidden bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-purple-500/10 border border-orange-400/30 shadow-2xl shadow-orange-500/10 transition-all group-hover:shadow-orange-500/30"
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-orange-500/20 blur-2xl" />
                <div className="relative h-full flex flex-col justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-xl shadow-orange-500/30">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black mb-1">我是老师</h3>
                    <p className="text-sm text-white/60 mb-4">创建课堂、随机点名、发布题目</p>
                    <div className="flex items-center gap-1.5 text-orange-300 font-medium text-sm">
                      进入教师端 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>

            <Link to="/student" className="group block">
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="relative h-56 rounded-3xl p-7 overflow-hidden bg-gradient-to-br from-teal-400/20 via-blue-500/20 to-cyan-400/10 border border-teal-400/30 shadow-2xl shadow-teal-500/10 transition-all group-hover:shadow-teal-500/30"
              >
                <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-teal-400/20 blur-2xl" />
                <div className="relative h-full flex flex-col justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center shadow-xl shadow-teal-500/30">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black mb-1">我是学生</h3>
                    <p className="text-sm text-white/60 mb-4">输入课堂码加入互动课堂</p>
                    <div className="flex items-center gap-1.5 text-teal-300 font-medium text-sm">
                      进入学生端 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-3 gap-4 max-w-2xl mx-auto w-full"
          >
            {[
              { icon: <Target className="w-5 h-5" />, t: '🎯 随机点名', d: '公平加权算法，动画展示', c: 'from-orange-500/30 to-pink-500/30' },
              { icon: <ListChecks className="w-5 h-5" />, t: '📝 限时答题', d: '倒计时自动提交', c: 'from-teal-400/30 to-blue-500/30' },
              { icon: <BarChart3 className="w-5 h-5" />, t: '📊 实时统计', d: '柱状图投屏展示', c: 'from-purple-500/30 to-cyan-400/30' }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center"
              >
                <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${f.c} flex items-center justify-center`}>
                  {f.icon}
                </div>
                <div className="text-sm font-bold mb-0.5">{f.t}</div>
                <div className="text-[11px] text-white/50">{f.d}</div>
              </motion.div>
            ))}
          </motion.div>
        </main>

        <footer className="mt-10 text-center text-xs text-white/30">
          <p>ClassSpark · 致力于创造更好的课堂互动体验</p>
        </footer>
      </div>
    </div>
  );
}
