/**
 * Mind Board — a free-form sticky-notes canvas for facilitators.
 * Independent tool (not part of the diagnosis flow): its own toolbar,
 * persistence, and TXT export/import.
 */
import { useRef, useState, type MouseEvent } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useMindBoard } from './state';
import { StickyNoteCard } from './StickyNoteCard';
import { ConnectionsLayer } from './ConnectionsLayer';
import { buildBoardTxt, parseBoardTxt } from './boardTxt';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  NOTE_COLORS,
  NOTE_DEFAULT_HEIGHT,
  NOTE_DEFAULT_WIDTH,
  type BoardState,
  type NoteColor,
} from './types';
import { Button } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { useToast } from '../../ui/Toast';
import { DownloadIcon, PlusIcon, TrashIcon, UploadIcon, XIcon } from '../../ui/icons';
import { downloadTxt } from '../../io/exportTxt';
import { STRINGS } from '../../i18n/strings';

export function MindBoard() {
  const { board, dispatch } = useMindBoard();
  const { show } = useToast();
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [nextColor, setNextColor] = useState<NoteColor>('yellow');
  const [confirmClear, setConfirmClear] = useState(false);
  const [pendingImport, setPendingImport] = useState<BoardState | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addNoteAt = (x: number, y: number) => {
    dispatch({ type: 'ADD_NOTE', x, y, color: nextColor });
  };

  const addNoteCentered = () => {
    const scroller = scrollRef.current;
    // Cascade new notes slightly so they never stack exactly on top of each other.
    const cascade = (board.notes.length % 8) * 28;
    const x =
      (scroller?.scrollLeft ?? 0) +
      (scroller?.clientWidth ?? 600) / 2 -
      NOTE_DEFAULT_WIDTH / 2 +
      cascade;
    const y =
      (scroller?.scrollTop ?? 0) +
      (scroller?.clientHeight ?? 400) / 2 -
      NOTE_DEFAULT_HEIGHT / 2 +
      cascade;
    addNoteAt(x, y);
  };

  const handleCanvasDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // only empty canvas
    const rect = e.currentTarget.getBoundingClientRect();
    addNoteAt(
      e.clientX - rect.left - NOTE_DEFAULT_WIDTH / 2,
      e.clientY - rect.top - NOTE_DEFAULT_HEIGHT / 2
    );
  };

  const handleConnectClick = (noteId: string) => {
    if (!connectSource) {
      setConnectSource(noteId);
      return;
    }
    if (connectSource !== noteId) {
      dispatch({ type: 'ADD_CONNECTION', fromNoteId: connectSource, toNoteId: noteId });
    }
    setConnectSource(null);
  };

  const handleExport = () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadTxt(buildBoardTxt(board), `mind-board-${date}.txt`);
    show(STRINGS.feedback.exported, 'success');
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPendingImport(parseBoardTxt(await file.text()));
    } catch {
      show(STRINGS.feedback.importError, 'error');
    }
  };

  return (
    <div className="flex h-[calc(100vh-61px)] flex-col">
      {/* Board toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2">
        <Button icon={<PlusIcon size={15} />} onClick={addNoteCentered}>
          פתק חדש
        </Button>
        <div className="flex items-center gap-1.5 px-2" role="radiogroup" aria-label="צבע פתק חדש">
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={nextColor === color}
              aria-label={`צבע ${color}`}
              onClick={() => setNextColor(color)}
              className={`size-5 rounded-full border-2 transition-transform duration-150 hover:scale-110 ${
                nextColor === color
                  ? 'scale-110 border-[var(--color-primary)]'
                  : 'border-[var(--color-border-strong)]'
              }`}
              style={{ backgroundColor: `var(--note-${color})` }}
            />
          ))}
        </div>
        <span className="hidden text-xs text-[var(--color-text-muted)] sm:inline">
          לחיצה כפולה על הלוח מוסיפה פתק
        </span>
        <div className="ms-auto flex items-center gap-1">
          {connectSource && (
            <Button
              variant="secondary"
              icon={<XIcon size={14} />}
              onClick={() => setConnectSource(null)}
            >
              ביטול חיבור — בחרו פתק יעד
            </Button>
          )}
          <Button variant="ghost" icon={<DownloadIcon size={15} />} onClick={handleExport}>
            ייצוא הלוח
          </Button>
          <Button
            variant="ghost"
            icon={<UploadIcon size={15} />}
            onClick={() => fileRef.current?.click()}
          >
            טעינת לוח
          </Button>
          <Button
            variant="danger"
            icon={<TrashIcon size={15} />}
            disabled={board.notes.length === 0}
            onClick={() => setConfirmClear(true)}
          >
            ניקוי
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div
          className="relative"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          onDoubleClick={handleCanvasDoubleClick}
        >
          <ConnectionsLayer
            board={board}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
            onDeleteConnection={(id) => dispatch({ type: 'DELETE_CONNECTION', id })}
          />
          <AnimatePresence>
            {board.notes.map((note) => (
              <StickyNoteCard
                key={note.id}
                note={note}
                connectMode={connectSource !== null}
                isConnectSource={connectSource === note.id}
                onMove={(id, x, y) => dispatch({ type: 'UPDATE_NOTE', id, patch: { x, y } })}
                onResize={(id, width, height) =>
                  dispatch({ type: 'UPDATE_NOTE', id, patch: { width, height } })
                }
                onText={(id, text) => dispatch({ type: 'UPDATE_NOTE', id, patch: { text } })}
                onColor={(id, color) => dispatch({ type: 'UPDATE_NOTE', id, patch: { color } })}
                onDelete={(id) => dispatch({ type: 'DELETE_NOTE', id })}
                onConnectClick={handleConnectClick}
              />
            ))}
          </AnimatePresence>
          {board.notes.length === 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-32 text-center text-[var(--color-text-muted)]">
              <p className="text-lg font-medium">לוח חשיבה</p>
              <p className="mt-1 text-sm">לחצו לחיצה כפולה בכל מקום כדי להוסיף פתק</p>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".txt,text/plain"
        className="hidden"
        onChange={(e) => {
          void handleImportFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        title="לנקות את הלוח?"
        body="כל הפתקים והחיבורים יימחקו. פעולה זו אינה הפיכה."
        danger
        confirmLabel="ניקוי"
        onConfirm={() => {
          dispatch({ type: 'CLEAR_BOARD' });
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        open={pendingImport !== null}
        title={STRINGS.confirmations.importTitle}
        body="טעינת קובץ לוח תחליף את הפתקים הנוכחיים."
        confirmLabel={STRINGS.actions.import}
        onConfirm={() => {
          if (pendingImport) dispatch({ type: 'IMPORT_BOARD', board: pendingImport });
          setPendingImport(null);
          show(STRINGS.feedback.imported, 'success');
        }}
        onCancel={() => setPendingImport(null)}
      />
    </div>
  );
}
