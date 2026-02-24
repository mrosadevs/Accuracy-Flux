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

export interface EmailItem {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  hasAttachment: boolean;
  client?: string;
  labels: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  initials: string;
  color: string;
}

export const teamMembers: TeamMember[] = [
  { id: '1', name: 'Sarah Chen', role: 'Senior Accountant', avatar: '', initials: 'SC', color: '#3b82f6' },
  { id: '2', name: 'Marcus Rivera', role: 'Tax Specialist', avatar: '', initials: 'MR', color: '#8b5cf6' },
  { id: '3', name: 'Emily Watson', role: 'Bookkeeper', avatar: '', initials: 'EW', color: '#ec4899' },
  { id: '4', name: 'David Park', role: 'CPA Manager', avatar: '', initials: 'DP', color: '#10b981' },
  { id: '5', name: 'Lisa Thompson', role: 'Admin', avatar: '', initials: 'LT', color: '#f59e0b' },
];

export const clients: Client[] = [
  { id: '1', name: 'Robert Johnson', company: 'Johnson & Associates LLC', email: 'robert@johnsonllc.com', phone: '(555) 123-4567', status: 'active', type: 'business', assignedTo: 'Sarah Chen', lastActivity: '2 hours ago', totalBilled: 45200, outstandingBalance: 3500, tags: ['Tax', 'Advisory'] },
  { id: '2', name: 'Maria Garcia', company: 'Garcia Restaurants Inc', email: 'maria@garciarestaurants.com', phone: '(555) 234-5678', status: 'active', type: 'business', assignedTo: 'Marcus Rivera', lastActivity: '1 day ago', totalBilled: 28900, outstandingBalance: 0, tags: ['Bookkeeping', 'Payroll'] },
  { id: '3', name: 'James Smith', company: 'Smith Consulting', email: 'james@smithconsulting.com', phone: '(555) 345-6789', status: 'active', type: 'business', assignedTo: 'Emily Watson', lastActivity: '3 hours ago', totalBilled: 62100, outstandingBalance: 8200, tags: ['Tax', 'Bookkeeping'] },
  { id: '4', name: 'Chen Wei', company: 'Wei Technologies', email: 'chen@weitech.com', phone: '(555) 456-7890', status: 'onboarding', type: 'business', assignedTo: 'David Park', lastActivity: '5 hours ago', totalBilled: 0, outstandingBalance: 0, tags: ['Onboarding'] },
  { id: '5', name: 'Patricia Brown', company: '', email: 'patricia.brown@gmail.com', phone: '(555) 567-8901', status: 'active', type: 'individual', assignedTo: 'Sarah Chen', lastActivity: '1 week ago', totalBilled: 12400, outstandingBalance: 1200, tags: ['Tax'] },
  { id: '6', name: 'Michael Davis', company: 'Davis Properties', email: 'michael@davisproperties.com', phone: '(555) 678-9012', status: 'active', type: 'business', assignedTo: 'Marcus Rivera', lastActivity: '2 days ago', totalBilled: 38700, outstandingBalance: 4100, tags: ['Tax', 'Advisory', 'Bookkeeping'] },
  { id: '7', name: 'Sarah Miller', company: 'Miller & Daughters Bakery', email: 'sarah@millerbakery.com', phone: '(555) 789-0123', status: 'inactive', type: 'business', assignedTo: 'Emily Watson', lastActivity: '3 months ago', totalBilled: 15600, outstandingBalance: 0, tags: ['Bookkeeping'] },
  { id: '8', name: 'Ahmed Hassan', company: 'Hassan Medical Group', email: 'ahmed@hassanmedical.com', phone: '(555) 890-1234', status: 'active', type: 'business', assignedTo: 'David Park', lastActivity: '4 hours ago', totalBilled: 89300, outstandingBalance: 12500, tags: ['Tax', 'Payroll', 'Advisory'] },
];

export const workItems: WorkItem[] = [
  {
    id: 'w1', title: '2025 Annual Tax Return', client: 'Johnson & Associates LLC', clientId: '1', type: 'tax-return', status: 'in-progress', priority: 'high', assignee: 'Sarah Chen', dueDate: '2026-03-15', startDate: '2026-01-15', progress: 65, budget: 4500, timeSpent: 18.5,
    tasks: [
      { id: 't1', title: 'Gather financial documents', completed: true, assignee: 'Sarah Chen' },
      { id: 't2', title: 'Review P&L statements', completed: true, assignee: 'Sarah Chen' },
      { id: 't3', title: 'Calculate deductions', completed: true, assignee: 'Marcus Rivera' },
      { id: 't4', title: 'Prepare Form 1120', completed: false, assignee: 'Sarah Chen' },
      { id: 't5', title: 'Partner review', completed: false, assignee: 'David Park' },
      { id: 't6', title: 'Client approval', completed: false, assignee: 'Robert Johnson' },
    ]
  },
  {
    id: 'w2', title: 'Monthly Bookkeeping - February', client: 'Garcia Restaurants Inc', clientId: '2', type: 'bookkeeping', status: 'in-progress', priority: 'medium', assignee: 'Emily Watson', dueDate: '2026-03-05', startDate: '2026-02-20', progress: 30, budget: 1200, timeSpent: 4.2,
    tasks: [
      { id: 't7', title: 'Reconcile bank statements', completed: true, assignee: 'Emily Watson' },
      { id: 't8', title: 'Categorize expenses', completed: false, assignee: 'Emily Watson' },
      { id: 't9', title: 'Update accounts receivable', completed: false, assignee: 'Emily Watson' },
      { id: 't10', title: 'Generate financial reports', completed: false, assignee: 'Emily Watson' },
    ]
  },
  {
    id: 'w3', title: 'Quarterly Payroll Filing', client: 'Hassan Medical Group', clientId: '8', type: 'payroll', status: 'waiting-on-client', priority: 'urgent', assignee: 'David Park', dueDate: '2026-02-28', startDate: '2026-02-15', progress: 40, budget: 2800, timeSpent: 8.0,
    tasks: [
      { id: 't11', title: 'Collect payroll data', completed: true, assignee: 'David Park' },
      { id: 't12', title: 'Verify employee changes', completed: true, assignee: 'Lisa Thompson' },
      { id: 't13', title: 'Waiting for W-2 corrections', completed: false, assignee: 'Ahmed Hassan' },
      { id: 't14', title: 'File 941 form', completed: false, assignee: 'David Park' },
    ]
  },
  {
    id: 'w4', title: 'Client Onboarding', client: 'Wei Technologies', clientId: '4', type: 'onboarding', status: 'in-progress', priority: 'medium', assignee: 'David Park', dueDate: '2026-03-01', startDate: '2026-02-18', progress: 50, budget: 800, timeSpent: 3.0,
    tasks: [
      { id: 't15', title: 'Engagement letter signed', completed: true, assignee: 'David Park' },
      { id: 't16', title: 'Collect prior year returns', completed: true, assignee: 'Chen Wei' },
      { id: 't17', title: 'Setup in accounting system', completed: false, assignee: 'Lisa Thompson' },
      { id: 't18', title: 'Initial consultation meeting', completed: false, assignee: 'David Park' },
    ]
  },
  {
    id: 'w5', title: 'Advisory - Tax Planning Session', client: 'Davis Properties', clientId: '6', type: 'advisory', status: 'not-started', priority: 'low', assignee: 'Marcus Rivera', dueDate: '2026-03-20', startDate: '2026-03-10', progress: 0, budget: 3200, timeSpent: 0,
    tasks: [
      { id: 't19', title: 'Review current tax structure', completed: false, assignee: 'Marcus Rivera' },
      { id: 't20', title: 'Prepare analysis document', completed: false, assignee: 'Marcus Rivera' },
      { id: 't21', title: 'Schedule meeting', completed: false, assignee: 'Lisa Thompson' },
    ]
  },
  {
    id: 'w6', title: '2025 Individual Tax Return', client: 'Patricia Brown', clientId: '5', type: 'tax-return', status: 'in-review', priority: 'medium', assignee: 'Sarah Chen', dueDate: '2026-04-15', startDate: '2026-02-01', progress: 85, budget: 1500, timeSpent: 9.5,
    tasks: [
      { id: 't22', title: 'Gather W-2s and 1099s', completed: true },
      { id: 't23', title: 'Input tax data', completed: true },
      { id: 't24', title: 'Review deductions', completed: true },
      { id: 't25', title: 'Manager review', completed: false, assignee: 'David Park' },
      { id: 't26', title: 'Client approval & e-file', completed: false },
    ]
  },
];

export const kanbanColumns: KanbanColumn[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    color: '#94a3b8',
    items: [
      { id: 'k1', title: 'Setup QuickBooks integration for Wei Tech', client: 'Wei Technologies', assignee: 'Lisa Thompson', assigneeAvatar: '', priority: 'medium', tags: ['Setup', 'Integration'], subtasks: { total: 4, completed: 0 }, comments: 2 },
      { id: 'k2', title: 'Prepare advisory report templates', assignee: 'Marcus Rivera', priority: 'low', tags: ['Templates'], subtasks: { total: 3, completed: 1 } },
    ]
  },
  {
    id: 'todo',
    title: 'To Do',
    color: '#3b82f6',
    items: [
      { id: 'k3', title: 'Review Smith Consulting Q4 financials', client: 'Smith Consulting', assignee: 'Emily Watson', priority: 'high', dueDate: '2026-02-28', tags: ['Review', 'Financials'], progress: 0, subtasks: { total: 5, completed: 0 }, comments: 3, attachments: 2 },
      { id: 'k4', title: 'Schedule tax planning meeting with Davis Properties', client: 'Davis Properties', assignee: 'Marcus Rivera', priority: 'medium', dueDate: '2026-03-05', tags: ['Meeting', 'Tax Planning'] },
      { id: 'k5', title: 'Update payroll system for Hassan Medical', client: 'Hassan Medical Group', assignee: 'David Park', priority: 'urgent', dueDate: '2026-02-25', tags: ['Payroll', 'Urgent'], subtasks: { total: 3, completed: 0 } },
    ]
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: '#f59e0b',
    items: [
      { id: 'k6', title: 'Complete Johnson Associates tax return', client: 'Johnson & Associates LLC', assignee: 'Sarah Chen', priority: 'high', dueDate: '2026-03-15', tags: ['Tax Return', '1120'], progress: 65, subtasks: { total: 6, completed: 3 }, comments: 8, attachments: 5 },
      { id: 'k7', title: 'February bookkeeping - Garcia Restaurants', client: 'Garcia Restaurants Inc', assignee: 'Emily Watson', priority: 'medium', dueDate: '2026-03-05', tags: ['Bookkeeping', 'Monthly'], progress: 30, subtasks: { total: 4, completed: 1 }, comments: 2 },
      { id: 'k8', title: 'Client onboarding - Wei Technologies', client: 'Wei Technologies', assignee: 'David Park', priority: 'medium', dueDate: '2026-03-01', tags: ['Onboarding'], progress: 50, subtasks: { total: 4, completed: 2 }, attachments: 3 },
    ]
  },
  {
    id: 'review',
    title: 'In Review',
    color: '#8b5cf6',
    items: [
      { id: 'k9', title: 'Patricia Brown individual tax return', client: 'Patricia Brown', assignee: 'Sarah Chen', priority: 'medium', dueDate: '2026-04-15', tags: ['Tax Return', '1040'], progress: 85, subtasks: { total: 5, completed: 3 }, comments: 4, attachments: 7 },
    ]
  },
  {
    id: 'completed',
    title: 'Completed',
    color: '#10b981',
    items: [
      { id: 'k10', title: 'January bookkeeping - Garcia Restaurants', client: 'Garcia Restaurants Inc', assignee: 'Emily Watson', priority: 'medium', tags: ['Bookkeeping', 'Monthly'], progress: 100, subtasks: { total: 4, completed: 4 } },
      { id: 'k11', title: 'Q4 payroll filing - Hassan Medical', client: 'Hassan Medical Group', assignee: 'David Park', priority: 'high', tags: ['Payroll', '941'], progress: 100, subtasks: { total: 6, completed: 6 }, comments: 5 },
    ]
  },
];

export const emails: EmailItem[] = [
  { id: 'e1', from: 'Robert Johnson', fromEmail: 'robert@johnsonllc.com', subject: 'Re: Missing K-1 Documents', preview: 'Hi Sarah, I found the K-1 forms from our partnership. Attaching them now for your review...', timestamp: '10:30 AM', read: false, starred: true, hasAttachment: true, client: 'Johnson & Associates LLC', labels: ['Tax'] },
  { id: 'e2', from: 'Ahmed Hassan', fromEmail: 'ahmed@hassanmedical.com', subject: 'Payroll Changes for March', preview: 'We have two new hires starting March 1st. I need to get them set up in the payroll system...', timestamp: '9:15 AM', read: false, starred: false, hasAttachment: false, client: 'Hassan Medical Group', labels: ['Payroll'] },
  { id: 'e3', from: 'Maria Garcia', fromEmail: 'maria@garciarestaurants.com', subject: 'February Receipts Ready', preview: 'All the February receipts have been scanned and organized. You can access them in the shared...', timestamp: 'Yesterday', read: true, starred: false, hasAttachment: true, client: 'Garcia Restaurants Inc', labels: ['Bookkeeping'] },
  { id: 'e4', from: 'Chen Wei', fromEmail: 'chen@weitech.com', subject: 'Onboarding Documents Submitted', preview: 'I\'ve uploaded all the requested documents to the portal. Please let me know if you need...', timestamp: 'Yesterday', read: true, starred: false, hasAttachment: true, client: 'Wei Technologies', labels: ['Onboarding'] },
  { id: 'e5', from: 'Michael Davis', fromEmail: 'michael@davisproperties.com', subject: 'Tax Planning Questions', preview: 'I wanted to discuss some strategies for reducing our tax liability this year. Are there any...', timestamp: '2 days ago', read: true, starred: true, hasAttachment: false, client: 'Davis Properties', labels: ['Advisory', 'Tax'] },
  { id: 'e6', from: 'Patricia Brown', fromEmail: 'patricia.brown@gmail.com', subject: 'Approved - Ready to File', preview: 'I\'ve reviewed everything and it looks great. You have my approval to go ahead and e-file...', timestamp: '2 days ago', read: true, starred: false, hasAttachment: false, client: 'Patricia Brown', labels: ['Tax'] },
];

export const dashboardStats = {
  activeClients: 6,
  totalClients: 8,
  workInProgress: 4,
  completedThisMonth: 12,
  revenue: 47850,
  revenueGrowth: 12.5,
  outstanding: 29500,
  hoursTracked: 43.2,
  utilizationRate: 78,
  avgResponseTime: '2.4 hrs',
  tasksCompleted: 34,
  tasksDue: 12,
};

export const revenueData = [
  { month: 'Sep', revenue: 32000, target: 35000 },
  { month: 'Oct', revenue: 38000, target: 35000 },
  { month: 'Nov', revenue: 41000, target: 38000 },
  { month: 'Dec', revenue: 45000, target: 38000 },
  { month: 'Jan', revenue: 42000, target: 40000 },
  { month: 'Feb', revenue: 47850, target: 40000 },
];

export const workloadData = [
  { name: 'Sarah Chen', tasks: 8, hours: 32, capacity: 40 },
  { name: 'Marcus Rivera', tasks: 5, hours: 28, capacity: 40 },
  { name: 'Emily Watson', tasks: 7, hours: 35, capacity: 40 },
  { name: 'David Park', tasks: 9, hours: 38, capacity: 40 },
  { name: 'Lisa Thompson', tasks: 4, hours: 20, capacity: 32 },
];

export const activityFeed = [
  { id: 'a1', user: 'Sarah Chen', action: 'completed task', target: 'Calculate deductions', project: 'Johnson Associates Tax Return', time: '30 min ago', type: 'task' as const },
  { id: 'a2', user: 'Emily Watson', action: 'reconciled', target: 'Bank Statement - Feb', project: 'Garcia Restaurants Bookkeeping', time: '1 hour ago', type: 'work' as const },
  { id: 'a3', user: 'David Park', action: 'uploaded document', target: 'Engagement Letter', project: 'Wei Technologies Onboarding', time: '2 hours ago', type: 'document' as const },
  { id: 'a4', user: 'Robert Johnson', action: 'sent email', target: 'Re: Missing K-1 Documents', project: 'Johnson Associates Tax Return', time: '3 hours ago', type: 'email' as const },
  { id: 'a5', user: 'Marcus Rivera', action: 'created work item', target: 'Tax Planning Session', project: 'Davis Properties Advisory', time: '4 hours ago', type: 'work' as const },
  { id: 'a6', user: 'Chen Wei', action: 'uploaded files', target: 'Prior Year Tax Returns', project: 'Wei Technologies Onboarding', time: '5 hours ago', type: 'document' as const },
  { id: 'a7', user: 'Lisa Thompson', action: 'sent reminder', target: 'W-2 Corrections Needed', project: 'Hassan Medical Payroll', time: '6 hours ago', type: 'email' as const },
];
