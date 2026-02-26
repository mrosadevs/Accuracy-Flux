import type { EntityType } from '@/lib/types/database';

/** A single task entry in a template */
export interface TemplateTask {
  title: string;
  phase: string; // phase/category label for grouping
}

/** A named workflow template */
export interface StaffTemplate {
  id: string;
  name: string;
  entity_types: EntityType[]; // which entity types this applies to (empty = all)
  work_types: string[];        // which work item types this applies to (empty = all)
  tasks: TemplateTask[];
}

/* ─────────────────────────────────────────────────────────────────────────
   TAX RETURN TEMPLATES
───────────────────────────────────────────────────────────────────────── */

const TAX_INDIVIDUAL: StaffTemplate = {
  id: 'tax-individual',
  name: 'Individual Tax Return (1040)',
  entity_types: ['individual', 'sole-prop', 'llc-single'],
  work_types: ['tax-return'],
  tasks: [
    // Phase 1 – Engagement & Setup
    { phase: 'Engagement & Setup', title: 'Send engagement letter to client' },
    { phase: 'Engagement & Setup', title: 'Obtain signed engagement letter' },
    { phase: 'Engagement & Setup', title: 'Request prior year return for comparison' },
    { phase: 'Engagement & Setup', title: 'Set up client in tax software' },
    // Phase 2 – Document Collection
    { phase: 'Document Collection', title: 'Send document request list to client' },
    { phase: 'Document Collection', title: 'Verify all W-2s received' },
    { phase: 'Document Collection', title: 'Check all 1099s (interest, dividends, misc)' },
    { phase: 'Document Collection', title: 'Collect retirement distribution statements (1099-R)' },
    { phase: 'Document Collection', title: 'Review Social Security benefit statement (SSA-1099)' },
    { phase: 'Document Collection', title: 'Collect mortgage interest statement (1098)' },
    { phase: 'Document Collection', title: 'Verify health insurance / ACA documents' },
    { phase: 'Document Collection', title: 'Collect HSA contribution / distribution records' },
    { phase: 'Document Collection', title: 'Follow up on any missing documents' },
    // Phase 3 – Preparation
    { phase: 'Tax Preparation', title: 'Enter all income data into tax software' },
    { phase: 'Tax Preparation', title: 'Enter itemized deductions (if applicable)' },
    { phase: 'Tax Preparation', title: 'Review and enter investment gains/losses (Schedule D)' },
    { phase: 'Tax Preparation', title: 'Enter Schedule C business income/expenses (if applicable)' },
    { phase: 'Tax Preparation', title: 'Calculate home office deduction (if applicable)' },
    { phase: 'Tax Preparation', title: 'Review carryovers from prior year' },
    { phase: 'Tax Preparation', title: 'Prepare state return(s)' },
    // Phase 4 – Review
    { phase: 'Quality Review', title: 'Internal review by preparer' },
    { phase: 'Quality Review', title: 'Manager / CPA review and sign-off' },
    { phase: 'Quality Review', title: 'Reconcile return to prior year' },
    { phase: 'Quality Review', title: 'Resolve any open questions / review notes' },
    // Phase 5 – Client Review & Approval
    { phase: 'Client Approval', title: 'Prepare client summary / tax organizer' },
    { phase: 'Client Approval', title: 'Send return to client for review' },
    { phase: 'Client Approval', title: 'Discuss any questions or concerns with client' },
    { phase: 'Client Approval', title: 'Obtain signed Form 8879 (e-file authorization)' },
    // Phase 6 – Filing
    { phase: 'Filing', title: 'E-file federal return' },
    { phase: 'Filing', title: 'Confirm IRS acceptance' },
    { phase: 'Filing', title: 'E-file state return(s)' },
    { phase: 'Filing', title: 'Confirm state acceptance' },
    // Phase 7 – Wrap-Up
    { phase: 'Wrap-Up', title: 'Send client copy of completed return' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
    { phase: 'Wrap-Up', title: 'Archive documents securely' },
    { phase: 'Wrap-Up', title: 'Note tax planning items for next year' },
  ],
};

const TAX_SCORP: StaffTemplate = {
  id: 'tax-scorp',
  name: 'S-Corp Tax Return (1120-S)',
  entity_types: ['s-corp'],
  work_types: ['tax-return'],
  tasks: [
    { phase: 'Engagement & Setup', title: 'Send engagement letter to client' },
    { phase: 'Engagement & Setup', title: 'Obtain signed engagement letter' },
    { phase: 'Engagement & Setup', title: 'Request prior year 1120-S return' },
    { phase: 'Engagement & Setup', title: 'Confirm shareholder information and ownership %' },
    // Document Collection
    { phase: 'Document Collection', title: 'Collect financial statements (P&L and Balance Sheet)' },
    { phase: 'Document Collection', title: 'Collect business bank statements' },
    { phase: 'Document Collection', title: 'Obtain payroll records and officer W-2s' },
    { phase: 'Document Collection', title: 'Collect 1099s issued to contractors' },
    { phase: 'Document Collection', title: 'Gather fixed asset additions and disposals' },
    { phase: 'Document Collection', title: 'Review health insurance premiums paid for shareholders' },
    { phase: 'Document Collection', title: 'Verify shareholder loan balances' },
    { phase: 'Document Collection', title: 'Collect state business filings and licenses' },
    // Preparation
    { phase: 'Tax Preparation', title: 'Reconcile book income to taxable income' },
    { phase: 'Tax Preparation', title: 'Prepare depreciation schedule (Form 4562)' },
    { phase: 'Tax Preparation', title: 'Calculate shareholder basis' },
    { phase: 'Tax Preparation', title: 'Verify reasonable compensation for officer(s)' },
    { phase: 'Tax Preparation', title: 'Prepare Schedule K and K-1 for each shareholder' },
    { phase: 'Tax Preparation', title: 'Prepare state business return(s)' },
    { phase: 'Tax Preparation', title: 'Review prior year carryovers' },
    // Review
    { phase: 'Quality Review', title: 'Internal review by preparer' },
    { phase: 'Quality Review', title: 'Manager / CPA review and sign-off' },
    { phase: 'Quality Review', title: 'Verify K-1 amounts tie to return' },
    { phase: 'Quality Review', title: 'Resolve any open questions' },
    // Client Approval
    { phase: 'Client Approval', title: 'Prepare client summary and distribute K-1s' },
    { phase: 'Client Approval', title: 'Review return with client' },
    { phase: 'Client Approval', title: 'Obtain officer signature on Form 8879-S' },
    // Filing
    { phase: 'Filing', title: 'E-file federal 1120-S' },
    { phase: 'Filing', title: 'Confirm IRS acceptance' },
    { phase: 'Filing', title: 'E-file state business return(s)' },
    { phase: 'Filing', title: 'Distribute signed K-1s to all shareholders' },
    // Wrap-Up
    { phase: 'Wrap-Up', title: 'Send client copy of completed return' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
    { phase: 'Wrap-Up', title: 'Archive documents securely' },
    { phase: 'Wrap-Up', title: 'Note year-end planning items' },
  ],
};

const TAX_PARTNERSHIP: StaffTemplate = {
  id: 'tax-partnership',
  name: 'Partnership / LLC Multi-Member Return (1065)',
  entity_types: ['partnership', 'llc-multi'],
  work_types: ['tax-return'],
  tasks: [
    { phase: 'Engagement & Setup', title: 'Send engagement letter to client' },
    { phase: 'Engagement & Setup', title: 'Obtain signed engagement letter' },
    { phase: 'Engagement & Setup', title: 'Request prior year 1065 return' },
    { phase: 'Engagement & Setup', title: 'Confirm partner information and ownership %' },
    // Document Collection
    { phase: 'Document Collection', title: 'Collect financial statements (P&L and Balance Sheet)' },
    { phase: 'Document Collection', title: 'Collect business bank statements' },
    { phase: 'Document Collection', title: 'Obtain guaranteed payment records' },
    { phase: 'Document Collection', title: 'Collect 1099s issued to contractors' },
    { phase: 'Document Collection', title: 'Gather fixed asset additions and disposals' },
    { phase: 'Document Collection', title: 'Verify partner loan/capital account balances' },
    // Preparation
    { phase: 'Tax Preparation', title: 'Reconcile book income to taxable income' },
    { phase: 'Tax Preparation', title: 'Prepare depreciation schedule (Form 4562)' },
    { phase: 'Tax Preparation', title: 'Calculate partner capital accounts' },
    { phase: 'Tax Preparation', title: 'Prepare Schedule K and K-1 for each partner' },
    { phase: 'Tax Preparation', title: 'Prepare state partnership return(s)' },
    { phase: 'Tax Preparation', title: 'Review prior year carryovers' },
    // Review
    { phase: 'Quality Review', title: 'Internal review by preparer' },
    { phase: 'Quality Review', title: 'Manager / CPA review and sign-off' },
    { phase: 'Quality Review', title: 'Verify K-1 amounts tie to return' },
    { phase: 'Quality Review', title: 'Resolve any open questions' },
    // Client Approval
    { phase: 'Client Approval', title: 'Prepare client summary and distribute K-1s' },
    { phase: 'Client Approval', title: 'Review return with managing partner' },
    { phase: 'Client Approval', title: 'Obtain partner signature' },
    // Filing
    { phase: 'Filing', title: 'E-file federal 1065' },
    { phase: 'Filing', title: 'Confirm IRS acceptance' },
    { phase: 'Filing', title: 'E-file state return(s)' },
    { phase: 'Filing', title: 'Distribute signed K-1s to all partners' },
    // Wrap-Up
    { phase: 'Wrap-Up', title: 'Send client copy of completed return' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
    { phase: 'Wrap-Up', title: 'Archive documents securely' },
  ],
};

const TAX_CCORP: StaffTemplate = {
  id: 'tax-ccorp',
  name: 'C-Corp Tax Return (1120)',
  entity_types: ['c-corp'],
  work_types: ['tax-return'],
  tasks: [
    { phase: 'Engagement & Setup', title: 'Send engagement letter to client' },
    { phase: 'Engagement & Setup', title: 'Obtain signed engagement letter' },
    { phase: 'Engagement & Setup', title: 'Request prior year 1120 return' },
    { phase: 'Engagement & Setup', title: 'Verify corporate officer information' },
    // Document Collection
    { phase: 'Document Collection', title: 'Collect audited / reviewed financial statements' },
    { phase: 'Document Collection', title: 'Collect business bank statements' },
    { phase: 'Document Collection', title: 'Obtain payroll records and W-2 summary' },
    { phase: 'Document Collection', title: 'Collect 1099s issued to contractors' },
    { phase: 'Document Collection', title: 'Gather fixed asset schedule (additions / disposals)' },
    { phase: 'Document Collection', title: 'Review dividend distributions and corporate minutes' },
    { phase: 'Document Collection', title: 'Verify estimated tax payments made' },
    // Preparation
    { phase: 'Tax Preparation', title: 'Reconcile book income to taxable income (Sch. M-1/M-3)' },
    { phase: 'Tax Preparation', title: 'Prepare depreciation schedule (Form 4562)' },
    { phase: 'Tax Preparation', title: 'Review and apply NOL carryforwards' },
    { phase: 'Tax Preparation', title: 'Prepare state corporate return(s)' },
    { phase: 'Tax Preparation', title: 'Calculate estimated tax for next year' },
    // Review
    { phase: 'Quality Review', title: 'Internal review by preparer' },
    { phase: 'Quality Review', title: 'Manager / CPA review and sign-off' },
    { phase: 'Quality Review', title: 'Verify Sch. M-1 reconciliation' },
    { phase: 'Quality Review', title: 'Resolve any open questions' },
    // Client Approval
    { phase: 'Client Approval', title: 'Prepare client summary' },
    { phase: 'Client Approval', title: 'Review return with client' },
    { phase: 'Client Approval', title: 'Obtain officer signature on Form 8879-C' },
    // Filing
    { phase: 'Filing', title: 'E-file federal 1120' },
    { phase: 'Filing', title: 'Confirm IRS acceptance' },
    { phase: 'Filing', title: 'E-file state corporate return(s)' },
    // Wrap-Up
    { phase: 'Wrap-Up', title: 'Send client copy of completed return' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
    { phase: 'Wrap-Up', title: 'Archive documents securely' },
    { phase: 'Wrap-Up', title: 'Schedule year-end tax planning meeting' },
  ],
};

const TAX_NONPROFIT: StaffTemplate = {
  id: 'tax-nonprofit',
  name: 'Non-Profit Return (Form 990)',
  entity_types: ['non-profit'],
  work_types: ['tax-return'],
  tasks: [
    { phase: 'Engagement & Setup', title: 'Send engagement letter' },
    { phase: 'Engagement & Setup', title: 'Obtain signed engagement letter' },
    { phase: 'Engagement & Setup', title: 'Request prior year Form 990' },
    { phase: 'Engagement & Setup', title: 'Confirm board member and officer information' },
    { phase: 'Document Collection', title: 'Collect audited financial statements' },
    { phase: 'Document Collection', title: 'Obtain revenue breakdowns (program, management, fundraising)' },
    { phase: 'Document Collection', title: 'Collect grant revenue details' },
    { phase: 'Document Collection', title: 'Gather executive compensation details' },
    { phase: 'Document Collection', title: 'Review related party transactions' },
    { phase: 'Tax Preparation', title: 'Complete Form 990 (Part I–XII)' },
    { phase: 'Tax Preparation', title: 'Prepare Schedule A (public support test)' },
    { phase: 'Tax Preparation', title: 'Prepare applicable schedules (B, G, L, O, etc.)' },
    { phase: 'Tax Preparation', title: 'Prepare state charitable registration filings' },
    { phase: 'Quality Review', title: 'Internal review by preparer' },
    { phase: 'Quality Review', title: 'Manager / CPA review and sign-off' },
    { phase: 'Client Approval', title: 'Send draft to executive director / board' },
    { phase: 'Client Approval', title: 'Obtain board approval and signature' },
    { phase: 'Filing', title: 'E-file Form 990' },
    { phase: 'Filing', title: 'Confirm IRS acceptance' },
    { phase: 'Wrap-Up', title: 'Post 990 publicly (3 year requirement)' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice' },
    { phase: 'Wrap-Up', title: 'Archive documents securely' },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────
   BOOKKEEPING TEMPLATE
───────────────────────────────────────────────────────────────────────── */

const BOOKKEEPING: StaffTemplate = {
  id: 'bookkeeping-monthly',
  name: 'Monthly Bookkeeping',
  entity_types: [],  // applies to all entity types
  work_types: ['bookkeeping'],
  tasks: [
    { phase: 'Bank & Credit Cards', title: 'Reconcile all bank accounts' },
    { phase: 'Bank & Credit Cards', title: 'Reconcile all credit card accounts' },
    { phase: 'Bank & Credit Cards', title: 'Record any bank fees or interest charges' },
    { phase: 'Transactions', title: 'Categorize all income transactions' },
    { phase: 'Transactions', title: 'Categorize all expense transactions' },
    { phase: 'Transactions', title: 'Record owner draws / distributions' },
    { phase: 'Transactions', title: 'Record payroll journal entries' },
    { phase: 'Accounts Receivable', title: 'Review outstanding invoices' },
    { phase: 'Accounts Receivable', title: 'Record payments received' },
    { phase: 'Accounts Receivable', title: 'Follow up on overdue receivables (if applicable)' },
    { phase: 'Accounts Payable', title: 'Record and code all bills' },
    { phase: 'Accounts Payable', title: 'Review vendor payment due dates' },
    { phase: 'Reporting', title: 'Generate Profit & Loss report' },
    { phase: 'Reporting', title: 'Generate Balance Sheet' },
    { phase: 'Reporting', title: 'Review reports for anomalies or unusual items' },
    { phase: 'Reporting', title: 'Send monthly financial package to client' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────
   PAYROLL TEMPLATE
───────────────────────────────────────────────────────────────────────── */

const PAYROLL: StaffTemplate = {
  id: 'payroll-quarterly',
  name: 'Payroll & Quarterly Filing',
  entity_types: [],
  work_types: ['payroll'],
  tasks: [
    { phase: 'Payroll Processing', title: 'Collect hours and pay data from client' },
    { phase: 'Payroll Processing', title: 'Process payroll in payroll system' },
    { phase: 'Payroll Processing', title: 'Review payroll register for accuracy' },
    { phase: 'Payroll Processing', title: 'Distribute pay stubs to employees' },
    { phase: 'Tax Deposits', title: 'Calculate federal payroll tax deposit (941)' },
    { phase: 'Tax Deposits', title: 'Remit federal tax deposit via EFTPS' },
    { phase: 'Tax Deposits', title: 'Calculate and remit state payroll tax deposit' },
    { phase: 'Quarterly Filing', title: 'Prepare Form 941 (quarterly federal payroll)' },
    { phase: 'Quarterly Filing', title: 'Review Form 941 with client' },
    { phase: 'Quarterly Filing', title: 'File Form 941' },
    { phase: 'Quarterly Filing', title: 'Prepare and file state quarterly payroll returns' },
    { phase: 'Quarterly Filing', title: 'Prepare FUTA calculation (Form 940 – annual)' },
    { phase: 'Year-End', title: 'Process year-end payroll' },
    { phase: 'Year-End', title: 'Reconcile annual payroll' },
    { phase: 'Year-End', title: 'Prepare W-2s for all employees' },
    { phase: 'Year-End', title: 'Prepare 1099-NECs for contractors (if applicable)' },
    { phase: 'Year-End', title: 'File W-2s with SSA (Form W-3)' },
    { phase: 'Year-End', title: 'File 1099-NECs with IRS (Form 1096)' },
    { phase: 'Year-End', title: 'Distribute W-2s and 1099s to recipients' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────
   ONBOARDING TEMPLATE
───────────────────────────────────────────────────────────────────────── */

const ONBOARDING: StaffTemplate = {
  id: 'onboarding-new-client',
  name: 'New Client Onboarding',
  entity_types: [],
  work_types: ['onboarding'],
  tasks: [
    { phase: 'Initial Setup', title: 'Send welcome email and introduction' },
    { phase: 'Initial Setup', title: 'Schedule onboarding call / meeting' },
    { phase: 'Initial Setup', title: 'Send welcome packet and document checklist' },
    { phase: 'Initial Setup', title: 'Prepare and send engagement letter' },
    { phase: 'Initial Setup', title: 'Obtain signed engagement letter' },
    { phase: 'Data Collection', title: 'Collect government-issued photo ID' },
    { phase: 'Data Collection', title: 'Collect Social Security card(s)' },
    { phase: 'Data Collection', title: 'Obtain EIN letter (businesses)' },
    { phase: 'Data Collection', title: 'Obtain Articles of Incorporation / Organization' },
    { phase: 'Data Collection', title: 'Collect prior year tax returns (last 2 years)' },
    { phase: 'Data Collection', title: 'Collect most recent financial statements' },
    { phase: 'Data Collection', title: 'Gather all payroll access and records' },
    { phase: 'System Setup', title: 'Set up client in practice management software' },
    { phase: 'System Setup', title: 'Create client portal account and send login' },
    { phase: 'System Setup', title: 'Set up access to client accounting software (if applicable)' },
    { phase: 'System Setup', title: 'Add client to billing system' },
    { phase: 'System Setup', title: 'Schedule recurring work items (tax, bookkeeping, payroll)' },
    { phase: 'Wrap-Up', title: 'Confirm all access is working' },
    { phase: 'Wrap-Up', title: 'Send confirmation / welcome completion email' },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────
   ADVISORY TEMPLATE
───────────────────────────────────────────────────────────────────────── */

const ADVISORY: StaffTemplate = {
  id: 'advisory-general',
  name: 'Advisory / Consulting Engagement',
  entity_types: [],
  work_types: ['advisory'],
  tasks: [
    { phase: 'Scope & Engagement', title: 'Define scope of advisory engagement' },
    { phase: 'Scope & Engagement', title: 'Prepare and send engagement letter' },
    { phase: 'Scope & Engagement', title: 'Obtain signed engagement letter' },
    { phase: 'Research & Analysis', title: 'Gather relevant financial data from client' },
    { phase: 'Research & Analysis', title: 'Perform analysis / modeling' },
    { phase: 'Research & Analysis', title: 'Research applicable tax law / strategies' },
    { phase: 'Preparation', title: 'Prepare advisory memo or report' },
    { phase: 'Preparation', title: 'Internal review by manager / CPA' },
    { phase: 'Delivery', title: 'Present findings and recommendations to client' },
    { phase: 'Delivery', title: 'Address client questions and follow-ups' },
    { phase: 'Implementation', title: 'Assist with implementing recommended changes' },
    { phase: 'Implementation', title: 'Document any changes made' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
    { phase: 'Wrap-Up', title: 'Archive documents securely' },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────
   ALL TEMPLATES REGISTRY
───────────────────────────────────────────────────────────────────────── */

export const ALL_STAFF_TEMPLATES: StaffTemplate[] = [
  TAX_INDIVIDUAL,
  TAX_SCORP,
  TAX_PARTNERSHIP,
  TAX_CCORP,
  TAX_NONPROFIT,
  BOOKKEEPING,
  PAYROLL,
  ONBOARDING,
  ADVISORY,
];

/** Returns the best matching template(s) for a given work type and entity type.
 *  First tries exact entity_type match, then falls back to work_type-only match. */
export function getMatchingTemplates(
  workType: string,
  entityType?: EntityType | null,
): StaffTemplate[] {
  const byWorkType = ALL_STAFF_TEMPLATES.filter(
    t => t.work_types.length === 0 || t.work_types.includes(workType),
  );

  if (!entityType) return byWorkType;

  // Prefer entity-specific templates first
  const exact = byWorkType.filter(
    t => t.entity_types.length > 0 && t.entity_types.includes(entityType),
  );
  if (exact.length > 0) return exact;

  // Fall back to generic (no entity_types restriction)
  return byWorkType.filter(t => t.entity_types.length === 0);
}
