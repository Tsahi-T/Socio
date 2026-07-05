/**
 * "Type and press Enter" input for adding items — the primary interaction
 * across exercises. Keeps focus after adding for rapid brainstorming.
 */
import { useRef, useState, type KeyboardEvent } from 'react';
import { TextInput } from './TextInput';
import { IconButton } from './IconButton';
import { PlusIcon } from './icons';
import { sanitizeText } from '../lib/sanitize';
import { STRINGS } from '../i18n/strings';

interface AddItemInputProps {
  placeholder: string;
  onAdd: (text: string) => void;
  autoFocus?: boolean;
}

export function AddItemInput({ placeholder, onAdd, autoFocus = false }: AddItemInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const clean = sanitizeText(value);
    if (!clean) return;
    onAdd(clean);
    setValue('');
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <TextInput
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <IconButton label={STRINGS.actions.add} onClick={submit} className="shrink-0">
        <PlusIcon />
      </IconButton>
    </div>
  );
}
