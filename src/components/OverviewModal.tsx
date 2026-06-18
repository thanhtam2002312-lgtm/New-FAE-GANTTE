import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, FolderKanban, Cpu, CheckCircle2, TrendingUp, BarChart3, Activity, UserCircle, ArrowLeft } from 'lucide-react';
import { Customer, PN, Project, Task } from '../types';
import { cn } from '../utils/cn';
import { getBadgeColor } from '../utils/colors';

interface OverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onFilterStatus?: (status: string) => void;
  onFilterProductLine?: (pl: string) => void;
  onFilterSales?: (sales: string) => void;
}

export function OverviewModal({ isOpen, onClose, customers, onFilterStatus, onFilterProductLine, onFilterSales }: OverviewModalProps) {
  const [detailView, setDetailView] = useState<'customers' | 'projects' | 'pns' | 'tasks' | null>(null);
  const [detailFilter, setDetailFilter] = useState<string | null>(null);
  const [recentView, setRecentView] = useState<'projects' | 'pns' | 'tasks'>('projects');

  const stats = useMemo(() => {
    let totalProjects = 0;
    let totalPNs = 0;
    let totalTasks = 0;
    
    const plCount: Record<string, number> = {};
    const statusCount: Record<string, number> = {};
    const segmentCount: Record<string, number> = {};
    const salesCount: Record<string, number> = {};
    
    let recentProjects: (Project & { customerName: string })[] = [];
    let recentPns: (PN & { customerName: string, projectName: string })[] = [];
    let recentTasks: (Task & { customerName: string, projectName: string, pnName: string })[] = [];
    
    const allCustomers: { category: string, name: string, extra: {text: string, sub?: string}[] }[] = [];
    const allProjects: { category: string, name: string, extra: {text: string, sub?: string}[] }[] = [];
    const allPNs: { category: string, name: string, extra: {text: string, sub?: string}[] }[] = [];
    const allTasks: { category: string, name: string, extra: {text: string, sub?: string}[] }[] = [];

    (customers || []).forEach(c => {
      const customerName = c.nameZh || c.nameEn;
      const sales = (c.salesEn || c.salesCn || "Unassigned").trim();
      
      const customerPls = new Set<string>();
      (c.projects || []).forEach(p => {
        (p.pns || []).forEach(pn => {
          if (pn.productLine) customerPls.add(pn.productLine);
        });
      });
      const plArray = Array.from(customerPls);

      allCustomers.push({ category: sales, name: customerName, extra: plArray.length > 0 ? plArray.map(pl => ({text: pl})) : [{text: '无产品线'}] });
      
      (c.projects || []).forEach(p => {
        totalProjects++;
        const projectPns = (p.pns || []).filter(pn => pn.name).map(pn => ({ text: pn.name, sub: pn.productLine }));
        allProjects.push({ category: customerName, name: p.name, extra: projectPns.length > 0 ? projectPns : [{text: '无料号'}] });
        
        recentProjects.push({
          ...p,
          customerName: c.nameZh || c.nameEn
        });
        
        (p.pns || []).forEach(pn => {
          totalPNs++;

          if (pn.marketSegment) {
            segmentCount[pn.marketSegment] = (segmentCount[pn.marketSegment] || 0) + 1;
          }
          const pnTasks = (pn.tasks || []).filter(t => t.name).map(t => ({text: t.name}));
          allPNs.push({ category: pn.productLine || '未分配', name: pn.name, extra: pnTasks.length > 0 ? pnTasks : [{text: '无任务'}] });
          
          totalTasks += (pn.tasks || []).length;
          (pn.tasks || []).forEach(t => {
            allTasks.push({ category: t.owner || '未分配', name: t.name, extra: [{text: t.status || '无状态'}] });
            recentTasks.push({
              ...t,
              customerName: c.nameZh || c.nameEn,
              projectName: p.name,
              pnName: pn.name
            });
          });
          
          salesCount[sales] = (salesCount[sales] || 0) + 1;
          
          if (pn.productLine) {
            const pl = pn.productLine.trim();
            if (pl) {
              plCount[pl] = (plCount[pl] || 0) + 1;
            }
          }
          if (pn.status) {
            const status = pn.status.trim().toUpperCase();
            if (status) {
              statusCount[status] = (statusCount[status] || 0) + 1;
            }
          }
          
          recentPns.push({
            ...pn,
            customerName: c.nameZh,
            projectName: p.name
          });
        });
      });
    });

    recentProjects.sort((a, b) => b.updatedAt - a.updatedAt);
    recentProjects = recentProjects.slice(0, 5);

    recentPns.sort((a, b) => b.updatedAt - a.updatedAt);
    recentPns = recentPns.slice(0, 5);

    recentTasks.sort((a, b) => b.updatedAt - a.updatedAt);
    recentTasks = recentTasks.slice(0, 5);

    const sortedPl = Object.entries(plCount).sort((a, b) => b[1] - a[1]);
    const sortedStatus = Object.entries(statusCount).sort((a, b) => b[1] - a[1]);
    const sortedSegments = Object.entries(segmentCount).sort((a, b) => b[1] - a[1]);
    const sortedSales = Object.entries(salesCount).sort((a, b) => b[1] - a[1]);

    return {
      totalCustomers: customers.length,
      totalProjects,
      totalPNs,
      totalTasks,
      sortedPl,
      sortedStatus,
      sortedSegments,
      sortedSales,
      recentProjects,
      recentPns,
      recentTasks,
      allCustomers,
      allProjects,
      allPNs,
      allTasks
    };
  }, [customers]);

  // Reset detail view when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setDetailView(null);
      setRecentView('projects');
    }
  }, [isOpen]);

  // Reset detail filter when detail view changes
  React.useEffect(() => {
    setDetailFilter(null);
  }, [detailView]);

  if (!isOpen) return null;

  const currentList = detailView === 'customers' ? stats.allCustomers :
                      detailView === 'projects' ? stats.allProjects :
                      detailView === 'pns' ? stats.allPNs :
                      detailView === 'tasks' ? stats.allTasks : [];

  const categories = Array.from(new Set(currentList.map(item => item.category))).sort();
  const filteredList = detailFilter ? currentList.filter(item => item.category === detailFilter) : currentList;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-[#F5F5F7] dark:bg-[#1C1C1E] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 bg-white/50 dark:bg-black/20 backdrop-blur-md border-b border-black/5 dark:border-white/5 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              {detailView && (
                <button
                  onClick={() => setDetailView(null)}
                  className="p-2 -ml-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
                  title="返回概览"
                >
                  <ArrowLeft className="w-6 h-6 text-[#1D1D1F] dark:text-white" />
                </button>
              )}
              <div>
                <h2 className="text-2xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                  {detailView === 'customers' ? '所有客户列表' :
                   detailView === 'projects' ? '所有项目列表' :
                   detailView === 'pns' ? '所有料号列表' :
                   detailView === 'tasks' ? '所有任务列表' :
                   '项目概览'}
                </h2>
                <p className="text-sm text-[#8E8E93] mt-1">
                  {detailView ? '详细数据列表' : '全局数据统计与分析'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-[#8E8E93]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
            <AnimatePresence mode="wait">
              {detailView ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-6 shadow-sm border border-black/5 dark:border-white/5 flex flex-col h-full"
                >
                  <div className="mb-4 flex items-center justify-between shrink-0">
                    <select
                      value={detailFilter || ""}
                      onChange={(e) => setDetailFilter(e.target.value || null)}
                      className="px-3 py-1.5 bg-[#F2F2F7] dark:bg-[#3A3A3C] border-none rounded-lg text-sm font-medium text-[#1D1D1F] dark:text-[#E5E5EA] focus:ring-2 focus:ring-[#007AFF] outline-none cursor-pointer"
                    >
                      <option value="">
                        全部 {detailView === 'customers' ? 'Sales' : detailView === 'projects' ? '客户' : detailView === 'pns' ? '产品线' : 'Owner'}
                      </option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="text-sm font-medium text-[#8E8E93]">
                      共 {filteredList.length} 项
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="grid grid-cols-1 gap-3">
                      {filteredList.map((item, idx) => (
                        <div key={idx} className="flex items-center p-4 rounded-xl bg-[#F2F2F7] dark:bg-[#3A3A3C] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <div className="text-sm font-medium text-[#1D1D1F] dark:text-[#E5E5EA] truncate w-[15%] shrink-0" title={item.category}>
                            {item.category}
                          </div>
                          <div className="text-sm font-medium text-[#1D1D1F] dark:text-[#E5E5EA] truncate w-[25%] shrink-0 ml-4" title={item.name}>
                            {item.name}
                          </div>
                          <div className="flex-1 ml-4 flex flex-wrap gap-2 justify-end items-center">
                            {item.extra.map((ext, i) => (
                              <div key={i} className="flex flex-row items-stretch rounded-md border border-black/5 dark:border-white/10 overflow-hidden shadow-sm">
                                {ext.sub && (
                                  <div className="flex items-center text-[10px] font-semibold px-2 py-1 bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400 border-r border-black/5 dark:border-white/10 whitespace-nowrap">
                                    {ext.sub}
                                  </div>
                                )}
                                <div className={cn("flex items-center text-[11px] px-2 py-1 font-medium whitespace-nowrap", getBadgeColor(ext.text))}>
                                  {ext.text}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredList.length === 0 && (
                      <div className="text-center py-12 text-[#8E8E93]">暂无数据</div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Metric Cards */}
                    <MetricCard icon={<Users />} label="总客户数" value={stats.totalCustomers} color="bg-blue-500" onClick={() => setDetailView('customers')} />
                    <MetricCard icon={<FolderKanban />} label="总项目数" value={stats.totalProjects} color="bg-indigo-500" onClick={() => setDetailView('projects')} />
                    <MetricCard icon={<Cpu />} label="总料号 (PN)" value={stats.totalPNs} color="bg-purple-500" onClick={() => setDetailView('pns')} />
                    <MetricCard icon={<CheckCircle2 />} label="总任务数" value={stats.totalTasks} color="bg-emerald-500" onClick={() => setDetailView('tasks')} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Product Line Distribution */}
              <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-6 shadow-sm border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-[#007AFF]" />
                  <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-white">产品线分布</h3>
                </div>
                <div className="space-y-4">
                  {stats.sortedPl.map(([pl, count], idx) => (
                    <div 
                      key={pl} 
                      className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity p-2 -mx-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                      onClick={() => onFilterProductLine?.(pl)}
                      title={`点击筛选产品线为 ${pl} 的项目`}
                    >
                      <div className="w-20 text-sm font-medium text-[#1D1D1F] dark:text-[#E5E5EA] truncate" title={pl}>{pl}</div>
                      <div className="flex-1 h-3 bg-[#F2F2F7] dark:bg-[#3A3A3C] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / stats.totalPNs) * 100}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 }}
                          className="h-full bg-[#007AFF] rounded-full"
                        />
                      </div>
                      <div className="w-8 text-right text-sm font-bold text-[#8E8E93]">{count}</div>
                    </div>
                  ))}
                  {stats.sortedPl.length === 0 && (
                    <div className="text-sm text-[#8E8E93] text-center py-4">暂无数据</div>
                  )}
                </div>
              </div>

              {/* Sales Distribution */}
              <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-6 shadow-sm border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2 mb-6">
                  <UserCircle className="w-5 h-5 text-[#AF52DE]" />
                  <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-white">Sales 分布</h3>
                </div>
                <div className="space-y-4">
                  {stats.sortedSales.map(([sales, count], idx) => (
                    <div 
                      key={sales} 
                      className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity p-2 -mx-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                      onClick={() => onFilterSales?.(sales)}
                      title={`点击筛选 Sales 为 ${sales} 的项目`}
                    >
                      <div className="w-20 text-sm font-medium text-[#1D1D1F] dark:text-[#E5E5EA] truncate" title={sales}>{sales}</div>
                      <div className="flex-1 h-3 bg-[#F2F2F7] dark:bg-[#3A3A3C] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / stats.totalPNs) * 100}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 }}
                          className="h-full bg-[#AF52DE] rounded-full"
                        />
                      </div>
                      <div className="w-8 text-right text-sm font-bold text-[#8E8E93]">{count}</div>
                    </div>
                  ))}
                  {stats.sortedSales.length === 0 && (
                    <div className="text-sm text-[#8E8E93] text-center py-4">暂无数据</div>
                  )}
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-6 shadow-sm border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-[#FF9500]" />
                  <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-white">状态分布 (Status)</h3>
                </div>
                <div className="space-y-4">
                  {stats.sortedStatus.map(([status, count], idx) => {
                    const isWin = status === 'DWIN';
                    const isLost = status === 'DLOST';
                    const colorClass = isWin ? 'bg-[#34C759]' : isLost ? 'bg-[#FF3B30]' : 'bg-[#FF9500]';
                    
                    return (
                      <div 
                        key={status} 
                        className="flex items-center justify-between p-3 rounded-xl bg-[#F2F2F7] dark:bg-[#3A3A3C] cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onFilterStatus?.(status)}
                        title={`点击筛选状态为 ${status} 的项目`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-3 h-3 rounded-full", colorClass)} />
                          <span className="text-sm font-medium text-[#1D1D1F] dark:text-[#E5E5EA]">{status}</span>
                        </div>
                        <span className="text-sm font-bold text-[#1D1D1F] dark:text-white">{count}</span>
                      </div>
                    );
                  })}
                  {stats.sortedStatus.length === 0 && (
                    <div className="text-sm text-[#8E8E93] text-center py-4">暂无数据</div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-6 shadow-sm border border-black/5 dark:border-white/5">
              <div 
                className="flex items-center gap-2 mb-6 cursor-pointer hover:opacity-80 transition-opacity select-none"
                onClick={() => {
                  setRecentView(prev => prev === 'projects' ? 'pns' : prev === 'pns' ? 'tasks' : 'projects');
                }}
                title="点击切换视图"
              >
                <Activity className="w-5 h-5 text-[#FF2D55]" />
                <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-white">
                  最近更新的{recentView === 'projects' ? '项目' : recentView === 'pns' ? '料号' : '任务'}
                </h3>
                <div className="ml-2 px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-medium text-[#8E8E93]">
                  点击切换
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/5 dark:border-white/5">
                      <th className="pb-3 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">客户</th>
                      <th className="pb-3 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">项目</th>
                      {recentView !== 'projects' && (
                        <th className="pb-3 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">料号 (PN)</th>
                      )}
                      {recentView === 'tasks' && (
                        <th className="pb-3 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">任务</th>
                      )}
                      <th className="pb-3 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">状态</th>
                      <th className="pb-3 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider text-right">更新时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {recentView === 'projects' && stats.recentProjects.map(p => (
                      <tr key={p.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 text-sm text-[#1D1D1F] dark:text-[#E5E5EA] font-medium">{p.customerName}</td>
                        <td className="py-3 text-sm text-[#1D1D1F] dark:text-white font-mono">{p.name}</td>
                        <td className="py-3">
                          <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-black/5 dark:bg-white/10 text-[#1D1D1F] dark:text-white">
                            -
                          </span>
                        </td>
                        <td className="py-3 text-sm text-[#8E8E93] text-right">
                          {new Date(p.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {recentView === 'pns' && stats.recentPns.map(pn => (
                      <tr key={pn.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 text-sm text-[#1D1D1F] dark:text-[#E5E5EA] font-medium">{pn.customerName}</td>
                        <td className="py-3 text-sm text-[#8E8E93]">{pn.projectName}</td>
                        <td className="py-3 text-sm text-[#1D1D1F] dark:text-white font-mono">{pn.name}</td>
                        <td className="py-3">
                          <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-black/5 dark:bg-white/10 text-[#1D1D1F] dark:text-white">
                            {pn.status || 'NBO'}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-[#8E8E93] text-right">
                          {new Date(pn.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {recentView === 'tasks' && stats.recentTasks.map(t => (
                      <tr key={t.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 text-sm text-[#1D1D1F] dark:text-[#E5E5EA] font-medium">{t.customerName}</td>
                        <td className="py-3 text-sm text-[#8E8E93]">{t.projectName}</td>
                        <td className="py-3 text-sm text-[#8E8E93] font-mono">{t.pnName}</td>
                        <td className="py-3 text-sm text-[#1D1D1F] dark:text-white">{t.name}</td>
                        <td className="py-3">
                          <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-black/5 dark:bg-white/10 text-[#1D1D1F] dark:text-white">
                            {t.status || '未开始'}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-[#8E8E93] text-right">
                          {new Date(t.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {((recentView === 'projects' && stats.recentProjects.length === 0) ||
                      (recentView === 'pns' && stats.recentPns.length === 0) ||
                      (recentView === 'tasks' && stats.recentTasks.length === 0)) && (
                      <tr>
                        <td colSpan={recentView === 'projects' ? 4 : recentView === 'pns' ? 5 : 6} className="py-8 text-center text-sm text-[#8E8E93]">暂无动态</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function MetricCard({ icon, label, value, color, onClick }: { icon: React.ReactNode, label: string, value: number, color: string, onClick?: () => void }) {
  return (
    <div 
      className={cn(
        "bg-white dark:bg-[#2C2C2E] rounded-2xl p-6 shadow-sm border border-black/5 dark:border-white/5 flex items-center gap-4",
        onClick && "cursor-pointer hover:scale-105 hover:shadow-md transition-all active:scale-95"
      )}
      onClick={onClick}
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-inner", color)}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      </div>
      <div>
        <div className="text-sm font-medium text-[#8E8E93] mb-1">{label}</div>
        <div className="text-3xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">{value}</div>
      </div>
    </div>
  );
}
