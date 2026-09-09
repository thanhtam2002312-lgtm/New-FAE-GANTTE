import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Calendar, DollarSign, Layers, CheckCircle2 } from 'lucide-react';
import { Customer, Project, PNStatus } from '../types';
import { normalizeDateStr } from '../utils/helpers';
import { GlassSelect } from './GlassSelect';

interface AddPNModalProps {
  customers: Customer[];
  customer?: Customer;
  project?: Project;
  onClose: () => void;
  onSave: (data: {
    name: string;
    productLine: string;
    status: PNStatus;
    drStatus: string;
    marketSegment?: string;
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
          className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/20 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/70 [color-scheme:light-dark]"
          placeholder={placeholder}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <Calendar className="w-4 h-4 text-white/70" />
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
        className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/20 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/70"
        placeholder={placeholder}
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-[#121927]/80 dark:bg-[#0D131F]/85 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.2)] max-h-48 overflow-y-auto p-1 custom-scrollbar">
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

export default function AddPNModal({ customers, customer, project, onClose, onSave, initialData }: AddPNModalProps) {
  const [productLine, setProductLine] = useState(initialData?.productLine || '');
  const [name, setName] = useState(initialData?.name || '');
  const [status, setStatus] = useState<PNStatus>(initialData?.status || 'NBO');
  const [drStatus, setDrStatus] = useState(initialData?.drStatus || '');
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
      marketSegment: project?.marketSegment || initialData?.marketSegment || '',
      socketCreateDate: socketCreateDate.trim(),
      socketTotalLtrAmt: socketTotalLtrAmt.trim(),
      channelOk,
      remark: remark.trim(),
    });
  };

  const marketSegmentDisplay = project?.marketSegment || initialData?.marketSegment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[4px]"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-xl macos-glass-modal rounded-3xl overflow-hidden transform transition-all flex flex-col max-h-[92vh] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/10 bg-white/[0.04] backdrop-blur-md">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0071E3]" />
              <span>{initialData ? '编辑料号 (PN) 详情' : '添加料号 (PN)'}</span>
            </h3>
            {(customer || project) && (
              <div className="flex items-center gap-2 flex-wrap text-xs text-white/65">
                {customer && (
                  <span>
                    所属客户: <span className="text-white font-medium">{customer.nameZh || customer.nameEn}</span>
                  </span>
                )}
                {customer && project && <span className="text-white/20">/</span>}
                {project && (
                  <span>
                    项目: <span className="text-white font-medium">{project.name}</span>
                  </span>
                )}
                {marketSegmentDisplay && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#0071E3]/20 border border-[#0071E3]/35 text-[#64B5F6] font-medium text-[11px] ml-1">
                    市场: {marketSegmentDisplay}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {error && (
            <div className="p-3 bg-[#FF3B30]/15 text-[#FF6961] text-xs font-medium rounded-xl border border-[#FF3B30]/25 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: 产品线选择 & 料号 PN (Symmetric 2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          {/* Row 2: 状态与渠道 (Symmetric 3 columns - No awkward gaps) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-white/70 mb-1.5 ml-1">
                料号状态
              </label>
              <GlassSelect
                value={status}
                onChange={(val) => setStatus(val as PNStatus)}
                options={['Leads', 'NBO', 'DIN', 'DFIN', 'DWIN', 'DLOST']}
                className="w-full !bg-white/10 !border-white/15 !py-2.5 !px-3.5 !rounded-xl text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-white/70 mb-1.5 ml-1">
                DR 状态
              </label>
              <input
                type="text"
                value={drStatus}
                onChange={(e) => setDrStatus(e.target.value)}
                className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-3.5 py-2.5 text-[14px] text-white outline-none transition-all placeholder:text-white/40"
                placeholder="如 DR0, DR1, DR2"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-white/70 mb-1.5 ml-1">
                渠道是否 OK
              </label>
              <GlassSelect
                value={channelOk}
                onChange={(val) => setChannelOk(val as 'Yes' | 'No')}
                options={['Yes', 'No']}
                className="w-full !bg-white/10 !border-white/15 !py-2.5 !px-3.5 !rounded-xl text-[14px]"
              />
            </div>
          </div>

          {/* Row 3: Socket 金额 & Socket 创建日期 (Symmetric 2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-white/70 mb-1.5 ml-1">
                Socket 金额
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={socketTotalLtrAmt}
                  onChange={(e) => setSocketTotalLtrAmt(e.target.value)}
                  className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl pl-9 pr-4 py-2.5 text-[14px] text-white outline-none transition-all placeholder:text-white/40"
                  placeholder="金额如 $10,000 或 500K"
                />
                <DollarSign className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <DateInput
              label="Socket 创建日期"
              value={socketCreateDate}
              onChange={setSocketCreateDate}
            />
          </div>

          {/* Row 4: Remark 备注 (Full width) */}
          <div>
            <label className="block text-[13px] font-medium text-white/70 mb-1.5 ml-1">
              Remark (选填)
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full h-24 bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[14px] text-white outline-none transition-all placeholder:text-white/40 resize-none leading-relaxed"
              placeholder="填写料号备注，该备注将保存并在详情中查阅..."
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-[15px] font-semibold text-white/80 bg-white/10 hover:bg-white/20 active:scale-[0.98] rounded-xl transition-all select-none cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-[15px] font-semibold text-white bg-[#007AFF] hover:bg-[#0071E3] active:scale-[0.98] rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer transition-all select-none text-center"
            >
              {initialData ? '保存修改' : '保存料号'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
