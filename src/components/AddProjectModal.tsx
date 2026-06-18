import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, ChevronDown, Calendar } from 'lucide-react';
import { Customer, PNStatus } from '../types';

interface AddProjectModalProps {
  customers: Customer[];
  onClose: () => void;
  onSave: (data: {
    nameZh: string;
    nameEn: string;
    customerCode: string;
    salesEn: string;
    salesCn: string;
    customerRd: string;
    marketSegment: string;
    projectName: string;
    productLine: string;
    pnName: string;
    pnStatus: PNStatus;
    drStatus: string;
    socketCreateDate: string;
    socketTotalLtrAmt: string;
    mpSchedule?: string;
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
      e.preventDefault(); // Prevent form submission
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
        <div className="absolute z-50 w-full mt-1.5 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.35)] max-h-48 overflow-y-auto py-1">
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

export default function AddProjectModal({ customers, onClose, onSave, initialCustomer }: AddProjectModalProps) {
  const [nameZh, setNameZh] = useState(initialCustomer?.nameZh || '');
  const [nameEn, setNameEn] = useState(initialCustomer?.nameEn || '');
  const [customerCode, setCustomerCode] = useState(initialCustomer?.customerCode || '');
  const [salesEn, setSalesEn] = useState(initialCustomer?.salesEn || '');
  const [salesCn, setSalesCn] = useState(initialCustomer?.salesCn || '');
  const [customerRd, setCustomerRd] = useState(initialCustomer?.customerRd || '');
  const [marketSegment, setMarketSegment] = useState('');
  
  const [projectName, setProjectName] = useState('');
  const [productLine, setProductLine] = useState('');
  const [pnName, setPnName] = useState('');
  const [pnStatus, setPnStatus] = useState<PNStatus>('NBO');
  const [drStatus, setDrStatus] = useState('');
  const [socketCreateDate, setSocketCreateDate] = useState('');
  const [mpSchedule, setMpSchedule] = useState('');
  const [socketTotalLtrAmt, setSocketTotalLtrAmt] = useState('');

  // Extract unique values for autocompletes
  const nameZhOptions = useMemo(() => Array.from(new Set(customers.map(c => c.nameZh).filter(Boolean))), [customers]);
  const nameEnOptions = useMemo(() => Array.from(new Set(customers.map(c => c.nameEn).filter(Boolean))), [customers]);
  const codeOptions = useMemo(() => Array.from(new Set(customers.map(c => c.customerCode).filter(Boolean))) as string[], [customers]);
  const salesEnOptions = useMemo(() => Array.from(new Set(customers.map(c => c.salesEn).filter(Boolean))) as string[], [customers]);
  const salesCnOptions = useMemo(() => Array.from(new Set(customers.map(c => c.salesCn).filter(Boolean))) as string[], [customers]);
  const rdOptions = useMemo(() => Array.from(new Set(customers.map(c => c.customerRd).filter(Boolean))) as string[], [customers]);
  const marketOptions = useMemo(() => Array.from(new Set(customers.map(c => c.projects).flat().map(p => p.pns).flat().map(pn => pn.marketSegment).filter(Boolean))) as string[], [customers]);
  
  const productLineOptions = useMemo(() => {
    const pls = new Set<string>();
    customers.forEach(c => c.projects.forEach(p => p.pns.forEach(pn => {
      if (pn.productLine) pls.add(pn.productLine);
    })));
    return Array.from(pls);
  }, [customers]);

  const pnOptions = useMemo(() => {
    const pns = new Set<string>();
    customers.forEach(c => c.projects.forEach(p => p.pns.forEach(pn => {
      if (pn.productLine === productLine && pn.name) pns.add(pn.name);
    })));
    return Array.from(pns);
  }, [customers, productLine]);

  // Auto-fill other customer fields only when identity fields change (only when not pre-selected/initialCustomer)
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

  useEffect(() => {
    if (initialCustomer) return;
    const existing = customers.find(c => c.nameEn === nameEn);
    if (existing) {
      setNameZh(existing.nameZh || '');
      setCustomerCode(existing.customerCode || '');
      setSalesEn(existing.salesEn || '');
      setSalesCn(existing.salesCn || '');
      setCustomerRd(existing.customerRd || '');
    }
  }, [nameEn, customers, initialCustomer]);

  useEffect(() => {
    if (initialCustomer) return;
    const existing = customers.find(c => c.customerCode === customerCode);
    if (existing) {
      setNameZh(existing.nameZh || '');
      setNameEn(existing.nameEn || '');
      setSalesEn(existing.salesEn || '');
      setSalesCn(existing.salesCn || '');
      setCustomerRd(existing.customerRd || '');
    }
  }, [customerCode, customers, initialCustomer]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nameZh || !projectName || !pnName) {
      alert('请填写必填字段：客户中文名、项目名称、料号PN');
      return;
    }
    onSave({
      nameZh,
      nameEn,
      customerCode,
      salesEn,
      salesCn,
      customerRd,
      marketSegment,
      projectName,
      productLine,
      pnName,
      pnStatus,
      drStatus,
      socketCreateDate,
      socketTotalLtrAmt,
      mpSchedule
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-md transition-all">
      <div className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 dark:border-white/10">
        <div className="flex items-center justify-between px-8 py-5 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-[#1C1C1E]/50 w-full">
          <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white tracking-tight">添加项目</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#8E8E93]" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-5 custom-scrollbar">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {/* Show customer selection fields only if there is NO initialCustomer context */}
            {!initialCustomer && (
              <>
                <AutocompleteInput label="客户中文名" value={nameZh} onChange={setNameZh} options={nameZhOptions} placeholder="必填" required />
                <AutocompleteInput label="客户英文名" value={nameEn} onChange={setNameEn} options={nameEnOptions} />
                <AutocompleteInput label="客户 Code" value={customerCode} onChange={setCustomerCode} options={codeOptions} />
                <AutocompleteInput label="Sales 英文名" value={salesEn} onChange={setSalesEn} options={salesEnOptions} />
                <AutocompleteInput label="Sales 中文名" value={salesCn} onChange={setSalesCn} options={salesCnOptions} />
                <AutocompleteInput label="客户 R&D" value={customerRd} onChange={setCustomerRd} options={rdOptions} />
              </>
            )}

            {/* Project Name */}
            <div className="col-span-2">
              <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">项目名称 <span className="text-[#FF3B30]">*</span></label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
                placeholder="必填"
                required
              />
            </div>

            <AutocompleteInput label="产品线" value={productLine} onChange={setProductLine} options={productLineOptions} />
            <AutocompleteInput label="料号 PN" value={pnName} onChange={setPnName} options={pnOptions} placeholder="必填" required />
            <AutocompleteInput label="市场 (Segment)" value={marketSegment} onChange={setMarketSegment} options={marketOptions} />
            
            <div>
              <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">PN 状态</label>
              <div className="relative">
                <select
                  value={pnStatus}
                  onChange={(e) => setPnStatus(e.target.value as PNStatus)}
                  className="w-full appearance-none bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl pl-4 pr-10 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all cursor-pointer"
                >
                  {['Leads', 'NBO', 'DIN', 'DFIN', 'DWIN'].map(status => (
                    <option key={status} value={status} className="bg-white dark:bg-[#1C1C1E]">{status}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] pointer-events-none" />
              </div>
            </div>

            <AutocompleteInput label="DR 状态" value={drStatus} onChange={setDrStatus} options={[]} />
            
            <DateInput
              label="Socket 创建日期"
              value={socketCreateDate}
              onChange={setSocketCreateDate}
            />

            <DateInput
              label="项目量产时间"
              value={mpSchedule}
              onChange={setMpSchedule}
            />

            <div className="col-span-2">
              <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">Socket 总 LTR 金额</label>
              <input
                type="text"
                value={socketTotalLtrAmt}
                onChange={(e) => setSocketTotalLtrAmt(e.target.value)}
                className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/30 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
                placeholder="例如 $10,000"
              />
            </div>
          </div>

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
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
