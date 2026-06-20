import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, Sparkles, UserCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { classroomApi } from '../../services/api';

export default function StudentJoin() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { setError('请输入6位课堂码'); return; }
    if (!name.trim()) { setError('请输入你的姓名'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await classroomApi.getByCode(code.toUpperCase());
      if (res.data) {
        const key = `student_${res.data.id}`;
        localStorage.setItem(key, JSON.stringify({ name: name.trim(), joinedAt: Date.now() }));
        navigate(`/student/classroom/${res.data.id}`, { state: { name: name.trim() } });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '课堂码无效');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (v: string) => {
    setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1c3f] via-[#1a2d5c] to-[#0f1c3f] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="inline-block mb-4"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center shadow-2xl shadow-teal-500/30">
              <GraduationCap className="w-11 h-11 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-black mb-2 tracking-tight">课堂互动</h1>
          <p className="text-white/60 text-sm">输入课堂码加入互动课堂</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-white/70 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-400" />
                课堂码 (6位)
              </label>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-[4/5] rounded-xl flex items-center justify-center text-2xl font-black tracking-wider border-2 transition ${
                      code[i]
                        ? 'bg-gradient-to-br from-orange-500/20 to-pink-500/20 border-orange-400/60 text-orange-300 shadow-lg shadow-orange-500/10'
                        : 'bg-white/5 border-white/10 text-white/20'
                    }`}
                  >
                    {code[i] || (i + 1)}
                  </div>
                ))}
              </div>
              <input
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                placeholder=""
                className="mt-3 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-center font-mono text-lg tracking-[0.4em] focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20 outline-none transition"
                maxLength={6}
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2.5 flex items-center gap-1.5">
                <UserCircle2 className="w-4 h-4 text-teal-400" />
                你的姓名
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入你的姓名"
                className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20 outline-none transition placeholder:text-white/30"
                maxLength={20}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 overflow-hidden"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 hover:opacity-95 font-bold text-lg shadow-2xl shadow-teal-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? '加入中...' : '加入课堂'}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </form>
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          由老师创建课堂并提供课堂码
        </p>
      </motion.div>
    </div>
  );
}
