import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Calendar } from 'lucide-react';
import { Customer, PNStatus } from '../types';
import { normalizeDateStr } from '../utils/helpers';

interface AddPNModalProps {
  customers: Customer[];
  onClose: () => void;
  onSave: (data: {
    name: string;
    productLine: string;
    status: PNStatus;
    drStatus: string;
    marketSegment: string;
    socketCreateDate: string;
    socketTotalLtrAmt: string;
    channelOk: 'Yes' | 'No';
    remark: string;
  }) => void;
  initialData?: {
    name: string;
    productLine: string;
    status: PNStatus;
    drStatus?: string;
    socketCreateDate?: string;
    socketTotalLtrAmt?: string;
    channelOk?: 'Yes' | 'No';
    remark?: string;
    marketSegment?: string;
  };
}

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
          className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/20 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93] [color-scheme:light-dark]"
          placeholder={placeholder}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <Calendar className="w-4 h-4 text-[#8E8E93]" />
        </div>
      </div>
    </div>
  );
};

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
        className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/20 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
        placeholder={placeholder}
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.35)] max-h-48 overflow-y-auto py-1">
          {filteredOptions.map((opt, i) => (
            <div
              key={i}
              className={`px-4 py-2 text-[14px] cursor-pointer transition-colors ${
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

export default function AddPNModal({ customers, onClose, onSave, initialData }: AddPNModalProps) {
  const [productLine, setProductLine] = useState(initialData?.productLine || '');
  const [name, setName] = useState(initialData?.name || '');
  const [status, setStatus] = useState<PNStatus>(initialData?.status || 'NBO');
  const [drStatus, setDrStatus] = useState(initialData?.drStatus || '');
  const [marketSegment, setMarketSegment] = useState(initialData?.marketSegment || '');
  const [socketCreateDate, setSocketCreateDate] = useState(normalizeDateStr(initialData?.socketCreateDate || ''));
  const [socketTotalLtrAmt, setSocketTotalLtrAmt] = useState(initialData?.socketTotalLtrAmt || '');
  const [channelOk, setChannelOk] = useState<'Yes' | 'No'>(initialData?.channelOk || 'Yes');
  const [remark, setRemark] = useState(initialData?.remark || '');
  const [error, setError] = useState('');

  // Collect unique product lines and part numbers from current customers database
  const existingProductLines = useMemo(() => {
    const lines = new Set<string>();
    customers.forEach((c) => {
      c.projects.forEach((p) => {
        p.pns.forEach((pn) => {
          if (pn.productLine) lines.add(pn.productLine);
        });
      });
    });
    return Array.from(lines).filter(Boolean);
  }, [customers]);

  const existingPartNumbers = useMemo(() => {
    const names = new Set<string>();
    customers.forEach((c) => {
      c.projects.forEach((p) => {
        p.pns.forEach((pn) => {
          if (pn.name) names.add(pn.name);
        });
      });
    });
    return Array.from(names).filter(Boolean);
  }, [customers]);

  const existingMarketSegments = useMemo(() => {
    const markets = new Set<string>();
    customers.forEach((c) => {
      c.projects.forEach((p) => {
        p.pns.forEach((pn) => {
          if (pn.marketSegment) markets.add(pn.marketSegment);
        });
      });
    });
    return Array.from(markets).filter(Boolean);
  }, [customers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('请输入或选择料号(PN)');
      return;
    }
    if (!productLine.trim()) {
      setError('请输入或选择产品线');
      return;
    }

    onSave({
      name: name.trim(),
      productLine: productLine.trim(),
      status,
      drStatus: drStatus.trim(),
      marketSegment: marketSegment.trim(),
      socketCreateDate: socketCreateDate.trim(),
      socketTotalLtrAmt: socketTotalLtrAmt.trim(),
      channelOk,
      remark: remark.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-black/5 dark:border-white/10 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
          <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
            {initialData ? '编辑料号 (PN) 详情' : '添加料号 (PN)'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {error && (
            <div className="p-3.5 bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-medium rounded-xl border border-[#FF3B30]/10">
              {error}
            </div>
          )}

          {/* Row 1: Product Line and Channel OK */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <AutocompleteInput
                label="产品线选择"
                value={productLine}
                onChange={(val) => {
                  setProductLine(val);
                  setError('');
                }}
                options={existingProductLines}
                placeholder="输入或选择已有产品线..."
                required
              />
            </div>
            <div>
              <AutocompleteInput
                label="市场 (Segment)"
                value={marketSegment}
                onChange={setMarketSegment}
                options={existingMarketSegments}
                placeholder="Market Segment"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <AutocompleteInput
                label="料号 PN"
                value={name}
                onChange={(val) => {
                  setName(val);
                  setError('');
                }}
                options={existingPartNumbers}
                placeholder="输入或选择料号..."
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">
                渠道是否OK
              </label>
              <select
                value={channelOk}
                onChange={(e) => setChannelOk(e.target.value as 'Yes' | 'No')}
                className="w-full appearance-none bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#0071E3]/20 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all cursor-pointer"
              >
                <option value="Yes" className="bg-white dark:bg-[#1C1C1E]">Yes</option>
                <option value="No" className="bg-white dark:bg-[#1C1C1E]">No</option>
              </select>
            </div>
          </div>

          {/* Row 2: Part Number, PN Status, and DR Status */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              {/* moved to row 1 above */}
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">
                料号状态
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PNStatus)}
                className="w-full appearance-none bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-transparent focus:border-[#0071E3]/20 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all cursor-pointer"
              >
                {['Leads', 'NBO', 'DIN', 'DFIN', 'DWIN', 'DLOST'].map((st) => (
                  <option key={st} value={st} className="bg-white dark:bg-[#1C1C1E]">{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">
                DR 状态
              </label>
              <input
                type="text"
                value={drStatus}
                onChange={(e) => setDrStatus(e.target.value)}
                className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/20 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
                placeholder="如 DR0, DR1"
              />
            </div>
          </div>

          {/* Row 3: Socket Amount and Socket Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">
                Socket 金额
              </label>
              <input
                type="text"
                value={socketTotalLtrAmt}
                onChange={(e) => setSocketTotalLtrAmt(e.target.value)}
                className="w-full bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/20 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93]"
                placeholder="金额如 $10,000"
              />
            </div>

            <DateInput
              label="Socket 创建日期"
              value={socketCreateDate}
              onChange={setSocketCreateDate}
            />
          </div>

          {/* Row 4: Remark text area */}
          <div>
            <label className="block text-[13px] font-medium text-[#8E8E93] mb-1.5 ml-1">
              Remark (选填)
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full h-24 bg-black/[0.03] dark:bg-white/5 border border-transparent focus:border-[#0071E3]/20 focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-[#1D1D1F] dark:text-white outline-none transition-all placeholder:text-[#8E8E93] resize-none"
              placeholder="填写备注，备注将保存但在左侧列表隐藏..."
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-[15px] font-semibold text-[#1D1D1F] dark:text-white bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.08] dark:hover:bg-white/10 active:scale-[0.98] rounded-xl transition-all select-none"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-[15px] font-semibold text-white bg-[#007AFF] hover:bg-[#0071E3] active:scale-[0.98] rounded-xl shadow-md cursor-pointer transition-all select-none text-center"
            >
              {initialData ? '保存修改' : '保存料号'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
