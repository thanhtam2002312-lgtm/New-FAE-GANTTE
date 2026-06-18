import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  GanttChartSquare,
  Plus,
  Minus,
  ChevronRight,
  ChevronDown,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Activity,
  Calendar,
  Search,
  MoreVertical,
  Trash2,
  User,
  Clock,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Table,
  LayoutList,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Customer,
  Project,
  Task,
  TaskStatus,
  ViewMode,
  PN,
  PNStatus,
} from "./types";
import { cn } from "./utils/cn";
import {
  generateId,
  getCurrentDateStr,
  getWeekNumber,
  getDaysBetween,
} from "./utils/helpers";
import { excelService } from "./services/excelService";
import TaskModal from "./components/TaskModal";
import AddProjectModal from "./components/AddProjectModal";
import AddCustomerModal from "./components/AddCustomerModal";
import EditCustomerModal from "./components/EditCustomerModal";
import EditProjectModal from "./components/EditProjectModal";
import EditPNModal from "./components/EditPNModal";
import AddPNModal from "./components/AddPNModal";
import { OverviewModal } from "./components/OverviewModal";
import { ExcelView } from "./components/ExcelView";
import { getBadgeColor } from "./utils/colors";
import { get, set, del } from "idb-keyval";

const STORAGE_KEY = "fae_gantt_data_v3";

const ALLOWED_USERNAME = "Roben";
const ALLOWED_PASSWORD = "znuobin";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("fae_is_logged_in") === "true" || sessionStorage.getItem("fae_is_logged_in") === "true";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ALLOWED_USERNAME && password === ALLOWED_PASSWORD) {
      setIsLoggedIn(true);
      if (rememberMe) {
        localStorage.setItem("fae_is_logged_in", "true");
      } else {
        sessionStorage.setItem("fae_is_logged_in", "true");
      }
      setLoginError("");
    } else {
      setLoginError("账号或密码错误");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("fae_is_logged_in");
    sessionStorage.removeItem("fae_is_logged_in");
    setUsername("");
    setPassword("");
  };

  // --- State ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterProductLine, setFilterProductLine] = useState<string | null>(null);
  const [filterSales, setFilterSales] = useState<string | null>(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskContext, setSelectedTaskContext] = useState<{
    task: Task;
    customerId: string;
    projectId: string;
    pnId: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [displayMode, setDisplayMode] = useState<"gantt" | "excel">("gantt");
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [activeEditCustomer, setActiveEditCustomer] = useState<Customer | null>(null);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [activeEditProject, setActiveEditProject] = useState<{ customer: Customer; project: Project } | null>(null);
  const [selectedCustomerForProject, setSelectedCustomerForProject] = useState<Customer | null>(null);
  const [addPNModalData, setAddPNModalData] = useState<{ customerId: string; projectId: string } | null>(null);
  const [editPNModalData, setEditPNModalData] = useState<{ customerId: string; projectId: string; pn: PN } | null>(null);
  const clickTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const [longHoverId, setLongHoverId] = useState<string | null>(null);
  const hoverTimerRef = useRef<Record<string, NodeJS.Timeout>>({});

  const handleNameMouseEnter = (id: string) => {
    if (hoverTimerRef.current[id]) {
      clearTimeout(hoverTimerRef.current[id]);
    }
    hoverTimerRef.current[id] = setTimeout(() => {
      setLongHoverId(id);
    }, 800);
  };

  const handleNameMouseLeave = (id: string) => {
    if (hoverTimerRef.current[id]) {
      clearTimeout(hoverTimerRef.current[id]);
      delete hoverTimerRef.current[id];
    }
    if (longHoverId === id) {
      setLongHoverId(null);
    }
  };
  const [sortType, setSortType] = useState<'createdAt_asc' | 'createdAt_desc' | 'updatedAt_asc' | 'updatedAt_desc'>('updatedAt_desc');
  const [dragTask, setDragTask] = useState<Task | null>(null);
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem("fae_zoom");
    return saved ? parseFloat(saved) : 1.0;
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("fae_sidebar_width");
    return saved ? parseInt(saved, 10) : 340;
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleQuickCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setToast({ message: `${label} "${text}" 已复制` });
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isSyncingScroll = useRef(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("fae_dark_mode");
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("fae_dark_mode", isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem("fae_zoom", zoom.toString());
  }, [zoom]);

  useEffect(() => {
    localStorage.setItem("fae_sidebar_width", sidebarWidth.toString());
  }, [sidebarWidth]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await get<Customer[]>(STORAGE_KEY);
        if (saved && saved.length > 0) {
          setCustomers(saved);
        } else {
          // Check localStorage for migration (if upgrading from previous version)
          const oldSaved = localStorage.getItem(STORAGE_KEY);
          if (oldSaved) {
            const parsed = JSON.parse(oldSaved);
            setCustomers(parsed);
            // Optionally, we could clean it up after migrating:
            // localStorage.removeItem(STORAGE_KEY);
          } else {
            const today = getCurrentDateStr();
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 14);
            const nextWeekStr = nextWeek.toISOString().split("T")[0];

            const demoData: Customer[] = [
              {
                id: "c1",
                nameZh: "特斯拉",
                nameEn: "Tesla",
                customerCode: "TSLA001",
                salesEn: "Elon M.",
                projects: [
                  {
                    id: "p1",
                    name: "Model Y 智能座舱项目",
                    pns: [
                      {
                        id: "pn1",
                        name: "PN: 1234567-00-A",
                        productLine: "Auto",
                        status: "DIN",
                        tasks: [
                          {
                            id: "t1",
                            name: "原理图评审",
                            status: "done",
                            startDate: "2026-01-01",
                            endDate: "2026-01-15",
                            owner: "张工",
                          },
                          {
                            id: "t2",
                            name: "PCB 布局支持",
                            status: "risk",
                            startDate: today,
                            endDate: nextWeekStr,
                            owner: "李工",
                            blocker: "等待层叠结构确认",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ];
            setCustomers(demoData);
          }
        }
      } catch (e) {
        console.error("加载数据失败", e);
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      if (customers.length > 0) {
        set(STORAGE_KEY, customers).catch(console.error);
      } else {
        del(STORAGE_KEY).catch(console.error);
      }
    }
  }, [customers, isDataLoaded]);

  // --- Computed Stats ---
  const stats = useMemo(() => {
    let riskCount = 0;
    let thisWeekTodo = 0;
    const today = new Date();

    (customers || []).forEach((c) => {
      (c.projects || []).forEach((p) => {
        (p.pns || []).forEach((pn) => {
          (pn.tasks || []).forEach((t) => {
            if (t.status === "risk") riskCount++;
            const start = new Date(t.startDate);
            const end = new Date(t.endDate);
            const isOngoing = today >= start && today <= end;
            if (isOngoing && t.status !== "done") thisWeekTodo++;
          });
        });
      });
    });

    return { riskCount, thisWeekTodo };
  }, [customers]);

  // --- Handlers ---
  const toggleExpand = (id: string, childIdsToExpand?: string[]) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
      if (childIdsToExpand) {
        childIdsToExpand.forEach(childId => newSet.add(childId));
      }
    }
    setExpandedItems(newSet);
  };

  const isItemExpanded = (id: string) => {
    if (searchQuery !== "") return true;
    return expandedItems.has(id);
  };

  const handleExpandAll = () => {
    const allIds = new Set<string>();
    (customers || []).forEach((c) => {
      allIds.add(c.id);
      (c.projects || []).forEach((p) => {
        allIds.add(p.id);
        (p.pns || []).forEach((pn) => {
          allIds.add(pn.id);
        });
      });
    });
    setExpandedItems(allIds);
    setToast({ message: "已展开全部层级" });
  };

  const handleCollapseAll = () => {
    setExpandedItems(new Set());
    setToast({ message: "已收起全部层级" });
  };

  const scrollToToday = (behavior: ScrollBehavior = "smooth") => {
    if (timelineRef.current) {
      const pos = getCurrentMarkerPos();
      const containerWidth = timelineRef.current.clientWidth;
      const targetScrollLeft = pos - containerWidth / 2 + columnWidth / 2;
      timelineRef.current.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior,
      });
    }
  };

  useEffect(() => {
    if (customers.length > 0 && timelineRef.current) {
      const timer = setTimeout(() => {
        scrollToToday("auto");
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [viewMode, customers.length > 0]);

  const renderHighlight = (text: string, highlight: string) => {
    if (!text) return <span></span>;
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              className="bg-yellow-200 dark:bg-yellow-500/40 text-yellow-900 dark:text-yellow-100 px-0.5 rounded font-bold"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const addCustomer = () => {
    const newCustomer: Customer = {
      id: generateId(),
      nameZh: "新客户",
      nameEn: "New Customer",
      customerCode: "CODE",
      salesEn: "Sales",
      projects: [],
    };
    setCustomers((prev) => [...prev, newCustomer]);
    setEditingId(newCustomer.id);
  };

  const addProject = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      setSelectedCustomerForProject(cust);
      setShowAddProjectModal(true);
    }
  };

  const addPN = (customerId: string, projectId: string) => {
    setAddPNModalData({ customerId, projectId });
  };

  const handleAddPNSubmit = (data: {
    name: string;
    productLine: string;
    status: PNStatus;
    drStatus: string;
    socketCreateDate: string;
    socketTotalLtrAmt: string;
    channelOk: 'Yes' | 'No';
    remark: string;
  }) => {
    if (!addPNModalData) return;
    const { customerId, projectId } = addPNModalData;

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            updatedAt: Date.now(),
            projects: c.projects.map((p) => {
              if (p.id === projectId) {
                const newPN: PN = {
                  id: generateId(),
                  name: data.name,
                  productLine: data.productLine,
                  status: data.status,
                  drStatus: data.drStatus,
                  socketCreateDate: data.socketCreateDate,
                  socketTotalLtrAmt: data.socketTotalLtrAmt,
                  channelOk: data.channelOk,
                  remark: data.remark,
                  tasks: [],
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
                return { ...p, updatedAt: Date.now(), pns: [...p.pns, newPN] };
              }
              return p;
            }),
          };
        }
        return c;
      }),
    );
    setExpandedItems((prev) => new Set(prev).add(projectId));
    setAddPNModalData(null);
    setToast({ message: "添加料号成功" });
  };

  const handlePnItemClick = (
    id: string,
    onSingleClick: () => void,
    onDoubleClick: () => void,
  ) => {
    if (clickTimers.current[id]) {
      clearTimeout(clickTimers.current[id]);
      delete clickTimers.current[id];
      onDoubleClick();
    } else {
      clickTimers.current[id] = setTimeout(() => {
        onSingleClick();
        delete clickTimers.current[id];
      }, 250);
    }
  };

  const handleEditPNSubmit = (
    customerId: string,
    projectId: string,
    pnId: string,
    data: {
      name: string;
      productLine: string;
      status: PNStatus;
      drStatus: string;
      socketCreateDate: string;
      socketTotalLtrAmt: string;
      channelOk: 'Yes' | 'No';
      remark: string;
      tasks: Task[];
    }
  ) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            updatedAt: Date.now(),
            projects: c.projects.map((p) => {
              if (p.id === projectId) {
                return {
                  ...p,
                  updatedAt: Date.now(),
                  pns: p.pns.map((pItem) => {
                    if (pItem.id === pnId) {
                      const updatedTasks = data.tasks.map((t) => {
                        const isNew = t.id.startsWith('task_');
                        return {
                          ...t,
                          id: isNew ? generateId() : t.id,
                          createdAt: t.createdAt || Date.now(),
                          updatedAt: Date.now(),
                        };
                      });
                      return {
                        ...pItem,
                        name: data.name,
                        productLine: data.productLine,
                        status: data.status,
                        drStatus: data.drStatus,
                        socketCreateDate: data.socketCreateDate,
                        socketTotalLtrAmt: data.socketTotalLtrAmt,
                        channelOk: data.channelOk,
                        remark: data.remark,
                        tasks: updatedTasks,
                        updatedAt: Date.now(),
                      };
                    }
                    return pItem;
                  }),
                };
              }
              return p;
            }),
          };
        }
        return c;
      }),
    );
    setEditPNModalData(null);
    setToast({ message: "修改料号及关联任务成功" });
  };

  const handleSaveEditCustomer = (
    customerId: string,
    data: {
      nameZh: string;
      nameEn: string;
      customerCode: string;
      salesEn: string;
      salesCn: string;
      customerRd: string;
    }
  ) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            ...data,
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );
    setShowEditCustomerModal(false);
    setActiveEditCustomer(null);
    setToast({ message: "修改客户及属性成功" });
  };

  const handleSaveCustomer = (data: {
    nameZh: string;
    nameEn: string;
    customerCode: string;
    salesEn: string;
    salesCn: string;
    customerRd: string;
  }) => {
    setCustomers((prev) => {
      let newCustomers = [...prev];
      let customerIndex = newCustomers.findIndex((c) => c.nameZh === data.nameZh);
      let customer: Customer;

      if (customerIndex === -1) {
        customer = {
          id: generateId(),
          nameZh: data.nameZh,
          nameEn: data.nameEn,
          customerCode: data.customerCode,
          salesEn: data.salesEn,
          salesCn: data.salesCn,
          customerRd: data.customerRd,
          projects: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        newCustomers.push(customer);
      } else {
        customer = { ...newCustomers[customerIndex] };
        customer.nameEn = data.nameEn || customer.nameEn;
        customer.customerCode = data.customerCode || customer.customerCode;
        customer.salesEn = data.salesEn || customer.salesEn;
        customer.salesCn = data.salesCn || customer.salesCn;
        customer.customerRd = data.customerRd || customer.customerRd;
        customer.updatedAt = Date.now();
        newCustomers[customerIndex] = customer;
      }

      setExpandedItems((prevSet) => {
        const newSet = new Set(prevSet);
        newSet.add(customer.id);
        return newSet;
      });

      return newCustomers;
    });
    setShowAddCustomerModal(false);
    setToast({ message: "添加客户成功" });
  };

  const handleSaveProject = (data: {
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
  }) => {
    setCustomers(prev => {
      let newCustomers = [...prev];
      let customerIndex = newCustomers.findIndex(c => c.nameZh === data.nameZh);
      let customer: Customer;
      
      if (customerIndex === -1) {
        customer = {
          id: generateId(),
          nameZh: data.nameZh,
          nameEn: data.nameEn,
          customerCode: data.customerCode,
          salesEn: data.salesEn,
          salesCn: data.salesCn,
          customerRd: data.customerRd,
          projects: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        newCustomers.push(customer);
      } else {
        customer = { ...newCustomers[customerIndex] };
        customer.nameEn = data.nameEn || customer.nameEn;
        customer.customerCode = data.customerCode || customer.customerCode;
        customer.salesEn = data.salesEn || customer.salesEn;
        customer.salesCn = data.salesCn || customer.salesCn;
        customer.customerRd = data.customerRd || customer.customerRd;
        customer.updatedAt = Date.now();
        customer.projects = [...customer.projects];
        newCustomers[customerIndex] = customer;
      }

      let projectIndex = customer.projects.findIndex(p => p.name === data.projectName);
      let project: Project;
      if (projectIndex === -1) {
        project = {
          id: generateId(),
          name: data.projectName,
          pns: [],
          mpSchedule: data.mpSchedule,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        customer.projects.push(project);
      } else {
        project = { ...customer.projects[projectIndex] };
        if (data.mpSchedule) {
          project.mpSchedule = data.mpSchedule;
        }
        project.updatedAt = Date.now();
        project.pns = [...project.pns];
        customer.projects[projectIndex] = project;
      }

      let pnIndex = project.pns.findIndex(p => p.name === data.pnName);
      let pn: PN;
      if (pnIndex === -1) {
        pn = {
          id: generateId(),
          name: data.pnName,
          productLine: data.productLine,
          status: data.pnStatus,
          drStatus: data.drStatus,
          socketCreateDate: data.socketCreateDate,
          socketTotalLtrAmt: data.socketTotalLtrAmt,
          marketSegment: data.marketSegment,
          tasks: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        project.pns.push(pn);
      } else {
        pn = { ...project.pns[pnIndex] };
        pn.productLine = data.productLine || pn.productLine;
        pn.status = data.pnStatus || pn.status;
        pn.drStatus = data.drStatus || pn.drStatus;
        pn.marketSegment = data.marketSegment || pn.marketSegment;
        pn.socketCreateDate = data.socketCreateDate || pn.socketCreateDate;
        pn.socketTotalLtrAmt = data.socketTotalLtrAmt || pn.socketTotalLtrAmt;
        pn.updatedAt = Date.now();
        project.pns[pnIndex] = pn;
      }

      // Expand the newly created/updated customer and project
      setExpandedItems(prevSet => {
        const newSet = new Set(prevSet);
        newSet.add(customer.id);
        newSet.add(project.id);
        return newSet;
      });

      return newCustomers;
    });
    setShowAddProjectModal(false);
  };

  const handleSaveEditProject = (
    projectId: string,
    projectName: string,
    mpSchedule: string,
    pns: Array<{
      id: string;
      name: string;
      productLine: string;
      status: PNStatus;
      drStatus: string;
      socketCreateDate: string;
      socketTotalLtrAmt: string;
      channelOk?: 'Yes' | 'No';
      remark?: string;
    }>
  ) => {
    if (!activeEditProject) return;
    const { customer } = activeEditProject;

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customer.id) {
          const updatedProjects = c.projects.map((p) => {
            if (p.id === projectId) {
              const updatedPns = pns.map((pData) => {
                const isNew = pData.id.startsWith('new_');
                if (isNew) {
                  return {
                    id: generateId(),
                    name: pData.name,
                    productLine: pData.productLine,
                    status: pData.status,
                    drStatus: pData.drStatus,
                    socketCreateDate: pData.socketCreateDate,
                    socketTotalLtrAmt: pData.socketTotalLtrAmt,
                    channelOk: pData.channelOk || 'Yes',
                    remark: pData.remark || '',
                    tasks: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  };
                } else {
                  const existingPn = p.pns.find((x) => x.id === pData.id);
                  return {
                    ...existingPn,
                    id: pData.id,
                    name: pData.name,
                    productLine: pData.productLine,
                    status: pData.status,
                    drStatus: pData.drStatus,
                    socketCreateDate: pData.socketCreateDate,
                    socketTotalLtrAmt: pData.socketTotalLtrAmt,
                    channelOk: pData.channelOk || 'Yes',
                    remark: pData.remark || '',
                    tasks: existingPn ? existingPn.tasks : [],
                    updatedAt: Date.now(),
                  } as PN;
                }
              });

              return {
                ...p,
                name: projectName,
                mpSchedule: mpSchedule,
                pns: updatedPns,
                updatedAt: Date.now(),
              };
            }
            return p;
          });

          return {
            ...c,
            projects: updatedProjects,
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );

    setShowEditProjectModal(false);
    setActiveEditProject(null);
    setToast({ message: "修改项目成功" });
  };

  const addTask = (customerId: string, projectId: string, pnId: string) => {
    const today = getCurrentDateStr();
    const end = new Date();
    end.setDate(end.getDate() + 7);
    const newTask: Task = {
      id: generateId(),
      name: "",
      status: "standard",
      startDate: today,
      endDate: end.toISOString().split("T")[0],
      owner: "我",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSelectedTaskContext({
      task: newTask,
      customerId,
      projectId,
      pnId,
      isNew: true,
    });
    setIsModalOpen(true);
  };

  const updateCustomerField = (
    id: string,
    field: "nameZh" | "nameEn" | "customerCode" | "salesEn" | "salesCn" | "customerRd",
    value: string,
  ) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) return { ...c, [field]: value, updatedAt: Date.now() };
        return c;
      }),
    );
    setEditingId(null);
  };

  const addPNRow = (customerId: string, projectId: string, afterPnId: string | undefined, newPn: PN) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            projects: c.projects.map((p) => {
              if (p.id === projectId) {
                const nextPns = [...p.pns];
                let inserted = false;
                if (afterPnId) {
                   const idx = nextPns.findIndex((x) => x.id === afterPnId);
                   if (idx >= 0) {
                     nextPns.splice(idx + 1, 0, newPn);
                     inserted = true;
                   }
                }
                if (!inserted) nextPns.push(newPn);
                return { ...p, pns: nextPns };
              }
              return p;
            }),
          };
        }
        return c;
      })
    );
  };

  const updatePNField = (
    pnId: string,
    field: "name" | "productLine" | "status" | "drStatus" | "socketCreateDate" | "socketTotalLtrAmt",
    value: string,
  ) => {
    setCustomers((prev) =>
      prev.map((c) => {
        let customerUpdated = false;
        const newProjects = c.projects.map((p) => {
          let projectUpdated = false;
          const newPns = p.pns.map((pn) => {
            if (pn.id === pnId) {
              customerUpdated = true;
              projectUpdated = true;
              return { ...pn, [field]: value, updatedAt: Date.now() };
            }
            return pn;
          });
          if (projectUpdated) return { ...p, pns: newPns, updatedAt: Date.now() };
          return p;
        });
        if (customerUpdated) return { ...c, projects: newProjects, updatedAt: Date.now() };
        return c;
      }),
    );
    setEditingId(null);
  };

  const updateName = (id: string, newName: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        let customerUpdated = false;
        const newProjects = c.projects.map((p) => {
          if (p.id === id) {
            customerUpdated = true;
            return { ...p, name: newName, updatedAt: Date.now() };
          }
          let projectUpdated = false;
          const newPns = p.pns.map((pn) => {
            if (pn.id === id) {
              customerUpdated = true;
              projectUpdated = true;
              return { ...pn, name: newName, updatedAt: Date.now() };
            }
            let pnUpdated = false;
            const newTasks = pn.tasks.map((t) => {
              if (t.id === id) {
                customerUpdated = true;
                projectUpdated = true;
                pnUpdated = true;
                return { ...t, name: newName, updatedAt: Date.now() };
              }
              return t;
            });
            if (pnUpdated) return { ...pn, tasks: newTasks, updatedAt: Date.now() };
            return pn;
          });
          if (projectUpdated) return { ...p, pns: newPns, updatedAt: Date.now() };
          return p;
        });
        if (customerUpdated) return { ...c, projects: newProjects, updatedAt: Date.now() };
        return c;
      }),
    );
    setEditingId(null);
  };

  const deleteTask = (
    customerId: string,
    projectId: string,
    pnId: string,
    taskId: string,
  ) => {
    console.log("Deleting task:", taskId);
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        return {
          ...c,
          updatedAt: Date.now(),
          projects: c.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              updatedAt: Date.now(),
              pns: (p.pns || []).map((pn) => {
                if (pn.id !== pnId) return pn;
                return {
                  ...pn,
                  updatedAt: Date.now(),
                  tasks: (pn.tasks || []).filter((t) => t.id !== taskId),
                };
              }),
            };
          }),
        };
      }),
    );
  };

  const addFullRow = (afterCustomerId: string, newCustomer: Customer) => {
    setCustomers((prev) => {
      const next = [...prev];
      const idx = next.findIndex(c => c.id === afterCustomerId);
      if (idx !== -1) {
        next.splice(idx + 1, 0, newCustomer);
      } else {
        next.push(newCustomer);
      }
      return next;
    });
  };

  const deletePN = (customerId: string, projectId: string, pnId: string) => {
    console.log("Deleting PN:", pnId);
    setCustomers((prev) => {
      const nextCustomers = [...prev];
      const cIndex = nextCustomers.findIndex(c => c.id === customerId);
      if (cIndex === -1) return prev;
      
      const c = { ...nextCustomers[cIndex] };
      const pIndex = (c.projects || []).findIndex(p => p.id === projectId);
      if (pIndex === -1) return prev;
      
      const p = { ...c.projects[pIndex] };
      p.pns = (p.pns || []).filter(pn => pn.id !== pnId);
      
      if (p.pns.length === 0) {
        c.projects = c.projects.filter(proj => proj.id !== projectId);
      } else {
        c.projects = [...c.projects];
        c.projects[pIndex] = { ...p, updatedAt: Date.now() };
      }
      
      if (c.projects.length === 0) {
        nextCustomers.splice(cIndex, 1);
      } else {
        nextCustomers[cIndex] = { ...c, updatedAt: Date.now() };
      }
      
      return nextCustomers;
    });
  };

  const deleteProject = (customerId: string, projectId: string) => {
    console.log("Deleting project:", projectId);
    setCustomers((prev) => {
      const nextCustomers = [...prev];
      const cIndex = nextCustomers.findIndex(c => c.id === customerId);
      if (cIndex === -1) return prev;
      
      const c = { ...nextCustomers[cIndex] };
      c.projects = (c.projects || []).filter((p) => p.id !== projectId);
      
      if (c.projects.length === 0) {
        nextCustomers.splice(cIndex, 1);
      } else {
        nextCustomers[cIndex] = { ...c, updatedAt: Date.now() };
      }
      return nextCustomers;
    });
  };

  const deleteCustomer = (customerId: string) => {
    console.log("Deleting customer:", customerId);
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  const handleTaskSave = (updatedTask: Task) => {
    const isNew = selectedTaskContext?.isNew;

    setCustomers((prev) =>
      prev.map((c) => {
        let customerUpdated = false;
        const newProjects = c.projects.map((p) => {
          let projectUpdated = false;
          const newPns = p.pns.map((pn) => {
            if (isNew && pn.id === selectedTaskContext?.pnId) {
              customerUpdated = true;
              projectUpdated = true;
              return {
                ...pn,
                tasks: [...pn.tasks, { ...updatedTask, updatedAt: Date.now() }],
                updatedAt: Date.now(),
              };
            }

            let pnUpdated = false;
            const newTasks = pn.tasks.map((t) => {
              if (t.id === updatedTask.id) {
                customerUpdated = true;
                projectUpdated = true;
                pnUpdated = true;
                return { ...updatedTask, updatedAt: Date.now() };
              }
              return t;
            });
            if (pnUpdated) return { ...pn, tasks: newTasks, updatedAt: Date.now() };
            return pn;
          });
          if (projectUpdated) return { ...p, pns: newPns, updatedAt: Date.now() };
          return p;
        });
        if (customerUpdated) return { ...c, projects: newProjects, updatedAt: Date.now() };
        return c;
      }),
    );

    if (isNew && selectedTaskContext?.pnId) {
      setExpandedItems((prev) => new Set(prev).add(selectedTaskContext.pnId));
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = Math.max(250, Math.min(800, moveEvent.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = "default";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // --- Filtering & Sorting ---
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    
    const filtered = customers
      .filter((c) => {
        if (filterSales) {
          const sales = (c.salesEn || c.salesCn || "Unassigned").trim();
          if (sales !== filterSales) return false;
        }
        return true;
      })
      .map((c) => {
        const customerMatches = 
          !q ||
          (c.nameZh || "").toLowerCase().includes(q) ||
          (c.nameEn || "").toLowerCase().includes(q) ||
          (c.customerCode || "").toLowerCase().includes(q) ||
          (c.salesEn || "").toLowerCase().includes(q);

        return {
          ...c,
          projects: (c.projects || [])
            .map((p) => {
              const projectMatches = customerMatches || (p.name || "").toLowerCase().includes(q);
              
              return {
                ...p,
                pns: (p.pns || [])
                  .filter((pn) => {
                    if (filterStatus && (pn.status || "").trim().toUpperCase() !== filterStatus) {
                      return false;
                    }
                    if (filterProductLine && (pn.productLine || "").trim() !== filterProductLine) {
                      return false;
                    }
                    return true;
                  })
                  .map((pn) => {
                    const pnMatches = projectMatches || (pn.name || "").toLowerCase().includes(q) || (pn.productLine || "").toLowerCase().includes(q);
                    
                    return {
                      ...pn,
                      tasks: (pn.tasks || []).filter((t) => {
                        const taskMatchesSearch = pnMatches || (t.name || "").toLowerCase().includes(q) || (t.owner || "").toLowerCase().includes(q);
                        const matchesRisk = filterRisk ? t.status === "risk" : true;
                        return taskMatchesSearch && matchesRisk;
                      }),
                    };
                  })
                  .filter((pn) => {
                    const pnMatches = projectMatches || (pn.name || "").toLowerCase().includes(q) || (pn.productLine || "").toLowerCase().includes(q);
                    return pn.tasks.length > 0 || ((pnMatches || filterStatus || filterProductLine) && !filterRisk);
                  }),
              };
            })
            .filter((p) => p.pns.length > 0 || (customerMatches && !filterRisk && !filterStatus && !filterProductLine)),
        };
      })
      .filter((c) => {
        const customerMatches = 
          !q ||
          (c.nameZh || "").toLowerCase().includes(q) ||
          (c.nameEn || "").toLowerCase().includes(q) ||
          (c.customerCode || "").toLowerCase().includes(q) ||
          (c.salesEn || "").toLowerCase().includes(q);
        return c.projects.length > 0 || (customerMatches && !filterRisk && !filterStatus && !filterProductLine && !filterSales);
      });

    // Sorting
    return filtered.sort((a, b) => {
      const aVal = sortType.startsWith('createdAt') ? (a.createdAt || 0) : (a.updatedAt || 0);
      const bVal = sortType.startsWith('createdAt') ? (b.createdAt || 0) : (b.updatedAt || 0);
      return sortType.endsWith('asc') ? aVal - bVal : bVal - aVal;
    });
  }, [customers, searchQuery, filterRisk, filterStatus, filterProductLine, filterSales, sortType]);

  // --- Timeline Calculations ---
  const columnWidth = useMemo(() => {
    if (viewMode === "day") return 120 * zoom;
    if (viewMode === "week") return 80 * zoom;
    if (viewMode === "month") return 160 * zoom;
    return 100 * zoom;
  }, [viewMode, zoom]);

  const timelineExtents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startYear = now.getFullYear() - 1;
    const endYear = startYear + 3; // 4 years total
    return { startYear, endYear, now };
  }, []);

  const timelineHeaders = useMemo(() => {
    const headers = [];
    const { startYear, endYear, now } = timelineExtents;

    if (viewMode === "day") {
      for (let i = -14; i < 90; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        headers.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, date: d });
      }
    } else if (viewMode === "week") {
      for (let y = startYear; y <= endYear; y++) {
        for (let i = 1; i <= 52; i++) {
          headers.push({ label: i === 1 ? `${y} W${i}` : `W${i}`, week: i, year: y });
        }
      }
    } else if (viewMode === "month") {
      for (let y = startYear; y <= endYear; y++) {
        for (let i = 1; i <= 12; i++) {
          headers.push({ label: i === 1 ? `${y}年${i}月` : `${i}月`, month: i, year: y });
        }
      }
    }
    return headers;
  }, [viewMode, timelineExtents]);

  const getPositionFromDate = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
    if (isNaN(date.getTime())) return 0;
    
    const { startYear, now } = timelineExtents;
    if (viewMode === "day") {
      const baseDate = new Date(now);
      baseDate.setDate(now.getDate() - 14);
      const diffDays = (date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays * columnWidth;
    } else if (viewMode === "week") {
      const diffYears = date.getFullYear() - startYear;
      let weekNum = getWeekNumber(date);
      if (weekNum > 52) weekNum = 52;
      
      const totalWeeksOffset = diffYears * 52 + (weekNum - 1);
      const dayNum = date.getDay() || 7;
      const weekFraction = (dayNum - 1) / 7;
      
      return (totalWeeksOffset + weekFraction) * columnWidth;
    } else if (viewMode === "month") {
      const diffYears = date.getFullYear() - startYear;
      const totalMonthsOffset = diffYears * 12 + date.getMonth();
      const numDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      const monthFraction = (date.getDate() - 1) / numDays;
      
      return (totalMonthsOffset + monthFraction) * columnWidth;
    }
    return 0;
  };

  const getTaskPosition = (task: Task) => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return { left: 0, width: 0, visible: false };

    const left = getPositionFromDate(start);
    const endInclusive = new Date(end);
    endInclusive.setDate(endInclusive.getDate() + 1);
    const right = getPositionFromDate(endInclusive);

    return { left, width: Math.max(0, right - left), visible: true };
  };

  const getMpSchedulePosition = (mpScheduleStr?: string) => {
    if (!mpScheduleStr) return { left: 0, visible: false };
    const date = new Date(mpScheduleStr);
    if (isNaN(date.getTime())) return { left: 0, visible: false };

    return { left: getPositionFromDate(date), visible: true };
  };

  const getCurrentMarkerPos = () => {
    return getPositionFromDate(new Date());
  };

  const handleDragResize = (
    e: React.MouseEvent,
    task: Task,
    type: "start" | "end" | "move",
  ) => {
    e.stopPropagation();
    const startX = e.clientX;
    const originalStart = new Date(task.startDate);
    const originalEnd = new Date(task.endDate);

    let currentDragTask: Task = { ...task };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let daysDelta = 0;

      if (viewMode === "day") daysDelta = Math.round(deltaX / columnWidth);
      else if (viewMode === "week")
        daysDelta = Math.round(deltaX / columnWidth) * 7;
      else if (viewMode === "month")
        daysDelta = Math.round(deltaX / columnWidth) * 30;

      const newStart = new Date(originalStart);
      const newEnd = new Date(originalEnd);

      if (type === "start") {
        newStart.setDate(newStart.getDate() + daysDelta);
        if (newStart > newEnd) newStart.setDate(newEnd.getDate());
      } else if (type === "end") {
        newEnd.setDate(newEnd.getDate() + daysDelta);
        if (newEnd < newStart) newEnd.setDate(newStart.getDate());
      } else if (type === "move") {
        newStart.setDate(newStart.getDate() + daysDelta);
        newEnd.setDate(newEnd.getDate() + daysDelta);
      }

      currentDragTask = {
        ...task,
        startDate: newStart.toISOString().split("T")[0],
        endDate: newEnd.toISOString().split("T")[0],
      };
      setDragTask(currentDragTask);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      handleTaskSave(currentDragTask);
      setDragTask(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(3, Math.max(0.5, prev + delta)));
    }
  };

  const handleSidebarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingScroll.current) return;
    if (timelineRef.current && timelineRef.current.scrollTop !== e.currentTarget.scrollTop) {
      isSyncingScroll.current = true;
      timelineRef.current.scrollTop = e.currentTarget.scrollTop;
      // Allow browser to fire onScroll and then clear the lock
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    }
  };

  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    if (isSyncingScroll.current) return;
    if (sidebarRef.current && sidebarRef.current.scrollTop !== e.currentTarget.scrollTop) {
      isSyncingScroll.current = true;
      sidebarRef.current.scrollTop = e.currentTarget.scrollTop;
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    }
  };

  // --- Excel Actions ---
  const handleExportExcel = () => excelService.exportToExcel(customers);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imported = await excelService.importFromExcel(file, customers);
      setCustomers(imported);
      setShowImportMenu(false);
    }
    // Reset file input so the same file can be imported again
    if (e.target) {
      e.target.value = '';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "risk":
        return "bg-[#FF3B30]";
      case "standard":
        return "bg-[#0071E3]";
      case "done":
        return "bg-[#34C759]";
      case "waiting":
        return "bg-[#8E8E93]";
      default:
        return "bg-[#8E8E93]";
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#1C1C1E] dark:to-black">
        <div className="bg-white/80 dark:bg-[#2C2C2E]/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-[420px] border border-white/20 dark:border-white/10">
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
              <GanttChartSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">欢迎回来</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">FAE 项目进度管理系统</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">账号</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-medium"
                    placeholder="请输入账号"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">密码</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 flex items-center justify-center">
                    <span className="text-lg">●</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-medium"
                    placeholder="请输入密码"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${rememberMe ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600 bg-transparent'}`}>
                  {rememberMe && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="hidden"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">记住登录</span>
              </label>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl text-sm font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-[0.98] transition-all duration-200"
            >
              登录系统
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F5F5F7] dark:bg-black font-sans overflow-hidden text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors duration-300">
      {/* Top Bar */}
      <header className="glass-nav h-20 px-4 md:px-6 flex items-center justify-between shrink-0 shadow-sm gap-3 overflow-x-auto no-scrollbar whitespace-nowrap">
        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <button 
              onClick={() => setIsOverviewOpen(true)}
              className="p-2 md:p-2.5 bg-gradient-to-br from-[#E5E5EA] to-[#F2F2F7] rounded-xl shadow-sm border border-white/50 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
              title="查看数据概览"
            >
              <GanttChartSquare className="w-5 h-5 text-[#8E8E93]" />
            </button>
            <div className="shrink-0">
              <h1 
                className="text-base md:text-lg font-bold tracking-tight cursor-pointer hover:text-[#007AFF] transition-colors"
                onClick={() => window.location.reload()}
                title="刷新页面"
              >
                FAE 项目进度管理
              </h1>
              <p className="text-[8px] md:text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest hidden sm:block">
                Project Gantt Dashboard
              </p>
            </div>
          </div>

          <div className="hidden md:block w-px h-8 bg-black/10 dark:bg-white/10 shrink-0"></div>

          {/* Time Display - Click to Scroll To Today */}
          <button
            onClick={() => {
              scrollToToday("smooth");
            }}
            className="hidden sm:flex flex-col justify-center text-left shrink-0 cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.04] p-1.5 px-2 rounded-xl active:scale-95 transition-all duration-150 select-none group border border-transparent hover:border-black/5 dark:hover:border-white/5"
            title="点击回到今天"
          >
            <span className="text-[10px] font-medium text-[#8E8E93] dark:text-[#98989D] group-hover:text-[#007AFF] dark:group-hover:text-[#5AC8FA] transition-colors tabular-nums tracking-wider leading-none">
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月{currentDate.getDate()}日 {["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][currentDate.getDay()]}
            </span>
            <span className="text-base font-bold text-[#1D1D1F] dark:text-white group-hover:text-[#007AFF] dark:group-hover:text-[#5AC8FA] transition-colors tabular-nums tracking-widest mt-1 leading-none">
              {String(currentDate.getHours()).padStart(2, '0')}:{String(currentDate.getMinutes()).padStart(2, '0')}:{String(currentDate.getSeconds()).padStart(2, '0')}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Add Customer Button */}
          <button
            onClick={() => { setShowAddCustomerModal(true); }}
            className="flex items-center justify-center px-3 py-1.5 bg-black/5 dark:bg-white/10 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white rounded-xl hover:bg-black/10 dark:hover:bg-white/20 transition-colors border border-black/5 dark:border-white/10 shrink-0 select-none whitespace-nowrap"
            title="添加新客户"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-bold ml-1 hidden lg:inline">添加客户</span>
          </button>

          {/* Zoom Controls - Compact */}
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-1 hover:bg-white dark:hover:bg-[#1C1C1E] rounded-lg transition-all text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white shrink-0"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold w-9 text-center tabular-nums shrink-0">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              className="p-1 hover:bg-white dark:hover:bg-[#1C1C1E] rounded-lg transition-all text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Display Mode Switcher */}
          <div className="flex bg-black/5 dark:bg-white/10 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setDisplayMode("gantt")}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-all flex items-center justify-center shrink-0",
                displayMode === "gantt"
                  ? "bg-white dark:bg-[#1C1C1E] text-[#007AFF] shadow-sm"
                  : "text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white",
              )}
              title="甘特图模式"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDisplayMode("excel")}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-all flex items-center justify-center shrink-0",
                displayMode === "excel"
                  ? "bg-white dark:bg-[#1C1C1E] text-[#007AFF] shadow-sm"
                  : "text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white",
              )}
              title="Excel 表格模式"
            >
              <Table className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Mode Switcher (only show in gantt mode) */}
          {displayMode === "gantt" && (
            <div className="hidden sm:flex bg-black/5 dark:bg-white/10 p-1 rounded-xl shrink-0">
              {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0",
                    viewMode === mode
                      ? "bg-white dark:bg-[#1C1C1E] text-[#007AFF] shadow-sm"
                      : "text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white",
                  )}
                >
                  {mode === "day" ? "日" : mode === "week" ? "周" : "月"}
                </button>
              ))}
            </div>
          )}

          {/* Dark Mode Switcher */}
          <div className="flex bg-black/5 dark:bg-white/10 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setIsDarkMode(false)}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-all flex items-center justify-center shrink-0",
                !isDarkMode
                  ? "bg-white dark:bg-[#1C1C1E] text-[#007AFF] shadow-sm"
                  : "text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white",
              )}
              title="白天模式"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsDarkMode(true)}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-all flex items-center justify-center shrink-0",
                isDarkMode
                  ? "bg-white dark:bg-[#1C1C1E] text-[#007AFF] shadow-sm"
                  : "text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white",
              )}
              title="晚上模式"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setFilterRisk(!filterRisk)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0",
                  filterRisk
                    ? "bg-[#FF3B30] text-white shadow-sm"
                    : "text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white",
                )}
              >
                风险
              </button>
              {filterStatus && (
                <button
                  onClick={() => setFilterStatus(null)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-[#FF9500] text-white shadow-sm flex items-center gap-1 shrink-0"
                  title="清除状态筛选"
                >
                  {filterStatus}
                  <X className="w-3 h-3 shrink-0" />
                </button>
              )}
              {filterProductLine && (
                <button
                  onClick={() => setFilterProductLine(null)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-[#007AFF] text-white shadow-sm flex items-center gap-1 shrink-0"
                  title="清除产品线筛选"
                >
                  {filterProductLine}
                  <X className="w-3 h-3 shrink-0" />
                </button>
              )}
              {filterSales && (
                <button
                  onClick={() => setFilterSales(null)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-[#AF52DE] text-white shadow-sm flex items-center gap-1 shrink-0"
                  title="清除 Sales 筛选"
                >
                  {filterSales}
                  <X className="w-3 h-3 shrink-0" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[#8E8E93] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#1D1D1F] dark:hover:text-white rounded-xl transition-colors border border-black/5 dark:border-white/10 text-xs font-bold shrink-0 whitespace-nowrap"
                title="导入 Excel"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span>导入</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[#8E8E93] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#1D1D1F] dark:hover:text-white rounded-xl transition-colors border border-black/5 dark:border-white/10 text-xs font-bold shrink-0 whitespace-nowrap"
                title="导出 Excel"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>导出</span>
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-2 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-xl transition-colors shrink-0"
                title="清空所有数据"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-xl transition-colors shrink-0"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hidden Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportExcel}
        accept=".xlsx,.xls"
        className="hidden"
      />

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative p-0 md:p-6 gap-0 md:gap-6">
        {/* Mobile Overlay */}
        {displayMode === "gantt" && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Tree View */}
        {displayMode === "gantt" && (
        <aside
          className={cn(
            "apple-card flex flex-col shrink-0 overflow-hidden bg-white dark:bg-[#1C1C1E]",
            "fixed inset-y-0 left-0 z-50 w-[85vw] md:w-auto md:static shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out",
            !isSidebarOpen && "-translate-x-full md:translate-x-0"
          )}
          style={{ width: window.innerWidth >= 768 ? sidebarWidth : undefined }}
        >
          {/* Mobile Header for Sidebar */}
          <div className="md:hidden h-16 flex items-center justify-between px-4 border-b border-black/5 dark:border-white/5 shrink-0">
            <span className="font-bold text-lg">项目列表</span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drag Handle - Hidden on mobile */}
          <div
            className="hidden md:block absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-black/10 active:bg-black/20 transition-colors z-10"
            onMouseDown={handleSidebarMouseDown}
          />
          <div className="h-[72px] px-3 flex flex-col justify-center gap-2 border-b border-black/5 dark:border-white/5 shrink-0 bg-black/[0.015] dark:bg-white/[0.015]">
            {/* Row 1: Search Input */}
            <div className="relative w-full">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8E8E93]" />
              <input
                type="text"
                placeholder="搜索项目..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-6.5 pr-6 py-1.5 bg-black/[0.03] dark:bg-white/5 rounded-lg text-xs focus:ring-2 focus:ring-[#0071E3]/30 outline-none transition-all placeholder:text-[#8E8E93] text-[#1D1D1F] dark:text-white font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Row 2: Action Toolbar */}
            <div className="flex items-center justify-between px-0.5">
              {/* Sort Selector */}
              <div className="relative active:scale-95 transition-transform duration-150">
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value as any)}
                  className="appearance-none bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.04] rounded-md pl-1.5 pr-5 py-0.5 text-xs font-medium text-[#8E8E93] dark:text-[#98989D] outline-none cursor-pointer transition-all duration-200"
                >
                  <option value="createdAt_desc" className="bg-[#F5F5F7] dark:bg-[#1C1C1E] text-black dark:text-white">创建降序</option>
                  <option value="createdAt_asc" className="bg-[#F5F5F7] dark:bg-[#1C1C1E] text-black dark:text-white">创建升序</option>
                  <option value="updatedAt_desc" className="bg-[#F5F5F7] dark:bg-[#1C1C1E] text-black dark:text-white">修改降序</option>
                  <option value="updatedAt_asc" className="bg-[#F5F5F7] dark:bg-[#1C1C1E] text-black dark:text-white">修改升序</option>
                </select>
                <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-[#8E8E93] dark:text-[#98989D] pointer-events-none" />
              </div>

              {/* Expand / Collapse buttons without '全部' word */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExpandAll}
                  className="text-xs font-medium text-[#8E8E93] dark:text-[#98989D] bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.04] px-1.5 py-0.5 rounded-md transition-all active:scale-95 duration-150 cursor-pointer whitespace-nowrap text-center select-none"
                  title="全部展开"
                >
                  展开
                </button>
                <div className="w-[1px] h-2.5 bg-black/10 dark:bg-white/10 shrink-0" />
                <button
                  onClick={handleCollapseAll}
                  className="text-xs font-medium text-[#8E8E93] dark:text-[#98989D] bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.04] px-1.5 py-0.5 rounded-md transition-all active:scale-95 duration-150 cursor-pointer whitespace-nowrap text-center select-none"
                  title="全部收起"
                >
                  收起
                </button>
              </div>
            </div>
          </div>

          <div
            className="flex-1 overflow-auto relative no-scrollbar"
            ref={sidebarRef}
            onScroll={handleSidebarScroll}
          >
            <div className="py-3 flex flex-col gap-1 relative" style={{ minHeight: "max-content" }}>
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="flex flex-col gap-1 relative" style={{ contentVisibility: 'auto' }}>
                {/* Customer Row */}
                <div 
                  className="group flex items-center gap-2 px-3 border-b border-transparent rounded-xl hover:bg-black/[0.03] transition-colors h-14 shrink-0 cursor-pointer select-none"
                  onClick={() => toggleExpand(customer.id)}
                >
                  <button
                    className="p-1 hover:bg-black/5 rounded-lg transition-colors shrink-0"
                  >
                    {isItemExpanded(customer.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden pointer-events-none">
                    <div className="flex flex-col overflow-hidden gap-0.5">
                      <div 
                        className="relative flex items-center gap-1.5 pointer-events-auto"
                        onMouseEnter={() => handleNameMouseEnter(`cust_zh_${customer.id}`)}
                        onMouseLeave={() => handleNameMouseLeave(`cust_zh_${customer.id}`)}
                      >
                        <span
                          className="text-base font-bold truncate text-[#1D1D1F] dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 rounded px-1 -ml-1 transition-colors"
                          onClick={(e) => {
                            if (longHoverId === `cust_zh_${customer.id}`) {
                              e.stopPropagation();
                              handleQuickCopy(customer.nameZh || "", "客户中文名称");
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setActiveEditCustomer(customer);
                            setShowEditCustomerModal(true);
                          }}
                          title={longHoverId === `cust_zh_${customer.id}` ? "单击复制" : "双击查看详情"}
                        >
                          {renderHighlight(customer.nameZh, searchQuery)}
                        </span>
                        {longHoverId === `cust_zh_${customer.id}` && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickCopy(customer.nameZh || "", "客户中文名称");
                            }}
                            className="px-1.5 py-0.5 text-[9px] bg-[#0071E3] text-white rounded-md font-medium shadow-sm cursor-pointer whitespace-nowrap"
                          >
                            📋 单击复制
                          </motion.span>
                        )}
                      </div>

                      <div 
                        className="relative flex items-center gap-1.5 pointer-events-auto"
                        onMouseEnter={() => handleNameMouseEnter(`cust_en_${customer.id}`)}
                        onMouseLeave={() => handleNameMouseLeave(`cust_en_${customer.id}`)}
                      >
                        <span
                          className="text-xs text-[#8E8E93] truncate cursor-pointer hover:bg-black/5 rounded px-1 -ml-1 transition-colors"
                          onClick={(e) => {
                            if (longHoverId === `cust_en_${customer.id}`) {
                              e.stopPropagation();
                              handleQuickCopy(customer.nameEn || "", "客户英文名称");
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setActiveEditCustomer(customer);
                            setShowEditCustomerModal(true);
                          }}
                          title={longHoverId === `cust_en_${customer.id}` ? "单击复制" : "双击查看详情"}
                        >
                          {renderHighlight(customer.nameEn, searchQuery)}
                        </span>
                        {longHoverId === `cust_en_${customer.id}` && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickCopy(customer.nameEn || "", "客户英文名称");
                            }}
                            className="px-1.5 py-0.5 text-[9px] bg-[#0071E3] text-white rounded-md font-medium shadow-sm cursor-pointer whitespace-nowrap"
                          >
                            📋 单击复制
                          </motion.span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <div 
                        className="relative flex items-center gap-1.5 pointer-events-auto"
                        onMouseEnter={() => handleNameMouseEnter(`cust_code_${customer.id}`)}
                        onMouseLeave={() => handleNameMouseLeave(`cust_code_${customer.id}`)}
                      >
                        <span
                          className="text-[10px] bg-black/5 px-1.5 py-0.5 rounded text-[#8E8E93] font-mono cursor-pointer hover:bg-black/10 transition-colors"
                          onClick={(e) => {
                            if (longHoverId === `cust_code_${customer.id}`) {
                              e.stopPropagation();
                              handleCopyCode(customer.customerCode || "", customer.id);
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setActiveEditCustomer(customer);
                            setShowEditCustomerModal(true);
                          }}
                          title={longHoverId === `cust_code_${customer.id}` ? "单击复制" : "双击查看详情"}
                        >
                          {copiedId === customer.id ? "已复制!" : (customer.customerCode || "Code")}
                        </span>
                        {longHoverId === `cust_code_${customer.id}` && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCode(customer.customerCode || "", customer.id);
                            }}
                            className="px-1.5 py-0.5 text-[9px] bg-[#0071E3] text-white rounded-md font-medium shadow-sm cursor-pointer whitespace-nowrap"
                          >
                            📋 单击复制
                          </motion.span>
                        )}
                      </div>

                      <div 
                        className="relative flex items-center gap-1.5 pointer-events-auto"
                        onMouseEnter={() => handleNameMouseEnter(`cust_sales_${customer.id}`)}
                        onMouseLeave={() => handleNameMouseLeave(`cust_sales_${customer.id}`)}
                      >
                        <span
                          className="text-[10px] text-[#8E8E93] cursor-pointer hover:bg-black/5 rounded px-1 -mr-1 transition-colors"
                          onClick={(e) => {
                            if (longHoverId === `cust_sales_${customer.id}`) {
                              e.stopPropagation();
                              handleQuickCopy(customer.salesEn || "", "销售人员");
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setActiveEditCustomer(customer);
                            setShowEditCustomerModal(true);
                          }}
                        >
                          {customer.salesEn || "Sales"}
                        </span>
                        {longHoverId === `cust_sales_${customer.id}` && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickCopy(customer.salesEn || "", "销售人员");
                            }}
                            className="px-1.5 py-0.5 text-[9px] bg-[#0071E3] text-white rounded-md font-medium shadow-sm cursor-pointer whitespace-nowrap"
                          >
                            📋 单击复制
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div 
                    className="opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 flex items-center gap-1 shrink-0 z-10"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addProject(customer.id);
                      }}
                      className="p-1.5 text-[#8E8E93] hover:text-[#007AFF] dark:hover:text-[#0A84FF] hover:bg-[#007AFF]/5 dark:hover:bg-[#0A84FF]/10 rounded-lg transition-colors"
                      title="添加项目"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCustomer(customer.id);
                      }}
                      className="p-1.5 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/5 rounded-lg"
                      title="删除客户"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Projects */}
                {isItemExpanded(customer.id) && (
                  <div className="ml-6 flex flex-col gap-1">
                    {(customer.projects || []).map((project) => (
                      <div key={project.id} className="flex flex-col gap-1">
                        <div 
                          className="group flex items-center gap-2 px-3 border-b border-transparent rounded-xl hover:bg-black/[0.03] transition-colors h-10 shrink-0 cursor-pointer transform-gpu select-none"
                          onClick={() => toggleExpand(project.id, (project.pns || []).map(pn => pn.id))}
                        >
                          <button
                            className="p-1 hover:bg-black/5 rounded-lg transition-colors shrink-0"
                          >
                            {isItemExpanded(project.id) ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <div className="flex-1 flex items-center overflow-hidden pointer-events-none">
                            <div 
                              className="relative flex items-center gap-1.5 pointer-events-auto"
                              onMouseEnter={() => handleNameMouseEnter(`proj_${project.id}`)}
                              onMouseLeave={() => handleNameMouseLeave(`proj_${project.id}`)}
                            >
                              <span
                                className="text-sm font-semibold text-[#424245] dark:text-[#E5E5EA] truncate cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 rounded px-1 -ml-1 transition-colors"
                                onClick={(e) => {
                                  if (longHoverId === `proj_${project.id}`) {
                                    e.stopPropagation();
                                    handleQuickCopy(project.name || "", "项目名称");
                                  }
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setActiveEditProject({ customer, project });
                                  setShowEditProjectModal(true);
                                }}
                                title={longHoverId === `proj_${project.id}` ? "单击复制" : "双击查看及编辑"}
                              >
                                {renderHighlight(project.name, searchQuery)}
                              </span>
                              {longHoverId === `proj_${project.id}` && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickCopy(project.name || "", "项目名称");
                                  }}
                                  className="px-1.5 py-0.5 text-[9px] bg-[#0071E3] text-white rounded-md font-medium shadow-sm cursor-pointer whitespace-nowrap"
                                >
                                  📋 单击复制
                                </motion.span>
                              )}
                            </div>
                          </div>
                          <div 
                            className="opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 flex items-center gap-1 shrink-0 z-10"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addPN(customer.id, project.id);
                              }}
                              className="p-1.5 text-[#8E8E93] hover:text-[#0071E3] dark:hover:text-[#0A84FF] hover:bg-[#0071E3]/5 dark:hover:bg-[#0A84FF]/10 rounded-lg"
                              title="添加料号PN"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteProject(customer.id, project.id);
                              }}
                              className="p-1.5 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/5 rounded-lg"
                              title="删除项目"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* PNs */}
                        {isItemExpanded(project.id) && (
                          <div className="ml-6 flex flex-col gap-1 overflow-hidden">
                            {(project.pns || []).map((pn) => (
                              <div key={pn.id} className="flex flex-col gap-1">
                                <div 
                                  className="group flex items-center gap-2 px-3 border-b border-transparent rounded-xl hover:bg-black/[0.03] transition-colors h-9 shrink-0 cursor-pointer transform-gpu select-none"
                                  onClick={() => toggleExpand(pn.id)}
                                >
                                  <button
                                    className="p-1 hover:bg-black/5 rounded-lg transition-colors shrink-0"
                                  >
                                    {isItemExpanded(pn.id) ? (
                                      <ChevronDown className="w-3 h-3" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3" />
                                    )}
                                  </button>

                                  <div className="flex-1 flex items-center gap-2 overflow-hidden pointer-events-none">
                                    {/* Product Line with Warning if channel is No */}
                                    {pn.channelOk === "No" && (
                                      <span className="flex items-center justify-center text-[#FF3B30] shrink-0 pointer-events-auto" title="渠道不在">
                                        <AlertCircle className="w-4 h-4 text-[#FF3B30] animate-pulse" />
                                      </span>
                                    )}
                                    <div 
                                      className="relative flex items-center gap-1.5 pointer-events-auto shrink-0"
                                      onMouseEnter={() => handleNameMouseEnter(`pn_pl_${pn.id}`)}
                                      onMouseLeave={() => handleNameMouseLeave(`pn_pl_${pn.id}`)}
                                    >
                                      <span
                                        className={cn(
                                          "text-xs px-2 py-0.5 rounded font-medium cursor-pointer hover:opacity-80 transition-opacity",
                                          getBadgeColor(pn.productLine || "")
                                        )}
                                        onClick={(e) => {
                                          if (longHoverId === `pn_pl_${pn.id}`) {
                                            e.stopPropagation();
                                            handleQuickCopy(pn.productLine || "", "产品线");
                                          }
                                        }}
                                        onDoubleClick={(e) => {
                                          e.stopPropagation();
                                          setEditPNModalData({ customerId: customer.id, projectId: project.id, pn });
                                        }}
                                        title={longHoverId === `pn_pl_${pn.id}` ? "单击复制" : "双击查看详情"}
                                      >
                                        {renderHighlight(pn.productLine || "PL", searchQuery)}
                                      </span>
                                      {longHoverId === `pn_pl_${pn.id}` && (
                                        <motion.span
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.8 }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickCopy(pn.productLine || "", "产品线");
                                          }}
                                          className="px-1.5 py-0.5 text-[9px] bg-[#0071E3] text-white rounded-md font-medium shadow-sm cursor-pointer whitespace-nowrap"
                                        >
                                          📋 单击复制
                                        </motion.span>
                                      )}
                                    </div>

                                    {/* PN Name */}
                                    <div className="flex-1 flex items-center overflow-hidden">
                                      <div 
                                        className="relative flex items-center gap-1.5 pointer-events-auto"
                                        onMouseEnter={() => handleNameMouseEnter(`pn_name_${pn.id}`)}
                                        onMouseLeave={() => handleNameMouseLeave(`pn_name_${pn.id}`)}
                                      >
                                        <span
                                          className="text-xs font-bold text-[#8E8E93] truncate cursor-pointer hover:bg-black/5 rounded px-1 -ml-1 transition-colors"
                                          onClick={(e) => {
                                            if (longHoverId === `pn_name_${pn.id}`) {
                                              e.stopPropagation();
                                              handleQuickCopy(pn.name || "", "料号(PN)名称");
                                            }
                                          }}
                                          onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            setEditPNModalData({ customerId: customer.id, projectId: project.id, pn });
                                          }}
                                          title={longHoverId === `pn_name_${pn.id}` ? "单击复制" : "双击查看详情"}
                                        >
                                          {renderHighlight(pn.name, searchQuery)}
                                        </span>
                                        {longHoverId === `pn_name_${pn.id}` && (
                                          <motion.span
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleQuickCopy(pn.name || "", "料号(PN)名称");
                                            }}
                                            className="px-1.5 py-0.5 text-[9px] bg-[#0071E3] text-white rounded-md font-medium shadow-sm cursor-pointer whitespace-nowrap"
                                          >
                                            📋 单击复制
                                          </motion.span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Status */}
                                    {editingId === `${pn.id}_status` ? (
                                      <select
                                        autoFocus
                                        defaultValue={pn.status}
                                        onChange={(e) =>
                                          updatePNField(
                                            pn.id,
                                            "status",
                                            e.target.value,
                                          )
                                        }
                                        onBlur={() => setEditingId(null)}
                                        className="w-14 bg-white dark:bg-[#1C1C1E] border border-[#007AFF] rounded px-0 py-0 text-[9px] outline-none text-[#1D1D1F] dark:text-white pointer-events-auto"
                                      >
                                        {[
                                          "Leads",
                                          "NBO",
                                          "DIN",
                                          "DFIN",
                                          "DWIN",
                                        ].map((s) => (
                                          <option key={s} value={s} className="dark:bg-[#1C1C1E]">
                                            {s}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span
                                        className={cn(
                                          "text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 cursor-pointer hover:opacity-80 transition-opacity pointer-events-auto",
                                          pn.status === "DWIN"
                                            ? "bg-[#34C759]/10 text-[#34C759]"
                                            : pn.status === "DLOST"
                                              ? "bg-[#FF3B30]/10 text-[#FF3B30]"
                                              : "bg-[#007AFF]/10 text-[#007AFF]",
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingId(`${pn.id}_status`);
                                        }}
                                      >
                                        {pn.status || "NBO"}
                                      </span>
                                    )}
                                  </div>

                                  <div 
                                    className="opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 flex items-center gap-1 shrink-0 z-10"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addTask(customer.id, project.id, pn.id);
                                      }}
                                      className="p-1.5 text-[#8E8E93] hover:text-[#007AFF] dark:hover:text-[#0A84FF] hover:bg-[#007AFF]/5 dark:hover:bg-[#0A84FF]/10 rounded-lg"
                                      title="添加任务"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deletePN(customer.id, project.id, pn.id);
                                      }}
                                      className="p-1.5 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/5 rounded-lg"
                                      title="删除PN"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Tasks List */}
                                {isItemExpanded(pn.id) && (
                                  <div className="ml-0 flex flex-col gap-1">
                                    {(pn.tasks || []).map((task) => (
                                      <div
                                        key={task.id}
                                        className="group flex items-center gap-2.5 pl-9 pr-3 border-b border-transparent rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors cursor-pointer h-8 shrink-0 select-none"
                                        onClick={() => {
                                          setSelectedTaskContext({
                                            task,
                                            customerId: customer.id,
                                            projectId: project.id,
                                            pnId: pn.id,
                                          });
                                          setIsModalOpen(true);
                                        }}
                                      >
                                        <div
                                          className={cn(
                                            "w-1.5 h-1.5 rounded-full shrink-0",
                                            getStatusColor(task.status),
                                          )}
                                        />
                                        <span className="flex-1 text-xs font-semibold text-[#8E8E93] dark:text-gray-400 truncate">
                                          {renderHighlight(task.name, searchQuery)}
                                        </span>
                                        <div 
                                          className="opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 flex items-center gap-1 z-10"
                                        >
                                          <User className="w-3 h-3 text-[#8E8E93]" />
                                          <span className="text-[10px] font-bold text-[#8E8E93]">
                                            {renderHighlight(task.owner, searchQuery)}
                                          </span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteTask(
                                                customer.id,
                                                project.id,
                                                pn.id,
                                                task.id,
                                              );
                                            }}
                                            className="p-1 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/5 rounded ml-1"
                                            title="删除任务"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        </aside>
        )}

        {/* Gantt Timeline */}
        {displayMode === "gantt" && (
        <div className="flex-1 apple-card flex flex-col overflow-hidden">
          {/* Timeline Header */}
          <div className="h-[72px] border-b border-black/5 dark:border-white/5 flex shrink-0 bg-white/50 dark:bg-[#1C1C1E]/50 backdrop-blur-md z-20 overflow-hidden" ref={headerRef}>
            <div
              className="flex relative"
              style={{ width: timelineHeaders.length * columnWidth }}
            >
              {timelineHeaders.map((header, i) => {
                let isWeekend = false;
                if (viewMode === "day" && header.date) {
                  const day = header.date.getDay();
                  isWeekend = day === 0 || day === 6;
                }
                return (
                  <div
                    key={i}
                    className={cn(
                      "border-r border-black/5 dark:border-white/5 flex flex-col items-center justify-center shrink-0 h-full transition-colors",
                      isWeekend && "bg-black/[0.015] dark:bg-white/[0.01]"
                    )}
                    style={{ width: columnWidth }}
                  >
                    <span className={cn(
                      "text-[10px] font-bold transition-colors",
                      isWeekend ? "text-[#FF3B30] dark:text-[#FF453A]" : "text-[#8E8E93] dark:text-[#98989D]"
                    )}>
                      {header.label}
                    </span>
                    {viewMode === "day" && header.date && (
                      <span className={cn(
                        "text-[8px] font-semibold mt-0.5",
                        isWeekend ? "text-[#FF3B30]/70 dark:text-[#FF453A]/70" : "text-[#8E8E93]/60 dark:text-[#98989D]/60"
                      )}>
                        {["日", "一", "二", "三", "四", "五", "六"][header.date.getDay()]}
                      </span>
                    )}
                  </div>
                );
              })}
              {/* Current Marker Header */}
              <div
                className="absolute top-0 bottom-0 w-px bg-[#FF3B30] z-30 flex flex-col items-center"
                style={{ left: getCurrentMarkerPos() }}
              >
                <div className="bg-[#FF3B30] text-white text-[9px] px-2 py-0.5 rounded-b-lg whitespace-nowrap font-bold shadow-md shadow-red-500/20">
                  今天
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Body */}
          <div
            className="flex-1 overflow-auto relative no-scrollbar"
            ref={timelineRef}
            onWheel={handleWheel}
            onScroll={handleTimelineScroll}
          >
            <div
              style={{
                width: timelineHeaders.length * columnWidth,
                minHeight: "max-content",
              }}
              className="py-3 flex flex-col gap-1 relative"
            >
              {/* Column Background Grid */}
              <div className="absolute inset-y-0 left-0 flex pointer-events-none z-0">
                {timelineHeaders.map((header, i) => {
                  let isWeekend = false;
                  if (viewMode === "day" && header.date) {
                    const day = header.date.getDay();
                    isWeekend = day === 0 || day === 6;
                  }
                  return (
                    <div
                      key={i}
                      className={cn(
                        "h-full border-r border-black/[0.03] dark:border-white/[0.03] shrink-0 transition-colors",
                        isWeekend && "bg-black/[0.012] dark:bg-white/[0.008]"
                      )}
                      style={{ width: columnWidth }}
                    />
                  );
                })}
              </div>

              {/* Today Column Stripe Guide / Current Marker Vertical Line */}
              <div
                className="absolute top-0 bottom-0 bg-[#FF3B30]/3 dark:bg-[#FF3B30]/5 border-x border-[#FF3B30]/15 pointer-events-none z-0 shadow-[inset_0_0_8px_rgba(255,59,48,0.02)]"
                style={{ left: getCurrentMarkerPos(), width: columnWidth }}
              />

              {/* Rows */}
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="flex flex-col gap-1 z-10" style={{ contentVisibility: 'auto' }}>
                  {/* Customer Row Spacer */}
                  <div 
                    className={cn(
                      "h-14 border-b border-black/[0.02] dark:border-white/[0.01] shrink-0 transition-all duration-150 relative hover:bg-black/[0.025] dark:hover:bg-white/[0.03]",
                    )}
                  />

                  {isItemExpanded(customer.id) && (
                    <div className="flex flex-col gap-1">
                      {(customer.projects || []).map((project) => (
                        <div key={project.id} className="flex flex-col gap-1">
                          {/* Project Row Spacer with Milestone Diamond */}
                          <div 
                            className={cn(
                              "h-10 border-b border-black/[0.02] dark:border-white/[0.01] shrink-0 relative transition-all duration-150 hover:bg-black/[0.025] dark:hover:bg-white/[0.03]",
                            )}
                          >
                            {(() => {
                              const mpPos = getMpSchedulePosition(project.mpSchedule);
                              if (mpPos.visible) {
                                return (
                                  <div 
                                    className="absolute top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5"
                                    style={{ left: mpPos.left }}
                                  >
                                    <div className="relative flex items-center justify-center">
                                      <div className="w-3.5 h-3.5 bg-[#FF9500] rotate-45 border border-white dark:border-[#1C1C1E] shadow-sm shrink-0" />
                                      <div className="absolute w-3.5 h-3.5 bg-[#FF9500] rotate-45 border border-white dark:border-[#1C1C1E] animate-ping opacity-30 shrink-0" />
                                    </div>
                                    <span className="text-[9px] font-bold text-[#FF9500] bg-[#FF9500]/10 dark:bg-[#FF9500]/20 px-2 py-0.5 rounded-full border border-[#FF9500]/20 whitespace-nowrap shadow-sm shadow-[#FF9500]/5">
                                      量产 (MP): {project.mpSchedule}
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          {isItemExpanded(project.id) && (
                            <div className="flex flex-col gap-1">
                              {(project.pns || []).map((pn) => (
                                <div
                                  key={pn.id}
                                  className="flex flex-col gap-1"
                                >
                                  {/* PN Row Spacer */}
                                  <div 
                                    className={cn(
                                      "h-9 border-b border-black/[0.02] dark:border-white/[0.01] shrink-0 transition-all duration-150 relative hover:bg-black/[0.025] dark:hover:bg-white/[0.03]",
                                    )}
                                  />

                                  {isItemExpanded(pn.id) && (
                                    <div className="flex flex-col gap-1">
                                      {(pn.tasks || []).map((task) => {
                                        const currentTask = dragTask && dragTask.id === task.id ? dragTask : task;
                                        const pos = getTaskPosition(currentTask);
                                        return (
                                          <div
                                            key={task.id}
                                            className={cn(
                                              "h-8 border-b border-black/[0.03] dark:border-white/[0.02] relative group shrink-0 transition-all duration-150 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
                                            )}
                                          >
                                            {/* Task Bar */}
                                            {pos.visible && (
                                              <motion.div
                                                layoutId={task.id}
                                                className={cn(
                                                  "absolute top-1.5 bottom-1.5 rounded-full shadow-sm cursor-pointer flex items-center px-3 task-bar-transition hover:shadow-lg hover:brightness-105 active:scale-[0.99] z-10",
                                                  getStatusColor(currentTask.status),
                                                  currentTask.status === "waiting"
                                                    ? "text-[#1D1D1F] dark:text-white"
                                                    : "text-white",
                                                )}
                                                style={{
                                                  left: pos.left,
                                                  width: pos.width,
                                                }}
                                                onMouseDown={(e) =>
                                                  handleDragResize(
                                                    e,
                                                    task,
                                                    "move",
                                                  )
                                                }
                                                onClick={() => {
                                                  setSelectedTaskContext({
                                                    task: currentTask,
                                                    customerId: customer.id,
                                                    projectId: project.id,
                                                    pnId: pn.id,
                                                  });
                                                  setIsModalOpen(true);
                                                }}
                                              >
                                                {/* Tooltip on Hover */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#1D1D1F]/95 dark:bg-[#2C2C2E]/95 backdrop-blur-md text-white text-[10px] py-1 px-2.5 rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-30 pointer-events-none transition-all duration-150 animate-in fade-in-0 zoom-in-95">
                                                  <div className="font-bold flex items-center gap-1.5 p-0.5">
                                                    <Calendar className="w-3 h-3 text-[#007AFF]" />
                                                    <span>{currentTask.startDate}</span>
                                                    <span className="text-gray-400 font-normal">至</span>
                                                    <span>{currentTask.endDate}</span>
                                                    <span className="bg-[#007AFF]/20 text-[#007AFF] px-1.5 py-0.5 rounded-md ml-1 font-mono">
                                                      {getDaysBetween(currentTask.startDate, currentTask.endDate)}天
                                                    </span>
                                                  </div>
                                                </div>

                                                {/* Resize Handles */}
                                                <div
                                                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-l-full animate-pulse"
                                                  onMouseDown={(e) =>
                                                    handleDragResize(
                                                      e,
                                                      task,
                                                      "start",
                                                    )
                                                  }
                                                />
                                                <div
                                                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r-full animate-pulse"
                                                  onMouseDown={(e) =>
                                                    handleDragResize(
                                                      e,
                                                      task,
                                                      "end",
                                                    )
                                                  }
                                                />

                                                <div className="flex items-center gap-2 w-full pointer-events-none select-none">
                                                  {currentTask.status === "risk" && (
                                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                                                  )}
                                                  {currentTask.status === "done" && (
                                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                  )}
                                                  <span className="text-xs font-bold truncate flex-1">
                                                    {currentTask.name}
                                                  </span>
                                                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/10 rounded-full text-[9px] font-bold shrink-0">
                                                    <User className="w-2.5 h-2.5" />
                                                    {currentTask.owner}
                                                  </div>
                                                </div>
                                              </motion.div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Current Marker Vertical Line */}
              <div
                className="absolute top-0 bottom-0 w-px bg-[#FF3B30]/20 pointer-events-none z-0"
                style={{ left: getCurrentMarkerPos() }}
              />
            </div>
          </div>
        </div>
        )}

        {displayMode === "excel" && (
           <ExcelView
             customers={customers}
             onEditCustomer={(customer) => {
               setActiveEditCustomer(customer);
               setShowEditCustomerModal(true);
             }}
             onDeleteCustomer={deleteCustomer}
             onAddProject={addProject}
             onEditProject={(customer, project) => {
               setActiveEditProject({ customer, project });
               setShowEditProjectModal(true);
             }}
             onDeleteProject={deleteProject}
             onAddPN={addPN}
             onAddFullRow={addFullRow}
             onEditPN={(customerId, projectId, pn) => {
               setEditPNModalData({ customerId, projectId, pn });
             }}
             onDeletePN={deletePN}
             onAddTask={addTask}
             onEditTask={(customerId, projectId, pnId, task) => {
               setSelectedTaskContext({ task, customerId, projectId, pnId });
               setIsModalOpen(true);
             }}
             onDeleteTask={deleteTask}
             onUpdateCustomer={(updatedCustomer) => {
               setCustomers((prev) => 
                 prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
               );
             }}
           />
        )}
      </main>

      {/* Modals */}
      {showAddCustomerModal && (
        <AddCustomerModal
          customers={customers}
          onClose={() => setShowAddCustomerModal(false)}
          onSave={handleSaveCustomer}
        />
      )}

      {showEditCustomerModal && activeEditCustomer && (
        <EditCustomerModal
          customers={customers}
          customer={activeEditCustomer}
          onClose={() => {
            setShowEditCustomerModal(false);
            setActiveEditCustomer(null);
          }}
          onSave={handleSaveEditCustomer}
        />
      )}

      {showAddProjectModal && (
        <AddProjectModal
          customers={customers}
          onClose={() => {
            setShowAddProjectModal(false);
            setSelectedCustomerForProject(null);
          }}
          onSave={(data) => {
            handleSaveProject(data);
            setSelectedCustomerForProject(null);
          }}
          initialCustomer={selectedCustomerForProject || undefined}
        />
      )}

      {showEditProjectModal && activeEditProject && (
        <EditProjectModal
          customers={customers}
          customer={activeEditProject.customer}
          project={activeEditProject.project}
          onClose={() => {
            setShowEditProjectModal(false);
            setActiveEditProject(null);
          }}
          onSave={handleSaveEditProject}
        />
      )}

      {addPNModalData && (
        <AddPNModal
          customers={customers}
          onClose={() => setAddPNModalData(null)}
          onSave={handleAddPNSubmit}
        />
      )}

      {editPNModalData && (() => {
        const currentCustomer = customers.find(c => c.id === editPNModalData.customerId);
        const currentProject = currentCustomer?.projects.find(p => p.id === editPNModalData.projectId);
        if (!currentCustomer || !currentProject) return null;
        return (
          <EditPNModal
            customers={customers}
            customer={currentCustomer}
            project={currentProject}
            pn={editPNModalData.pn}
            onClose={() => setEditPNModalData(null)}
            onSave={handleEditPNSubmit}
          />
        );
      })()}

      {/* Task Detail Modal */}
      {selectedTaskContext && (
        <TaskModal
          task={selectedTaskContext.task}
          isNew={selectedTaskContext.isNew}
          projectMpSchedule={
            customers
              .find((c) => c.id === selectedTaskContext.customerId)
              ?.projects.find((p) => p.id === selectedTaskContext.projectId)
              ?.mpSchedule
          }
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTaskContext(null);
          }}
          onSave={handleTaskSave}
          onDelete={() => {
            deleteTask(
              selectedTaskContext.customerId,
              selectedTaskContext.projectId,
              selectedTaskContext.pnId,
              selectedTaskContext.task.id,
            );
            setIsModalOpen(false);
            setSelectedTaskContext(null);
          }}
        />
      )}

      {/* Clear All Confirm Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-xl p-6 w-[320px] flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 text-[#FF3B30]">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">清空所有数据</h3>
              </div>
              <p className="text-sm text-[#424245] dark:text-[#98989D]">确定要删除所有客户和项目数据吗？此操作无法撤销。</p>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-[#424245] dark:text-[#98989D] hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setCustomers([]);
                    setShowClearConfirm(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#FF3B30] hover:bg-[#FF3B30]/90 rounded-lg transition-colors"
                >
                  确定删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-50">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="pointer-events-auto bg-[#1D1D1F]/90 dark:bg-[#2C2C2E]/90 backdrop-blur-md text-white text-xs px-4 py-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex items-center gap-2.5 font-semibold border border-white/10"
            >
              <CheckCircle2 className="w-4 h-4 text-[#30D158]" />
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <OverviewModal
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        customers={customers}
        onFilterStatus={(status) => {
          setFilterStatus(status);
          setFilterProductLine(null);
          setFilterSales(null);
          setIsOverviewOpen(false);
          // Expand all items that match the filter
          const newExpanded = new Set<string>();
          (customers || []).forEach(c => {
            let hasMatchingPn = false;
            (c.projects || []).forEach(p => {
              const matchingPns = (p.pns || []).filter(pn => (pn.status || "").trim().toUpperCase() === status);
              if (matchingPns.length > 0) {
                hasMatchingPn = true;
                newExpanded.add(p.id);
                matchingPns.forEach(pn => newExpanded.add(pn.id));
              }
            });
            if (hasMatchingPn) {
              newExpanded.add(c.id);
            }
          });
          setExpandedItems(newExpanded);
        }}
        onFilterProductLine={(pl) => {
          setFilterProductLine(pl);
          setFilterStatus(null);
          setFilterSales(null);
          setIsOverviewOpen(false);
          // Expand all items that match the filter
          const newExpanded = new Set<string>();
          (customers || []).forEach(c => {
            let hasMatchingPn = false;
            (c.projects || []).forEach(p => {
              const matchingPns = (p.pns || []).filter(pn => (pn.productLine || "").trim() === pl);
              if (matchingPns.length > 0) {
                hasMatchingPn = true;
                newExpanded.add(p.id);
                matchingPns.forEach(pn => newExpanded.add(pn.id));
              }
            });
            if (hasMatchingPn) {
              newExpanded.add(c.id);
            }
          });
          setExpandedItems(newExpanded);
        }}
        onFilterSales={(sales) => {
          setFilterSales(sales);
          setFilterStatus(null);
          setFilterProductLine(null);
          setIsOverviewOpen(false);
          // Expand all items that match the filter
          const newExpanded = new Set<string>();
          (customers || []).forEach(c => {
            const cSales = (c.salesEn || c.salesCn || "Unassigned").trim();
            if (cSales === sales) {
              newExpanded.add(c.id);
              (c.projects || []).forEach(p => {
                newExpanded.add(p.id);
                (p.pns || []).forEach(pn => newExpanded.add(pn.id));
              });
            }
          });
          setExpandedItems(newExpanded);
        }}
      />
    </div>
  );
}
