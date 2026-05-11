import { format } from 'date-fns';
import { StickyNote, CalendarClock, Trees } from 'lucide-react';

export default function HomeView({ appData, onNavigate }) {
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todos = appData.todos || [];
  const todayNotes = appData.schedule?.[todayKey] || [];
  const activeTodos = todos.filter(note => note.status !== 'paused');
  const pausedTodos = todos.filter(note => note.status === 'paused');

  return (
    <div className="home-view">
      <header className="app-header" style={{ padding: '8px 20px' }}>
        <h1 className="app-title">
          <span style={{ fontSize: '28px' }}>🐥</span> うさぽんDAYS
        </h1>
      </header>

      <section className="home-summary">
        <div>
          <p className="home-kicker">今日のようす</p>
          <h2>ゆっくり貼って、できたら動かす</h2>
        </div>
        <div className="home-stats" aria-label="付箋の数">
          <span><strong>{todayNotes.length}</strong>今日</span>
          <span><strong>{activeTodos.length}</strong>付箋</span>
          <span><strong>{pausedTodos.length}</strong>休み</span>
        </div>
      </section>

      <nav className="home-menu" aria-label="ホームメニュー">
        <HomeMenuCard
          icon={<StickyNote size={30} color="#D4B01A" />}
          title="ふせん"
          description="TODOとひとやすみ中の付箋"
          color="var(--color-todo)"
          onClick={() => onNavigate('todo')}
        />

        <HomeMenuCard
          icon={<CalendarClock size={30} color="#5B9E77" />}
          title="スケジュール"
          description="今日の予定を組み立てる"
          color="var(--color-routine)"
          onClick={() => onNavigate('today')}
        />

        <HomeMenuCard
          icon={<Trees size={30} color="#6296C2" />}
          title="日記を書く"
          description="今日の景色と記録"
          color="var(--color-relax)"
          onClick={() => onNavigate('diary')}
        />
      </nav>
    </div>
  );
}

function HomeMenuCard({ icon, title, description, color, onClick }) {
  return (
    <button className="home-menu-card" onClick={onClick}>
      <span className="home-menu-icon" style={{ backgroundColor: color }}>
        {icon}
      </span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </button>
  );
}
