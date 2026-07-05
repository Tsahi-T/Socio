/**
 * Exercise: Organization Name — the opening screen of the diagnosis.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ExerciseComponentProps, ExerciseModule, OrganizationData } from '../../engine/types';
import { useSession } from '../../state/SessionContext';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { TextInput } from '../../ui/TextInput';
import { sanitizeText } from '../../lib/sanitize';

function OrganizationNameExercise({ data, onChange }: ExerciseComponentProps<OrganizationData>) {
  const { session, setOrganizationName, goToStep } = useSession();
  const [draft, setDraft] = useState(data.name);

  const start = () => {
    const clean = sanitizeText(draft);
    if (!clean) return;
    onChange({ ...data, name: clean });
    setOrganizationName(clean);
    goToStep(session.currentIndex + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mx-auto max-w-md"
    >
      <Card className="flex flex-col gap-5 p-8">
        <TextInput
          autoFocus
          value={draft}
          placeholder='לדוגמה: צה"ל, Microsoft, חברת החשמל'
          aria-label="שם הארגון"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') start();
          }}
          className="text-center text-lg"
        />
        <Button onClick={start} disabled={!sanitizeText(draft)} className="py-3 text-base">
          התחל אבחון
        </Button>
      </Card>
    </motion.div>
  );
}

export const organizationNameModule: ExerciseModule<OrganizationData> = {
  type: 'organization-name',
  Component: OrganizationNameExercise,
  createInitialData: () => ({ kind: 'organization', name: '' }),
  toTxt: (data) => data.name,
  fromTxt: (body) => ({ kind: 'organization', name: sanitizeText(body) }),
  isDone: (data) => data.name.trim().length > 0,
};
