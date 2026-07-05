/**
 * All user-facing Hebrew strings, centralized.
 * Future i18n = swap this module per locale.
 */
export const STRINGS = {
  appTitle: 'סטודיו אבחון ארגוני',
  modes: {
    diagnosis: 'אבחון',
    tools: 'כלים',
  },
  nav: {
    back: 'חזור',
    next: 'הבא',
    stepOf: (current: number, total: number) => `שלב ${current} מתוך ${total}`,
    undo: 'ביטול פעולה',
  },
  actions: {
    export: 'ייצוא',
    import: 'טעינה',
    reset: 'התחלה מחדש',
    add: 'הוספה',
    delete: 'מחיקה',
    edit: 'עריכה',
    save: 'שמירה',
    cancel: 'ביטול',
    confirm: 'אישור',
  },
  confirmations: {
    resetTitle: 'להתחיל מחדש?',
    resetBody: 'כל הנתונים של האבחון הנוכחי יימחקו. פעולה זו אינה הפיכה.',
    deleteTitle: 'למחוק את הפריט?',
    importTitle: 'לטעון קובץ?',
    importBody: 'טעינת קובץ תחליף את כל הנתונים הנוכחיים.',
  },
  feedback: {
    saved: 'נשמר ✓',
    imported: 'הקובץ נטען בהצלחה',
    exported: 'הקובץ ירד בהצלחה',
    importError: 'לא ניתן לקרוא את הקובץ — ודאו שזהו קובץ ייצוא תקין של המערכת',
    deleted: 'נמחק',
    undone: 'הפעולה בוטלה',
  },
  theme: {
    toggleLight: 'מעבר למצב בהיר',
    toggleDark: 'מעבר למצב כהה',
  },
} as const;
