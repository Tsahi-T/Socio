/**
 * The diagnosis flow — pure data, no component imports.
 * Reordering steps or adding new ones happens here only.
 * `id` doubles as the TXT section heading, so keep ids stable.
 */
import type { FlowStep } from './types';

export const FLOW: readonly FlowStep[] = [
  {
    id: 'Organization',
    type: 'organization-name',
    title: 'שם הארגון',
    description: 'איזה ארגון נאבחן היום?',
    navLabel: 'ארגון',
  },
  {
    id: 'Associations - Organization',
    type: 'association-sun',
    title: 'שמש אסוציאציות — הארגון',
    description: 'כאשר אתם חושבים על הארגון, אילו מילים עולות לכם לראש?',
    navLabel: 'שמש: ארגון',
  },
  {
    id: 'Associations - Customers',
    type: 'association-sun',
    title: 'שמש אסוציאציות — לקוחות',
    description: 'כאשר אתם חושבים כיצד הלקוחות תופסים אותנו, אילו מילים עולות לכם?',
    navLabel: 'שמש: לקוחות',
  },
  {
    id: 'SWOT',
    type: 'swot',
    title: 'ניתוח SWOT',
    description: 'מיינו את התובנות לחוזקות, חולשות, הזדמנויות ואיומים.',
    navLabel: 'SWOT',
  },
  {
    id: 'Focus Topics',
    type: 'focus-topics',
    title: 'במה נכון להתמקד?',
    description: 'נסחו נושאים אפשריים להתמקדות — משפט אחד לכל נושא.',
    navLabel: 'נושאים',
  },
  {
    id: 'Voting',
    type: 'voting',
    title: 'הצבעה',
    description: 'כל משתתף בוחר בדיוק שלושה נושאים. המנחה מזין את הקולות.',
    navLabel: 'הצבעה',
  },
] as const;

export const TOTAL_STEPS = FLOW.length;
