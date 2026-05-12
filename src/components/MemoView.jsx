import { useRef, useState } from 'react';
import { ArrowLeft, Check, MoreHorizontal, Plus } from 'lucide-react';

const CATEGORIES = [
  { id: 'relax', color: '#EAF5E8', label: 'のんびり' },
  { id: 'wakuwaku', color: '#FFF5BD', label: 'わくわく' },
  { id: 'todo', color: '#E8F4FA', label: 'TODO' },
  { id: 'routine', color: '#FFF8E8', label: 'ルーティン' }
];

const CATEGORY_BUDDIES = {
  todo: { src: `${import.meta.env.BASE_URL}assets/usa.png`, alt: 'グレーのうさぎ' },
  routine: { src: `${import.meta.env.BASE_URL}assets/pon.png`, alt: '茶色のうさぎ' },
  relax: { src: `${import.meta.env.BASE_URL}assets/piyo.png`, alt: 'ひよこ' },
  wakuwaku: { src: `${import.meta.env.BASE_URL}assets/lemon.png`, alt: 'レモン' }
};

const generateId = () => Math.random().toString(36).slice(2, 11);

const createChecklistItem = (text = '', done = false) => ({
  id: `c${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  text,
  done
});

const todayKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function MemoView({ setAppData, onNavigate }) {
  const inputRefs = useRef({});
  const [category, setCategory] = useState('relax');
  const [items, setItems] = useState([
    createChecklistItem('買い物'),
    createChecklistItem('ハガキ返送'),
    createChecklistItem('郵便局')
  ]);
  const buddy = CATEGORY_BUDDIES[category] || CATEGORY_BUDDIES.relax;
  const cleanItems = items.map(item => ({ ...item, text: item.text.trim() })).filter(item => item.text);

  const updateItem = (id, text) => {
    setItems(current => current.map(item => item.id === id ? { ...item, text } : item));
  };

  const toggleItem = (id) => {
    setItems(current => current.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const focusItem = (id) => {
    window.setTimeout(() => inputRefs.current[id]?.focus(), 0);
  };

  const addItem = (afterId = null) => {
    const nextItem = createChecklistItem('');
    setItems(current => {
      if (!afterId) return [...current, nextItem];
      const index = current.findIndex(item => item.id === afterId);
      if (index === -1) return [...current, nextItem];
      return [...current.slice(0, index + 1), nextItem, ...current.slice(index + 1)];
    });
    focusItem(nextItem.id);
  };

  const handleKeyDown = (event, item, index) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addItem(item.id);
      return;
    }

    if (event.key === 'Backspace' && item.text === '' && items.length > 1) {
      event.preventDefault();
      const focusTarget = items[index - 1]?.id || items[index + 1]?.id;
      setItems(current => current.filter(currentItem => currentItem.id !== item.id));
      if (focusTarget) focusItem(focusTarget);
    }
  };

  const handleSave = () => {
    if (cleanItems.length === 0) return;
    const newNote = {
      id: generateId(),
      title: cleanItems[0].text || 'やることリスト',
      category,
      durationMin: 30,
      memo: '',
      checklist: cleanItems.map(item => ({ id: item.id, text: item.text, done: item.done })),
      tags: ['やること'],
      dueDate: null,
      plannedStartAt: null,
      alarmAt: null,
      status: 'active',
      startTime: 12 * 60,
      createdAt: todayKey()
    };

    setAppData(prev => ({
      ...prev,
      todos: [...(prev.todos || []), newNote]
    }));
    onNavigate('home');
  };

  const handleStickify = () => {
    const checkedItems = cleanItems.filter(item => item.done);
    if (checkedItems.length === 0) return;
    const dateKey = todayKey();
    const newScheduleNotes = checkedItems.map((item, index) => ({
      id: generateId(),
      title: item.text,
      category,
      durationMin: 30,
      memo: '',
      checklist: [],
      tags: ['やること'],
      dueDate: null,
      plannedStartAt: null,
      alarmAt: null,
      status: 'active',
      startTime: 12 * 60 + index * 30,
      createdAt: dateKey
    }));

    setAppData(prev => ({
      ...prev,
      schedule: {
        ...(prev.schedule || {}),
        [dateKey]: [
          ...((prev.schedule || {})[dateKey] || []),
          ...newScheduleNotes
        ]
      }
    }));
    onNavigate('today');
  };

  return (
    <div className="memo-view">
      <header className="memo-header">
        <button type="button" onClick={() => onNavigate('home')} aria-label="戻る">
          <ArrowLeft size={22} />
        </button>
        <button type="button" aria-label="メニュー">
          <MoreHorizontal size={22} />
        </button>
      </header>

      <section className="memo-hero">
        <h1>やることリスト <span>☘</span></h1>
        <p>一旦全部書き出して<br />あとでふせんにして<br />ひとつずつはれるよ。</p>
      </section>

      <section className={`memo-sticky-preview sticky-note ${category}`}>
        <span className="memo-tape" aria-hidden="true" />
        <div className="memo-lines">
          {items.slice(0, 7).map((item, index) => (
            <label key={item.id} className="memo-line-row">
              <input
                className="memo-checkbox"
                type="checkbox"
                checked={item.done}
                onChange={() => toggleItem(item.id)}
                aria-label={`${index + 1}行目をチェック`}
              />
              <input
                ref={(element) => {
                  if (element) inputRefs.current[item.id] = element;
                }}
                className="memo-text-input"
                value={item.text}
                placeholder={index === 0 ? '買い物' : 'やること'}
                onChange={(event) => updateItem(item.id, event.target.value)}
                onKeyDown={(event) => handleKeyDown(event, item, index)}
              />
            </label>
          ))}
        </div>
        <img src={buddy.src} alt={buddy.alt} />
      </section>

      <button className="memo-edit-button" type="button" onClick={() => focusItem(items[0]?.id)}>
        編集する
      </button>

      <div className="memo-swatches" aria-label="付箋カラー">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            className={category === cat.id ? 'is-selected' : ''}
            style={{ background: cat.color }}
            onClick={() => setCategory(cat.id)}
            aria-label={cat.label}
          />
        ))}
      </div>

      <div className="memo-actions">
        <button type="button" className="memo-secondary" onClick={() => addItem()}>
          <Plus size={16} />
          行を追加
        </button>
        <button type="button" className="memo-primary" onClick={handleSave} disabled={cleanItems.length === 0}>
          <Check size={16} />
          ホームに追加
        </button>
        <button type="button" className="memo-stickify" onClick={handleStickify} disabled={!cleanItems.some(item => item.done)}>
          付箋化する
        </button>
      </div>
    </div>
  );
}
