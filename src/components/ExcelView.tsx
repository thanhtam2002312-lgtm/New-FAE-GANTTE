import React, { useState, useEffect, useRef } from "react";
import { Customer, Project, PN, Task } from "../types";
import { Plus, Trash2, Edit2, Filter, Check, X } from "lucide-react";
import { cn } from "../utils/cn";

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
      className={cn("w-full bg-transparent border-none outline-none focus:bg-black/5 dark:focus:bg-white/10 p-1.5 flex transition-colors text-ellipsis min-w-[60px]", className)}
    />
  )
}

function InlineSelect({ value, options, onChange, className }: { value: string; options: {label: string, value: string}[]; onChange: (v: string) => void; className?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("w-full bg-transparent border-none outline-none focus:bg-black/5 dark:focus:bg-white/10 p-1 rounded min-w-[60px]", className)}
    >
       <option value=""></option>
       {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

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
  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set());
  const [rowMenuOpen, setRowMenuOpen] = useState<string | null>(null);

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

  const toggleFilter = (key: string, value: string) => {
    setFilters(prev => {
      const current = prev[key] || [];
      if (current.includes(value)) {
         return { ...prev, [key]: current.filter(v => v !== value) };
      } else {
         return { ...prev, [key]: [...current, value] };
      }
    });
  };

  const clearFilter = (key: string) => {
    setFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
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

  const COLUMNS = [
    { key: "salesEn", label: "Sales EN" },
    { key: "salesCn", label: "Sales CN" },
    { key: "customerCode", label: "Customer Code" },
    { key: "nameEn", label: "Customer English Name" },
    { key: "nameZh", label: "Socket Customer Chinese Name" },
    { key: "customerRd", label: "Customer R&D" },
    { key: "marketSegment", label: "Market (Segment)" },
    { key: "projectName", label: "Project name" },
    { key: "productLine", label: "Brand (Product line)" },
    { key: "pnName", label: "P/N" },
    { key: "status", label: "Current Status" },
    { key: "drStatus", label: "DR status" },
    { key: "socketCreateDate", label: "Socket Create date" },
    { key: "mpSchedule", label: "MP Schedule" },
    { key: "socketTotalLtrAmt", label: "Socket Total LTR AMT" },
    { key: "channelOk", label: "Channel OK" },
    { key: "remark", label: "Remark" },
  ];

  return (
    <div className="flex-1 overflow-auto bg-white dark:bg-[#1C1C1E] apple-card flex flex-col w-full h-full">
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

       <div className="p-4 shrink-0 bg-[#F5F5F7] dark:bg-[#2C2C2E]">
          <h2 className="text-lg font-bold">Excel 数据视图</h2>
       </div>

       <div className="flex-1 overflow-auto relative">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-max">
            <thead>
              <tr className="bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7]">
                <th className="p-2 border-b border-r border-black/5 dark:border-white/5 font-bold sticky top-0 z-20 bg-[#F5F5F7] dark:bg-[#2C2C2E] shadow-sm align-top sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <div className="mb-2">操作</div>
                </th>
                {COLUMNS.map(col => {
                  const isActive = activeFilterCol === col.key;
                  const selectedValues = filters[col.key] || [];
                  const hasSelection = selectedValues.length > 0;
                  const uniqueValues = getUniqueValues(col.key);
                  return (
                  <th key={col.key} className="p-2 border-b border-r border-black/5 dark:border-white/5 font-bold sticky top-0 z-10 bg-[#F5F5F7] dark:bg-[#2C2C2E] shadow-sm align-top relative group">
                    <div className="flex items-center justify-between mb-1">
                      <span>{col.label}</span>
                      <button 
                        onClick={() => setActiveFilterCol(isActive ? null : col.key)} 
                        className={cn(
                          "p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity", 
                          hasSelection || isActive ? "opacity-100 text-[#007AFF] bg-[#007AFF]/10" : "text-[#8E8E93] hover:bg-black/5 dark:hover:bg-white/10"
                        )}
                        title="筛选"
                      >
                         <Filter className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {isActive && (
                      <>
                      <div className="fixed inset-0 z-40 cursor-default" onClick={() => setActiveFilterCol(null)} />
                      <div className="absolute top-full left-0 mt-1 max-h-64 w-56 bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 rounded-xl shadow-xl z-50 flex flex-col font-normal text-[#1D1D1F] dark:text-[#F5F5F7]">
                         <div className="p-2 border-b border-black/5 dark:border-white/5 flex items-center justify-between font-bold">
                            <span>筛选: {col.label}</span>
                            <div className="flex items-center gap-1">
                              {hasSelection && <button onClick={() => clearFilter(col.key)} className="text-[#007AFF] text-[10px] px-1 hover:underline">清除</button>}
                              <button onClick={() => setActiveFilterCol(null)} className="p-1 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] rounded"><X className="w-3.5 h-3.5"/></button>
                            </div>
                         </div>
                         <div className="flex-1 overflow-auto p-1 py-1.5 flex flex-col gap-0.5 min-h-[50px]">
                            {uniqueValues.map(uVal => {
                               const isSelected = selectedValues.includes(uVal);
                               return (
                                  <button
                                    key={uVal}
                                    onClick={() => toggleFilter(col.key, uVal)}
                                    className="px-2 py-1.5 rounded flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors"
                                  >
                                    <div className={cn("w-3.5 h-3.5 shrink-0 rounded flex items-center justify-center border transition-colors", isSelected ? "bg-[#007AFF] border-[#007AFF] text-white" : "border-[#C7C7CC] dark:border-[#3A3A3C]")}>
                                       {isSelected && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                                    </div>
                                    <span className="truncate flex-1 select-text text-xs" onDoubleClick={(e) => { e.stopPropagation(); toggleFilter(col.key, uVal) }} title={uVal}>{uVal === "" ? "(空白)" : uVal}</span>
                                  </button>
                               )
                            })}
                            {uniqueValues.length === 0 && (
                               <div className="text-center p-4 text-[#8E8E93] text-xs">无选项</div>
                            )}
                         </div>
                      </div>
                      </>
                    )}
                  </th>
                )})}
                <th className="p-2 border-b border-black/5 dark:border-white/5 font-bold sticky top-0 z-10 bg-[#F5F5F7] dark:bg-[#2C2C2E] shadow-sm align-top">
                  <div className="mb-2">Activity</div>
                </th>
              </tr>
            </thead>
            <tbody>
               {filteredData.length === 0 ? (
                 <tr><td colSpan={19} className="text-center p-8 text-[#8E8E93]">未找到匹配数据 / 暂无数据</td></tr>
               ) : filteredData.map((row, idx) => {
                  const c = row.customer as Customer;
                  const p = row.project as Project | undefined;
                  const pn = row.pn as PN | undefined;

                   const isNewRow = pn && newRowIds.has(pn.id);
                   const isMenuOpen = pn && rowMenuOpen === pn.id;

                  return (
                    <tr key={`${c.id}-${p?.id || 'none'}-${pn?.id || 'none'}`} className={cn("hover:bg-black/[0.03] dark:hover:bg-white/[0.03] border-b border-black/5 dark:border-white/5 transition-colors group relative", isNewRow ? "bg-[#34C759]/10 dark:bg-[#34C759]/20" : "", isMenuOpen ? "z-50 focus-within:z-50" : "")}>
                       <td className={cn("p-0 border-r border-black/5 dark:border-white/5 bg-white dark:bg-[#1C1C1E] sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]", isMenuOpen ? "z-50" : "z-10")}>
                          <div className="flex gap-1 items-center justify-center p-2">
                            {/* Customer Level Add Project */}
                            {(!p && !pn) && (
                               <>
                                 <button title="添加项目" onClick={() => onAddProject(c.id)} className="p-1 px-2 text-[#8E8E93] hover:text-[#0071E3] hover:bg-[#0071E3]/10 bg-black/5 dark:bg-white/10 rounded flex items-center gap-1 font-bold text-[10px]"><Plus className="w-3 h-3"/>项目</button>
                                 <button title="删除客户" onClick={() => onDeleteCustomer(c.id)} className="p-1 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                               </>
                            )}

                            {/* Project Level Add PN */}
                            {(p && !pn) && (
                               <>
                               <button title="添加料号PN" onClick={() => onAddPN(c.id, p.id)} className="p-1 px-2 text-[#8E8E93] hover:text-[#0071E3] hover:bg-[#0071E3]/10 bg-black/5 dark:bg-white/10 rounded flex items-center gap-1 font-bold text-[10px]"><Plus className="w-3 h-3"/>料号</button>
                               <button title="删除项目" onClick={() => onDeleteProject(c.id, p.id)} className="p-1 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                               </>
                            )}

                            {/* PN Level Add Row / Delete */}
                            {pn && p && (
                               <>
                               <div className="relative">
                                 <button title="增加行" onClick={() => setRowMenuOpen(rowMenuOpen === pn.id ? null : pn.id)} className="p-1 text-[#8E8E93] hover:text-[#0071E3] hover:bg-[#0071E3]/10 bg-black/5 dark:bg-white/10 rounded flex items-center justify-center transition-colors"><Plus className="w-3 h-3"/></button>
                                 {rowMenuOpen === pn.id && (
                                    <>
                                      <div className="fixed inset-0 z-40 cursor-default" onClick={() => setRowMenuOpen(null)} />
                                      <div className="absolute left-0 top-full mt-1 bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 rounded shadow-lg z-50 flex flex-col py-1 min-w-[100px]">
                                        <button onClick={() => handleAddNewRow(c, p, pn, 'blank', idx)} className="px-4 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors">增加空白行</button>
                                        <button onClick={() => handleAddNewRow(c, p, pn, 'prev', idx)} className="px-4 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors">复制上一行</button>
                                        <button onClick={() => handleAddNewRow(c, p, pn, 'next', idx)} className="px-4 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors">复制下一行</button>
                                      </div>
                                    </>
                                 )}
                               </div>
                               <button title="删除条目" onClick={() => onDeletePN(c.id, p.id, pn.id)} className="p-1 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                               </>
                            )}
                          </div>
                       </td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5"><InlineInput listId="list_salesEn" value={c.salesEn || ""} onChange={(v) => handleUpdate(c, p, pn, "customer", "salesEn", v)} /></td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5"><InlineInput listId="list_salesCn" value={c.salesCn || ""} onChange={(v) => handleUpdate(c, p, pn, "customer", "salesCn", v)} /></td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5"><InlineInput listId="list_customerCode" value={c.customerCode || ""} onChange={(v) => handleUpdate(c, p, pn, "customer", "customerCode", v)} /></td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5"><InlineInput listId="list_nameEn" value={c.nameEn || ""} onChange={(v) => handleUpdate(c, p, pn, "customer", "nameEn", v)} /></td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5"><InlineInput listId="list_nameZh" value={c.nameZh || ""} className="font-bold" onChange={(v) => handleUpdate(c, p, pn, "customer", "nameZh", v)} /></td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5"><InlineInput listId="list_customerRd" value={c.customerRd || ""} onChange={(v) => handleUpdate(c, p, pn, "customer", "customerRd", v)} /></td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5"><InlineInput listId="list_marketSegment" value={pn?.marketSegment || ""} onChange={(v) => handleUpdate(c, p, pn, "pn", "marketSegment", v)} /></td>
                       
                       <td className="p-0 border-r border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.015]"><InlineInput listId="list_pName" value={p?.name || ""} className="font-medium text-[#007AFF]" onChange={(v) => handleUpdate(c, p, pn, "project", "name", v)} /></td>
                       
                       <td className="p-0 border-r border-black/5 dark:border-white/5"><InlineInput listId="list_pnLine" value={pn?.productLine || ""} onChange={(v) => handleUpdate(c, p, pn, "pn", "productLine", v)} /></td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5"><InlineInput listId="list_pnName" value={pn?.name || ""} className="font-mono text-[#007AFF] font-bold" onChange={(v) => handleUpdate(c, p, pn, "pn", "name", v)} /></td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5">
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
                              "font-bold",
                              pn.status === "DWIN" ? "text-[#34C759]" :
                              pn.status === "DLOST" ? "text-[#FF3B30]" :
                              "text-[#007AFF]"
                            )}
                          />}
                       </td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5"><InlineInput value={pn?.drStatus || ""} onChange={(v) => handleUpdate(c, p, pn, "pn", "drStatus", v)} /></td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5"><InlineInput value={pn?.socketCreateDate || ""} onChange={(v) => handleUpdate(c, p, pn, "pn", "socketCreateDate", v)} /></td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5"><InlineInput value={p?.mpSchedule || ""} onChange={(v) => handleUpdate(c, p, pn, "project", "mpSchedule", v)} /></td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5"><InlineInput value={pn?.socketTotalLtrAmt || ""} onChange={(v) => handleUpdate(c, p, pn, "pn", "socketTotalLtrAmt", v)} /></td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5">
                          {pn && <InlineSelect 
                             value={pn.channelOk || "Yes"}
                             options={[{label: "Yes", value: "Yes"}, {label: "No", value: "No"}]}
                             onChange={(v) => handleUpdate(c, p, pn, "pn", "channelOk", v)}
                             className={cn("text-center font-bold", pn.channelOk === "No" ? "text-[#FF3B30]" : "")}
                          />}
                       </td>
                       <td className="p-0 border-r border-black/5 dark:border-white/5"><InlineInput value={pn?.remark || ""} className="min-w-[150px] max-w-[300px]" onChange={(v) => handleUpdate(c, p, pn, "pn", "remark", v)} /></td>
                       <td className="relative p-1 px-2 text-[10px] whitespace-pre-wrap min-w-[200px] max-w-[400px] group/activity align-top">
                          {(pn?.tasks || []).map(t => {
                            const start = (t.startDate || "").replace(/-/g, "");
                            const end = (t.endDate || "").replace(/-/g, "");
                            return (
                               <div key={t.id} className="group/task flex items-start gap-1 py-1 px-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded">
                                 <span className="flex-1 cursor-pointer" onDoubleClick={() => p && onEditTask(c.id, p.id, pn.id, t)} title="双击编辑">{`${start} - ${end}：${t.name}`}</span>
                                 <div className="opacity-0 group-hover/task:opacity-100 transition-opacity flex items-center shrink-0 gap-0.5">
                                   <button onClick={() => p && onEditTask(c.id, p.id, pn.id, t)} className="p-0.5 text-[#8E8E93] hover:text-[#007AFF] bg-black/5 dark:bg-white/10 rounded"><Edit2 className="w-3 h-3"/></button>
                                   <button onClick={() => p && onDeleteTask(c.id, p.id, pn.id, t.id)} className="p-0.5 text-[#8E8E93] hover:text-[#FF3B30] bg-black/5 dark:bg-white/10 rounded"><Trash2 className="w-3 h-3"/></button>
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
                                  className="flex items-center gap-1 p-1 px-2 text-[#8E8E93] hover:text-[#0071E3] hover:bg-[#0071E3]/10 rounded bg-black/5 dark:bg-white/10 w-full justify-center transition-colors"
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
    </div>
  )
}
