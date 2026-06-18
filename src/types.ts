export type TaskStatus = "risk" | "standard" | "done" | "waiting";
export type ViewMode = "day" | "week" | "month";

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  owner: string;
  blocker?: string;
  mpDate?: string;
  createdAt?: number;
  updatedAt?: number;
}

export type PNStatus = "Leads" | "NBO" | "DIN" | "DFIN" | "DWIN" | "DLOST";

export interface PN {
  id: string;
  name: string;
  productLine?: string;
  status?: PNStatus;
  drStatus?: string;
  socketCreateDate?: string;
  socketTotalLtrAmt?: string;
  tasks: Task[];
  channelOk?: "Yes" | "No";
  remark?: string;
  marketSegment?: string;
  rawData?: any;
  createdAt?: number;
  updatedAt?: number;
}

export interface Project {
  id: string;
  name: string;
  mpSchedule?: string;
  pns: PN[];
  createdAt?: number;
  updatedAt?: number;
}

export interface Customer {
  id: string;
  nameZh: string;
  nameEn: string;
  customerCode?: string;
  salesEn?: string;
  salesCn?: string;
  customerRd?: string;
  projects: Project[];
  createdAt?: number;
  updatedAt?: number;
}
