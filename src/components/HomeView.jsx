import React from 'react';
import { StickyNote, CalendarClock, Trees } from 'lucide-react';

export default function HomeView({ appData, onNavigate }) {
  return (
    <div style={{ padding: '20px 0' }}>
      <header className="app-header">
        <h1 className="app-title">
          <span style={{ fontSize: '28px' }}>🐥</span> うさぽんDAYS
        </h1>
      </header>

      <div className="card" onClick={() => onNavigate('todo')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ padding: '12px', backgroundColor: 'var(--color-todo)', borderRadius: '50%' }}>
          <StickyNote size={32} color="#D4B01A" />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>ふせん</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-sub)' }}>TODOリスト・ひとやすみ中の付箋</p>
        </div>
      </div>

      <div className="card" onClick={() => onNavigate('schedule')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ padding: '12px', backgroundColor: 'var(--color-routine)', borderRadius: '50%' }}>
          <CalendarClock size={32} color="#5B9E77" />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>スケジュール</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-sub)' }}>今日の予定を組み立てる</p>
        </div>
      </div>

      <div className="card" onClick={() => onNavigate('diary')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ padding: '12px', backgroundColor: 'var(--color-relax)', borderRadius: '50%' }}>
          <Trees size={32} color="#6296C2" />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>お庭を見る</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-sub)' }}>今日の景色と記録</p>
        </div>
      </div>
    </div>
  );
}
