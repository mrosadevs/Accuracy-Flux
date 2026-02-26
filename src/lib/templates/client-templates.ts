import type { EntityType } from '@/lib/types/database';

/** A single document/task the client needs to provide */
export interface ClientTemplateItem {
  title: string;
  category: string; // for grouping / display
  required: boolean;
}

/** A named client document checklist template */
export interface ClientTemplate {
  id: string;
  name: string;
  description: string;
  entity_types: EntityType[];
  items: ClientTemplateItem[];
}

/* ─────────────────────────────────────────────────────────────────────────
   INDIVIDUAL / SOLE PROPRIETOR
───────────────────────────────────────────────────────────────────────── */

const CHECKLIST_INDIVIDUAL: ClientTemplate = {
  id: 'checklist-individual',
  name: 'Individual / Personal Tax Documents',
  description: 'Document checklist for individual tax return preparation',
  entity_types: ['individual', 'sole-prop', 'llc-single'],
  items: [
    // Personal Info
    { category: 'Personal Information', title: 'Copy of government-issued photo ID', required: true },
    { category: 'Personal Information', title: 'Social Security card(s) — all family members', required: true },
    { category: 'Personal Information', title: 'Spouse Social Security card (if married)', required: false },
    { category: 'Personal Information', title: 'Prior year tax return (copy)', required: true },
    // Income Documents
    { category: 'Income Documents', title: 'W-2 form(s) from all employers', required: true },
    { category: 'Income Documents', title: '1099-NEC or 1099-MISC (freelance / contract work)', required: false },
    { category: 'Income Documents', title: '1099-INT (bank interest)', required: false },
    { category: 'Income Documents', title: '1099-DIV (dividends)', required: false },
    { category: 'Income Documents', title: '1099-B (investment sales / brokerage)', required: false },
    { category: 'Income Documents', title: 'SSA-1099 (Social Security benefits)', required: false },
    { category: 'Income Documents', title: '1099-R (retirement / pension distributions)', required: false },
    { category: 'Income Documents', title: '1099-G (unemployment / state refund)', required: false },
    { category: 'Income Documents', title: 'Schedule K-1 (if partner or shareholder)', required: false },
    // Deductions
    { category: 'Deductions & Credits', title: 'Mortgage interest statement (Form 1098)', required: false },
    { category: 'Deductions & Credits', title: 'Property tax statements', required: false },
    { category: 'Deductions & Credits', title: 'Charitable donation receipts', required: false },
    { category: 'Deductions & Credits', title: 'Medical expense receipts (if large amounts)', required: false },
    { category: 'Deductions & Credits', title: 'Childcare provider name, address, and EIN/SSN', required: false },
    { category: 'Deductions & Credits', title: 'Education expenses / 1098-T (tuition)', required: false },
    { category: 'Deductions & Credits', title: 'Student loan interest statement (1098-E)', required: false },
    // Health & Retirement
    { category: 'Health & Retirement', title: 'Health insurance premiums paid (if self-employed)', required: false },
    { category: 'Health & Retirement', title: 'HSA contribution / distribution statements (5498-SA / 1099-SA)', required: false },
    { category: 'Health & Retirement', title: 'IRA contribution records (if applicable)', required: false },
    { category: 'Health & Retirement', title: 'ACA marketplace coverage form (1095-A)', required: false },
    // Business (Sole Prop / LLC)
    { category: 'Business Income & Expenses', title: 'Business income records / revenue summary', required: false },
    { category: 'Business Income & Expenses', title: 'Business expense records (receipts, invoices)', required: false },
    { category: 'Business Income & Expenses', title: 'Vehicle mileage log (if deducting vehicle)', required: false },
    { category: 'Business Income & Expenses', title: 'Home office measurements (if deducting)', required: false },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────
   S-CORP / PARTNERSHIP / LLC MULTI-MEMBER
───────────────────────────────────────────────────────────────────────── */

const CHECKLIST_SCORP: ClientTemplate = {
  id: 'checklist-scorp',
  name: 'S-Corp Document Checklist',
  description: 'Document checklist for S-Corporation tax return (1120-S)',
  entity_types: ['s-corp'],
  items: [
    { category: 'Business Information', title: 'Prior year S-Corp tax return (1120-S)', required: true },
    { category: 'Business Information', title: 'Articles of Incorporation', required: true },
    { category: 'Business Information', title: 'EIN confirmation letter (CP 575)', required: true },
    { category: 'Business Information', title: 'Current shareholder names, SSNs, and ownership %', required: true },
    // Financial Statements
    { category: 'Financial Statements', title: 'Profit & Loss Statement (full year)', required: true },
    { category: 'Financial Statements', title: 'Balance Sheet (beginning and end of year)', required: true },
    { category: 'Financial Statements', title: 'General Ledger or Trial Balance', required: true },
    { category: 'Financial Statements', title: 'Business bank statements (all accounts, full year)', required: true },
    // Payroll
    { category: 'Payroll', title: 'Payroll records / annual payroll summary', required: true },
    { category: 'Payroll', title: 'W-2s issued to all officers and employees', required: true },
    { category: 'Payroll', title: 'Health insurance premiums paid on behalf of shareholders', required: true },
    // Income & Expenses
    { category: 'Income & Contractors', title: '1099-NECs issued to contractors', required: false },
    { category: 'Income & Contractors', title: '1099-Ks received (payment processors)', required: false },
    // Assets & Loans
    { category: 'Assets & Loans', title: 'Fixed asset list (equipment, furniture, vehicles purchased/sold)', required: true },
    { category: 'Assets & Loans', title: 'Loan statements (business loans — beginning and ending balances)', required: false },
    { category: 'Assets & Loans', title: 'Shareholder loan details (if loans to/from shareholders)', required: false },
    // Distributions
    { category: 'Distributions & Minutes', title: 'Record of distributions paid to shareholders', required: true },
    { category: 'Distributions & Minutes', title: 'Corporate meeting minutes (if available)', required: false },
    // State
    { category: 'State & Local', title: 'State business registration / annual report', required: false },
    { category: 'State & Local', title: 'State tax payments made during the year', required: false },
  ],
};

const CHECKLIST_PARTNERSHIP: ClientTemplate = {
  id: 'checklist-partnership',
  name: 'Partnership / LLC Multi-Member Checklist',
  description: 'Document checklist for partnership / multi-member LLC (Form 1065)',
  entity_types: ['partnership', 'llc-multi'],
  items: [
    { category: 'Business Information', title: 'Prior year partnership return (1065)', required: true },
    { category: 'Business Information', title: 'Partnership Agreement (most recent version)', required: true },
    { category: 'Business Information', title: 'EIN confirmation letter (CP 575)', required: true },
    { category: 'Business Information', title: 'Current partner names, SSNs/EINs, and ownership %', required: true },
    // Financial Statements
    { category: 'Financial Statements', title: 'Profit & Loss Statement (full year)', required: true },
    { category: 'Financial Statements', title: 'Balance Sheet (beginning and end of year)', required: true },
    { category: 'Financial Statements', title: 'General Ledger or Trial Balance', required: true },
    { category: 'Financial Statements', title: 'Business bank statements (all accounts, full year)', required: true },
    // Partner Distributions
    { category: 'Partner Activity', title: 'Record of partner distributions paid', required: true },
    { category: 'Partner Activity', title: 'Guaranteed payments made to partners', required: false },
    { category: 'Partner Activity', title: 'Partner capital contributions made during the year', required: false },
    // Assets & Loans
    { category: 'Assets & Loans', title: 'Fixed asset list (equipment, vehicles purchased/sold)', required: true },
    { category: 'Assets & Loans', title: 'Loan statements (business loans)', required: false },
    { category: 'Assets & Loans', title: 'Partner loan details (if loans to/from partners)', required: false },
    // Contractors
    { category: 'Income & Contractors', title: '1099-NECs issued to contractors', required: false },
    // State
    { category: 'State & Local', title: 'State business registration / annual report', required: false },
    { category: 'State & Local', title: 'State tax payments made during the year', required: false },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────
   C-CORP
───────────────────────────────────────────────────────────────────────── */

const CHECKLIST_CCORP: ClientTemplate = {
  id: 'checklist-ccorp',
  name: 'C-Corp Document Checklist',
  description: 'Document checklist for C-Corporation tax return (Form 1120)',
  entity_types: ['c-corp'],
  items: [
    { category: 'Corporate Information', title: 'Prior year corporate return (1120)', required: true },
    { category: 'Corporate Information', title: 'Articles of Incorporation', required: true },
    { category: 'Corporate Information', title: 'EIN confirmation letter', required: true },
    { category: 'Corporate Information', title: 'Corporate officer list (name, SSN, compensation)', required: true },
    // Financial Statements
    { category: 'Financial Statements', title: 'Audited or reviewed financial statements', required: true },
    { category: 'Financial Statements', title: 'Profit & Loss Statement (full year)', required: true },
    { category: 'Financial Statements', title: 'Balance Sheet (beginning and end of year)', required: true },
    { category: 'Financial Statements', title: 'General Ledger or Trial Balance', required: true },
    { category: 'Financial Statements', title: 'Business bank statements (all accounts, full year)', required: true },
    // Payroll & Dividends
    { category: 'Payroll & Dividends', title: 'Payroll records / annual payroll summary', required: true },
    { category: 'Payroll & Dividends', title: 'W-2s issued to all employees', required: true },
    { category: 'Payroll & Dividends', title: 'Record of dividends paid to shareholders', required: false },
    { category: 'Payroll & Dividends', title: 'Corporate meeting minutes', required: false },
    // Assets & Loans
    { category: 'Assets & Loans', title: 'Fixed asset schedule (additions and disposals)', required: true },
    { category: 'Assets & Loans', title: 'Loan statements (business loans)', required: false },
    // Taxes Paid
    { category: 'Taxes & Estimates', title: 'Record of estimated corporate tax payments made', required: true },
    { category: 'Taxes & Estimates', title: 'Prior year state tax payments', required: false },
    // Contractors
    { category: 'Income & Contractors', title: '1099-NECs issued to contractors', required: false },
    // State
    { category: 'State & Local', title: 'State corporate tax filings', required: false },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────
   NON-PROFIT
───────────────────────────────────────────────────────────────────────── */

const CHECKLIST_NONPROFIT: ClientTemplate = {
  id: 'checklist-nonprofit',
  name: 'Non-Profit Document Checklist',
  description: 'Document checklist for Form 990 preparation',
  entity_types: ['non-profit'],
  items: [
    { category: 'Organization Information', title: 'Prior year Form 990', required: true },
    { category: 'Organization Information', title: 'IRS determination letter (501(c)(3) status)', required: true },
    { category: 'Organization Information', title: 'Current board of directors list', required: true },
    { category: 'Organization Information', title: 'Key employee and officer compensation details', required: true },
    // Financial Statements
    { category: 'Financial Statements', title: 'Audited / reviewed financial statements', required: true },
    { category: 'Financial Statements', title: 'Revenue breakdown by program, management, fundraising', required: true },
    { category: 'Financial Statements', title: 'Balance Sheet (Statement of Financial Position)', required: true },
    // Revenue
    { category: 'Revenue', title: 'Grant revenue detail (grantor name, amount, purpose)', required: true },
    { category: 'Revenue', title: 'Donation / contribution records', required: true },
    { category: 'Revenue', title: 'Program service revenue details', required: false },
    { category: 'Revenue', title: 'Event / fundraiser income and expense records', required: false },
    // Compliance
    { category: 'Compliance', title: 'Related party transactions disclosure', required: true },
    { category: 'Compliance', title: 'Foreign activities or grantees (if applicable)', required: false },
    { category: 'Compliance', title: 'State charitable registration filings', required: false },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────
   ALL TEMPLATES REGISTRY
───────────────────────────────────────────────────────────────────────── */

export const ALL_CLIENT_TEMPLATES: ClientTemplate[] = [
  CHECKLIST_INDIVIDUAL,
  CHECKLIST_SCORP,
  CHECKLIST_PARTNERSHIP,
  CHECKLIST_CCORP,
  CHECKLIST_NONPROFIT,
];

/** Returns the best matching client checklist template for the given entity type */
export function getClientTemplate(entityType?: EntityType | null): ClientTemplate | null {
  if (!entityType) return CHECKLIST_INDIVIDUAL;
  return (
    ALL_CLIENT_TEMPLATES.find(t => t.entity_types.includes(entityType)) ??
    CHECKLIST_INDIVIDUAL
  );
}
