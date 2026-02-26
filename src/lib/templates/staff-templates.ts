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
   These reflect the merged workflow from PDF best-practices + actual
   checklist steps used in practice (prepare → client signs → file).
───────────────────────────────────────────────────────────────────────── */

// ── Individual 1040 ──────────────────────────────────────────────────────────
const TAX_INDIVIDUAL: StaffTemplate = {
  id: 'tax-individual',
  name: 'Individual Tax Return (1040)',
  entity_types: ['individual', 'sole-prop'],
  work_types: ['tax-return'],
  tasks: [
    // Engagement & Setup
    { phase: 'Engagement & Setup', title: 'Send engagement letter to client' },
    { phase: 'Engagement & Setup', title: 'Obtain signed engagement letter' },
    { phase: 'Engagement & Setup', title: 'Request prior year return for comparison' },
    { phase: 'Engagement & Setup', title: 'Set up client in tax software' },
    // Extension (complete if applicable, skip if not needed)
    { phase: 'Extension', title: 'File extension (Form 4868) with IRS' },
    { phase: 'Extension', title: 'Confirm extension accepted by IRS' },
    // Document Collection
    { phase: 'Document Collection', title: 'Send document request list to client' },
    { phase: 'Document Collection', title: 'Receive all tax documents from client' },
    { phase: 'Document Collection', title: 'Verify all W-2s received' },
    { phase: 'Document Collection', title: 'Check all 1099s (interest, dividends, misc)' },
    { phase: 'Document Collection', title: 'Collect retirement distribution statements (1099-R)' },
    { phase: 'Document Collection', title: 'Review Social Security benefit statement (SSA-1099)' },
    { phase: 'Document Collection', title: 'Collect mortgage interest statement (1098)' },
    { phase: 'Document Collection', title: 'Verify health insurance / ACA documents (1095-A if applicable)' },
    { phase: 'Document Collection', title: 'Follow up on any missing documents' },
    // Tax Preparation
    { phase: 'Tax Preparation', title: 'Enter all income data into tax software' },
    { phase: 'Tax Preparation', title: 'Enter itemized deductions (if applicable)' },
    { phase: 'Tax Preparation', title: 'Review and enter investment gains/losses (Schedule D)' },
    { phase: 'Tax Preparation', title: 'Enter Schedule C business income/expenses (if applicable)' },
    { phase: 'Tax Preparation', title: 'Calculate home office deduction (if applicable)' },
    { phase: 'Tax Preparation', title: 'Review carryovers from prior year' },
    { phase: 'Tax Preparation', title: 'Prepare state return (Form F-1040 or applicable)' },
    // Quality Review
    { phase: 'Quality Review', title: 'Internal review by preparer' },
    { phase: 'Quality Review', title: 'Manager / CPA review and sign-off' },
    { phase: 'Quality Review', title: 'Reconcile return to prior year' },
    { phase: 'Quality Review', title: 'Resolve any open questions / review notes' },
    // Client Approval
    { phase: 'Client Approval', title: 'Send return to client for review' },
    { phase: 'Client Approval', title: 'Discuss any questions or concerns with client' },
    { phase: 'Client Approval', title: 'Obtain signed Form 8879 (e-file authorization)' },
    // Filing
    { phase: 'Filing', title: 'E-file federal return (Form 1040)' },
    { phase: 'Filing', title: 'Confirm IRS acceptance' },
    { phase: 'Filing', title: 'E-file state return' },
    { phase: 'Filing', title: 'Confirm state acceptance' },
    // Wrap-Up
    { phase: 'Wrap-Up', title: 'Send client copy of completed return' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
    { phase: 'Wrap-Up', title: 'Archive documents securely' },
    { phase: 'Wrap-Up', title: 'Note tax planning items for next year' },
  ],
};

// ── Individual 1040 — Single Member LLC (Schedule C / disregarded entity) ───
const TAX_LLC_SINGLE: StaffTemplate = {
  id: 'tax-llc-single',
  name: 'Single Member LLC — Disregarded Entity (Schedule C / 1040)',
  entity_types: ['llc-single'],
  work_types: ['tax-return'],
  tasks: [
    // Engagement & Setup
    { phase: 'Engagement & Setup', title: 'Send engagement letter to client' },
    { phase: 'Engagement & Setup', title: 'Obtain signed engagement letter' },
    { phase: 'Engagement & Setup', title: 'Set up client in tax software' },
    // Extension
    { phase: 'Extension', title: 'File personal extension (Form 4868) with IRS' },
    { phase: 'Extension', title: 'Confirm extension accepted by IRS' },
    // Document Collection & Bookkeeping
    { phase: 'Document Collection', title: 'Request business financial information from client' },
    { phase: 'Document Collection', title: 'Receive business records / bank statements' },
    { phase: 'Bookkeeping', title: 'Process bookkeeping for the LLC' },
    { phase: 'Bookkeeping', title: 'Prepare financial statements (P&L and Balance Sheet)' },
    { phase: 'Bookkeeping', title: 'Client approves financial statements' },
    { phase: 'Document Collection', title: 'Collect personal income documents (W-2, 1099, etc.)' },
    { phase: 'Document Collection', title: 'Follow up on any missing documents' },
    // Tax Preparation
    { phase: 'Tax Preparation', title: 'Enter business income/expenses on Schedule C' },
    { phase: 'Tax Preparation', title: 'Calculate self-employment tax (Schedule SE)' },
    { phase: 'Tax Preparation', title: 'Enter all personal income data into tax software' },
    { phase: 'Tax Preparation', title: 'Review carryovers from prior year' },
    { phase: 'Tax Preparation', title: 'Prepare state return (Form F-1040 or applicable)' },
    // Quality Review
    { phase: 'Quality Review', title: 'Internal review by preparer' },
    { phase: 'Quality Review', title: 'Manager / CPA review and sign-off' },
    { phase: 'Quality Review', title: 'Resolve any open questions' },
    // Client Approval
    { phase: 'Client Approval', title: 'Send return to client for review' },
    { phase: 'Client Approval', title: 'Obtain signed Form 8879 (e-file authorization)' },
    // Filing
    { phase: 'Filing', title: 'E-file federal return (Form 1040 + Schedule C)' },
    { phase: 'Filing', title: 'Confirm IRS acceptance' },
    { phase: 'Filing', title: 'E-file state return' },
    { phase: 'Filing', title: 'Confirm state acceptance' },
    // Wrap-Up
    { phase: 'Wrap-Up', title: 'Send client copy of completed return' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
    { phase: 'Wrap-Up', title: 'Archive documents securely' },
  ],
};

// ── Non-Resident Alien — 1040NR ──────────────────────────────────────────────
const TAX_1040NR: StaffTemplate = {
  id: 'tax-1040nr',
  name: 'Non-Resident Alien Tax Return (1040NR)',
  entity_types: ['individual'],
  work_types: ['tax-return-nr'],
  tasks: [
    // Engagement & Setup
    { phase: 'Engagement & Setup', title: 'Send engagement letter to client' },
    { phase: 'Engagement & Setup', title: 'Obtain signed engagement letter' },
    { phase: 'Engagement & Setup', title: 'Confirm ITIN / SSN status' },
    { phase: 'Engagement & Setup', title: 'Set up client in tax software' },
    // Extension
    { phase: 'Extension', title: 'File extension with IRS (if needed)' },
    { phase: 'Extension', title: 'Confirm extension accepted by IRS' },
    // Document Collection
    { phase: 'Document Collection', title: 'Collect all U.S.-source income documents' },
    { phase: 'Document Collection', title: 'Verify ITIN is active and valid' },
    { phase: 'Document Collection', title: 'Collect treaty information (if applicable)' },
    { phase: 'Document Collection', title: 'Collect any Schedule C income (if applicable)' },
    { phase: 'Document Collection', title: 'Follow up on any missing documents' },
    // Tax Preparation
    { phase: 'Tax Preparation', title: 'Enter all U.S. income into tax software' },
    { phase: 'Tax Preparation', title: 'Apply applicable tax treaty provisions' },
    { phase: 'Tax Preparation', title: 'Include single-member LLC activity (Schedule C) if applicable' },
    { phase: 'Tax Preparation', title: 'Prepare Form 1040NR' },
    // Quality Review
    { phase: 'Quality Review', title: 'Internal review by preparer' },
    { phase: 'Quality Review', title: 'Manager / CPA review and sign-off' },
    { phase: 'Quality Review', title: 'Resolve any open questions' },
    // Client Approval
    { phase: 'Client Approval', title: 'Send Form 1040NR to client for review' },
    { phase: 'Client Approval', title: 'Obtain signed Form 8879 (e-file authorization)' },
    // Filing
    { phase: 'Filing', title: 'E-file Form 1040NR with IRS' },
    { phase: 'Filing', title: 'Confirm IRS acceptance' },
    // Wrap-Up
    { phase: 'Wrap-Up', title: 'Send client copy of completed return' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
    { phase: 'Wrap-Up', title: 'Archive documents securely' },
  ],
};

// ── S-Corp 1120-S ────────────────────────────────────────────────────────────
const TAX_SCORP: StaffTemplate = {
  id: 'tax-scorp',
  name: 'S-Corp Tax Return (1120-S)',
  entity_types: ['s-corp'],
  work_types: ['tax-return'],
  tasks: [
    // Engagement & Setup
    { phase: 'Engagement & Setup', title: 'Send engagement letter to client' },
    { phase: 'Engagement & Setup', title: 'Obtain signed engagement letter' },
    { phase: 'Engagement & Setup', title: 'Request prior year 1120-S return' },
    { phase: 'Engagement & Setup', title: 'Confirm shareholder information and ownership %' },
    // Extension
    { phase: 'Extension', title: 'File extension (Form 7004) with IRS' },
    { phase: 'Extension', title: 'Confirm extension accepted by IRS' },
    // Document Collection & Bookkeeping
    { phase: 'Document Collection', title: 'Request financial information from client' },
    { phase: 'Document Collection', title: 'Receive financial information from client' },
    { phase: 'Document Collection', title: 'Collect business bank statements' },
    { phase: 'Document Collection', title: 'Obtain payroll records and officer W-2s' },
    { phase: 'Document Collection', title: 'Collect 1099s issued to contractors' },
    { phase: 'Document Collection', title: 'Gather fixed asset additions and disposals' },
    { phase: 'Document Collection', title: 'Review health insurance premiums paid for shareholders' },
    { phase: 'Bookkeeping', title: 'Process bookkeeping' },
    { phase: 'Bookkeeping', title: 'Prepare financial statements (P&L and Balance Sheet)' },
    { phase: 'Bookkeeping', title: 'Client approves financial statements' },
    // Tax Preparation
    { phase: 'Tax Preparation', title: 'Reconcile book income to taxable income' },
    { phase: 'Tax Preparation', title: 'Prepare depreciation schedule (Form 4562)' },
    { phase: 'Tax Preparation', title: 'Calculate shareholder basis' },
    { phase: 'Tax Preparation', title: 'Verify reasonable compensation for officer(s)' },
    { phase: 'Tax Preparation', title: 'Prepare Schedule K and K-1 for each shareholder' },
    { phase: 'Tax Preparation', title: 'Prepare state business return (Form F-1120 for FL)' },
    { phase: 'Tax Preparation', title: 'Review prior year carryovers' },
    // Quality Review
    { phase: 'Quality Review', title: 'Internal review by preparer' },
    { phase: 'Quality Review', title: 'Manager / CPA review and sign-off' },
    { phase: 'Quality Review', title: 'Verify K-1 amounts tie to return' },
    { phase: 'Quality Review', title: 'Resolve any open questions' },
    // Client Approval
    { phase: 'Client Approval', title: 'Send Form 1120-S to client for review' },
    { phase: 'Client Approval', title: 'Obtain signed Form 8879-S (e-file authorization)' },
    // Federal Filing
    { phase: 'Filing — Federal', title: 'E-file federal Form 1120-S' },
    { phase: 'Filing — Federal', title: 'Confirm IRS acceptance' },
    { phase: 'Filing — Federal', title: 'Distribute signed K-1s to all shareholders' },
    // State Filing (Florida)
    { phase: 'Filing — State (FL)', title: 'E-file Florida Form F-1120' },
    { phase: 'Filing — State (FL)', title: 'Confirm Florida acceptance' },
    // Wrap-Up
    { phase: 'Wrap-Up', title: 'Send client copy of completed return' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
    { phase: 'Wrap-Up', title: 'Archive documents securely' },
    { phase: 'Wrap-Up', title: 'Note year-end planning items' },
  ],
};

// ── Partnership / Multi-Member LLC — 1065 ────────────────────────────────────
const TAX_PARTNERSHIP: StaffTemplate = {
  id: 'tax-partnership',
  name: 'Partnership / LLC Multi-Member Return (1065)',
  entity_types: ['partnership', 'llc-multi'],
  work_types: ['tax-return'],
  tasks: [
    // Engagement & Setup
    { phase: 'Engagement & Setup', title: 'Send engagement letter to client' },
    { phase: 'Engagement & Setup', title: 'Obtain signed engagement letter' },
    { phase: 'Engagement & Setup', title: 'Request prior year 1065 return' },
    { phase: 'Engagement & Setup', title: 'Confirm partner information and ownership %' },
    // Extension
    { phase: 'Extension', title: 'Request / file extension (Form 7004) with IRS' },
    { phase: 'Extension', title: 'Confirm extension accepted by IRS' },
    // Document Collection & Bookkeeping
    { phase: 'Document Collection', title: 'Request financial information from client' },
    { phase: 'Document Collection', title: 'Receive financial information from client' },
    { phase: 'Document Collection', title: 'Collect business bank statements' },
    { phase: 'Document Collection', title: 'Obtain guaranteed payment records' },
    { phase: 'Document Collection', title: 'Collect 1099s issued to contractors' },
    { phase: 'Document Collection', title: 'Gather fixed asset additions and disposals' },
    { phase: 'Bookkeeping', title: 'Process bookkeeping' },
    { phase: 'Bookkeeping', title: 'Prepare financial statements (P&L and Balance Sheet)' },
    { phase: 'Bookkeeping', title: 'Client approves financial statements' },
    // Tax Preparation
    { phase: 'Tax Preparation', title: 'Reconcile book income to taxable income' },
    { phase: 'Tax Preparation', title: 'Prepare depreciation schedule (Form 4562)' },
    { phase: 'Tax Preparation', title: 'Calculate partner capital accounts' },
    { phase: 'Tax Preparation', title: 'Prepare Schedule K and K-1 for each partner' },
    { phase: 'Tax Preparation', title: 'Determine if Form 8804 is required (foreign partners)' },
    { phase: 'Tax Preparation', title: 'Review prior year carryovers' },
    // Quality Review
    { phase: 'Quality Review', title: 'Internal review by preparer' },
    { phase: 'Quality Review', title: 'Manager / CPA review and sign-off' },
    { phase: 'Quality Review', title: 'Verify K-1 amounts tie to return' },
    { phase: 'Quality Review', title: 'Resolve any open questions' },
    // Client Approval
    { phase: 'Client Approval', title: 'Send Form 1065 to client for review' },
    { phase: 'Client Approval', title: 'Obtain signed Form 8879 (e-file authorization)' },
    // Federal Filing
    { phase: 'Filing — Federal', title: 'E-file federal Form 1065' },
    { phase: 'Filing — Federal', title: 'Confirm IRS acceptance' },
    { phase: 'Filing — Federal', title: 'Distribute signed K-1s to all partners' },
    { phase: 'Filing — Federal', title: 'File Form 8804 / 8805 (if foreign partners)' },
    { phase: 'Filing — Federal', title: 'Send signed Form 8804 to IRS' },
    // Wrap-Up
    { phase: 'Wrap-Up', title: 'Send client copy of completed return' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
    { phase: 'Wrap-Up', title: 'Archive documents securely' },
  ],
};

// ── C-Corp 1120 ──────────────────────────────────────────────────────────────
const TAX_CCORP: StaffTemplate = {
  id: 'tax-ccorp',
  name: 'C-Corp Tax Return (1120)',
  entity_types: ['c-corp'],
  work_types: ['tax-return'],
  tasks: [
    // Engagement & Setup
    { phase: 'Engagement & Setup', title: 'Send engagement letter to client' },
    { phase: 'Engagement & Setup', title: 'Obtain signed engagement letter' },
    { phase: 'Engagement & Setup', title: 'Request prior year 1120 return' },
    { phase: 'Engagement & Setup', title: 'Verify corporate officer information' },
    // Extension
    { phase: 'Extension', title: 'File extension (Form 7004) with IRS' },
    { phase: 'Extension', title: 'Confirm extension accepted by IRS' },
    // Document Collection & Bookkeeping
    { phase: 'Document Collection', title: 'Request financial information from client' },
    { phase: 'Document Collection', title: 'Receive financial information from client' },
    { phase: 'Document Collection', title: 'Collect business bank statements' },
    { phase: 'Document Collection', title: 'Obtain payroll records and W-2 summary' },
    { phase: 'Document Collection', title: 'Collect 1099s issued to contractors' },
    { phase: 'Document Collection', title: 'Gather fixed asset schedule (additions / disposals)' },
    { phase: 'Document Collection', title: 'Review dividend distributions and corporate minutes' },
    { phase: 'Document Collection', title: 'Verify estimated tax payments made' },
    { phase: 'Bookkeeping', title: 'Process bookkeeping' },
    { phase: 'Bookkeeping', title: 'Prepare financial statements (P&L and Balance Sheet)' },
    { phase: 'Bookkeeping', title: 'Client approves financial statements' },
    // Tax Preparation
    { phase: 'Tax Preparation', title: 'Reconcile book income to taxable income (Sch. M-1/M-3)' },
    { phase: 'Tax Preparation', title: 'Prepare depreciation schedule (Form 4562)' },
    { phase: 'Tax Preparation', title: 'Review and apply NOL carryforwards' },
    { phase: 'Tax Preparation', title: 'Calculate estimated tax for next year' },
    // Quality Review
    { phase: 'Quality Review', title: 'Internal review by preparer' },
    { phase: 'Quality Review', title: 'Manager / CPA review and sign-off' },
    { phase: 'Quality Review', title: 'Verify Sch. M-1 reconciliation' },
    { phase: 'Quality Review', title: 'Resolve any open questions' },
    // Client Approval
    { phase: 'Client Approval', title: 'Send Form 1120 to client for review' },
    { phase: 'Client Approval', title: 'Obtain officer signature on Form 8879-C' },
    // Federal Filing
    { phase: 'Filing — Federal', title: 'E-file federal Form 1120' },
    { phase: 'Filing — Federal', title: 'Confirm IRS acceptance' },
    // State Filing (Florida)
    { phase: 'Filing — State (FL)', title: 'Prepare Florida Form F-1120' },
    { phase: 'Filing — State (FL)', title: 'Obtain client signature on FL return' },
    { phase: 'Filing — State (FL)', title: 'E-file Florida Form F-1120' },
    { phase: 'Filing — State (FL)', title: 'Confirm Florida acceptance' },
    // Wrap-Up
    { phase: 'Wrap-Up', title: 'Send client copy of completed return' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
    { phase: 'Wrap-Up', title: 'Archive documents securely' },
    { phase: 'Wrap-Up', title: 'Schedule year-end tax planning meeting' },
  ],
};

// ── Foreign-Owned LLC — Form 1120 + 5472 ────────────────────────────────────
const TAX_5472: StaffTemplate = {
  id: 'tax-5472',
  name: 'Foreign-Owned LLC — Form 1120 + 5472',
  entity_types: ['llc-single'],
  work_types: ['tax-return-5472'],
  tasks: [
    // Engagement & Setup
    { phase: 'Engagement & Setup', title: 'Send engagement letter to client' },
    { phase: 'Engagement & Setup', title: 'Obtain signed engagement letter' },
    { phase: 'Engagement & Setup', title: 'Confirm EIN and foreign ownership structure' },
    // Extension
    { phase: 'Extension', title: 'Request / file extension for Form 5472 if needed' },
    { phase: 'Extension', title: 'Confirm extension accepted' },
    // Document Collection & Bookkeeping
    { phase: 'Document Collection', title: 'Request financial information from client' },
    { phase: 'Document Collection', title: 'Receive financial information from client' },
    { phase: 'Document Collection', title: 'Collect bank statements and transaction records' },
    { phase: 'Bookkeeping', title: 'Process bookkeeping' },
    { phase: 'Bookkeeping', title: 'Prepare financial statements' },
    { phase: 'Bookkeeping', title: 'Client approves financial statements' },
    // Tax Preparation
    { phase: 'Tax Preparation', title: 'Prepare Form 1120 (pro-forma, for 5472 attachment)' },
    { phase: 'Tax Preparation', title: 'Prepare Form 5472 (reportable transactions)' },
    // Quality Review
    { phase: 'Quality Review', title: 'Internal review by preparer' },
    { phase: 'Quality Review', title: 'Manager / CPA review and sign-off' },
    { phase: 'Quality Review', title: 'Verify all reportable transactions reported' },
    // Client Approval
    { phase: 'Client Approval', title: 'Send Form 5472 package to client for review' },
    { phase: 'Client Approval', title: 'Obtain client signature on Form 5472' },
    // Filing
    { phase: 'Filing', title: 'File Form 1120 + 5472 with IRS (paper or e-file)' },
    { phase: 'Filing', title: 'Confirm IRS receipt / acceptance' },
    // Wrap-Up
    { phase: 'Wrap-Up', title: 'Send client copy of filed return' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
    { phase: 'Wrap-Up', title: 'Archive documents securely' },
  ],
};

// ── Non-Profit — Form 990 ────────────────────────────────────────────────────
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
    { phase: 'Extension', title: 'File extension (Form 8868) if needed' },
    { phase: 'Extension', title: 'Confirm extension accepted' },
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
    { phase: 'Client Approval', title: 'Obtain board approval and officer signature' },
    { phase: 'Filing', title: 'E-file Form 990' },
    { phase: 'Filing', title: 'Confirm IRS acceptance' },
    { phase: 'Wrap-Up', title: 'Post 990 publicly (3-year public disclosure requirement)' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice' },
    { phase: 'Wrap-Up', title: 'Archive documents securely' },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────
   ITIN APPLICATION TEMPLATE
   For clients who need an Individual Taxpayer Identification Number.
───────────────────────────────────────────────────────────────────────── */

const ITIN_APPLICATION: StaffTemplate = {
  id: 'itin-application',
  name: 'ITIN Application (Form W-7)',
  entity_types: [],
  work_types: ['itin'],
  tasks: [
    // Engagement & Setup
    { phase: 'Engagement & Setup', title: 'Send engagement letter to client' },
    { phase: 'Engagement & Setup', title: 'Obtain signed engagement letter' },
    { phase: 'Engagement & Setup', title: 'Confirm client is ineligible for SSN' },
    // Document Collection
    { phase: 'Document Collection', title: 'Collect government-issued photo ID (passport preferred)' },
    { phase: 'Document Collection', title: 'Collect foreign national ID (if applicable)' },
    { phase: 'Document Collection', title: 'Confirm ID documents meet IRS CAA requirements' },
    { phase: 'Document Collection', title: 'Collect tax return to be attached to W-7 (if required)' },
    // ITIN Package Preparation
    { phase: 'ITIN Preparation', title: 'Prepare Form W-7 (ITIN Application)' },
    { phase: 'ITIN Preparation', title: 'Certify identity documents as CAA (if applicable)' },
    { phase: 'ITIN Preparation', title: 'Compile complete ITIN package (W-7 + ID + tax return)' },
    // Client Signature
    { phase: 'Client Signature', title: 'Send ITIN package to client for review' },
    { phase: 'Client Signature', title: 'Client signs Form W-7 and all required documents' },
    { phase: 'Client Signature', title: 'Receive fully executed ITIN package back from client' },
    // Submission
    { phase: 'Submission', title: 'Mail ITIN package to IRS (Austin, TX ITIN Operations)' },
    { phase: 'Submission', title: 'Send client confirmation of mailing with tracking number' },
    // Tracking
    { phase: 'Tracking', title: 'Track ITIN application status (allow 7–11 weeks)' },
    { phase: 'Tracking', title: 'Receive ITIN letter from IRS' },
    { phase: 'Tracking', title: 'Notify client of ITIN and store securely in file' },
    // Wrap-Up
    { phase: 'Wrap-Up', title: 'Update client file with new ITIN' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
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
    { phase: 'Reporting', title: 'Client approves / acknowledges financial package' },
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
   NEW CLIENT ONBOARDING TEMPLATE
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
    { phase: 'Data Collection', title: 'Collect Social Security card(s) or ITIN documentation' },
    { phase: 'Data Collection', title: 'Obtain EIN letter (businesses)' },
    { phase: 'Data Collection', title: 'Obtain Articles of Incorporation / Organization' },
    { phase: 'Data Collection', title: 'Confirm Sunbiz / state business registration is current' },
    { phase: 'Data Collection', title: 'Collect prior year tax returns (last 2 years)' },
    { phase: 'Data Collection', title: 'Collect most recent financial statements' },
    { phase: 'Data Collection', title: 'Gather all payroll access and records (if applicable)' },
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
   SUNBIZ / ANNUAL REPORT RENEWAL TEMPLATE
   Used for Florida clients who need their business registration renewed.
───────────────────────────────────────────────────────────────────────── */

const SUNBIZ_RENEWAL: StaffTemplate = {
  id: 'sunbiz-renewal',
  name: 'Sunbiz Annual Report / Business Renewal (Florida)',
  entity_types: [],
  work_types: ['other'],
  tasks: [
    { phase: 'Preparation', title: 'Verify current registered agent information' },
    { phase: 'Preparation', title: 'Confirm business address and officer/member list is up to date' },
    { phase: 'Preparation', title: 'Check Sunbiz for any pending renewal notices or status issues' },
    { phase: 'Client Approval', title: 'Confirm filing details with client' },
    { phase: 'Filing', title: 'File annual report on Sunbiz (sunbiz.org)' },
    { phase: 'Filing', title: 'Pay Florida annual report fee' },
    { phase: 'Filing', title: 'Confirm renewal accepted and record updated' },
    { phase: 'Wrap-Up', title: 'Send confirmation to client' },
    { phase: 'Wrap-Up', title: 'Update client file with renewal date' },
    { phase: 'Wrap-Up', title: 'Update billing and invoice client' },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────
   ALL TEMPLATES REGISTRY
───────────────────────────────────────────────────────────────────────── */

export const ALL_STAFF_TEMPLATES: StaffTemplate[] = [
  // Tax Returns
  TAX_INDIVIDUAL,
  TAX_LLC_SINGLE,
  TAX_1040NR,
  TAX_SCORP,
  TAX_PARTNERSHIP,
  TAX_CCORP,
  TAX_5472,
  TAX_NONPROFIT,
  // Specialty
  ITIN_APPLICATION,
  SUNBIZ_RENEWAL,
  // Operations
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
