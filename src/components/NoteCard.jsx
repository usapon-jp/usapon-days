import { Play, Trash2 } from 'lucide-react';

const formatDueDate = (dueDate) => {
  if (!dueDate) return null;
  const [, month, day] = dueDate.split('-');
  if (!month || !day) return dueDate;
  return `${Number(month)}/${Number(day)}まで`;
};

export default function NoteCard({ note, onMoveToToday, onDelete }) {
  const checklist = Array.isArray(note.checklist) ? note.checklist : [];
  const tags = Array.isArray(note.tags) ? note.tags : [];
  const shownChecklist = checklist.slice(0, 2);
  const remainingCount = Math.max(checklist.length - shownChecklist.length, 0);
  const hasDetails = Boolean(note.memo?.trim()) || checklist.length > 0;
  const dueLabel = formatDueDate(note.dueDate);

  return (
    <article className={`note-card note-card-${note.category || 'todo'}`}>
      {hasDetails && (
        <img
          className="note-card-detail-icon"
          src={`${import.meta.env.BASE_URL}assets/icons/detail-note.svg`}
          alt="詳細あり"
        />
      )}

      <div className="note-card-main">
        <div className="note-card-title-row">
          <h3 className="note-card-title">{note.title}</h3>
          {dueLabel && <span className="note-card-due">{dueLabel}</span>}
        </div>

        {shownChecklist.length > 0 && (
          <ul className="note-card-checklist">
            {shownChecklist.map((item, index) => (
              <li key={item.id || `${note.id}-check-${index}`} className={item.done ? 'is-done' : ''}>
                <span className="note-card-checkmark">{item.done ? '✓' : ''}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        )}

        {(remainingCount > 0 || tags.length > 0) && (
          <div className="note-card-footer">
            {remainingCount > 0 && (
              <span className="note-card-more">あと{remainingCount}件</span>
            )}
            {tags.map(tag => (
              <span key={tag} className="note-card-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="note-card-actions">
        <button
          className="note-card-action"
          onClick={() => onMoveToToday(note)}
          title="今日のスケジュールに追加"
          aria-label="今日のスケジュールに追加"
        >
          <Play size={17} color="var(--color-primary)" />
        </button>
        <button
          className="note-card-action"
          onClick={() => onDelete(note.id)}
          aria-label="削除"
        >
          <Trash2 size={17} color="#A0A0A0" />
        </button>
      </div>
    </article>
  );
}
