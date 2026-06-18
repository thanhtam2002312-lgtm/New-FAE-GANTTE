import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, ChevronDown, Calendar, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, Project, PN, PNStatus } from '../types';
import { normalizeDateStr } from '../utils/helpers';

interface EditProjectModalProps {
  customers: Customer[];
  customer: Customer;
  project: Project;
  onClose: () => void;
  onSave: (
    projectId: string,
    projectName: string,
    mpSchedule: string,
    pns: Array<{
      id: string;
      name: string;
      productLine: string;
      status: PNStatus;
      drStatus: string;
      socketCreateDate: string;
      socketTotalLtrAmt: string;
      channelOk?: 'Yes' | 'No';
      remark?: string;
    }>
  ) => void;
}

const AutocompleteInput = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  hideLabel = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  hideLabel?: boolean;
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
      {!hideLabel && (
        <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">
          {label} {required && <span className="text-[#FF3B30]">*</span>}
        </label>
      )}
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
        className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3 py-2 text-[14px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
        placeholder={placeholder}
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.35)] max-h-48 overflow-y-auto py-1">
          {filteredOptions.map((opt, i) => (
            <div
              key={i}
              className={`px-3 py-1.5 text-[13px] cursor-pointer transition-colors ${
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

const CompactDateInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => {
  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3 py-2 text-[14px] text-[#1D1D1F] dark:text-white outline-none transition-all [color-scheme:light-dark]"
      />
    </div>
  );
};

export default function EditProjectModal({
  customers,
  customer,
  project,
  onClose,
  onSave,
}: EditProjectModalProps) {
  const [projectName, setProjectName] = useState(project.name);
  const [mpSchedule, setMpSchedule] = useState(normalizeDateStr(project.mpSchedule || ''));
  const [showToast, setShowToast] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);
  
  // Local list of PNs representing the current states
  const [localPns, setLocalPns] = useState<Array<{
    id: string;
    name: string;
    productLine: string;
    status: PNStatus;
    drStatus: string;
    socketCreateDate: string;
    socketTotalLtrAmt: string;
    channelOk?: 'Yes' | 'No';
    remark?: string;
  }>>([]);

  // Initialize state from project
  useEffect(() => {
    if (project) {
      setProjectName(project.name || '');
      setMpSchedule(normalizeDateStr(project.mpSchedule || ''));
      if (project.pns) {
        setLocalPns(project.pns.map(pn => ({
          id: pn.id,
          name: pn.name || '',
          productLine: pn.productLine || '',
          status: pn.status || 'NBO',
          drStatus: pn.drStatus || '',
          socketCreateDate: normalizeDateStr(pn.socketCreateDate || ''),
          socketTotalLtrAmt: pn.socketTotalLtrAmt || '',
          channelOk: pn.channelOk || 'Yes',
          remark: pn.remark || '',
        })));
      } else {
        setLocalPns([]);
      }
    }
  }, [project]);

  // Extract autocomplete options
  const productLineOptions = useMemo(() => {
    const pls = new Set<string>();
    customers.forEach(c => c.projects.forEach(p => p.pns.forEach(pn => {
      if (pn.productLine) pls.add(pn.productLine);
    })));
    return Array.from(pls);
  }, [customers]);

  const existingPartNumbers = useMemo(() => {
    const pns = new Set<string>();
    customers.forEach(c => c.projects.forEach(p => p.pns.forEach(pn => {
      if (pn.name) pns.add(pn.name);
    })));
    return Array.from(pns);
  }, [customers]);

  const handleUpdatePnField = (index: number, key: string, val: any) => {
    setLocalPns(prev => prev.map((pn, i) => {
      if (i === index) {
        return { ...pn, [key]: val };
      }
      return pn;
    }));
  };

  const handleAddPn = () => {
    setLocalPns(prev => [
      ...prev,
      {
        id: 'new_' + Math.random().toString(36).substr(2, 9),
        name: '',
        productLine: localPns[localPns.length - 1]?.productLine || '',
        status: 'NBO' as PNStatus,
        drStatus: '',
        socketCreateDate: '',
        socketTotalLtrAmt: '',
        channelOk: 'Yes' as const,
        remark: '',
      }
    ]);
    setShowToast(true);
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const handleRemovePn = (index: number) => {
    setLocalPns(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert('请填写必填字段：项目名称');
      return;
    }

    // Verify each PN
    for (let i = 0; i < localPns.length; i++) {
      const pn = localPns[i];
      if (!pn.name.trim()) {
        alert(`请填写第 ${i + 1} 个料号 (PN) 的名称`);
        return;
      }
    }

    onSave(project.id, projectName.trim(), mpSchedule, localPns);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-md transition-all">
      <div className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] w-full max-w-[95vw] lg:max-w-[85vw] xl:max-w-6xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 dark:border-white/10 relative">
        
        {/* Toast feedback */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20, x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, scale: 0.9, y: -20, x: '-50%' }}
              className="absolute top-6 left-1/2 bg-[#34C759] text-white text-sm font-semibold px-4 py-2 rounded-full shadow-[0_8px_24px_rgba(52,199,89,0.3)] flex items-center gap-1.5 z-[110]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>成功添加新料号栏！</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-[#1C1C1E]/50 w-full shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white tracking-tight">编辑项目及料号详情</h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">客户: {customer.nameZh} {customer.nameEn ? `(${customer.nameEn})` : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#8E8E93]" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          
          {/* Section 1: Project Information */}
          <div className="bg-black/[0.01] dark:bg-white/[0.01] border border-black/5 dark:border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white border-b border-black/5 dark:border-white/5 pb-2">项目基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">
                  项目名称 <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
                  placeholder="项目名称为必填"
                  required
                />
              </div>

              <DateInput
                label="项目量产时间"
                value={mpSchedule}
                onChange={setMpSchedule}
              />
            </div>
          </div>

          {/* Section 2: PNs detail in cohesive list table */}
          <div className="space-y-4 overflow-visible">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
              <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                该项目下的料号 (PN) 信息列表
              </h3>
              <button
                type="button"
                onClick={handleAddPn}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>增添新料号</span>
              </button>
            </div>

            {localPns.length === 0 ? (
              <div className="text-center py-8 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl border border-dashed border-black/10 dark:border-white/10 text-sm text-[#8E8E93]">
                当前项目暂无料号 PN，请点击右上角并“增添新料号”新增一行
              </div>
            ) : (
              <div className="border border-black/5 dark:border-white/5 rounded-2xl overflow-visible bg-black/[0.01] dark:bg-white/[0.01]">
                {/* Header Row */}
                <div className="grid grid-cols-[130px_95px_160px_110px_100px_120px_140px_1fr_45px] gap-2.5 px-4 py-3 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider select-none">
                  <div>产品线</div>
                  <div>渠道 OK</div>
                  <div>料号 PN <span className="text-[#FF3B30]">*</span></div>
                  <div>PN 状态</div>
                  <div>DR 状态</div>
                  <div>Socket 金额</div>
                  <div>Socket 创建日期</div>
                  <div>备注 / Remark</div>
                  <div className="text-center">操作</div>
                </div>

                {/* Body Rows */}
                <div className="divide-y divide-black/5 dark:divide-white/5 overflow-visible">
                  {localPns.map((pn, index) => (
                    <div 
                      key={pn.id} 
                      className="grid grid-cols-[130px_95px_160px_110px_100px_120px_140px_1fr_45px] gap-2.5 px-4 py-3 items-center hover:bg-black/[0.01] dark:hover:bg-white/[0.01] overflow-visible"
                    >
                      {/* 1. Product Line Autocomplete */}
                      <div className="overflow-visible">
                        <AutocompleteInput
                          label="产品线"
                          value={pn.productLine}
                          onChange={(val) => handleUpdatePnField(index, 'productLine', val)}
                          options={productLineOptions}
                          hideLabel
                        />
                      </div>

                      {/* 2. Channel OK dropdown */}
                      <div>
                        <div className="relative">
                          <select
                            value={pn.channelOk || 'Yes'}
                            onChange={(e) => handleUpdatePnField(index, 'channelOk', e.target.value)}
                            className="w-full appearance-none bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl pl-3 pr-8 py-2 text-[13px] text-[#1D1D1F] dark:text-white outline-none transition-all cursor-pointer"
                          >
                            <option value="Yes" className="bg-white dark:bg-[#1C1C1E]">Yes</option>
                            <option value="No" className="bg-white dark:bg-[#1C1C1E]">No</option>
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8E8E93] pointer-events-none" />
                        </div>
                      </div>

                      {/* 3. Part Number Autocomplete */}
                      <div className="overflow-visible">
                        <AutocompleteInput
                          label="料号 PN"
                          value={pn.name}
                          onChange={(val) => handleUpdatePnField(index, 'name', val)}
                          options={existingPartNumbers}
                          placeholder="必填"
                          required
                          hideLabel
                        />
                      </div>

                      {/* 4. PN Status dropdown */}
                      <div>
                        <div className="relative">
                          <select
                            value={pn.status}
                            onChange={(e) => handleUpdatePnField(index, 'status', e.target.value as PNStatus)}
                            className="w-full appearance-none bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl pl-3 pr-8 py-2 text-[13px] text-[#1D1D1F] dark:text-white outline-none transition-all cursor-pointer"
                          >
                            {['Leads', 'NBO', 'DIN', 'DFIN', 'DWIN', 'DLOST'].map(status => (
                              <option key={status} value={status} className="bg-white dark:bg-[#1C1C1E]">{status}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8E8E93] pointer-events-none" />
                        </div>
                      </div>

                      {/* 5. DR Status */}
                      <div>
                        <input
                          type="text"
                          value={pn.drStatus}
                          onChange={(e) => handleUpdatePnField(index, 'drStatus', e.target.value)}
                          className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3 py-2 text-[13px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
                          placeholder="DR状态"
                        />
                      </div>

                      {/* 6. LTR Amt */}
                      <div>
                        <input
                          type="text"
                          value={pn.socketTotalLtrAmt}
                          onChange={(e) => handleUpdatePnField(index, 'socketTotalLtrAmt', e.target.value)}
                          className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3 py-2 text-[13px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
                          placeholder="金額,如$10K"
                        />
                      </div>

                      {/* 7. Socket Create Date */}
                      <div>
                        <CompactDateInput
                          value={pn.socketCreateDate}
                          onChange={(val) => handleUpdatePnField(index, 'socketCreateDate', val)}
                        />
                      </div>

                      {/* 8. Remark */}
                      <div>
                        <input
                          type="text"
                          value={pn.remark}
                          onChange={(e) => handleUpdatePnField(index, 'remark', e.target.value)}
                          className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3 py-2 text-[13px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
                          placeholder="输入备注..."
                        />
                      </div>

                      {/* 9. Action (Delete) */}
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePn(index)}
                          className="p-2 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/5 rounded-xl transition-all"
                          title="删除此料号"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} className="h-2" />
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
