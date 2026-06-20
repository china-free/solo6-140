import { useState, useEffect } from 'react';
import { PlusCircle, ListChecks, Send, Clock, XCircle, CheckCircle2, BarChart3, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend } from 'recharts';
import { quizApi } from '../../services/api';
import { useAppStore } from '../../stores/appStore';
import type { QuizOption, QuizType } from '../../types';

const OPTION_COLORS: Record<string, string> = {
  A: '#4ECDC4',
  B: '#FF6B35',
  C: '#FFE66D',
  D: '#96CEB4',
  正确: '#3ECF8E',
  错误: '#FF6B6B'
};

function JudgeOptions(): QuizOption[] {
  return [
    { key: 'T', content: '正确 ✓' },
    { key: 'F', content: '错误 ✗' }
  ];
}
function DefaultChoiceOptions(): QuizOption[] {
  return [
    { key: 'A', content: '' },
    { key: 'B', content: '' },
    { key: 'C', content: '' },
    { key: 'D', content: '' }
  ];
}

export default function QuizPanel() {
  const currentClassroom = useAppStore(s => s.currentClassroom);
  const currentQuiz = useAppStore(s => s.currentQuiz);
  const currentQuizStats = useAppStore(s => s.currentQuizStats);
  const setCurrentQuiz = useAppStore(s => s.setCurrentQuiz);
  const setCurrentQuizStats = useAppStore(s => s.setCurrentQuizStats);
  const students = useAppStore(s => s.students);

  const [mode, setMode] = useState<'edit' | 'ongoing' | 'result'>('edit');
  const [type, setType] = useState<QuizType>('choice');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<QuizOption[]>(DefaultChoiceOptions());
  const [correct, setCorrect] = useState('A');
  const [duration, setDuration] = useState(30);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [correctAnswerFinal, setCorrectAnswerFinal] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'ongoing' && remaining > 0) {
      const id = setTimeout(() => setRemaining(r => r - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [mode, remaining]);

  useEffect(() => {
    if (currentQuiz) {
      setMode('ongoing');
      const published = currentQuiz.publishedAt ? new Date(currentQuiz.publishedAt).getTime() : Date.now();
      const end = published + currentQuiz.durationSeconds * 1000;
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemaining(left);
      setCorrectAnswerFinal(null);
    }
  }, [currentQuiz]);

  useEffect(() => {
    if (mode === 'ongoing' && currentQuiz && currentQuizStats && currentQuiz.status !== 'ongoing') {
      setMode('result');
    }
  }, [currentQuiz, currentQuizStats, mode]);

  const handleTypeChange = (t: QuizType) => {
    setType(t);
    setOptions(t === 'choice' ? DefaultChoiceOptions() : JudgeOptions());
    setCorrect(t === 'choice' ? 'A' : 'T');
  };

  const updateOptionContent = (key: string, content: string) => {
    setOptions(prev => prev.map(o => o.key === key ? { ...o, content } : o));
  };

  const loadStats = async (quizId: string) => {
    if (!currentClassroom) return;
    try {
      const res = await quizApi.getStats(currentClassroom.id, quizId);
      if (res.data) {
        setCurrentQuizStats(res.data.stats);
        if (res.data.correctAnswer) {
          setCorrectAnswerFinal(res.data.correctAnswer);
          setMode('result');
        }
      }
    } catch (_e) { /* ignore */ }
  };

  const handlePublish = async () => {
    if (!currentClassroom) return;
    setError('');
    if (!question.trim()) { setError('请输入题目内容'); return; }
    if (type === 'choice') {
      const invalid = options.some(o => !o.content.trim());
      if (invalid) { setError('请填写所有选项内容'); return; }
    }
    setPublishing(true);
    try {
      const res = await quizApi.publish(currentClassroom.id, {
        type, question: question.trim(), options, durationSeconds: duration, correctAnswer: correct
      });
      if (res.data) {
        setCurrentQuiz(res.data);
        setRemaining(res.data.durationSeconds);
        setPublishing(false);
        setQuestion('');
        setOptions(DefaultChoiceOptions());
        setCorrect('A');
        const id = res.data.id;
        const iv = setInterval(() => { loadStats(id); }, 1500);
        setTimeout(() => clearInterval(iv), (duration + 15) * 1000);
        await loadStats(id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '发布失败');
      setPublishing(false);
    }
  };

  const handleFinishEarly = async () => {
    if (!currentClassroom || !currentQuiz) return;
    try {
      await quizApi.forceFinish(currentClassroom.id, currentQuiz.id);
      setMode('result');
      await loadStats(currentQuiz.id);
    } catch (_e) { /* ignore */ }
  };

  const handleReset = () => {
    setMode('edit');
    setCurrentQuiz(null);
    setCurrentQuizStats(null);
    setCorrectAnswerFinal(null);
  };

  const chartData = currentQuizStats
    ? Object.entries(currentQuizStats.optionCounts).map(([key, value]) => {
        const opt = currentQuiz?.options.find(o => o.key === key);
        return {
          key,
          label: key + (opt ? ` (${opt.content.length > 8 ? opt.content.slice(0, 8) + '…' : opt.content})` : ''),
          人数: value,
          isCorrect: key === correctAnswerFinal
        };
      })
    : [];

  const progressPercent = currentQuiz ? (remaining / currentQuiz.durationSeconds) * 100 : 0;
  const danger = remaining <= 10 && mode === 'ongoing';

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-purple-400" />
          答题互动
        </h3>
        {mode !== 'edit' && (
          <button onClick={handleReset} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition">
            新题目
          </button>
        )}
      </div>

      {mode === 'edit' && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="flex gap-2">
            <button
              onClick={() => handleTypeChange('choice')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition border ${
                type === 'choice'
                  ? 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 border-purple-400/50 text-white shadow-lg shadow-purple-500/10'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              选择题 (4选1)
            </button>
            <button
              onClick={() => handleTypeChange('judge')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition border ${
                type === 'judge'
                  ? 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 border-purple-400/50 text-white shadow-lg shadow-purple-500/10'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              判断题
            </button>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              题目内容
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="请输入题目..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-400/50 outline-none resize-none placeholder:text-white/30 transition"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">选项 (点击圆圈设置正确答案)</label>
            <div className="space-y-2">
              {options.map((opt) => (
                <div key={opt.key} className="flex items-center gap-2">
                  <button
                    onClick={() => setCorrect(opt.key)}
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition border-2 ${
                      correct === opt.key
                        ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/30'
                        : 'bg-white/5 border-white/20 text-white/50 hover:border-white/40'
                    }`}
                  >
                    {opt.key}
                  </button>
                  <input
                    value={opt.content}
                    onChange={(e) => updateOptionContent(opt.key, e.target.value)}
                    disabled={type === 'judge'}
                    placeholder={`选项 ${opt.key}${type === 'judge' ? '（判断题无需修改）' : ''}`}
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-white/5 border border-white/10 focus:border-purple-400/50 outline-none placeholder:text-white/30 transition disabled:opacity-60"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              答题时间: {duration}秒
            </label>
            <input
              type="range"
              min={10}
              max={180}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-white/40 mt-1">
              <span>10s</span>
              <span>3分钟</span>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handlePublish}
            disabled={publishing}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 via-blue-500 to-teal-400 hover:opacity-95 font-bold text-lg shadow-2xl shadow-purple-500/30 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {publishing ? '发布中...' : '🚀 发布题目'}
          </motion.button>
        </div>
      )}

      {mode !== 'edit' && currentQuiz && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className={`px-2 py-0.5 rounded-full ${
                  mode === 'ongoing' ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30' : 'bg-green-500/15 text-green-300 border border-green-500/30'
                }`}>
                  {mode === 'ongoing' ? '进行中' : '已结束'}
                </span>
                <span>{currentQuiz.type === 'choice' ? '选择题' : '判断题'}</span>
              </div>
              {mode === 'ongoing' && (
                <button onClick={handleFinishEarly} className="text-xs px-3 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 flex items-center gap-1 transition">
                  <XCircle className="w-3 h-3" />提前结束
                </button>
              )}
            </div>
            <p className="font-medium">{currentQuiz.question}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {currentQuiz.options.map(o => (
                <div
                  key={o.key}
                  className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                    correctAnswerFinal && o.key === correctAnswerFinal
                      ? 'bg-green-500/15 border-green-500/40 text-green-300'
                      : 'bg-white/5 border-white/10 text-white/70'
                  }`}
                >
                  <span className="font-bold">{o.key}.</span>
                  {o.content}
                  {correctAnswerFinal && o.key === correctAnswerFinal && <CheckCircle2 className="w-3 h-3" />}
                </div>
              ))}
            </div>
          </div>

          {mode === 'ongoing' && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-white/60 mb-1.5">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />倒计时</span>
                <span className={`font-mono font-bold text-lg ${danger ? 'text-red-400 animate-pulse' : 'text-white'}`}>{remaining}s</span>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{
                    width: `${progressPercent}%`,
                    backgroundColor: danger ? '#FF6B6B' : remaining <= 20 ? '#FFE66D' : '#4ECDC4'
                  }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full"
                />
              </div>
            </div>
          )}

          {currentQuizStats && (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] text-white/50 flex items-center justify-center gap-1"><Users className="w-3 h-3" />总人数</div>
                  <div className="text-lg font-bold text-white mt-0.5">{currentQuizStats.totalStudents}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] text-white/50 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" />已提交</div>
                  <div className="text-lg font-bold text-teal-300 mt-0.5">{currentQuizStats.submittedCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] text-white/50 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" />未作答</div>
                  <div className="text-lg font-bold text-red-300 mt-0.5">{currentQuizStats.missedCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] text-white/50">正确率</div>
                  <div className="text-lg font-bold text-orange-300 mt-0.5">{currentQuizStats.accuracyRate}%</div>
                </div>
              </div>
              <div className="flex-1 min-h-0 rounded-xl bg-white/5 border border-white/10 p-3">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={10} allowDecimals={false} />
                      <YAxis type="category" dataKey="key" stroke="rgba(255,255,255,0.6)" fontSize={12} width={30} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a2d5c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: 'white' }}
                        itemStyle={{ color: 'white' }}
                        formatter={(value: number) => [`${value}人`, '选择人数']}
                      />
                      <Legend />
                      <Bar dataKey="人数" radius={[0, 6, 6, 0]} maxBarSize={32}>
                        {chartData.map((entry, idx) => (
                          <Cell
                            key={idx}
                            fill={entry.isCorrect ? OPTION_COLORS['正确'] : (OPTION_COLORS[entry.key] || OPTION_COLORS.B)}
                            fillOpacity={0.9}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/40 text-sm">暂无统计数据</div>
                )}
              </div>
              {mode === 'result' && (
                <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-500/20 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-white/80">
                    正确答案: <span className="font-bold text-green-300">{correctAnswerFinal}</span>
                    <span className="mx-2 text-white/30">|</span>
                    全班 {currentQuizStats.totalStudents} 人 · 作答 {currentQuizStats.submittedCount} 人
                    {currentQuizStats.missedCount > 0 && <><span className="mx-1 text-white/30">·</span> 未答 <span className="text-red-300 font-medium">{currentQuizStats.missedCount}</span> 人</>}
                    <span className="mx-2 text-white/30">|</span>
                    正确率 <span className="font-bold text-orange-300">{currentQuizStats.accuracyRate}%</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!currentQuiz && students.length === 0 && mode === 'edit' && (
        <div className="mt-2 text-xs text-white/40 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
          💡 提示：请先在左侧添加学生名单后再发布题目
        </div>
      )}
    </div>
  );
}
