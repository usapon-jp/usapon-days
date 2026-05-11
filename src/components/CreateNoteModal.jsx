import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X, Star, Clock } from 'lucide-react';

const CATEGORIES = [
  { id: 'todo', label: 'TODO', color: 'var(--color-todo)', textColor: '#5E7F8F' },
  { id: 'routine', label: 'ルーティン', color: 'var(--color-routine)', textColor: '#7B6658' },
  { id: 'relax', label: 'のんびり', color: 'var(--color-relax)', textColor: '#5B8A67' },
  { id: 'wakuwaku', label: 'わくわく', color: 'var(--color-wakuwaku)', textColor: '#A88412' },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

const createChecklistItem = (text = '', done = false) => ({
  id: `c${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  text,
  done
});

const buildChecklist = (items) => items
  .map(item => ({ ...item, text: item.text.trim() }))
  .filter(item => item.text);

const buildTags = (rawText) => rawText
  .split(/[,\s、]+/)
  .map(tag => tag.trim().replace(/^#/, ''))
  .filter(Boolean);

export default function CreateNoteModal({ appData, onClose, onSave, initialCategory = 'todo' }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [durationMin, setDurationMin] = useState(30);
  const [memo, setMemo] = useState('');
  const [checklistItems, setChecklistItems] = useState([createChecklistItem()]);
  const [tagsText, setTagsText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [plannedStartAt, setPlannedStartAt] = useState('');
  const [alarmAt, setAlarmAt] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // 繰り返し設定
  const [isRepeat, setIsRepeat] = useState(false);
  const [repeatType, setRepeatType] = useState('daily');
  const [repeatDays, setRepeatDays] = useState([]); // 0:日, 1:月...

  const favorites = appData?.favorites || [];
  const history = appData?.history || [];
  const filteredFavorites = favorites.filter(fav => fav.category === category);

  const handleSelectTemplate = (tpl) => {
    setTitle(tpl.title);
    setCategory(tpl.category);
    setDurationMin(tpl.durationMin);
    setMemo(tpl.memo || '');
    setChecklistItems(tpl.checklist?.length ? tpl.checklist.map(item => createChecklistItem(item.text, item.done)) : [createChecklistItem()]);
    setTagsText((tpl.tags || []).join(' '));
    setDueDate(tpl.dueDate || '');
    setPlannedStartAt(tpl.plannedStartAt || '');
    setAlarmAt(tpl.alarmAt || '');
    setShowDetails(Boolean(tpl.memo || tpl.dueDate || tpl.plannedStartAt || tpl.alarmAt || tpl.checklist?.length || tpl.tags?.length));
  };

  const toggleDay = (dayIndex) => {
    if (repeatDays.includes(dayIndex)) {
      setRepeatDays(repeatDays.filter(d => d !== dayIndex));
    } else {
      setRepeatDays([...repeatDays, dayIndex]);
    }
  };

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
      return [
        ...items.slice(0, index + 1),
        nextItem,
        ...items.slice(index + 1)
      ];
    });
  };

  const handleChecklistKeyDown = (event, item) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addChecklistItem(item.id);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    
    const noteData = {
      title,
      category,
      durationMin,
      memo: memo.trim(),
      checklist: buildChecklist(checklistItems),
      tags: buildTags(tagsText),
      dueDate: dueDate || null,
      plannedStartAt: plannedStartAt || null,
      alarmAt: alarmAt || null,
    };

    if (category === 'routine' && isRepeat) {
      noteData.repeat = {
        type: repeatType,
        days: repeatType === 'weekly' ? repeatDays : [],
      };
    }

    onSave(noteData);
  };

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div style={{ 
        width: '100%', maxWidth: '480px', backgroundColor: '#fff',
        borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
        padding: '24px 20px 40px', position: 'relative',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        maxHeight: '92vh',
        overflowY: 'auto'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-sub)' }}
        >
          <X size={24} />
        </button>

        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>付箋をつくる</h3>

        {/* お気に入りと履歴チップ */}
        {(filteredFavorites.length > 0 || history.length > 0) && (
          <div style={{ marginBottom: '24px' }}>
            {filteredFavorites.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <Star size={14} fill="#FFD700" color="#FFD700" />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-sub)' }}>お気に入り</span>
                </div>
                <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {filteredFavorites.map((fav, i) => (
                    <button 
                      key={i} onClick={() => handleSelectTemplate(fav)}
                      style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--color-border)', backgroundColor: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {fav.title} <span style={{ color: 'var(--color-text-sub)', fontSize: '10px' }}>{fav.durationMin}分</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {history.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <Clock size={14} color="var(--color-text-sub)" />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-sub)' }}>最近使った付箋</span>
                </div>
                <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {history.map((hist, i) => (
                    <button 
                      key={i} onClick={() => handleSelectTemplate(hist)}
                      style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '16px', border: '1px dashed var(--color-border)', backgroundColor: '#fafafa', fontSize: '12px', color: 'var(--color-text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {hist.title} <span style={{ color: 'var(--color-text-sub)', fontSize: '10px' }}>{hist.durationMin}分</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <input 
            type="text" 
            placeholder="何をする？" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ 
              width: '100%', fontSize: '18px', padding: '12px 0', 
              border: 'none', borderBottom: '2px solid var(--color-border)',
              backgroundColor: 'transparent', outline: 'none', fontWeight: 'bold'
            }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-sub)', marginBottom: '8px' }}>種類</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  if (cat.id !== 'routine') setIsRepeat(false);
                }}
                className={`sticky-note ${cat.id}`}
                style={{ 
                  flex: 1, padding: '12px 0', borderRadius: '12px', border: 'none',
                  color: cat.textColor, fontWeight: 'bold',
                  opacity: category === cat.id ? 1 : 0.58,
                  transform: category === cat.id ? 'translateY(-2px)' : 'scale(1)',
                  transition: 'all 0.2s', cursor: 'pointer',
                  boxShadow: category === cat.id ? '0 7px 14px rgba(0,0,0,0.08)' : 'none',
                  backgroundColor: cat.color
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="note-detail-toggle"
          onClick={() => setShowDetails(prev => !prev)}
          aria-expanded={showDetails}
        >
          <span>{showDetails ? '詳細を閉じる' : '詳細を追加'}</span>
          {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showDetails && (
          <div className="note-detail-fields">
            <label>
              <span>目安時間</span>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', WebkitOverflowScrolling: 'touch' }}>
                {DURATIONS.map(mins => (
                  <button 
                    key={mins}
                    type="button"
                    onClick={() => setDurationMin(mins)}
                    style={{ 
                      flexShrink: 0, padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--color-border-dark)',
                      backgroundColor: durationMin === mins ? 'var(--color-text-main)' : 'transparent',
                      color: durationMin === mins ? '#fff' : 'var(--color-text-main)',
                      fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {mins}分
                  </button>
                ))}
              </div>
            </label>

            <label>
              <span>開始予定</span>
              <input
                type="datetime-local"
                value={plannedStartAt}
                onChange={(e) => setPlannedStartAt(e.target.value)}
              />
            </label>

            <label>
              <span>締切</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>

            <label>
              <span>アラーム</span>
              <input
                type="datetime-local"
                value={alarmAt}
                onChange={(e) => setAlarmAt(e.target.value)}
              />
            </label>

            <label>
              <span>タグ</span>
              <input
                type="text"
                placeholder="旅行 しごと"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
              />
            </label>

            <label>
              <span>詳細メモ</span>
              <textarea
                rows={2}
                placeholder="あとで見返したいこと"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
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
                      onChange={(e) => updateChecklistItem(item.id, { done: e.target.checked })}
                    />
                    <input
                      type="text"
                      placeholder={index === 0 ? 'チェックすること' : '次のチェック'}
                      value={item.text}
                      onChange={(e) => updateChecklistItem(item.id, { text: e.target.value })}
                      onKeyDown={(e) => handleChecklistKeyDown(e, item)}
                    />
                  </label>
                ))}
              </div>
            </div>

            {category === 'routine' && (
              <div style={{ marginTop: '2px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px', cursor: 'pointer', color: 'var(--color-text-main)' }}>
                  <input 
                    type="checkbox" 
                    checked={isRepeat} 
                    onChange={(e) => setIsRepeat(e.target.checked)} 
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-routine)' }}
                  />
                  繰り返し設定にする
                </label>
                
                {isRepeat && (
                  <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: repeatType === 'weekly' ? '16px' : '0' }}>
                      {['daily', 'weekly', 'monthly', 'yearly'].map(type => {
                        const label = type === 'daily' ? '毎日' : type === 'weekly' ? '毎週' : type === 'monthly' ? '毎月' : '毎年';
                        const isSelected = repeatType === type;
                        return (
                          <button 
                            key={type}
                            type="button"
                            onClick={() => setRepeatType(type)}
                            style={{
                              flex: 1, padding: '8px 0', fontSize: '13px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                              backgroundColor: isSelected ? '#5B9E77' : '#fff',
                              color: isSelected ? '#fff' : 'var(--color-text-main)',
                              border: isSelected ? 'none' : '1px solid var(--color-border)',
                              transition: 'all 0.2s'
                            }}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                    
                    {repeatType === 'weekly' && (
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => {
                          const isSelected = repeatDays.includes(index);
                          return (
                            <button
                              type="button"
                              key={index}
                              onClick={() => toggleDay(index)}
                              style={{
                                width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
                                backgroundColor: isSelected ? '#5B9E77' : '#fff',
                                color: isSelected ? '#fff' : 'var(--color-text-main)',
                                border: isSelected ? 'none' : '1px solid var(--color-border)',
                                transition: 'all 0.2s'
                              }}
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button 
          onClick={handleSave}
          disabled={!title.trim() || (isRepeat && repeatType === 'weekly' && repeatDays.length === 0)}
          style={{ 
            width: '100%', padding: '16px 0', borderRadius: '16px', border: 'none',
            backgroundColor: title.trim() ? 'var(--color-primary)' : 'var(--color-border-dark)',
            color: title.trim() ? '#fff' : 'var(--color-text-sub)',
            fontSize: '16px', fontWeight: 'bold', cursor: title.trim() ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s'
          }}
        >
          スケジュールに貼る
        </button>

      </div>
    </div>
  );
}
