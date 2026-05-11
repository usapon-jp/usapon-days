import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Save } from 'lucide-react';

const CATEGORIES = [
  { id: 'todo', label: 'TODO', textColor: '#D4B01A' },
  { id: 'routine', label: 'ルーティン', textColor: '#5B9E77' },
  { id: 'relax', label: 'のんびり', textColor: '#6296C2' },
  { id: 'wakuwaku', label: 'わくわく', textColor: '#E57373' }
];

const createChecklistItem = (text = '', done = false, id = null) => ({
  id: id || `c${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  text,
  done
});

const findNoteBySource = (appData, source) => {
  if (!source) return null;
  if (source.sourceType === 'todos') {
    return (appData.todos || []).find(note => note.id === source.id) || null;
  }
  if (source.sourceType === 'routines') {
    return (appData.routines || []).find(note => note.id === source.id) || null;
  }
  if (source.sourceType === 'schedule') {
    return (appData.schedule?.[source.sourceDateKey] || []).find(note => note.id === source.id) || null;
  }
  return null;
};

const buildChecklist = (items) => items
  .map(item => ({ ...item, text: item.text.trim() }))
  .filter(item => item.text);

export default function NoteDetailView({ appData, setAppData, source, onBack }) {
  const note = useMemo(() => findNoteBySource(appData, source), [appData, source]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('todo');
  const [plannedStartAt, setPlannedStartAt] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [alarmAt, setAlarmAt] = useState('');
  const [memo, setMemo] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [checklistItems, setChecklistItems] = useState([createChecklistItem()]);

  useEffect(() => {
    if (!note) return;
    setTitle(note.title || '');
    setCategory(note.category || 'todo');
    setPlannedStartAt(note.plannedStartAt || '');
    setDueDate(note.dueDate || '');
    setAlarmAt(note.alarmAt || '');
    setMemo(note.memo || '');
    setTagsText((note.tags || []).join(' '));
    setChecklistItems(note.checklist?.length
      ? note.checklist.map(item => createChecklistItem(item.text, item.done, item.id))
      : [createChecklistItem()]
    );
  }, [note]);

  const updateChecklistItem = (id, patch) => {
    setChecklistItems(items => items.map(item => (
      item.id === id ? { ...item, ...patch } : item
    )));
  };

  const addChecklistItem = (afterId) => {
    setChecklistItems(items => {
      const nextItem = createChecklistItem();
      if (!afterId) return [...items, nextItem];
      const index = items.findIndex(item => item.id === afterId);
      if (index === -1) return [...items, nextItem];
      return [...items.slice(0, index + 1), nextItem, ...items.slice(index + 1)];
    });
  };

  const handleChecklistKeyDown = (event, item) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addChecklistItem(item.id);
    }
  };

  const handleSave = () => {
    if (!note || !title.trim()) return;
    const updatedNote = {
      ...note,
      title: title.trim(),
      category,
      plannedStartAt: plannedStartAt || null,
      dueDate: dueDate || null,
      alarmAt: alarmAt || null,
      memo: memo.trim(),
      tags: tagsText.split(/[,\s、]+/).map(tag => tag.trim().replace(/^#/, '')).filter(Boolean),
      checklist: buildChecklist(checklistItems)
    };

    setAppData(prev => {
      if (source.sourceType === 'todos') {
        return {
          ...prev,
          todos: (prev.todos || []).map(item => item.id === source.id ? updatedNote : item)
        };
      }
      if (source.sourceType === 'routines') {
        return {
          ...prev,
          routines: (prev.routines || []).map(item => item.id === source.id ? updatedNote : item)
        };
      }
      if (source.sourceType === 'schedule') {
        return {
          ...prev,
          schedule: {
            ...prev.schedule,
            [source.sourceDateKey]: (prev.schedule?.[source.sourceDateKey] || []).map(item => (
              item.id === source.id ? updatedNote : item
            ))
          }
        };
      }
      return prev;
    });

    onBack();
  };

  if (!note) {
    return (
      <div className="note-detail-view">
        <button className="note-detail-back" type="button" onClick={onBack}>
          <ArrowLeft size={22} />
          <span>週間スケジュールへ戻る</span>
        </button>
        <div className="note-detail-missing">
          <p>付箋が見つかりませんでした</p>
          <span>一覧を更新して、もう一度開いてみてください。</span>
        </div>
      </div>
    );
  }

  return (
    <div className="note-detail-view">
      <header className="note-detail-header">
        <button className="note-detail-back" type="button" onClick={onBack}>
          <ArrowLeft size={22} />
          <span>週間スケジュールへ戻る</span>
        </button>
        <h1>付箋の詳細</h1>
      </header>

      <div className="note-detail-form">
        <label className="note-detail-field">
          <span>題名</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <div className="note-detail-category">
          <span>種類</span>
          <div>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`sticky-note ${cat.id} ${category === cat.id ? 'is-selected' : ''}`}
                style={{ color: cat.textColor }}
                onClick={() => setCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="note-detail-time-grid">
          <label className="note-detail-field">
            <span>開始予定</span>
            <input type="datetime-local" value={plannedStartAt} onChange={(event) => setPlannedStartAt(event.target.value)} />
          </label>
          <label className="note-detail-field">
            <span>締切</span>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
          <label className="note-detail-field">
            <span>アラーム</span>
            <input type="datetime-local" value={alarmAt} onChange={(event) => setAlarmAt(event.target.value)} />
          </label>
        </div>

        <label className="note-detail-field">
          <span>タグ</span>
          <input placeholder="旅行 しごと" value={tagsText} onChange={(event) => setTagsText(event.target.value)} />
        </label>

        <label className="note-detail-field">
          <span>メモ</span>
          <textarea rows={4} value={memo} onChange={(event) => setMemo(event.target.value)} />
        </label>

        <div className="note-checklist-editor">
          <div className="note-checklist-editor-header">
            <span>チェックリスト</span>
            <button type="button" onClick={() => addChecklistItem()} aria-label="チェック項目を追加">
              <Plus size={16} />
            </button>
          </div>
          <div className="note-checklist-editor-items">
            {checklistItems.map((item, index) => (
              <label className="note-checklist-editor-row" key={item.id}>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(event) => updateChecklistItem(item.id, { done: event.target.checked })}
                />
                <input
                  type="text"
                  placeholder={index === 0 ? 'チェックすること' : '次のチェック'}
                  value={item.text}
                  onChange={(event) => updateChecklistItem(item.id, { text: event.target.value })}
                  onKeyDown={(event) => handleChecklistKeyDown(event, item)}
                />
              </label>
            ))}
          </div>
        </div>

        <button className="note-detail-save" type="button" onClick={handleSave} disabled={!title.trim()}>
          <Save size={18} />
          <span>保存する</span>
        </button>
      </div>
    </div>
  );
}

