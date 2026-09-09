import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Calendar, FolderKanban, UserCheck, User, Briefcase, Phone, Mail, DollarSign } from 'lucide-react';
import { Customer, PNStatus } from '../types';

interface AddProjectModalProps {
  customers: Customer[];
  onClose: () => void;
  onSave: (data: {
    nameZh: string;
    nameEn?: string;
    customerCode?: string;
    salesEn?: string;
    salesCn?: string;
    customerRd?: string;
    projectName: string;
    marketSegment?: string;
    mpSchedule?: string;
    ltrAmt?: string;
    ownerName?: string;
    ownerTitle?: string;
    ownerPhone?: string;
    ownerEmail?: string;
    // 兼容历史字段
    productLine?: string;
    pnName?: string;
    pnStatus?: PNStatus;
    drStatus?: string;
    socketCreateDate?: string;
    socketTotalLtrAmt?: string;
  }) => void;
  initialCustomer?: Customer;
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
      <label className="block text-[13px] font-medium text-white/70 mb-1.5 ml-1">
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
        className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/40 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/40"
        placeholder={placeholder}
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-[#121927]/90 dark:bg-[#0D131F]/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.2)] max-h-48 overflow-y-auto p-1 custom-scrollbar">
          {filteredOptions.map((opt, i) => (
            <div
              key={i}
              className={`px-3 py-2 text-[14px] rounded-xl cursor-pointer transition-all ${
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
          className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/40 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/40 [color-scheme:dark]"
          placeholder={placeholder}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <Calendar className="w-4 h-4 text-white/50" />
        </div>
      </div>
    </div>
  );
};

export default function AddProjectModal({ customers, onClose, onSave, initialCustomer }: AddProjectModalProps) {
  const [nameZh, setNameZh] = useState(initialCustomer?.nameZh || '');
  const [nameEn, setNameEn] = useState(initialCustomer?.nameEn || '');
  const [customerCode, setCustomerCode] = useState(initialCustomer?.customerCode || '');
  const [salesEn, setSalesEn] = useState(initialCustomer?.salesEn || '');
  const [salesCn, setSalesCn] = useState(initialCustomer?.salesCn || '');
  const [customerRd, setCustomerRd] = useState(initialCustomer?.customerRd || '');
  
  // 用户明确指定的项目字段：
  // 1. 项目名称
  const [projectName, setProjectName] = useState('');
  // 2. 市场 (Segment)
  const [marketSegment, setMarketSegment] = useState('');
  // 3. 项目量产时间
  const [mpSchedule, setMpSchedule] = useState('');
  // 4. LTR
  const [ltrAmt, setLtrAmt] = useState('');
  // 5. 负责人名字
  const [ownerName, setOwnerName] = useState('');
  // 6. 职位
  const [ownerTitle, setOwnerTitle] = useState('');
  // 7. 电话
  const [ownerPhone, setOwnerPhone] = useState('');
  // 8. 邮箱
  const [ownerEmail, setOwnerEmail] = useState('');

  // 客户字段历史数据联想
  const nameZhOptions = useMemo(() => Array.from(new Set(customers.map(c => c.nameZh).filter(Boolean))), [customers]);
  const nameEnOptions = useMemo(() => Array.from(new Set(customers.map(c => c.nameEn).filter(Boolean))), [customers]);
  const codeOptions = useMemo(() => Array.from(new Set(customers.map(c => c.customerCode).filter(Boolean))) as string[], [customers]);
  const salesCnOptions = useMemo(() => Array.from(new Set(customers.map(c => c.salesCn).filter(Boolean))) as string[], [customers]);

  // 市场 Segment 历史选项提取（支持项目和料号中的历史记录）
  const marketOptions = useMemo(() => {
    const list = new Set<string>();
    customers.forEach(c => {
      c.projects.forEach(p => {
        if (p.marketSegment) list.add(p.marketSegment);
        p.pns.forEach(pn => {
          if (pn.marketSegment) list.add(pn.marketSegment);
        });
      });
    });
    return Array.from(list);
  }, [customers]);

  // 自动联想客户信息
  useEffect(() => {
    if (initialCustomer) return;
    const existing = customers.find(c => c.nameZh === nameZh);
    if (existing) {
      setNameEn(existing.nameEn || '');
      setCustomerCode(existing.customerCode || '');
      setSalesEn(existing.salesEn || '');
      setSalesCn(existing.salesCn || '');
      setCustomerRd(existing.customerRd || '');
    }
  }, [nameZh, customers, initialCustomer]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalCustomerName = initialCustomer ? initialCustomer.nameZh : nameZh.trim();
    if (!finalCustomerName) {
      alert('请选择或填写所属客户');
      return;
    }
    if (!projectName.trim()) {
      alert('请填写必填字段：项目名称');
      return;
    }

    onSave({
      nameZh: finalCustomerName,
      nameEn,
      customerCode,
      salesEn,
      salesCn,
      customerRd,
      projectName: projectName.trim(),
      marketSegment: marketSegment.trim(),
      mpSchedule: mpSchedule.trim(),
      ltrAmt: ltrAmt.trim(),
      ownerName: ownerName.trim(),
      ownerTitle: ownerTitle.trim(),
      ownerPhone: ownerPhone.trim(),
      ownerEmail: ownerEmail.trim(),
      socketTotalLtrAmt: ltrAmt.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="macos-glass-modal rounded-3xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] border border-white/20 shadow-[0_24px_50px_rgba(0,0,0,0.5)]">
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/10 bg-white/[0.04] backdrop-blur-md w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0071E3]/20 border border-[#0071E3]/30 flex items-center justify-center text-[#0071E3]">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">添加项目</h2>
              <p className="text-[12px] text-white/50">为客户添加新项目并配置核心市场与团队信息</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容区 */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* 所属客户展示或选择 */}
          {initialCustomer ? (
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <span className="text-[12px] font-medium text-white/50">所属客户</span>
                <span className="text-[14px] font-semibold text-white">{initialCustomer.nameZh}</span>
                {initialCustomer.customerCode && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-white/70 font-mono">
                    {initialCustomer.customerCode}
                  </span>
                )}
              </div>
              {(initialCustomer.salesCn || initialCustomer.salesEn) && (
                <span className="text-[12px] text-white/60">
                  Sales: {initialCustomer.salesCn || initialCustomer.salesEn}
                </span>
              )}
            </div>
          ) : (
            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3">
              <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">选择所属客户</div>
              <div className="grid grid-cols-2 gap-3">
                <AutocompleteInput label="客户中文名" value={nameZh} onChange={setNameZh} options={nameZhOptions} placeholder="必填" required />
                <AutocompleteInput label="客户英文名" value={nameEn} onChange={setNameEn} options={nameEnOptions} />
                <AutocompleteInput label="客户 Code" value={customerCode} onChange={setCustomerCode} options={codeOptions} />
                <AutocompleteInput label="Sales" value={salesCn} onChange={setSalesCn} options={salesCnOptions} />
              </div>
            </div>
          )}

          {/* 1. 项目核心信息 */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1 border-b border-white/10 text-[12px] font-semibold text-white/70 uppercase tracking-wider">
              <FolderKanban className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>项目基本信息</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              {/* 项目名称 (全宽) */}
              <div className="col-span-2">
                <label className="block text-[13px] font-medium text-white/80 mb-1.5 ml-1">
                  项目名称 <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/50 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/15 rounded-xl px-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/35"
                  placeholder="请输入项目名称（如：车载智能座舱域控制器）"
                  required
                  autoFocus
                />
              </div>

              {/* 市场 (Segment) */}
              <AutocompleteInput
                label="市场 (Segment)"
                value={marketSegment}
                onChange={setMarketSegment}
                options={marketOptions}
                placeholder="例如：Auto / 工业控制 / 消费电子"
              />

              {/* 项目量产时间 */}
              <DateInput
                label="项目量产时间"
                value={mpSchedule}
                onChange={setMpSchedule}
              />

              {/* LTR */}
              <div className="col-span-2">
                <label className="block text-[13px] font-medium text-white/80 mb-1.5 ml-1">
                  LTR (Socket 总 LTR 金额)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ltrAmt}
                    onChange={(e) => setLtrAmt(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/50 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/15 rounded-xl pl-9 pr-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/35"
                    placeholder="例如：$10,000 或 500K"
                  />
                  <DollarSign className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. 负责人信息 */}
          <div className="space-y-3.5 pt-1">
            <div className="flex items-center gap-2 pb-1 border-b border-white/10 text-[12px] font-semibold text-white/70 uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5 text-[#34C759]" />
              <span>负责人联系信息</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              {/* 负责人名字 */}
              <div>
                <label className="block text-[13px] font-medium text-white/80 mb-1.5 ml-1">负责人名字</label>
                <div className="relative">
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/50 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/15 rounded-xl pl-9 pr-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/35"
                    placeholder="姓名"
                  />
                  <User className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* 职位 */}
              <div>
                <label className="block text-[13px] font-medium text-white/80 mb-1.5 ml-1">职位</label>
                <div className="relative">
                  <input
                    type="text"
                    value={ownerTitle}
                    onChange={(e) => setOwnerTitle(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/50 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/15 rounded-xl pl-9 pr-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/35"
                    placeholder="例如：项目总监 / 硬件经理"
                  />
                  <Briefcase className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* 电话 */}
              <div>
                <label className="block text-[13px] font-medium text-white/80 mb-1.5 ml-1">电话</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/50 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/15 rounded-xl pl-9 pr-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/35"
                    placeholder="手机号或座机"
                  />
                  <Phone className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* 邮箱 */}
              <div>
                <label className="block text-[13px] font-medium text-white/80 mb-1.5 ml-1">邮箱</label>
                <div className="relative">
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/50 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/15 rounded-xl pl-9 pr-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/35"
                    placeholder="name@company.com"
                  />
                  <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* 底部操作按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-[14px] font-medium text-white hover:bg-white/10 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#0062C3] transition-colors shadow-sm cursor-pointer"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
