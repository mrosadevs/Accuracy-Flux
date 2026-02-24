// Type definitions only — all sample data removed.
// Real data comes from Supabase via the hooks in /lib/hooks/.

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'onboarding';
  avatar?: string;
  type: 'individual' | 'business';
  assignedTo: string;
  lastActivity: string;
  totalBilled: number;
  outstandingBalance: number;
  tags: string[];
}

export interface WorkItem {
  id: string;
  title: string;
  client: string;
  clientId: string;
  type: 'tax-return' | 'bookkeeping' | 'payroll' | 'advisory' | 'audit' | 'onboarding';
  status: 'not-started' | 'in-progress' | 'waiting-on-client' | 'in-review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  assigneeAvatar?: string;
  dueDate: string;
  startDate: string;
  progress: number;
  budget: number;
  timeSpent: number;
  tasks: Task[];
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  items: KanbanCard[];
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  client?: string;
  assignee?: string;
  assigneeAvatar?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  tags: string[];
  progress?: number;
  subtasks?: { total: number; completed: number };
  comments?: number;
  attachments?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  initials: string;
  color: string;
}

// Empty exports — retained for import compatibility
export const teamMembers: TeamMember[] = [];
export const clients: Client[] = [];
export const workItems: WorkItem[] = [];
export const kanbanColumns: KanbanColumn[] = [];
export const emails: unknown[] = [];
export const dashboardStats = {
  activeClients: 0,
  totalClients: 0,
  workInProgress: 0,
  completedThisMonth: 0,
  revenue: 0,
  revenueGrowth: 0,
  outstanding: 0,
  hoursTracked: 0,
  utilizationRate: 0,
  avgResponseTime: '—',
  tasksCompleted: 0,
  tasksDue: 0,
};
export const revenueData: { month: string; revenue: number; target: number }[] = [];
export const workloadData: { name: string; tasks: number; hours: number; capacity: number }[] = [];
export const activityFeed: {
  id: string; user: string; action: string; target: string;
  project: string; time: string; type: 'task' | 'work' | 'document' | 'email';
}[] = [];
