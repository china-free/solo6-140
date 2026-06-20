import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Users, Copy, Check, ArrowRight, Trash2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { classroomApi } from '../../services/api';
import type { Classroom } from '../../types';

export default function TeacherHome() {
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState('');
  const [className, setClassName] = useState('');
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const loadClassrooms = async () => {
    try {
      const res = await classroomApi.list();
      setClassrooms(res.data || []);
    } catch (_e) {
      /* ignore */
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await classroomApi.create(courseName, className);
      if (res.data) {
        setNewCode(res.data.code);
        const saved = localStorage.getItem('teacher_classrooms') || '[]';
        const arr = JSON.parse(saved);
        arr.push({ id: res.data.id, token: res.data.teacherToken });
        localStorage.setItem('teacher_classrooms', JSON.stringify(arr));
        setTimeout(() => {
          navigate(`/teacher/classroom/${res.data!.id}`);
        }, 2500);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (!newCode) return;
    navigator.clipboard.writeText(newCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个课堂吗？相关学生名单和记录会被清除。')) return;
    try {
      await classroomApi.delete(id);
      loadClassrooms();
    } catch (_e) { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1c3f] via-[#1a2d5c] to-[#0f1c3f] text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">课堂互动平台</h1>
              <p className="text-sm text-white/60">教师控制台</p>
            </div>
          </motion.div>
          <Link to="/" className="text-sm text-white/60 hover:text-white transition">
            返回首页
          </Link>
        </header>

        <AnimatePresence>
          {newCode && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <div className="bg-gradient-to-br from-[#1a2d5c] to-[#0f1c3f] rounded-3xl p-10 shadow-2xl border border-white/10 text-center max-w-md">
                <p className="text-white/70 mb-4 text-sm">课堂创建成功！</p>
                <p className="text-xs text-white/50 mb-3">请将此课堂码分享给学生</p>
                <div className="flex justify-center gap-2 mb-6">
                  {newCode.split('').map((ch, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-14 h-16 rounded-xl bg-gradient-to-b from-orange-400 to-orange-600 flex items-center justify-center text-3xl font-bold shadow-lg shadow-orange-500/40"
                    >
                      {ch}
                    </motion.span>
                  ))}
                </div>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-2 mx-auto px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition border border-white/10"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? '已复制' : '复制课堂码'}
                </button>
                <p className="text-xs text-white/40 mt-4">即将跳转到课堂控制台...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-5 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold">创建新课堂</h2>
              </div>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-sm text-white/70 mb-2">课程名称</label>
                  <input
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="例如：高等数学"
                    className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 outline-none transition placeholder:text-white/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">班级</label>
                  <input
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="例如：计算机2301班"
                    className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 outline-none transition placeholder:text-white/30"
                    required
                  />
                </div>
                {error && (
                  <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                    {error}
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 font-bold text-lg shadow-xl shadow-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {loading ? '创建中...' : '创建课堂并生成码'}
                </motion.button>
              </form>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-400" />
                历史课堂
              </h2>
              <span className="text-sm text-white/50">{classrooms.length} 个课堂</span>
            </div>
            {classrooms.length === 0 ? (
              <div className="h-[400px] bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col items-center justify-center text-white/40">
                <Users className="w-16 h-16 mb-4 opacity-40" />
                <p className="text-lg">还没有创建课堂</p>
                <p className="text-sm mt-1">填写左侧表单开启你的第一堂互动课</p>
              </div>
            ) : (
              <div className="grid gap-4 max-h-[560px] overflow-y-auto pr-2">
                {classrooms.map((c, idx) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-orange-400/40 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold truncate">{c.name}</h3>
                        <p className="text-white/60 text-sm mt-1">{c.className}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                          <span className={`px-2 py-0.5 rounded-full ${
                            c.status === 'active'
                              ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                              : 'bg-white/10 text-white/50 border border-white/10'
                          }`}>
                            {c.status === 'active' ? '进行中' : '已结束'}
                          </span>
                          <span>创建于 {new Date(c.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-400/30 text-orange-300 font-mono text-sm tracking-wider font-bold">
                          {c.code}
                        </div>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/15 text-white/50 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/teacher/classroom/${c.id}`)}
                          className="p-2 rounded-xl bg-gradient-to-br from-orange-500/80 to-pink-500/80 hover:from-orange-500 hover:to-pink-500 text-white shadow-lg shadow-orange-500/20 transition"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
