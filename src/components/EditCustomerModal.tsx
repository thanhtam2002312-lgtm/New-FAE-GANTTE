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
        className="w-full bg-white/10 border border-white/15 focus:border-[#0071E3]/30 focus:bg-white/15 focus:ring-4 focus:ring-[#0071E3]/10 rounded-xl px-4 py-2.5 text-[15px] text-white outline-none transition-all placeholder:text-white/70"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/25 backdrop-blur-[3px] transition-all">
      <div className="macos-glass-modal rounded-3xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-white/[0.04] backdrop-blur-md w-full shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">编辑及查看客户详情</h2>
            <p className="text-xs text-white/70 mt-0.5">管理客户的详细属性信息与在用产品线渠道状态</p>
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
          
          {/* Section 1: Customer editable details */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">客户基本属性</h3>
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
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">产品线详情透视</h3>
            
            {/* 1. 客户在用的产品线 */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">客户在用的产品线 ({productLinesInUse.length})</h4>
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
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1">
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
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1">
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
