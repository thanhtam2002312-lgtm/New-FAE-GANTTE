import React, { useState, useEffect, useRef } from "react";
import { Customer, Project, PN, Task } from "../types";
import { Plus, Trash2, Edit2, Filter, Check, X, Search, RotateCcw, ChevronLeft, ChevronRight, Maximize2, Sparkles, SlidersHorizontal } from "lucide-react";
import { cn } from "../utils/cn";
import { GlassSelect } from "./GlassSelect";

interface ExcelViewProps {
  customers: Customer[];
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onAddProject: (customerId: string) => void;
  onEditProject: (customer: Customer, project: Project) => void;
  onDeleteProject: (customerId: string, projectId: string) => void;
  onAddPN: (customerId: string, projectId: string) => void;
  onEditPN: (customerId: string, projectId: string, pn: PN) => void;
  onDeletePN: (customerId: string, projectId: string, pnId: string) => void;
  onAddTask: (customerId: string, projectId: string, pnId: string) => void;
  onEditTask: (customerId: string, projectId: string, pnId: string, task: Task) => void;
  onDeleteTask: (customerId: string, projectId: string, pnId: string, taskId: string) => void;
  onUpdateCustomer: (updatedCustomer: Customer) => void;
  onAddFullRow?: (afterCustomerId: string, newCustomer: Customer) => void;
}

function InlineInput({ value, onChange, className, listId }: { value: string; onChange: (v: string) => void; className?: string; listId?: string }) {
  const [val, setVal] = useState(value);
  const [isTyping, setIsTyping] = useState(false);
  
  useEffect(() => { 
    setVal(value); 
    setIsTyping(false);
  }, [value]);
  
  return (
    <input 
      value={val}
      title={val || undefined}
      onChange={(e) => {
        setVal(e.target.value);
        setIsTyping(true);
      }}
      onBlur={() => { 
        setIsTyping(false);
        if (val !== value) onChange(val); 
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      list={isTyping && val.trim().length > 0 ? listId : undefined}
      className={cn("w-full bg-transparent border-none outline-none focus:bg-white/10 p-1.5 flex transition-colors text-ellipsis min-w-[60px] text-white placeholder:text-white/40 font-normal", className)}
    />
  )
}

function UpdatedCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [val, setVal] = useState(value);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalText, setModalText] = useState(value);

  useEffect(() => {
    setVal(value);
    setModalText(value);
  }, [value]);

  return (
    <div 
      className="group/upd relative flex items-start justify-between w-full h-full min-h-[38px] p-1.5 cursor-pointer hover:bg-white/[0.05] transition-colors"
      onDoubleClick={() => {
        setModalText(val);
        setIsModalOpen(true);
      }}
      title={val ? `${val}\n\n(双击或点击展开图标查看/编辑完整内容)` : "双击添加更新内容..."}
    >
      <div className="flex-1 pr-1 overflow-hidden">
        {val ? (
          <div className="text-[11px] leading-relaxed text-white whitespace-pre-line line-clamp-3 select-text font-normal break-words drop-shadow-xs">
            {val}
          </div>
        ) : (
          <span className="text-[11px] text-white/40 italic select-none">双击编辑更新...</span>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setModalText(val);
          setIsModalOpen(true);
        }}
        title="展开查看/编辑完整进展更新"
        className={cn(
          "p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md text-white/70 hover:text-[#007AFF] transition-opacity shrink-0 ml-0.5",
          val ? "opacity-0 group-hover/upd:opacity-100" : "opacity-0 group-hover/upd:opacity-40"
        )}
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>

      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[3px] p-4 cursor-default" 
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="macos-glass-modal rounded-2xl shadow-2xl w-full max-w-xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white">Updated 进展更新详情</span>
                <span className="text-[10px] text-white/70 bg-white/10 px-2 py-0.5 rounded-full font-mono">
                  来源：Activity (FAE/PM/Others) / Activity (Sales)
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 text-white/80 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={modalText}
              onChange={(e) => setModalText(e.target.value)}
              rows={12}
              className="w-full p-3.5 text-xs leading-relaxed rounded-xl bg-white/[0.05] border border-white/15 outline-none focus:border-[#007AFF] resize-none font-mono text-white"
              placeholder="在此输入或粘贴完整更新内容（例如每周周报、Call Report、跟进记录）..."
              autoFocus
            />
            <div className="flex justify-between items-center pt-1">
              <span className="text-[11px] text-white/70">字符数: {modalText.length}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-white/70 hover:bg-white/10 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(modalText);
                    setVal(modalText);
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#007AFF]/90 rounded-lg shadow-sm transition-colors"
                >
                  保存更新
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InlineSelect({ value, options, onChange, className }: { value: string; options: {label: string, value: string}[]; onChange: (v: string) => void; className?: string }) {
  return (
    <GlassSelect
      value={value}
      options={options}
      onChange={onChange}
      size="xs"
      className={cn("!bg-transparent hover:!bg-white/10 !border-transparent hover:!border-white/10 !shadow-none !px-2 !py-0.5 !text-xs", className)}
    />
  );
}

export interface ColumnConfig {
  key: string;
  label: string;
  defaultWidth: number;
  minWidth: number;
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "salesEn", label: "Sales EN", defaultWidth: 120, minWidth: 90 },
  { key: "salesCn", label: "Sales CN", defaultWidth: 110, minWidth: 80 },
  { key: "customerCode", label: "Customer Code", defaultWidth: 165, minWidth: 110 },
  { key: "nameEn", label: "Customer English Name", defaultWidth: 230, minWidth: 150 },
  { key: "nameZh", label: "Socket Customer Chinese Name", defaultWidth: 270, minWidth: 160 },
  { key: "customerRd", label: "Customer R&D", defaultWidth: 155, minWidth: 100 },
  { key: "marketSegment", label: "Market (Segment)", defaultWidth: 180, minWidth: 120 },
  { key: "projectName", label: "Project name", defaultWidth: 260, minWidth: 150 },
  { key: "productLine", label: "Brand (Product line)", defaultWidth: 195, minWidth: 130 },
  { key: "pnName", label: "P/N", defaultWidth: 190, minWidth: 130 },
  { key: "status", label: "Current Status", defaultWidth: 150, minWidth: 110 },
  { key: "drStatus", label: "DR status", defaultWidth: 130, minWidth: 90 },
  { key: "socketCreateDate", label: "Socket Create date", defaultWidth: 160, minWidth: 120 },
  { key: "mpSchedule", label: "MP Schedule", defaultWidth: 150, minWidth: 110 },
  { key: "socketTotalLtrAmt", label: "Socket Total LTR AMT", defaultWidth: 180, minWidth: 120 },
  { key: "channelOk", label: "Channel OK", defaultWidth: 120, minWidth: 80 },
  { key: "remark", label: "Remark", defaultWidth: 200, minWidth: 120 },
  { key: "updated", label: "Updated", defaultWidth: 320, minWidth: 180 },
];

export const DEFAULT_ACTION_WIDTH = 90;
export const DEFAULT_ACTIVITY_WIDTH = 360;

export function ExcelView({
  customers,
  onDeleteCustomer,
  onAddProject,
  onDeleteProject,
  onAddPN,
  onDeletePN,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateCustomer,
  onAddFullRow,
}: ExcelViewProps) {
  const flatData: any[] = [];
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set());
  const [rowMenuOpen, setRowMenuOpen] = useState<string | null>(null);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  const scrollTable = (direction: "left" | "right") => {
    if (!bodyScrollRef.current) return;
    const container = bodyScrollRef.current;
    const viewportWidth = container.clientWidth || 900;
    // 单次横向滑动半屏宽度（50% 可视区域）
    const step = Math.max(Math.round(viewportWidth * 0.5), 300);
    const offset = direction === "left" ? -step : step;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const targetLeft = Math.max(0, Math.min(maxScroll, container.scrollLeft + offset));

    container.scrollTo({
      left: targetLeft,
      behavior: "smooth",
    });
  };

  const handleHeaderWheel = (e: React.WheelEvent) => {
    if (bodyScrollRef.current) {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      bodyScrollRef.current.scrollLeft += delta * 1.2;
    }
  };

  // 列宽状态管理与持久化 (支持拖拽调整、双击自适应最佳宽度、一键自适应全表)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("fae_excel_column_widths");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === "object" && parsed !== null) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return {};
  });

  const saveColumnWidths = (newWidths: Record<string, number>) => {
    setColumnWidths(newWidths);
    try {
      localStorage.setItem("fae_excel_column_widths", JSON.stringify(newWidths));
    } catch {
      // ignore
    }
  };

  const [resizingCol, setResizingCol] = useState<{
    key: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const [isDraggingHeader, setIsDraggingHeader] = useState(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, input, select, [data-resizer='true']")) return;
    if (resizingCol) return;
    setIsDraggingHeader(true);
    dragStartX.current = e.pageX;
    dragStartScrollLeft.current = bodyScrollRef.current?.scrollLeft || 0;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingHeader || !bodyScrollRef.current) return;
      const diff = e.pageX - dragStartX.current;
      bodyScrollRef.current.scrollLeft = dragStartScrollLeft.current - diff;
    };

    const onMouseUp = () => {
      setIsDraggingHeader(false);
    };

    if (isDraggingHeader) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDraggingHeader]);

  // Drag state for the floating horizontal scrollbar
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollRatio, setScrollRatio] = useState(1);
  const scrollbarTrackRef = useRef<HTMLDivElement>(null);
  const scrollbarDragStartX = useRef(0);
  const scrollbarStartScrollLeft = useRef(0);

  const updateScrollMetrics = () => {
    if (bodyScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = bodyScrollRef.current;
      const max = scrollWidth - clientWidth;
      if (max > 0) {
        setScrollProgress(scrollLeft / max);
        setScrollRatio(clientWidth / scrollWidth);
      } else {
        setScrollRatio(1);
        setScrollProgress(0);
      }
    }
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingScrollbar || !bodyScrollRef.current || !scrollbarTrackRef.current) return;
      const trackWidth = scrollbarTrackRef.current.clientWidth;
      const { scrollWidth, clientWidth } = bodyScrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll <= 0 || trackWidth <= 0) return;

      const thumbWidthPercent = Math.max(8, Math.min(100, scrollRatio * 100));
      const thumbW = (thumbWidthPercent / 100) * trackWidth;
      const maxThumbTravel = trackWidth - thumbW;
      if (maxThumbTravel <= 0) return;

      const deltaX = e.pageX - scrollbarDragStartX.current;
      const scrollDelta = (deltaX / maxThumbTravel) * maxScroll;
      bodyScrollRef.current.scrollLeft = Math.max(0, Math.min(maxScroll, scrollbarStartScrollLeft.current + scrollDelta));
    };

    const onMouseUp = () => {
      setIsDraggingScrollbar(false);
    };

    if (isDraggingScrollbar) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDraggingScrollbar, scrollRatio]);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bodyScrollRef.current || !scrollbarTrackRef.current) return;
    const trackRect = scrollbarTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    const trackWidth = trackRect.width;
    const { scrollWidth, clientWidth } = bodyScrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0 || trackWidth <= 0) return;

    const thumbWidthPercent = Math.max(8, Math.min(100, scrollRatio * 100));
    const thumbW = (thumbWidthPercent / 100) * trackWidth;
    const targetThumbCenter = clickX - thumbW / 2;
    const maxThumbTravel = trackWidth - thumbW;
    const progress = Math.max(0, Math.min(1, targetThumbCenter / maxThumbTravel));
    bodyScrollRef.current.scrollTo({
      left: progress * maxScroll,
      behavior: "smooth"
    });
  };

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingScrollbar(true);
    scrollbarDragStartX.current = e.pageX;
    scrollbarStartScrollLeft.current = bodyScrollRef.current?.scrollLeft || 0;
  };

  const handleBodyScroll = () => {
    if (activeFilterCol) {
      setActiveFilterCol(null);
      setPopoverCoords(null);
    }
    updateScrollMetrics();
    // 同步表头位置；表头自身不反向修改表格主体，彻底防止平滑滚动动画被意外中断
    if (headerScrollRef.current && bodyScrollRef.current) {
      headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
    }
  };

  const handleHeaderScroll = () => {
    updateScrollMetrics();
  };

  const salesEnOptions = React.useMemo(() => Array.from(new Set(customers.map(c => c.salesEn).filter(Boolean))) as string[], [customers]);
  const salesCnOptions = React.useMemo(() => Array.from(new Set(customers.map(c => c.salesCn).filter(Boolean))) as string[], [customers]);
  const customerCodeOptions = React.useMemo(() => Array.from(new Set(customers.map(c => c.customerCode).filter(Boolean))) as string[], [customers]);
  const nameEnOptions = React.useMemo(() => Array.from(new Set(customers.map(c => c.nameEn).filter(Boolean))) as string[], [customers]);
  const nameZhOptions = React.useMemo(() => Array.from(new Set(customers.map(c => c.nameZh).filter(Boolean))) as string[], [customers]);
  const customerRdOptions = React.useMemo(() => Array.from(new Set(customers.map(c => c.customerRd).filter(Boolean))) as string[], [customers]);

  const pNameOptions = React.useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => (c.projects || []).forEach(p => { if (p.name) set.add(p.name); }));
    return Array.from(set);
  }, [customers]);

  const pnLineOptions = React.useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => (c.projects || []).forEach(p => (p.pns || []).forEach(pn => { if (pn.productLine) set.add(pn.productLine); })));
    return Array.from(set);
  }, [customers]);

  const pnNameOptions = React.useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => (c.projects || []).forEach(p => (p.pns || []).forEach(pn => { if (pn.name) set.add(pn.name); })));
    return Array.from(set);
  }, [customers]);

  const marketSegmentOptions = React.useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => (c.projects || []).forEach(p => (p.pns || []).forEach(pn => { if (pn.marketSegment) set.add(pn.marketSegment); })));
    return Array.from(set);
  }, [customers]);

  (customers || []).forEach((customer) => {
    if (!customer.projects || customer.projects.length === 0) {
       flatData.push({ type: 'customer', customer });
       return;
    }
    (customer.projects || []).forEach((project) => {
      if (!project.pns || project.pns.length === 0) {
         flatData.push({ type: 'project', customer, project });
         return;
      }
      (project.pns || []).forEach((pn) => {
        flatData.push({ type: 'pn', customer, project, pn });
      });
    });
  });

  const toggleFilter = (key: string, value: string, allValues: string[]) => {
    setFilters(prev => {
      const current = prev[key];
      if (!current) {
        // Initially all are selected, deselect this value
        return { ...prev, [key]: allValues.filter(v => v !== value) };
      }
      if (current.includes(value)) {
        const next = current.filter(v => v !== value);
        return { ...prev, [key]: next };
      } else {
        const next = [...current, value];
        if (next.length === allValues.length) {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        }
        return { ...prev, [key]: next };
      }
    });
  };

  const selectOnlyValue = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: [value] }));
  };

  const selectAll = (key: string) => {
    setFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearFilter = (key: string) => {
    setFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const deselectAll = (key: string) => {
    setFilters(prev => ({ ...prev, [key]: ["__NONE__"] }));
  };

  const getColValue = (key: string, c: Customer, p?: Project, pn?: PN): string => {
    let val: string | undefined = "";
    if (key === "salesEn") val = c.salesEn;
    else if (key === "salesCn") val = c.salesCn;
    else if (key === "customerCode") val = c.customerCode;
    else if (key === "nameEn") val = c.nameEn;
    else if (key === "nameZh") val = c.nameZh;
    else if (key === "customerRd") val = c.customerRd;
    else if (key === "marketSegment") val = pn?.marketSegment;
    else if (key === "projectName") val = p?.name;
    else if (key === "productLine") val = pn?.productLine;
    else if (key === "pnName") val = pn?.name;
    else if (key === "status") val = pn?.status;
    else if (key === "drStatus") val = pn?.drStatus;
    else if (key === "socketCreateDate") val = pn?.socketCreateDate;
    else if (key === "mpSchedule") val = p?.mpSchedule;
    else if (key === "socketTotalLtrAmt") val = pn?.socketTotalLtrAmt;
    else if (key === "channelOk") val = pn?.channelOk;
    else if (key === "remark") val = pn?.remark;
    else if (key === "updated") val = pn?.updated;
    return val || "";
  }

  const getUniqueValues = (key: string) => {
    const values = new Set<string>();
    flatData.forEach(row => {
      const val = getColValue(key, row.customer, row.project, row.pn);
      values.add(val);
    });
    return Array.from(values).sort();
  };

  const filteredData = flatData.filter(row => {
    for (const [key, selectedValues] of Object.entries(filters) as [string, string[]][]) {
      if (!selectedValues || selectedValues.length === 0) continue;
      const val = getColValue(key, row.customer, row.project, row.pn);
      if (!selectedValues.includes(val)) {
        return false;
      }
    }
    return true;
  });

  const getColWidth = (key: string): number => {
    if (key === "action") return columnWidths["action"] ?? DEFAULT_ACTION_WIDTH;
    if (key === "activity") return columnWidths["activity"] ?? DEFAULT_ACTIVITY_WIDTH;
    const found = DEFAULT_COLUMNS.find(c => c.key === key);
    return columnWidths[key] ?? (found ? found.defaultWidth : 150);
  };

  const handleResizerMouseDown = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const currentWidth = getColWidth(key);
    setResizingCol({
      key,
      startX: e.pageX,
      startWidth: currentWidth,
    });
  };

  useEffect(() => {
    if (!resizingCol) return;

    const colConfig = DEFAULT_COLUMNS.find(c => c.key === resizingCol.key);
    const minWidth = colConfig ? colConfig.minWidth : (resizingCol.key === "action" ? 60 : 160);

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.pageX - resizingCol.startX;
      const newWidth = Math.max(minWidth, Math.min(1200, Math.round(resizingCol.startWidth + deltaX)));
      setColumnWidths(prev => ({ ...prev, [resizingCol.key]: newWidth }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      const deltaX = e.pageX - resizingCol.startX;
      const finalWidth = Math.max(minWidth, Math.min(1200, Math.round(resizingCol.startWidth + deltaX)));
      setColumnWidths(prev => {
        const next = { ...prev, [resizingCol.key]: finalWidth };
        try {
          localStorage.setItem("fae_excel_column_widths", JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      setResizingCol(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingCol]);

  const calculateAutoFitWidth = (key: string): number => {
    if (key === "action") return DEFAULT_ACTION_WIDTH;
    if (key === "activity") return DEFAULT_ACTIVITY_WIDTH;

    const colConfig = DEFAULT_COLUMNS.find(c => c.key === key);
    const minW = colConfig ? colConfig.minWidth : 100;
    const title = colConfig ? colConfig.label : "";

    // 1. 表头文本预估宽度 (含筛选按钮、内边距与间隙)
    let estimatedHeaderWidth = 0;
    for (let i = 0; i < title.length; i++) {
      const code = title.charCodeAt(i);
      estimatedHeaderWidth += code > 255 ? 13 : 8.2;
    }
    estimatedHeaderWidth += 64;

    // 2. 扫描前 150 行样本数据文本最大宽度
    let maxDataWidth = 0;
    const sampleRows = flatData.slice(0, 150);
    for (const row of sampleRows) {
      const val = getColValue(key, row.customer, row.project, row.pn);
      if (!val) continue;
      const lines = val.split("\n");
      for (const line of lines) {
        let lineWidth = 0;
        for (let i = 0; i < line.length; i++) {
          const code = line.charCodeAt(i);
          lineWidth += code > 255 ? 13 : 8.2;
        }
        if (lineWidth > maxDataWidth) {
          maxDataWidth = lineWidth;
        }
      }
    }
    maxDataWidth += 36; // cell padding

    const fitted = Math.max(minW, Math.max(estimatedHeaderWidth, maxDataWidth));
    return Math.min(950, Math.ceil(fitted + 8));
  };

  const handleAutoFitColumn = (key: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const fitted = calculateAutoFitWidth(key);
    const next = { ...columnWidths, [key]: fitted };
    saveColumnWidths(next);
  };

  const handleAutoFitAllColumns = () => {
    const next: Record<string, number> = {};
    for (const col of DEFAULT_COLUMNS) {
      next[col.key] = calculateAutoFitWidth(col.key);
    }
    saveColumnWidths(next);
  };

  const handleResetColumnWidths = () => {
    setColumnWidths({});
    try {
      localStorage.removeItem("fae_excel_column_widths");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    updateScrollMetrics();
    window.addEventListener("resize", updateScrollMetrics);
    return () => window.removeEventListener("resize", updateScrollMetrics);
  }, [filteredData]);

  const handleUpdate = (
    c: Customer, 
    p: Project | undefined, 
    pn: PN | undefined, 
    level: "customer" | "project" | "pn", 
    field: string, 
    val: string
  ) => {
    let updatedCustomer = { ...c };
    
    if (level === "customer") {
       updatedCustomer = { ...updatedCustomer, [field]: val };
    } else if (level === "project" && p) {
       updatedCustomer.projects = updatedCustomer.projects.map(proj => 
         proj.id === p.id ? { ...proj, [field]: val } : proj
       );
    } else if (level === "pn" && p && pn) {
       updatedCustomer.projects = updatedCustomer.projects.map(proj => 
         proj.id === p.id 
           ? { 
               ...proj, 
               pns: proj.pns.map(n => n.id === pn.id ? { ...n, [field]: val } : n) 
             } 
           : proj
       );
    }
    onUpdateCustomer(updatedCustomer);

    if (pn && newRowIds.has(pn.id)) {
      setNewRowIds(prev => {
        const next = new Set(prev);
        next.delete(pn.id);
        return next;
      });
    }
  };

  const handleAddNewRow = (c: Customer, p: Project, pn: PN, mode: 'blank' | 'prev' | 'next', currentIdx: number) => {
    let baseC: Partial<Customer> = {};
    let baseP: Partial<Project> = {};
    let basePn: Partial<PN> = {};

    if (mode === 'prev' && currentIdx > 0) {
      const prevRow = filteredData[currentIdx - 1];
      if (prevRow?.customer) baseC = { ...prevRow.customer };
      if (prevRow?.project) baseP = { ...prevRow.project };
      if (prevRow?.pn) basePn = { ...prevRow.pn };
    } else if (mode === 'next' && currentIdx < filteredData.length - 1) {
      const nextRow = filteredData[currentIdx + 1];
      if (nextRow?.customer) baseC = { ...nextRow.customer };
      if (nextRow?.project) baseP = { ...nextRow.project };
      if (nextRow?.pn) basePn = { ...nextRow.pn };
    }

    const newCustomerId = "cust_" + Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const newProjectId = "proj_" + Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const newPnId = "pn_" + Date.now().toString() + Math.random().toString(36).substr(2, 5);

    const defaultPn: PN = {
      id: newPnId,
      name: "",
      productLine: "",
      status: "NBO",
      drStatus: "",
      socketCreateDate: "",
      socketTotalLtrAmt: "",
      channelOk: "Yes",
      remark: "",
      marketSegment: "",
      updated: "",
      tasks: [],
    };

    const nextPn: PN = mode === 'blank' ? defaultPn : {
      ...defaultPn,
      ...basePn,
      id: newPnId,
      tasks: [],
    };

    const defaultProject: Project = {
      id: newProjectId,
      name: "",
      pns: [nextPn],
      updatedAt: Date.now(),
    };

    const nextProject: Project = mode === 'blank' ? defaultProject : {
      ...defaultProject,
      ...baseP,
      id: newProjectId,
      pns: [nextPn],
      updatedAt: Date.now(),
    };

    const defaultCustomer: Customer = {
      id: newCustomerId,
      nameZh: "",
      nameEn: "",
      customerCode: "",
      salesEn: "",
      salesCn: "",
      customerRd: "",
      projects: [nextProject],
      updatedAt: Date.now(),
    };

    const nextCustomer: Customer = mode === 'blank' ? defaultCustomer : {
      ...defaultCustomer,
      ...baseC,
      id: newCustomerId,
      projects: [nextProject],
      updatedAt: Date.now(),
    };

    if (onAddFullRow) {
      onAddFullRow(c.id, nextCustomer);
      
      setNewRowIds(prev => new Set([...prev, nextPn.id]));
      setRowMenuOpen(null);
    }
  };

  const ACTION_COL_WIDTH = getColWidth("action");
  const ACTIVITY_COL_WIDTH = getColWidth("activity");
  const TOTAL_TABLE_WIDTH = ACTION_COL_WIDTH + DEFAULT_COLUMNS.reduce((sum, col) => sum + getColWidth(col.key), 0) + ACTIVITY_COL_WIDTH;

  return (
    <div className={cn(
      "flex-1 overflow-hidden apple-card flex flex-col w-full h-full relative select-none",
      resizingCol ? "cursor-col-resize select-none" : ""
    )}>
       <datalist id="list_salesEn">{salesEnOptions.map(o => <option key={o} value={o} />)}</datalist>
       <datalist id="list_salesCn">{salesCnOptions.map(o => <option key={o} value={o} />)}</datalist>
       <datalist id="list_customerCode">{customerCodeOptions.map(o => <option key={o} value={o} />)}</datalist>
       <datalist id="list_nameEn">{nameEnOptions.map(o => <option key={o} value={o} />)}</datalist>
       <datalist id="list_nameZh">{nameZhOptions.map(o => <option key={o} value={o} />)}</datalist>
       <datalist id="list_customerRd">{customerRdOptions.map(o => <option key={o} value={o} />)}</datalist>
       <datalist id="list_marketSegment">{marketSegmentOptions.map(o => <option key={o} value={o} />)}</datalist>
       <datalist id="list_pName">{pNameOptions.map(o => <option key={o} value={o} />)}</datalist>
       <datalist id="list_pnLine">{pnLineOptions.map(o => <option key={o} value={o} />)}</datalist>
       <datalist id="list_pnName">{pnNameOptions.map(o => <option key={o} value={o} />)}</datalist>

       {/* Top Header Bar - Seamless Glass */}
       <div className="h-[60px] px-6 shrink-0 bg-transparent border-b border-white/[0.08] flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#007AFF] shadow-sm shadow-[#007AFF]/40" />
            <h2 className="text-base font-bold tracking-tight text-white drop-shadow-xs">Excel 数据视图</h2>
            {Object.keys(filters).length > 0 && (
              <span className="text-[11px] font-semibold text-white bg-[#007AFF] px-2 py-0.5 rounded-full shadow-xs">
                已激活 {Object.keys(filters).length} 个筛选
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Horizontal Scroll & Column Width Tools */}
            <div className="flex items-center gap-0.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl p-0.5 backdrop-blur-md transition-colors">
              <button
                onClick={() => scrollTable("left")}
                title="向左横向滑动 (半屏)"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 active:bg-white/20 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollTable("right")}
                title="向右横向滑动 (半屏)"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 active:bg-white/20 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-white/15 my-auto mx-0.5" />
              <button
                onClick={handleAutoFitAllColumns}
                title="自适应列宽"
                className="p-1.5 text-[var(--accent-color,#FFFFFF)] hover:text-[var(--accent-hover-color,#FFFFFF)] hover:bg-[var(--accent-subtle-bg,rgba(255,255,255,0.15))] active:bg-white/20 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              >
                <Sparkles className="w-4 h-4 drop-shadow-xs" />
              </button>
            </div>

            {Object.keys(filters).length > 0 && (
              <button
                onClick={() => setFilters({})}
                className="flex items-center gap-1 text-xs text-[#FF453A] hover:bg-[#FF453A]/15 px-2.5 py-1 rounded-lg transition-colors font-medium cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>清除全部筛选</span>
              </button>
            )}
          </div>
       </div>

       {/* Fixed Columns Header Row - Pinned directly below the Top Bar */}
       <div 
         ref={headerScrollRef} 
         onScroll={handleHeaderScroll}
         onWheel={handleHeaderWheel}
         onMouseDown={handleHeaderMouseDown}
         title="可按住左键拖拽表头或在表头滚动滚轮左右滑动"
         className={cn(
           "shrink-0 overflow-x-hidden bg-transparent border-b border-white/[0.08] select-none transition-cursor",
           isDraggingHeader ? "cursor-grabbing" : "cursor-grab"
         )}
       >
          <table className="table-fixed text-left border-separate border-spacing-0 text-xs whitespace-nowrap" style={{ width: TOTAL_TABLE_WIDTH }}>
            <colgroup>
              <col style={{ width: ACTION_COL_WIDTH }} />
              {DEFAULT_COLUMNS.map(col => (
                <col key={col.key} style={{ width: getColWidth(col.key) }} />
              ))}
              <col style={{ width: ACTIVITY_COL_WIDTH }} />
            </colgroup>
            <thead>
              <tr className="text-white">
                <th className="relative p-2.5 border-r border-white/[0.08] font-semibold align-middle text-center bg-transparent group/th">
                  <div className="text-center font-bold text-white/90 px-2 drop-shadow-xs">操作</div>
                  <div
                    onMouseDown={(e) => handleResizerMouseDown("action", e)}
                    onDoubleClick={(e) => handleAutoFitColumn("action", e)}
                    data-resizer="true"
                    title="按住拖拽调整操作列宽，双击自适应"
                    className="absolute top-0 right-0 bottom-0 w-3 cursor-col-resize z-20 flex items-center justify-center translate-x-1/2 group/resizer"
                  >
                    <div
                      className={cn(
                        "w-[2px] h-3/5 rounded-full transition-colors",
                        resizingCol?.key === "action"
                          ? "bg-[#007AFF] shadow-xs shadow-[#007AFF]/50"
                          : "bg-transparent group-hover/resizer:bg-[#007AFF]"
                      )}
                    />
                  </div>
                </th>
                {DEFAULT_COLUMNS.map(col => {
                  const isActive = activeFilterCol === col.key;
                  const selectedValues = filters[col.key];
                  const hasSelection = selectedValues !== undefined;
                  const uniqueValues = getUniqueValues(col.key);
                  const isFiltered = hasSelection && selectedValues.length < uniqueValues.length;

                  return (
                    <th key={col.key} className="relative p-2.5 border-r border-white/[0.08] font-semibold align-middle bg-transparent group/th">
                      <div className="flex items-center justify-between gap-1 overflow-hidden min-w-0 pr-1">
                        <span 
                          className="text-xs font-semibold text-white truncate drop-shadow-xs" 
                          title={`${col.label}\n(拖拽右侧边缘调整列宽，双击自适应最佳宽度)`}
                        >
                          {col.label}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isActive) {
                              setActiveFilterCol(null);
                              setPopoverCoords(null);
                              setFilterSearch("");
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const popoverWidth = 288;
                              let left = rect.left;
                              if (left + popoverWidth > window.innerWidth - 16) {
                                left = window.innerWidth - popoverWidth - 16;
                              }
                              setPopoverCoords({
                                top: rect.bottom + 6,
                                left: Math.max(16, left),
                              });
                              setActiveFilterCol(col.key);
                              setFilterSearch("");
                            }
                          }} 
                          className={cn(
                            "p-1 rounded-lg transition-opacity duration-150 cursor-pointer shrink-0", 
                            isActive 
                              ? "opacity-100 text-[#007AFF] bg-[#007AFF]/15" 
                              : isFiltered 
                              ? "opacity-100 text-white bg-[#007AFF] shadow-xs" 
                              : "opacity-0 group-hover/th:opacity-100 text-white/80 hover:text-white hover:bg-white/15"
                          )}
                          title="打开筛选"
                        >
                           <Filter className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Column Resizer Handle */}
                      <div
                        onMouseDown={(e) => handleResizerMouseDown(col.key, e)}
                        onDoubleClick={(e) => handleAutoFitColumn(col.key, e)}
                        data-resizer="true"
                        title="按住拖拽调整列宽，双击自适应最佳宽度"
                        className="absolute top-0 right-0 bottom-0 w-3 cursor-col-resize z-20 flex items-center justify-center translate-x-1/2 group/resizer select-none"
                      >
                        <div
                          className={cn(
                            "w-[2px] h-3/5 rounded-full transition-colors",
                            resizingCol?.key === col.key 
                              ? "bg-[#007AFF] shadow-xs shadow-[#007AFF]/50" 
                              : "bg-transparent group-hover/resizer:bg-[#007AFF]"
                          )}
                        />
                      </div>
                    </th>
                  );
                })}
                <th className="relative p-2.5 font-semibold align-middle bg-transparent group/th">
                  <div className="text-xs font-semibold text-white drop-shadow-xs">Activity</div>
                  <div
                    onMouseDown={(e) => handleResizerMouseDown("activity", e)}
                    onDoubleClick={(e) => handleAutoFitColumn("activity", e)}
                    data-resizer="true"
                    title="按住拖拽调整 Activity 列宽，双击自适应"
                    className="absolute top-0 right-0 bottom-0 w-3 cursor-col-resize z-20 flex items-center justify-center translate-x-1/2 group/resizer select-none"
                  >
                    <div
                      className={cn(
                        "w-[2px] h-3/5 rounded-full transition-colors",
                        resizingCol?.key === "activity"
                          ? "bg-[#007AFF] shadow-xs shadow-[#007AFF]/50"
                          : "bg-transparent group-hover/resizer:bg-[#007AFF]"
                      )}
                    />
                  </div>
                </th>
              </tr>
            </thead>
          </table>
       </div>

       {/* Table Scroll Area */}
       <div 
         ref={bodyScrollRef} 
         onScroll={handleBodyScroll}
         onWheel={(e) => {
           if (e.altKey && e.deltaY !== 0 && bodyScrollRef.current) {
             bodyScrollRef.current.scrollLeft += e.deltaY * 1.2;
           }
         }}
         className="flex-1 overflow-auto relative no-scrollbar pb-6"
       >
          <table className="table-fixed text-left border-separate border-spacing-0 text-xs whitespace-nowrap" style={{ width: TOTAL_TABLE_WIDTH }}>
            <colgroup>
              <col style={{ width: ACTION_COL_WIDTH }} />
              {DEFAULT_COLUMNS.map(col => (
                <col key={col.key} style={{ width: getColWidth(col.key) }} />
              ))}
              <col style={{ width: ACTIVITY_COL_WIDTH }} />
            </colgroup>
            <tbody>
               {filteredData.length === 0 ? (
                 <tr>
                   <td colSpan={19} className="text-center py-16 text-white/70 font-medium border-b border-white/[0.08]">
                     未找到匹配数据 / 暂无数据
                   </td>
                 </tr>
               ) : filteredData.map((row, idx) => {
                  const c = row.customer as Customer;
                  const p = row.project as Project | undefined;
                  const pn = row.pn as PN | undefined;
                  const isNewRow = pn && newRowIds.has(pn.id);
                  const isMenuOpen = pn && rowMenuOpen === pn.id;

                  return (
                    <tr 
                      key={`${c.id}-${p?.id || 'none'}-${pn?.id || 'none'}`} 
                      className={cn(
                        "hover:bg-white/[0.04] transition-colors group relative", 
                        isNewRow ? "bg-[#34C759]/20" : "", 
                        isMenuOpen ? "z-50 focus-within:z-50" : ""
                      )}
                    >
                       {/* Left Column: Actions */}
                       <td className="p-0 border-r border-b border-white/[0.08] bg-transparent">
                          <div className="flex gap-1 items-center justify-center p-2">
                            {/* Customer Level Add Project */}
                            {(!p && !pn) && (
                               <>
                                 <button title="添加项目" onClick={() => onAddProject(c.id)} className="p-1 px-2 text-white/90 hover:text-[var(--accent-hover-color,#FFFFFF)] hover:bg-[var(--accent-subtle-bg,rgba(255,255,255,0.15))] bg-white/[0.08] rounded-lg flex items-center gap-1 font-bold text-[10px] transition-colors"><Plus className="w-3 h-3"/>项目</button>
                                 <button title="删除客户" onClick={() => onDeleteCustomer(c.id)} className="p-1 text-white/70 hover:text-[#FF453A] hover:bg-[#FF453A]/20 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                               </>
                            )}

                            {/* Project Level Add PN */}
                            {(p && !pn) && (
                               <>
                               <button title="添加料号PN" onClick={() => onAddPN(c.id, p.id)} className="p-1 px-2 text-white/90 hover:text-[var(--accent-hover-color,#FFFFFF)] hover:bg-[var(--accent-subtle-bg,rgba(255,255,255,0.15))] bg-white/[0.08] rounded-lg flex items-center gap-1 font-bold text-[10px] transition-colors"><Plus className="w-3 h-3"/>料号</button>
                               <button title="删除项目" onClick={() => onDeleteProject(c.id, p.id)} className="p-1 text-white/70 hover:text-[#FF453A] hover:bg-[#FF453A]/20 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                               </>
                            )}

                            {/* PN Level Add Row / Delete */}
                            {pn && p && (
                               <>
                               <div className="relative">
                                 <button title="增加行" onClick={() => setRowMenuOpen(rowMenuOpen === pn.id ? null : pn.id)} className="p-1 text-white/90 hover:text-[var(--accent-hover-color,#FFFFFF)] hover:bg-[var(--accent-subtle-bg,rgba(255,255,255,0.15))] bg-white/[0.08] rounded-lg flex items-center justify-center transition-colors"><Plus className="w-3 h-3"/></button>
                                 {rowMenuOpen === pn.id && (
                                    <>
                                      <div className="fixed inset-0 z-40 cursor-default" onClick={() => setRowMenuOpen(null)} />
                                      <div className="absolute left-0 top-full mt-1.5 bg-[#121927]/85 dark:bg-[#0D131F]/90 backdrop-blur-2xl border border-white/20 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.2)] z-50 flex flex-col p-1 min-w-[120px]">
                                        <button onClick={() => handleAddNewRow(c, p, pn, 'blank', idx)} className="px-3.5 py-1.5 text-left hover:bg-white/10 text-xs text-white transition-colors">增加空白行</button>
                                        <button onClick={() => handleAddNewRow(c, p, pn, 'prev', idx)} className="px-3.5 py-1.5 text-left hover:bg-white/10 text-xs text-white transition-colors">复制上一行</button>
                                        <button onClick={() => handleAddNewRow(c, p, pn, 'next', idx)} className="px-3.5 py-1.5 text-left hover:bg-white/10 text-xs text-white transition-colors">复制下一行</button>
                                      </div>
                                    </>
                                 )}
                               </div>
                               <button title="删除条目" onClick={() => onDeletePN(c.id, p.id, pn.id)} className="p-1 text-white/70 hover:text-[#FF453A] hover:bg-[#FF453A]/20 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                               </>
                            )}
                          </div>
                       </td>
                       <td className="p-0 border-r border-b border-white/[0.08]"><InlineInput listId="list_salesEn" value={c.salesEn || ""} onChange={(v) => handleUpdate(c, p, pn, "customer", "salesEn", v)} /></td>
                       <td className="p-0 border-r border-b border-white/[0.08]"><InlineInput listId="list_salesCn" value={c.salesCn || ""} onChange={(v) => handleUpdate(c, p, pn, "customer", "salesCn", v)} /></td>
                       <td className="p-0 border-r border-b border-white/[0.08]"><InlineInput listId="list_customerCode" value={c.customerCode || ""} className="font-mono text-white" onChange={(v) => handleUpdate(c, p, pn, "customer", "customerCode", v)} /></td>
                       <td className="p-0 border-r border-b border-white/[0.08]"><InlineInput listId="list_nameEn" value={c.nameEn || ""} onChange={(v) => handleUpdate(c, p, pn, "customer", "nameEn", v)} /></td>
                       <td className="p-0 border-r border-b border-white/[0.08]"><InlineInput listId="list_nameZh" value={c.nameZh || ""} className="font-bold text-white" onChange={(v) => handleUpdate(c, p, pn, "customer", "nameZh", v)} /></td>
                       <td className="p-0 border-r border-b border-white/[0.08]"><InlineInput listId="list_customerRd" value={c.customerRd || ""} onChange={(v) => handleUpdate(c, p, pn, "customer", "customerRd", v)} /></td>
                       <td className="p-0 border-r border-b border-white/[0.08]"><InlineInput listId="list_marketSegment" value={pn?.marketSegment || ""} onChange={(v) => handleUpdate(c, p, pn, "pn", "marketSegment", v)} /></td>
                       
                       <td className="p-0 border-r border-b border-white/[0.08] bg-white/[0.02]"><InlineInput listId="list_pName" value={p?.name || ""} className="font-medium text-[#38BDF8] drop-shadow-xs" onChange={(v) => handleUpdate(c, p, pn, "project", "name", v)} /></td>
                       
                       <td className="p-0 border-r border-b border-white/[0.08]"><InlineInput listId="list_pnLine" value={pn?.productLine || ""} onChange={(v) => handleUpdate(c, p, pn, "pn", "productLine", v)} /></td>
                       <td className="p-0 border-r border-b border-white/[0.08]"><InlineInput listId="list_pnName" value={pn?.name || ""} className="font-mono text-[#60A5FA] font-bold drop-shadow-xs" onChange={(v) => handleUpdate(c, p, pn, "pn", "name", v)} /></td>
                       <td className="p-0 border-r border-b border-white/[0.08] overflow-visible relative">
                          {pn && <InlineSelect 
                            value={pn.status || "NBO"}
                            options={[
                              {label: "Leads", value: "Leads"},
                              {label: "NBO", value: "NBO"},
                              {label: "DIN", value: "DIN"},
                              {label: "DFIN", value: "DFIN"},
                              {label: "DWIN", value: "DWIN"},
                              {label: "DLOST", value: "DLOST"},
                            ]}
                            onChange={(v) => handleUpdate(c, p, pn, "pn", "status", v)} 
                            className={cn(
                              "font-bold drop-shadow-xs",
                              pn.status === "DWIN" ? "text-[#4ADE80]" :
                              pn.status === "DLOST" ? "text-[#F87171]" :
                              "text-[#38BDF8]"
                            )}
                          />}
                       </td>
                       <td className="p-0 border-r border-b border-white/[0.08]"><InlineInput value={pn?.drStatus || ""} onChange={(v) => handleUpdate(c, p, pn, "pn", "drStatus", v)} /></td>
                       <td className="p-0 border-r border-b border-white/[0.08]"><InlineInput value={pn?.socketCreateDate || ""} onChange={(v) => handleUpdate(c, p, pn, "pn", "socketCreateDate", v)} /></td>
                       <td className="p-0 border-r border-b border-white/[0.08]"><InlineInput value={p?.mpSchedule || ""} onChange={(v) => handleUpdate(c, p, pn, "project", "mpSchedule", v)} /></td>
                       <td className="p-0 border-r border-b border-white/[0.08]"><InlineInput value={pn?.socketTotalLtrAmt || ""} onChange={(v) => handleUpdate(c, p, pn, "pn", "socketTotalLtrAmt", v)} /></td>
                       <td className="p-0 border-r border-b border-white/[0.08] overflow-visible relative">
                          {pn && <InlineSelect 
                             value={pn.channelOk || "Yes"}
                             options={[{label: "Yes", value: "Yes"}, {label: "No", value: "No"}]}
                             onChange={(v) => handleUpdate(c, p, pn, "pn", "channelOk", v)}
                             className={cn("text-center font-bold drop-shadow-xs", pn.channelOk === "No" ? "text-[#F87171]" : "text-[#4ADE80]")}
                          />}
                       </td>
                       <td className="p-0 border-r border-b border-white/[0.08]"><InlineInput value={pn?.remark || ""} className="min-w-[150px] max-w-[300px]" onChange={(v) => handleUpdate(c, p, pn, "pn", "remark", v)} /></td>
                       <td className="p-0 border-r border-b border-white/[0.08]"><UpdatedCell value={pn?.updated || ""} onChange={(v) => handleUpdate(c, p, pn, "pn", "updated", v)} /></td>
                       <td className="relative p-1 px-2 text-[10px] whitespace-pre-wrap min-w-[200px] max-w-[400px] group/activity align-top border-b border-white/[0.08] text-white">
                          {(pn?.tasks || []).map(t => {
                            const start = (t.startDate || "").replace(/-/g, "");
                            const end = (t.endDate || "").replace(/-/g, "");
                            const isSales = t.name.startsWith("[Sales]") || t.owner === "Sales";
                            const isFae = t.name.startsWith("[FAE/PM]") || t.name.startsWith("[FAE]") || t.owner === "FAE/PM" || t.owner === "FAE";
                            const displayName = t.name.replace(/^\[Sales\]\s*|^\[FAE\/PM\]\s*|^\[FAE\]\s*/, "");
                            return (
                               <div key={t.id} className="group/task flex items-start gap-1 py-1 px-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                 <span className="flex-1 cursor-pointer leading-snug break-words text-white drop-shadow-xs" onDoubleClick={() => p && onEditTask(c.id, p.id, pn.id, t)} title="双击编辑">
                                   {start && <span className="font-mono text-[9px] text-white/70 mr-1">{start === end ? `${start}：` : `${start} - ${end}：`}</span>}
                                   {isSales && (
                                     <span className="inline-block text-[9px] font-semibold text-[#38BDF8] bg-[#38BDF8]/20 border border-[#38BDF8]/30 px-1 py-0.2 rounded mr-1">
                                       Sales
                                     </span>
                                   )}
                                   {isFae && (
                                     <span className="inline-block text-[9px] font-semibold text-[#C084FC] bg-[#C084FC]/20 border border-[#C084FC]/30 px-1 py-0.2 rounded mr-1">
                                       FAE/PM
                                     </span>
                                   )}
                                   <span>{displayName}</span>
                                 </span>
                                 <div className="opacity-0 group-hover/task:opacity-100 transition-opacity flex items-center shrink-0 gap-0.5">
                                   <button onClick={() => p && onEditTask(c.id, p.id, pn.id, t)} className="p-0.5 text-white/80 hover:text-[#38BDF8] bg-white/10 rounded" title="编辑"><Edit2 className="w-3 h-3"/></button>
                                   <button onClick={() => p && onDeleteTask(c.id, p.id, pn.id, t.id)} className="p-0.5 text-white/80 hover:text-[#F87171] bg-white/10 rounded" title="删除"><Trash2 className="w-3 h-3"/></button>
                                 </div>
                               </div>
                            )
                           })}
                           {pn && p && (
                              <div className={cn(
                                "flex justify-center transition-opacity", 
                                pn.tasks && pn.tasks.length > 0 ? "opacity-0 group-hover/activity:opacity-100 mt-1 pointer-events-none group-hover/activity:pointer-events-auto cursor-pointer" : "opacity-100 py-1"
                              )}>
                                <button 
                                  onClick={() => onAddTask(c.id, p.id, pn.id)}
                                  className="flex items-center gap-1 p-1 px-2 text-white/90 hover:text-white hover:bg-white/20 rounded-lg bg-white/[0.08] border border-white/10 w-full justify-center transition-colors font-medium text-[11px]"
                                >
                                  <Plus className="w-3 h-3"/>
                                  <span>新增任务</span>
                                </button>
                              </div>
                           )}
                       </td>
                    </tr>
                  )
               })}
            </tbody>
          </table>
       </div>

       {/* Bottom Floating Horizontal Scrollbar (Only visible when mouse is placed there or during drag) */}
       {scrollRatio < 0.999 && (
         <div 
           className={cn(
             "absolute bottom-0 left-4 right-4 h-7 flex items-center px-2 z-30 transition-opacity duration-200 cursor-default select-none group/scrollzone",
             isDraggingScrollbar ? "opacity-100" : "opacity-0 hover:opacity-100"
           )}
           title="横向滚动条 (拖拽滑块或点击轨道左右滑动)"
         >
           <div 
             ref={scrollbarTrackRef}
             onClick={handleTrackClick}
             className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-md relative cursor-pointer hover:h-2.5 transition-all"
           >
             <div 
               onMouseDown={handleThumbMouseDown}
               style={{
                 width: `${Math.max(8, Math.min(100, scrollRatio * 100))}%`,
                 left: `${scrollProgress * (100 - Math.max(8, Math.min(100, scrollRatio * 100)))}%`
               }}
               className={cn(
                 "absolute top-0 bottom-0 rounded-full transition-colors cursor-grab active:cursor-grabbing shadow-xs",
                 isDraggingScrollbar 
                   ? "bg-black/55 dark:bg-white/60" 
                   : "bg-black/30 dark:bg-white/30 hover:bg-black/50 dark:hover:bg-white/50"
               )}
             />
           </div>
         </div>
       )}

       {/* Filter Popover Floating Element */}
       {activeFilterCol && popoverCoords && (() => {
         const col = DEFAULT_COLUMNS.find(c => c.key === activeFilterCol);
         if (!col) return null;
         const selectedValues = filters[col.key];
         const hasSelection = selectedValues !== undefined;
         const uniqueValues = getUniqueValues(col.key);
         const isFiltered = hasSelection && selectedValues.length < uniqueValues.length;
         const filteredUnique = uniqueValues.filter(u => 
           filterSearch === "" || u.toLowerCase().includes(filterSearch.toLowerCase())
         );

         return (
           <>
             <div 
               className="fixed inset-0 z-40 cursor-default" 
               onClick={() => {
                 setActiveFilterCol(null);
                 setPopoverCoords(null);
                 setFilterSearch("");
               }} 
             />
             <div 
               style={{ top: popoverCoords.top, left: popoverCoords.left }}
               className="fixed w-72 bg-[#121927]/85 dark:bg-[#0D131F]/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-white/10 z-50 flex flex-col font-normal text-white p-3 animate-in fade-in zoom-in-95 duration-150"
             >
               {/* Header */}
               <div className="flex items-center justify-between pb-2 border-b border-white/10">
                 <div className="flex items-center gap-1.5 min-w-0 pr-2">
                   <Filter className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                   <span className="font-bold text-xs truncate text-white" title={col.label}>{col.label}</span>
                 </div>
                 <div className="flex items-center gap-1 shrink-0">
                   {isFiltered && (
                     <button 
                       onClick={() => clearFilter(col.key)} 
                       className="text-[#38BDF8] hover:underline text-[11px] font-semibold px-1 cursor-pointer"
                     >
                       重置
                     </button>
                   )}
                   <button 
                     onClick={() => {
                       setActiveFilterCol(null);
                       setPopoverCoords(null);
                       setFilterSearch("");
                     }} 
                     className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                   >
                     <X className="w-3.5 h-3.5" />
                   </button>
                 </div>
               </div>

               {/* Search Input */}
               <div className="relative my-2.5">
                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50 pointer-events-none" />
                 <input
                   type="text"
                   placeholder="搜索选项..."
                   value={filterSearch}
                   onChange={(e) => setFilterSearch(e.target.value)}
                   className="w-full pl-8 pr-7 py-1.5 bg-white/10 border border-white/15 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#38BDF8]/50 text-white placeholder:text-white/40 font-medium"
                   autoFocus
                 />
                 {filterSearch && (
                   <button 
                     onClick={() => setFilterSearch("")}
                     className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-white/60 hover:text-white cursor-pointer"
                   >
                     <X className="w-3.5 h-3.5" />
                   </button>
                 )}
               </div>

               {/* Quick Action Bar */}
               <div className="flex items-center justify-between px-1 pb-2 text-[11px] text-white/70 border-b border-white/10">
                 <div className="flex items-center gap-3">
                   <button 
                     onClick={() => selectAll(col.key)}
                     className="hover:text-[#38BDF8] transition-colors cursor-pointer font-medium text-white/90"
                   >
                     全选
                   </button>
                   <span className="text-white/20">|</span>
                   <button 
                     onClick={() => deselectAll(col.key)}
                     className="hover:text-[#38BDF8] transition-colors cursor-pointer font-medium text-white/90"
                   >
                     清空
                   </button>
                 </div>
                 <span className="text-[10px]">双击可单选</span>
               </div>

               {/* Options List */}
               <div className="max-h-52 overflow-y-auto py-1.5 flex flex-col gap-0.5 no-scrollbar">
                 {filteredUnique.map(uVal => {
                   const isChecked = selectedValues === undefined || selectedValues.includes(uVal);
                   return (
                     <div
                       key={uVal}
                       onClick={() => toggleFilter(col.key, uVal, uniqueValues)}
                       onDoubleClick={(e) => {
                         e.stopPropagation();
                         selectOnlyValue(col.key, uVal);
                       }}
                       className="px-2 py-1.5 rounded-xl flex items-center gap-2 hover:bg-white/10 text-left transition-colors text-xs cursor-pointer group/opt text-white"
                       title="单击勾选/取消，双击仅选此项"
                     >
                       <div className={cn(
                         "w-4 h-4 shrink-0 rounded-md flex items-center justify-center border transition-all", 
                         isChecked 
                           ? "bg-[#007AFF] border-[#007AFF] text-white shadow-xs" 
                           : "border-white/30 bg-white/5"
                       )}>
                         {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                       </div>
                       <span className="truncate flex-1 text-xs select-none">
                         {uVal === "" ? <span className="text-white/50 italic">(空白)</span> : uVal}
                       </span>
                     </div>
                   );
                 })}
                 {filteredUnique.length === 0 && (
                   <div className="text-center py-6 text-white/50 text-xs">无匹配选项</div>
                 )}
               </div>

               {/* Footer */}
               <div className="pt-2 mt-1 border-t border-white/10 flex items-center justify-between text-[11px]">
                 <span className="text-white/70">
                   已选 {selectedValues ? selectedValues.filter(v => v !== "__NONE__").length : uniqueValues.length} / {uniqueValues.length} 项
                 </span>
                 <button
                   onClick={() => {
                     setActiveFilterCol(null);
                     setPopoverCoords(null);
                     setFilterSearch("");
                   }}
                   className="px-3 py-1 bg-[#007AFF] text-white font-medium rounded-lg hover:bg-[#007AFF]/90 transition-colors shadow-xs cursor-pointer"
                 >
                   完成
                 </button>
               </div>
             </div>
           </>
         );
       })()}
    </div>
  )
}
