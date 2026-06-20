import { useState } from 'react';
import { UserPlus, Upload, Trash2, IdCard, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { studentApi } from '../../services/api';
import type { Student } from '../../types';
import { useAppStore } from '../../stores/appStore';

export default function StudentPanel() {
  const currentClassroom = useAppStore(s => s.currentClassroom);
  const students = useAppStore(s => s.students);
  const setStudents = useAppStore(s => s.setStudents);
  const addStudent = useAppStore(s => s.addStudent);
  const removeStudent = useAppStore(s => s.removeStudent);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNo, setNewNo] = useState('');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  const handleAdd = async () => {
    if (!currentClassroom) return;
    setError('');
    try {
      const res = await studentApi.add(currentClassroom.id, { name: newName, studentNo: newNo });
      if (res.data) addStudent(res.data);
      setNewName('');
      setNewNo('');
      setShowAdd(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '添加失败');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentClassroom || !e.target.files?.length) return;
    setImporting(true);
    setError('');
    try {
      const res = await studentApi.importExcel(currentClassroom.id, e.target.files[0]);
      if (res.data) {
        setStudents([...students, ...res.data]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentClassroom) return;
    if (!confirm('删除该学生？')) return;
    try {
      await studentApi.delete(currentClassroom.id, id);
      removeStudent(id);
    } catch (_e) { /* ignore */ }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-400" />
          <h3 className="font-bold">学生名单</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">{students.length}人</span>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition">
            <Upload className="w-4 h-4" />
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button
            onClick={() => setShowAdd(v => !v)}
            className="p-2 rounded-xl bg-gradient-to-br from-orange-500/80 to-pink-500/80 hover:from-orange-500 hover:to-pink-500 shadow-lg shadow-orange-500/20 transition"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-1.5 mb-3 border border-red-500/20">{error}</div>}
      {importing && <div className="text-xs text-teal-400 bg-teal-500/10 rounded-lg px-3 py-1.5 mb-3 border border-teal-500/20">正在导入...</div>}

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 space-y-2 overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="姓名"
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 focus:border-orange-400/50 outline-none placeholder:text-white/30"
              />
              <input
                value={newNo}
                onChange={(e) => setNewNo(e.target.value)}
                placeholder="学号(选填)"
                className="w-32 px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 focus:border-orange-400/50 outline-none placeholder:text-white/30"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="w-full py-2 text-sm rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/30 text-teal-300 disabled:opacity-40 transition"
            >
              确认添加
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {students.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/40 text-sm py-10">
            <IdCard className="w-10 h-10 mb-2 opacity-50" />
            <p>暂无学生</p>
            <p className="text-xs mt-1 opacity-70">点击 + 按钮手动添加或导入Excel</p>
            <p className="text-xs mt-1 opacity-50">(Excel表头需包含「姓名」列)</p>
          </div>
        ) : (
          students.map((s: Student, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition"
            >
              <img src={s.avatar} alt="" className="w-9 h-9 rounded-full border border-white/10 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{s.name}</div>
                <div className="text-xs text-white/50 flex items-center gap-2">
                  {s.studentNo && <span className="font-mono">{s.studentNo}</span>}
                  {s.isOnline ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />在线
                    </span>
                  ) : (
                    <span className="text-white/30">未在线</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-white/40 px-2 py-0.5 rounded-md bg-white/5">
                被点{s.rollCallCount}次
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 text-white/40 hover:text-red-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
