import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Customer } from '../types';

interface AddCustomerModalProps {
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
  }) => void;
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
    if (e.key === 'Enter') {
      e.preventDefault(); // Always prevent form submission on Enter
      if (isOpen) {
        if (filteredOptions.length > 0 && activeIndex >= 0 && activeIndex < filteredOptions.length) {
          onChange(filteredOptions[activeIndex]);
        }
        setIsOpen(false);
        setIsTyping(false);
      } else {
        e.currentTarget.blur();
      }
      return;
    }

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

export default function AddCustomerModal({ customers, onClose, onSave }: AddCustomerModalProps) {
  const [nameZh, setNameZh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [salesEn, setSalesEn] = useState('');
  const [salesCn, setSalesCn] = useState('');
  const [customerRd, setCustomerRd] = useState('');
  const [marketSegment, setMarketSegment] = useState('');

  // Extract unique values for autocompletes
  const nameZhOptions = useMemo(() => Array.from(new Set(customers.map(c => c.nameZh).filter(Boolean))), [customers]);
  const nameEnOptions = useMemo(() => Array.from(new Set(customers.map(c => c.nameEn).filter(Boolean))), [customers]);
  const codeOptions = useMemo(() => Array.from(new Set(customers.map(c => c.customerCode).filter(Boolean))) as string[], [customers]);
  const salesEnOptions = useMemo(() => Array.from(new Set(customers.map(c => c.salesEn).filter(Boolean))) as string[], [customers]);
  const salesCnOptions = useMemo(() => Array.from(new Set(customers.map(c => c.salesCn).filter(Boolean))) as string[], [customers]);
  const rdOptions = useMemo(() => Array.from(new Set(customers.map(c => c.customerRd).filter(Boolean))) as string[], [customers]);
  const marketOptions = useMemo(() => Array.from(new Set(customers.map(c => c.projects).flat().map(p => p.pns).flat().map(pn => pn.marketSegment).filter(Boolean))) as string[], [customers]);

  // Uni-directional smart auto-fill and auto-clear driven by nameZh (Customer Chinese Name)
  const [autoFilledFromName, setAutoFilledFromName] = useState('');

  useEffect(() => {
    if (!nameZh) {
      if (autoFilledFromName) {
        setNameEn('');
        setCustomerCode('');
        setSalesEn('');
        setSalesCn('');
        setCustomerRd('');
        setMarketSegment('');
        setAutoFilledFromName('');
      }
      return;
    }

    const matched = customers.find(c => c.nameZh.trim() === nameZh.trim());
    if (matched) {
      setNameEn(matched.nameEn || '');
      setCustomerCode(matched.customerCode || '');
      setSalesEn(matched.salesEn || '');
      setSalesCn(matched.salesCn || '');
      setCustomerRd(matched.customerRd || '');
      setAutoFilledFromName(matched.nameZh);
    } else {
      if (autoFilledFromName) {
        setNameEn('');
        setCustomerCode('');
        setSalesEn('');
        setSalesCn('');
        setCustomerRd('');
        setMarketSegment('');
        setAutoFilledFromName('');
      }
    }
  }, [nameZh, customers, autoFilledFromName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameZh) {
      alert('请填写必填字段：客户中文名');
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
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-md transition-all">
      <div className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 dark:border-white/10">
        <div className="flex items-center justify-between px-8 py-5 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-[#1C1C1E]/50 w-full">
          <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white tracking-tight">添加客户</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#8E8E93]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-5 custom-scrollbar">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <AutocompleteInput label="客户中文名" value={nameZh} onChange={setNameZh} options={nameZhOptions} placeholder="必填" required />
            <AutocompleteInput label="客户英文名" value={nameEn} onChange={setNameEn} options={nameEnOptions} />
            <AutocompleteInput label="客户 Code" value={customerCode} onChange={setCustomerCode} options={codeOptions} />
            <AutocompleteInput label="Sales 英文名" value={salesEn} onChange={setSalesEn} options={salesEnOptions} />
            <AutocompleteInput label="Sales 中文名" value={salesCn} onChange={setSalesCn} options={salesCnOptions} />
            <AutocompleteInput label="客户 R&D" value={customerRd} onChange={setCustomerRd} options={rdOptions} />
            <div className="col-span-2">
              <AutocompleteInput label="市场 (Segment)" value={marketSegment} onChange={setMarketSegment} options={marketOptions} />
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
