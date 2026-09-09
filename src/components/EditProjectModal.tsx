import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, ChevronDown, Calendar, Plus, Trash2, CheckCircle2, FolderKanban, UserCheck, User, Briefcase, Phone, Mail, DollarSign, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, Project, PN, PNStatus } from '../types';
import { normalizeDateStr, calculatePnTotalLtr } from '../utils/helpers';
import { GlassSelect } from './GlassSelect';

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
    }>,
    extraFields?: {
      marketSegment?: string;
      ltrAmt?: string;
      ownerName?: string;
      ownerTitle?: string;
      ownerPhone?: string;
      ownerEmail?: string;
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
        <label className="block text-[13px] font-medium text-white/70 mb-1.5 ml-1">
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
        className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3 py-2 text-[14px] text-white outline-none transition-all placeholder:text-white/70"
        placeholder={placeholder}
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-[#121927]/80 dark:bg-[#0D131F]/85 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.2)] max-h-48 overflow-y-auto p-1 custom-scrollbar">
          {filteredOptions.map((opt, i) => (
            <div
              key={i}
              className={`px-3 py-1.5 text-[13px] rounded-xl cursor-pointer transition-all ${
                i === activeIndex
                  ? 'bg-[#0071E3] text-white shadow-sm font-semibold'
                  : 'text-white/90 hover:text-white hover:bg-white/15'
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
        <label className="block text-[13px] font-medium text-white/70">
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
          className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/70 [color-scheme:light-dark]"
          placeholder={placeholder}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <Calendar className="w-4 h-4 text-white/70" />
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
        className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3 py-2 text-[14px] text-white outline-none transition-all [color-scheme:light-dark]"
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
  const [marketSegment, setMarketSegment] = useState(project.marketSegment || '');
  const [ltrAmt, setLtrAmt] = useState(project.ltrAmt || '');
  const [ownerName, setOwnerName] = useState(project.ownerName || '');
  const [ownerTitle, setOwnerTitle] = useState(project.ownerTitle || '');
  const [ownerPhone, setOwnerPhone] = useState(project.ownerPhone || '');
  const [ownerEmail, setOwnerEmail] = useState(project.ownerEmail || '');
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
      setMarketSegment(project.marketSegment || '');
      setOwnerName(project.ownerName || '');
      setOwnerTitle(project.ownerTitle || '');
      setOwnerPhone(project.ownerPhone || '');
      setOwnerEmail(project.ownerEmail || '');
      if (project.pns) {
        const mappedPns = project.pns.map(pn => ({
          id: pn.id,
          name: pn.name || '',
          productLine: pn.productLine || '',
          status: pn.status || 'NBO',
          drStatus: pn.drStatus || '',
          socketCreateDate: normalizeDateStr(pn.socketCreateDate || ''),
          socketTotalLtrAmt: pn.socketTotalLtrAmt || '',
          channelOk: pn.channelOk || 'Yes',
          remark: pn.remark || '',
        }));
        setLocalPns(mappedPns);
        const computedInit = calculatePnTotalLtr(mappedPns);
        setLtrAmt(computedInit || project.ltrAmt || '');
      } else {
        setLocalPns([]);
        setLtrAmt(project.ltrAmt || '');
      }
    }
  }, [project]);

  // Computed sum of PN SOCKET amounts in real-time
  const computedTotalLtr = useMemo(() => {
    return calculatePnTotalLtr(localPns);
  }, [localPns]);

  // Keep ltrAmt synced whenever localPns change
  useEffect(() => {
    if (computedTotalLtr) {
      setLtrAmt(computedTotalLtr);
    }
  }, [computedTotalLtr]);

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

    const finalLtr = (computedTotalLtr || ltrAmt).trim();
    onSave(project.id, projectName.trim(), mpSchedule, localPns, {
      marketSegment: marketSegment.trim(),
      ltrAmt: finalLtr,
      ownerName: ownerName.trim(),
      ownerTitle: ownerTitle.trim(),
      ownerPhone: ownerPhone.trim(),
      ownerEmail: ownerEmail.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/25 backdrop-blur-[3px] transition-all">
      <div className="macos-glass-modal rounded-3xl w-full max-w-[95vw] lg:max-w-[85vw] xl:max-w-6xl overflow-hidden flex flex-col max-h-[90vh] relative">
        
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
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-white/[0.04] backdrop-blur-md w-full shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">编辑项目及料号详情</h2>
            <p className="text-xs text-white/70 mt-0.5">客户: {customer.nameZh} {customer.nameEn ? `(${customer.nameEn})` : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          
          {/* Section 1: Project Information */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-sm font-semibold text-white">
              <FolderKanban className="w-4 h-4 text-[#0071E3]" />
              <span>项目基本与团队信息</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[13px] font-medium text-white/70 mb-1.5 ml-1">
                  项目名称 <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/70"
                  placeholder="项目名称为必填"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-white/70 mb-1.5 ml-1">
                  市场 (Segment)
                </label>
                <input
                  type="text"
                  value={marketSegment}
                  onChange={(e) => setMarketSegment(e.target.value)}
                  className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/40"
                  placeholder="例如：Auto / 工业控制"
                />
              </div>

              <DateInput
                label="项目量产时间"
                value={mpSchedule}
                onChange={setMpSchedule}
              />

              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="block text-[13px] font-medium text-white/70">
                    LTR (总金额)
                  </label>
                  {localPns.length > 0 && (
                    <span 
                      className="text-[11px] text-[#34C759] bg-[#34C759]/15 border border-[#34C759]/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium select-none"
                      title="根据下方该项目所有料号的 SOCKET 金额自动汇总"
                    >
                      <Calculator className="w-3 h-3" />
                      自动汇总下方料号
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={computedTotalLtr || ltrAmt}
                    onChange={(e) => setLtrAmt(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl pl-9 pr-4 py-2.5 text-[15px] outline-none transition-all placeholder:text-white/40 font-semibold text-[#64B5F6]"
                    placeholder="例如：$10,000"
                  />
                  <DollarSign className="w-4 h-4 text-[#64B5F6]/70 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-white/70 mb-1.5 ml-1">负责人名字</label>
                <div className="relative">
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl pl-9 pr-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/40"
                    placeholder="姓名"
                  />
                  <User className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-white/70 mb-1.5 ml-1">职位</label>
                <div className="relative">
                  <input
                    type="text"
                    value={ownerTitle}
                    onChange={(e) => setOwnerTitle(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl pl-9 pr-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/40"
                    placeholder="职位"
                  />
                  <Briefcase className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-white/70 mb-1.5 ml-1">电话 / 邮箱</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl pl-8 pr-2 py-2.5 text-[13px] text-white outline-none transition-all placeholder:text-white/40"
                      placeholder="电话"
                    />
                    <Phone className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl pl-8 pr-2 py-2.5 text-[13px] text-white outline-none transition-all placeholder:text-white/40"
                      placeholder="邮箱"
                    />
                    <Mail className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: PNs detail in cohesive list table */}
          <div className="space-y-4 overflow-visible">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-white">
                  该项目下的料号 (PN) 信息列表
                </h3>
                {localPns.length > 0 && (
                  <span className="text-xs text-[#64B5F6] bg-[#0071E3]/20 border border-[#0071E3]/35 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 select-none">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>SOCKET 合计: <strong className="font-bold text-white">{computedTotalLtr || '$0'}</strong></span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddPn}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>增添新料号</span>
              </button>
            </div>

            {localPns.length === 0 ? (
              <div className="text-center py-8 bg-white/[0.03] rounded-2xl border border-dashed border-white/15 text-sm text-white/70">
                当前项目暂无料号 PN，请点击右上角并“增添新料号”新增一行
              </div>
            ) : (
              <div className="border border-white/10 rounded-2xl overflow-visible bg-white/[0.03]">
                {/* Header Row */}
                <div className="grid grid-cols-[130px_95px_160px_110px_100px_120px_140px_1fr_45px] gap-2.5 px-4 py-3 border-b border-white/10 bg-white/[0.05] text-[12px] font-semibold text-white/70 uppercase tracking-wider select-none">
                  <div>产品线</div>
                  <div>渠道 OK</div>
                  <div>料号 PN <span className="text-[#FF3B30]">*</span></div>
                  <div>PN 状态</div>
                  <div>DR 状态</div>
                  <div className="text-white">SOCKET 金额</div>
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
                        <GlassSelect
                          value={pn.channelOk || 'Yes'}
                          onChange={(val) => handleUpdatePnField(index, 'channelOk', val)}
                          options={['Yes', 'No']}
                          size="xs"
                          className="w-full !bg-white/10 !border-white/15 !py-2 !px-3 !rounded-xl text-[13px]"
                        />
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
                        <GlassSelect
                          value={pn.status}
                          onChange={(val) => handleUpdatePnField(index, 'status', val as PNStatus)}
                          options={['Leads', 'NBO', 'DIN', 'DFIN', 'DWIN', 'DLOST']}
                          size="xs"
                          className="w-full !bg-white/10 !border-white/15 !py-2 !px-3 !rounded-xl text-[13px]"
                        />
                      </div>

                      {/* 5. DR Status */}
                      <div>
                        <input
                          type="text"
                          value={pn.drStatus}
                          onChange={(e) => handleUpdatePnField(index, 'drStatus', e.target.value)}
                          className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3 py-2 text-[13px] text-white outline-none transition-all placeholder:text-white/70"
                          placeholder="DR状态"
                        />
                      </div>

                      {/* 6. LTR Amt */}
                      <div>
                        <input
                          type="text"
                          value={pn.socketTotalLtrAmt}
                          onChange={(e) => handleUpdatePnField(index, 'socketTotalLtrAmt', e.target.value)}
                          className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3 py-2 text-[13px] text-white outline-none transition-all placeholder:text-white/70 font-mono"
                          placeholder="如 2720 或 $10K"
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
                          className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3 py-2 text-[13px] text-white outline-none transition-all placeholder:text-white/70"
                          placeholder="输入备注..."
                        />
                      </div>

                      {/* 9. Action (Delete) */}
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePn(index)}
                          className="p-2 text-white/70 hover:text-[#FF3B30] hover:bg-[#FF3B30]/5 rounded-xl transition-all"
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
          <div className="flex justify-end gap-3 pt-5 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-[15px] font-medium text-white hover:bg-white/10 transition-colors"
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
