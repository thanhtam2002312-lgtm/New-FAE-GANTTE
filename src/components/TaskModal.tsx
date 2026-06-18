import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, User, Calendar, Clock, Trash2, ChevronDown } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { cn } from '../utils/cn';

interface TaskModalProps {
  task: Task;
  projectMpSchedule?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
  isNew?: boolean;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, projectMpSchedule, isOpen, onClose, onSave, onDelete, isNew = false }) => {
  const [editedTask, setEditedTask] = useState<Task>(task);

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedTask);
    onClose();
  };

  const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'standard', label: '正常', color: 'bg-[#0071E3]' },
    { value: 'risk', label: '风险', color: 'bg-[#FF3B30]' },
    { value: 'done', label: '完成', color: 'bg-[#34C759]' },
    { value: 'waiting', label: '等待', color: 'bg-[#8E8E93]' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
        <motion.div
           initial={{ opacity: 0, scale: 0.9, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.9, y: 20 }}
           className="bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden border border-white/40 dark:border-white/10"
        >
          <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-3">
              <div className="p-2 bg-[#0071E3]/10 rounded-xl">
                <Calendar className="w-6 h-6 text-[#0071E3]" />
              </div>
              {isNew ? '添加任务' : '任务详情'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-[#8E8E93]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-5">
              <div>
                <label className="block text-[13px] font-semibold text-[#8E8E93] mb-1.5 ml-1">任务名称</label>
                <input
                  type="text"
                  value={editedTask.name}
                  onChange={(e) => setEditedTask({ ...editedTask, name: e.target.value })}
                  className="apple-input"
                  required
                  placeholder="输入任务名称"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#8E8E93] mb-1.5 ml-1">负责人</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                    <input
                      type="text"
                      value={editedTask.owner}
                      onChange={(e) => setEditedTask({ ...editedTask, owner: e.target.value })}
                      className="apple-input !pl-10"
                      placeholder="姓名"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#8E8E93] mb-1.5 ml-1">状态</label>
                  <div className="relative">
                    <select
                      value={editedTask.status}
                      onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as TaskStatus })}
                      className="apple-input appearance-none bg-black/[0.03] cursor-pointer !pr-10"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#8E8E93] mb-1.5 ml-1">开始日期</label>
                  <input
                    type="date"
                    value={editedTask.startDate}
                    onChange={(e) => setEditedTask({ ...editedTask, startDate: e.target.value })}
                    className="apple-input"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#8E8E93] mb-1.5 ml-1">结束日期</label>
                  <input
                    type="date"
                    value={editedTask.endDate}
                    onChange={(e) => setEditedTask({ ...editedTask, endDate: e.target.value })}
                    className="apple-input"
                  />
                </div>
              </div>

              {editedTask.status === 'risk' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-[#FF3B30]/5 rounded-2xl border border-[#FF3B30]/10"
                >
                  <label className="flex items-center gap-2 text-[13px] font-bold text-[#FF3B30] mb-2">
                    <AlertCircle className="w-4 h-4" />
                    阻碍因素 (Blockers)
                  </label>
                  <textarea
                    value={editedTask.blocker || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, blocker: e.target.value })}
                    className="w-full p-3 text-sm rounded-xl border-none bg-white/50 dark:bg-[#1C1C1E]/50 focus:ring-2 focus:ring-[#FF3B30]/30 outline-none min-h-[80px] placeholder:text-[#FF3B30]/30 text-[#1D1D1F] dark:text-white"
                    placeholder="描述当前遇到的问题..."
                  />
                </motion.div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4">
              {!isNew ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(task.id);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-[#FF3B30] hover:bg-[#FF3B30]/5 rounded-full transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  删除任务
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="apple-button-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="apple-button-primary"
                >
                  保存
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskModal;
