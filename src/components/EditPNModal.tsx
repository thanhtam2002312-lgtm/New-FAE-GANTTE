import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, ChevronDown, Calendar, Plus, Trash2, CalendarDays, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';
import { Customer, Project, PN, Task, TaskStatus, PNStatus } from '../types';
import { normalizeDateStr } from '../utils/helpers';

interface EditPNModalProps {
  customers: Customer[];
  customer: Customer;
  project: Project;
  pn: PN;
  onClose: () => void;
  onSave: (
    customerId: string,
    projectId: string,
    pnId: string,
    pnData: {
      name: string;
      productLine: string;
      status: PNStatus;
      drStatus: string;
      marketSegment: string;
      socketCreateDate: string;
      socketTotalLtrAmt: string;
      channelOk: 'Yes' | 'No';
      remark: string;
      tasks: Task[];
    }
  ) => void;
}

const AutocompleteInput = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!isTyping) return [];
    if (!value) return [];
    const trimmed = value.trim();
    if (!trimmed) return [];

    const matched = options.filter(opt => 
      opt.toLowerCase().includes(trimmed.toLowerCase()) && 
      opt.toLowerCase() !== trimmed.toLowerCase()
    );
    return [trimmed, ...matched];
  }, [options, value]);

  useEffect(() => {
    setActiveIndex(0);
  }, [filteredOptions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsTyping(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => 
        filteredOptions.length > 0 ? (prev + 1) % filteredOptions.length : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => 
        filteredOptions.length > 0 ? (prev - 1 + filteredOptions.length) % filteredOptions.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0 && activeIndex >= 0 && activeIndex < filteredOptions.length) {
        onChange(filteredOptions[activeIndex]);
      }
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">
        {label} {required && <span className="text-[#FF3B30]">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsTyping(true);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
        placeholder={placeholder}
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.35)] max-h-48 overflow-y-auto py-1">
          {filteredOptions.map((opt, i) => (
            <div
              key={i}
              className={`px-4 py-2.5 text-[14px] cursor-pointer transition-colors ${
                i === activeIndex
                  ? 'bg-[#0071E3] text-white'
                  : 'text-[#1D1D1F] dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              onClick={() => {
                onChange(opt);
                setIsTyping(false);
                setIsOpen(false);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DateInput = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}) => {
  const handleSetToday = (e: React.MouseEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    onChange(today);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 ml-1">
        <label className="block text-[13px] font-medium text-[#8E8E93]">
          {label} {required && <span className="text-[#FF3B30]">*</span>}
        </label>
        <button
          type="button"
          onClick={handleSetToday}
          className="text-[11px] text-[#0071E3] hover:text-[#0077ED] font-medium transition-colors bg-transparent border-none p-0 cursor-pointer flex items-center gap-0.5"
        >
          今天
        </button>
      </div>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93] [color-scheme:light-dark]"
          placeholder={placeholder}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <Calendar className="w-4 h-4 text-[#8E8E93]" />
        </div>
      </div>
    </div>
  );
};

export default function EditPNModal({
  customers,
  customer,
  project,
  pn,
  onClose,
  onSave,
}: EditPNModalProps) {
  // Edit states for PN
  const [name, setName] = useState(pn.name || '');
  const [productLine, setProductLine] = useState(pn.productLine || '');
  const [marketSegment, setMarketSegment] = useState(pn.marketSegment || '');
  const [status, setStatus] = useState<PNStatus>((pn.status as PNStatus) || 'NBO');
  const [drStatus, setDrStatus] = useState(pn.drStatus || '');
  const [socketCreateDate, setSocketCreateDate] = useState(normalizeDateStr(pn.socketCreateDate || ''));
  const [socketTotalLtrAmt, setSocketTotalLtrAmt] = useState(pn.socketTotalLtrAmt || '');
  const [channelOk, setChannelOk] = useState<'Yes' | 'No'>(pn.channelOk || 'Yes');
  const [remark, setRemark] = useState(pn.remark || '');

  // Edit states for tasks list
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (pn && pn.tasks) {
      setLocalTasks(
        pn.tasks.map((t) => ({
          id: t.id,
          name: t.name || '',
          status: t.status || 'standard',
          startDate: t.startDate || '',
          endDate: t.endDate || '',
          owner: t.owner || '',
          blocker: t.blocker || '',
          mpDate: t.mpDate || '',
        }))
      );
    } else {
      setLocalTasks([]);
    }
  }, [pn]);

  // Unique options for autocompletes
  const existingProductLines = useMemo(() => {
    const lines = new Set<string>();
    customers.forEach((c) => {
      c.projects.forEach((p) => {
        p.pns.forEach((item) => {
          if (item.productLine) lines.add(item.productLine);
        });
      });
    });
    return Array.from(lines).filter(Boolean);
  }, [customers]);

  const existingMarketSegments = useMemo(() => {
    const markets = new Set<string>();
    customers.forEach((c) => {
      c.projects.forEach((p) => {
        p.pns.forEach((item) => {
          if (item.marketSegment) markets.add(item.marketSegment);
        });
      });
    });
    return Array.from(markets).filter(Boolean);
  }, [customers]);

  const existingPartNumbers = useMemo(() => {
    const names = new Set<string>();
    customers.forEach((c) => {
      c.projects.forEach((p) => {
        p.pns.forEach((item) => {
          if (item.name) names.add(item.name);
        });
      });
    });
    return Array.from(names).filter(Boolean);
  }, [customers]);

  const handleUpdateTaskField = (index: number, key: keyof Task, val: any) => {
    setLocalTasks((prev) =>
      prev.map((t, i) => {
        if (i === index) {
          return { ...t, [key]: val };
        }
        return t;
      })
    );
  };

  const handleAddTask = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 14);
    const endDateStr = defaultEnd.toISOString().split('T')[0];

    setLocalTasks((prev) => [
      ...prev,
      {
        id: 'task_' + Math.random().toString(36).substr(2, 9),
        name: '',
        status: 'standard' as TaskStatus,
        startDate: today,
        endDate: endDateStr,
        owner: '',
        blocker: '',
        mpDate: '',
      },
    ]);
  };

  const handleRemoveTask = (index: number) => {
    setLocalTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请填写料号PN名称');
      return;
    }

    // Basic validity checks on tasks
    for (let i = 0; i < localTasks.length; i++) {
      if (!localTasks[i].name.trim()) {
        alert(`请填写第 ${i + 1} 个任务的任务名称`);
        return;
      }
    }

    onSave(customer.id, project.id, pn.id, {
      name: name.trim(),
      productLine: productLine.trim(),
      status,
      drStatus,
      marketSegment,
      socketCreateDate,
      socketTotalLtrAmt,
      channelOk,
      remark: remark.trim(),
      tasks: localTasks,
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/20 backdrop-blur-md transition-all">
      <div className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] w-full max-w-[95vw] lg:max-w-[85vw] xl:max-w-6xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 dark:border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-[#1C1C1E]/50 w-full shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white tracking-tight flex items-center gap-2">
              <span>料号及任务关联详情编辑</span>
              <span className="text-sm font-normal text-[#8E8E93] bg-[#8E8E93]/10 px-2.5 py-1 rounded-md">
                {pn.name || '未命名料号'}
              </span>
            </h2>
            <p className="text-xs text-[#8E8E93] mt-1.5 leading-normal">
              隶属于 客户: <span className="font-semibold text-[#1D1D1F] dark:text-white">{customer.nameZh}</span> | 项目: <span className="font-semibold text-[#1D1D1F] dark:text-white">{project.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#8E8E93]" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-7 custom-scrollbar">
          
          {/* Section 1: PN properties form details */}
          <div className="bg-black/[0.01] dark:bg-white/[0.01] border border-black/5 dark:border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white border-b border-black/5 dark:border-white/5 pb-2.5 mb-4">
              料号 PN 基本信息
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
              <AutocompleteInput
                label="料号 PN"
                value={name}
                onChange={setName}
                options={existingPartNumbers}
                placeholder="必填"
                required
              />

              <AutocompleteInput
                label="产品线"
                value={productLine}
                onChange={setProductLine}
                options={existingProductLines}
                placeholder="输入或选择产品线"
              />
              <AutocompleteInput
                label="市场 (Segment)"
                value={marketSegment}
                onChange={setMarketSegment}
                options={existingMarketSegments}
                placeholder="Market Segment"
              />

              <div>
                <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">PN 状态</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PNStatus)}
                    className="w-full appearance-none bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl pl-4 pr-10 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all cursor-pointer"
                  >
                    {['Leads', 'NBO', 'DIN', 'DFIN', 'DWIN', 'DLOST'].map(st => (
                      <option key={st} value={st} className="bg-white dark:bg-[#1C1C1E]">{st}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">DR 状态</label>
                <input
                  type="text"
                  value={drStatus}
                  onChange={(e) => setDrStatus(e.target.value)}
                  className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
                  placeholder="如 DR0, DR1"
                />
              </div>

              <DateInput
                label="Socket 创建日期"
                value={socketCreateDate}
                onChange={setSocketCreateDate}
              />

              <div>
                <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">Socket 总 LTR 金额</label>
                <input
                  type="text"
                  value={socketTotalLtrAmt}
                  onChange={(e) => setSocketTotalLtrAmt(e.target.value)}
                  className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
                  placeholder="金额如 $10,000"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">渠道是否 OK</label>
                <div className="relative">
                  <select
                    value={channelOk}
                    onChange={(e) => setChannelOk(e.target.value as 'Yes' | 'No')}
                    className="w-full appearance-none bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl pl-4 pr-10 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all cursor-pointer"
                  >
                    <option value="Yes" className="bg-white dark:bg-[#1C1C1E]">Yes</option>
                    <option value="No" className="bg-white dark:bg-[#1C1C1E]">No</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] pointer-events-none" />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">Remark (备注/修饰符)</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full h-16 bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[14px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93] resize-none"
                  placeholder="填写料号其他备注信息..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Tasks list details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                  该料号下的关联任务详情
                </h3>
                <p className="text-[12px] text-[#8E8E93] mt-0.5">列出并管理该料号涉及的所有甘特图任务详情</p>
              </div>
              <button
                type="button"
                onClick={handleAddTask}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl hover:scale-[1.01] active:scale-[0.98] transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增甘特图任务</span>
              </button>
            </div>

            {localTasks.length === 0 ? (
              <div className="text-center py-12 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl border border-dashed border-black/10 dark:border-white/10 text-sm text-[#8E8E93] flex flex-col items-center justify-center gap-2">
                <CalendarDays className="w-8 h-8 text-[#C7C7CC] mb-1" />
                <p>该料号目前没有任何关联任务。</p>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="mt-2 text-xs text-[#0071E3] hover:text-[#0077ED] font-semibold border-none bg-transparent"
                >
                  立即创建首个任务 &rarr;
                </button>
              </div>
            ) : (
              <div className="border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden bg-black/[0.01] dark:bg-white/[0.01]">
                {/* List Header */}
                <div className="grid grid-cols-[1.5fr_1fr_120px_130px_130px_45px] gap-3 px-4 py-3 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider select-none">
                  <div>任务名称 <span className="text-[#FF3B30]">*</span></div>
                  <div>负责人</div>
                  <div>状态</div>
                  <div>开始日期</div>
                  <div>结束日期</div>
                  <div className="text-center">操作</div>
                </div>

                {/* List Body */}
                <div className="divide-y divide-black/5 dark:divide-white/5 bg-white/30 dark:bg-black/10">
                  {localTasks.map((task, index) => (
                    <div 
                      key={task.id} 
                      className="grid grid-cols-[1.5fr_1fr_120px_130px_130px_45px] gap-3 px-4 py-2.5 items-center hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-color text-sm"
                    >
                      {/* 1. Task Name Input */}
                      <div>
                        <input
                          type="text"
                          value={task.name}
                          onChange={(e) => handleUpdateTaskField(index, 'name', e.target.value)}
                          className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3 py-2 text-[13px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
                          placeholder="如: Socket板图设计"
                          required
                        />
                      </div>

                      {/* 2. Owner/Assignee Input */}
                      <div>
                        <input
                          type="text"
                          value={task.owner}
                          onChange={(e) => handleUpdateTaskField(index, 'owner', e.target.value)}
                          className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3 py-2 text-[13px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
                          placeholder="姓名"
                        />
                      </div>

                      {/* 3. Task Status Selector */}
                      <div>
                        <div className="relative">
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskField(index, 'status', e.target.value as TaskStatus)}
                            className="w-full appearance-none bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl pl-3 pr-8 py-2 text-[13px] font-medium text-[#1D1D1F] dark:text-white outline-none transition-all cursor-pointer"
                          >
                            <option value="standard" className="text-[#0071E3]">正常</option>
                            <option value="risk" className="text-[#FF3B30] font-semibold">⚠️ 风险</option>
                            <option value="done" className="text-[#34C759]">✅ 完成</option>
                            <option value="waiting" className="text-[#8E8E93]">等待</option>
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8E8E93] pointer-events-none" />
                        </div>
                      </div>

                      {/* 4. Start Date Picker */}
                      <div>
                        <input
                          type="date"
                          value={task.startDate}
                          onChange={(e) => handleUpdateTaskField(index, 'startDate', e.target.value)}
                          className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3 py-1.5 text-[13px] text-[#1D1D1F] dark:text-white outline-none transition-all [color-scheme:light-dark]"
                        />
                      </div>

                      {/* 5. End Date Picker */}
                      <div>
                        <input
                          type="date"
                          value={task.endDate}
                          onChange={(e) => handleUpdateTaskField(index, 'endDate', e.target.value)}
                          className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3 py-1.5 text-[13px] text-[#1D1D1F] dark:text-white outline-none transition-all [color-scheme:light-dark]"
                        />
                      </div>

                      {/* 6. Action Column (Remove) */}
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(index)}
                          className="p-2 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/5 rounded-xl transition-all"
                          title="删除此任务"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer controls */}
          <div className="flex justify-end gap-3 pt-5 border-t border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-[15px] font-medium text-[#1D1D1F] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-[15px] font-medium text-white bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#0062C3] transition-colors shadow-sm"
            >
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
