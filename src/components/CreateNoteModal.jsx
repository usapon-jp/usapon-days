import React, { useState } from 'react';
import { X } from 'lucide-react';

const CATEGORIES = [
  { id: 'todo', label: 'TODO', color: 'var(--color-todo)', textColor: '#D4B01A' },
  { id: 'routine', label: 'ルーティン', color: 'var(--color-routine)', textColor: '#5B9E77' },
  { id: 'relax', label: 'のんびり', color: 'var(--color-relax)', textColor: '#6296C2' },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function CreateNoteModal({ onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('todo');
  const [durationMin, setDurationMin] = useState(30);

  // 繰り返し設定
  const [isRepeat, setIsRepeat] = useState(false);
  const [repeatType, setRepeatType] = useState('daily');
  const [repeatDays, setRepeatDays] = useState([]); // 0:日, 1:月...

  const toggleDay = (dayIndex) => {
    if (repeatDays.includes(dayIndex)) {
      setRepeatDays(repeatDays.filter(d => d !== dayIndex));
    } else {
      setRepeatDays([...repeatDays, dayIndex]);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    
    const noteData = {
      title,
      category,
      durationMin,
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
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-sub)' }}
        >
          <X size={24} />
        </button>

        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>付箋をつくる</h3>

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
                style={{ 
                  flex: 1, padding: '12px 0', borderRadius: '12px', border: 'none',
                  backgroundColor: cat.color, color: cat.textColor, fontWeight: 'bold',
                  opacity: category === cat.id ? 1 : 0.4,
                  transform: category === cat.id ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s', cursor: 'pointer',
                  boxShadow: category === cat.id ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 繰り返し設定 (ルーティン時のみ) */}
        {category === 'routine' && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px', cursor: 'pointer' }}>
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
                        <div 
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
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-sub)', marginBottom: '8px' }}>目安時間（後から伸縮できます）</label>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', WebkitOverflowScrolling: 'touch' }}>
            {DURATIONS.map(mins => (
              <button 
                key={mins}
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
        </div>

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
          机に貼る
        </button>

      </div>
    </div>
  );
}
