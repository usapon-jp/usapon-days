import { useState } from 'react';
import { ArrowLeft, Check, Heart, MoreHorizontal, Pencil, Plus } from 'lucide-react';

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

const createChecklistItem = (text = '') => ({
  id: `c${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  text,
  done: false
});

const todayKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function MemoView({ setAppData, onNavigate }) {
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

  const addItem = (afterId = null) => {
    setItems(current => {
      const nextItem = createChecklistItem('');
      if (!afterId) return [...current, nextItem];
      const index = current.findIndex(item => item.id === afterId);
      if (index === -1) return [...current, nextItem];
      return [...current.slice(0, index + 1), nextItem, ...current.slice(index + 1)];
    });
  };

  const handleKeyDown = (event, item) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addItem(item.id);
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
      checklist: cleanItems.map(item => ({ id: item.id, text: item.text, done: false })),
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
          {items.slice(0, 5).map((item, index) => (
            <label key={item.id} className="memo-line-row">
              <span className="memo-circle" aria-hidden="true" />
              <input
                value={item.text}
                placeholder={index === 0 ? '買い物' : 'やること'}
                onChange={(event) => updateItem(item.id, event.target.value)}
                onKeyDown={(event) => handleKeyDown(event, item)}
              />
            </label>
          ))}
        </div>
        <img src={buddy.src} alt={buddy.alt} />
      </section>

      <div className="memo-pencil" aria-hidden="true">✏️</div>

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
        <button type="button" className="memo-heart" aria-label="お気に入り">
          <Heart size={20} />
        </button>
      </div>
    </div>
  );
}
