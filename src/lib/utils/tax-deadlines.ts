import type { EntityType } from '@/lib/types/database';

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  'individual':  'Individual (1040)',
  'sole-prop':   'Sole Proprietor (Sch. C)',
  'llc-single':  'LLC – Single Member',
  'llc-multi':   'LLC – Multi-Member (1065)',
  's-corp':      'S-Corporation (1120-S)',
  'c-corp':      'C-Corporation (1120)',
  'partnership': 'Partnership (1065)',
  'non-profit':  'Non-Profit (990)',
};

export const ENTITY_TYPE_SHORT: Record<EntityType, string> = {
  'individual':  'Individual',
  'sole-prop':   'Sole Prop',
  'llc-single':  'LLC (Single)',
  'llc-multi':   'LLC (Multi)',
  's-corp':      'S-Corp',
  'c-corp':      'C-Corp',
  'partnership': 'Partnership',
  'non-profit':  'Non-Profit',
};

/** Returns a YYYY-MM-DD string for the default tax deadline for the given entity type.
 *  Pass a specific `taxYear` (e.g. 2025) to calculate for that year; defaults to current year. */
export function getDefaultDeadline(entityType: EntityType, taxYear?: number): string {
  const year = (taxYear ?? new Date().getFullYear()) + 1; // deadline is filed *after* the tax year

  switch (entityType) {
    case 's-corp':
    case 'partnership':
    case 'llc-multi':
      return `${year}-03-15`; // March 15

    case 'non-profit':
      return `${year}-05-15`; // May 15

    case 'individual':
    case 'sole-prop':
    case 'llc-single':
    case 'c-corp':
    default:
      return `${year}-04-15`; // April 15
  }
}

/** Human-readable deadline description */
export function getDeadlineLabel(entityType: EntityType): string {
  switch (entityType) {
    case 's-corp':
    case 'partnership':
    case 'llc-multi':
      return 'March 15 (S-Corp/Partnership)';
    case 'non-profit':
      return 'May 15 (Non-Profit)';
    default:
      return 'April 15 (Federal)';
  }
}
