import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { Customer } from '../types';
import { getBadgeColor } from '../utils/colors';
import { cn } from '../utils/cn';

interface EditCustomerModalProps {
  customers: Customer[];
  customer: Customer;
  onClose: () => void;
  onSave: (
    customerId: string,
    data: {
      nameZh: string;
      nameEn: string;
      customerCode: string;
      salesEn: string;
      salesCn: string;
      customerRd: string;
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

export default function EditCustomerModal({
  customers,
  customer,
  onClose,
  onSave,
}: EditCustomerModalProps) {
  const [nameZh, setNameZh] = useState(customer.nameZh || '');
  const [nameEn, setNameEn] = useState(customer.nameEn || '');
  const [customerCode, setCustomerCode] = useState(customer.customerCode || '');
  const [salesEn, setSalesEn] = useState(customer.salesEn || '');
  const [salesCn, setSalesCn] = useState(customer.salesCn || '');
  const [customerRd, setCustomerRd] = useState(customer.customerRd || '');

  // Autocomplete options across all customers
  const nameZhOptions = useMemo(() => Array.from(new Set(customers.map(c => c.nameZh).filter(Boolean))), [customers]);
  const nameEnOptions = useMemo(() => Array.from(new Set(customers.map(c => c.nameEn).filter(Boolean))), [customers]);
  const codeOptions = useMemo(() => Array.from(new Set(customers.map(c => c.customerCode).filter(Boolean))) as string[], [customers]);
  const salesEnOptions = useMemo(() => Array.from(new Set(customers.map(c => c.salesEn).filter(Boolean))) as string[], [customers]);
  const salesCnOptions = useMemo(() => Array.from(new Set(customers.map(c => c.salesCn).filter(Boolean))) as string[], [customers]);
  const rdOptions = useMemo(() => Array.from(new Set(customers.map(c => c.customerRd).filter(Boolean))) as string[], [customers]);

  // Calculations for product lines based on actual project PN datas
  const productLinesInUse = useMemo(() => {
    const list = new Set<string>();
    customer.projects.forEach(p => {
      p.pns.forEach(pn => {
        if (pn.productLine && pn.productLine.trim()) {
          list.add(pn.productLine.trim());
        }
      });
    });
    return Array.from(list);
  }, [customer]);

  const channelOkProductLines = useMemo(() => {
    const list = new Set<string>();
    customer.projects.forEach(p => {
      p.pns.forEach(pn => {
        if (pn.productLine && pn.productLine.trim() && pn.channelOk === 'Yes') {
          list.add(pn.productLine.trim());
        }
      });
    });
    return Array.from(list);
  }, [customer]);

  const channelNgProductLines = useMemo(() => {
    const list = new Set<string>();
    customer.projects.forEach(p => {
      p.pns.forEach(pn => {
        if (pn.productLine && pn.productLine.trim() && pn.channelOk === 'No') {
          list.add(pn.productLine.trim());
        }
      });
    });
    return Array.from(list);
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameZh.trim()) {
      alert('请填写客户中文名');
      return;
    }
    onSave(customer.id, {
      nameZh: nameZh.trim(),
      nameEn: nameEn.trim(),
      customerCode: customerCode.trim(),
      salesEn: salesEn.trim(),
      salesCn: salesCn.trim(),
      customerRd: customerRd.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-md transition-all">
      <div className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 dark:border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-[#1C1C1E]/50 w-full shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white tracking-tight">编辑及查看客户详情</h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">管理客户的详细属性信息与在用产品线渠道状态</p>
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
          
          {/* Section 1: Customer editable details */}
          <div className="bg-black/[0.01] dark:bg-white/[0.01] border border-black/5 dark:border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white border-b border-black/5 dark:border-white/5 pb-2">客户基本属性</h3>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <AutocompleteInput label="客户中文名" value={nameZh} onChange={setNameZh} options={nameZhOptions} placeholder="必填" required />
              <AutocompleteInput label="客户英文名" value={nameEn} onChange={setNameEn} options={nameEnOptions} placeholder="客户英文名称" />
              <AutocompleteInput label="客户 Code" value={customerCode} onChange={setCustomerCode} options={codeOptions} placeholder="客户编码 Code如 P001" />
              <AutocompleteInput label="Sales 英文名" value={salesEn} onChange={setSalesEn} options={salesEnOptions} placeholder="销售英文名" />
              <AutocompleteInput label="Sales 中文名" value={salesCn} onChange={setSalesCn} options={salesCnOptions} placeholder="销售中文名" />
              <div className="col-span-2">
                <AutocompleteInput label="客户 R&D" value={customerRd} onChange={setCustomerRd} options={rdOptions} placeholder="客户研发负责人" />
              </div>
            </div>
          </div>

          {/* Section 2: Calculated Product Line statuses */}
          <div className="bg-black/[0.01] dark:bg-white/[0.01] border border-black/5 dark:border-white/5 rounded-2xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white border-b border-black/5 dark:border-white/5 pb-2">产品线详情透视</h3>
            
            {/* 1. 客户在用的产品线 */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">客户在用的产品线 ({productLinesInUse.length})</h4>
              {productLinesInUse.length === 0 ? (
                <p className="text-xs text-[#C7C7CC]">当前客户下暂未录入任何产品线信息</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {productLinesInUse.map((pl, i) => (
                    <span 
                      key={i} 
                      className={cn("text-[12px] px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all", getBadgeColor(pl))}
                    >
                      {pl}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 2. 渠道OK的产品线 */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span>渠道 OK 的产品线 ({channelOkProductLines.length})</span>
              </h4>
              {channelOkProductLines.length === 0 ? (
                <p className="text-xs text-[#C7C7CC]">暂无渠道 OK 的产品线数据</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {channelOkProductLines.map((pl, i) => (
                    <span 
                      key={i} 
                      className={cn("text-[12px] px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all", getBadgeColor(pl))}
                    >
                      {pl}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 3. 渠道有问题的产品线 */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span>渠道有问题的产品线 ({channelNgProductLines.length})</span>
              </h4>
              {channelNgProductLines.length === 0 ? (
                <p className="text-xs text-[#C7C7CC]">暂无渠道异常的产品线数据</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {channelNgProductLines.map((pl, i) => (
                    <span 
                      key={i} 
                      className={cn("text-[12px] px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all", getBadgeColor(pl))}
                    >
                      {pl}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer Controls */}
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
