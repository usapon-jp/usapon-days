import { format } from 'date-fns';
import { Bell, Check, ChevronRight, ClipboardList, Menu, Sprout } from 'lucide-react';

const CATEGORY_BUDDIES = {
  todo: { src: `${import.meta.env.BASE_URL}assets/usa.png`, alt: 'グレーのうさぎ' },
  routine: { src: `${import.meta.env.BASE_URL}assets/pon.png`, alt: '茶色のうさぎ' },
  relax: { src: `${import.meta.env.BASE_URL}assets/piyo.png`, alt: 'ひよこ' },
  wakuwaku: { src: `${import.meta.env.BASE_URL}assets/lemon.png`, alt: 'レモン' }
};

const CATEGORY_LABELS = {
  todo: 'TODO',
  routine: 'ルーティン',
  relax: 'のんびり',
  wakuwaku: 'わくわく'
};

const getStartLabel = (note) => {
  if (typeof note.startTime === 'number') {
    const hours = Math.floor(note.startTime / 60);
    const minutes = note.startTime % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  }
  if (note.plannedStartAt) {
    const timePart = note.plannedStartAt.split('T')[1];
    return timePart ? timePart.slice(0, 5) : '予定';
  }
  return '予定';
};

const getTodayNotes = (appData, todayKey) => {
  const notes = appData.schedule?.[todayKey] || [];
  return [...notes].sort((a, b) => (a.startTime ?? 9999) - (b.startTime ?? 9999));
};

const hasChecklistOrMemo = (note) => {
  const checklist = Array.isArray(note.checklist) ? note.checklist.filter(item => item.text?.trim()) : [];
  return checklist.length > 0 || Boolean(note.memo?.trim());
};

export default function HomeView({ appData, onNavigate, onOpenNoteDetail }) {
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayNotes = getTodayNotes(appData, todayKey);
  const schedulePreview = todayNotes.slice(0, 4);
  const listNotes = todayNotes.filter(hasChecklistOrMemo).slice(0, 6);

  const openScheduleDetail = (note) => {
    onOpenNoteDetail?.({
      sourceType: 'schedule',
      sourceDateKey: todayKey,
      id: note.id,
      returnLabel: 'ホームへ戻る'
    }, 'home');
  };

  return (
    <div className="home-view">
      <header className="home-topbar">
        <button className="home-icon-button" type="button" aria-label="メニュー">
          <Menu size={22} />
        </button>
        <h1>うさぽんデイズ</h1>
        <button className="home-icon-button" type="button" aria-label="お知らせ">
          <Bell size={21} />
        </button>
      </header>

      <section className="home-greeting" aria-label="今日のあいさつ">
        <img src={`${import.meta.env.BASE_URL}assets/piyo.png`} alt="ピヨ" />
        <div>
          <p>おはよう！</p>
          <span>今日もいっしょに<br />すてきな1日をつくろう〜</span>
        </div>
      </section>

      <HomeSection
        icon={<ClipboardList size={16} />}
        title="きょうのスケジュール"
        actionLabel="すべて見る"
        onAction={() => onNavigate('today')}
      >
        {schedulePreview.length > 0 ? (
          <div className="home-schedule-list">
            {schedulePreview.map(note => (
              <button
                key={note.id}
                type="button"
                className={`home-schedule-row ${note.status === 'completed' ? 'is-completed' : ''}`}
                onClick={() => openScheduleDetail(note)}
              >
                <span className="home-schedule-check">
                  {note.status === 'completed' && <Check size={12} />}
                </span>
                <span className="home-schedule-title">{note.title}</span>
                <small>{getStartLabel(note)}</small>
              </button>
            ))}
          </div>
        ) : (
          <p className="home-empty">きょうの予定はまだありません</p>
        )}
      </HomeSection>

      <HomeSection
        icon={<ClipboardList size={16} />}
        title="やることリスト"
        actionLabel="すべて見る"
        onAction={() => onNavigate('today')}
      >
        {listNotes.length > 0 ? (
          <div className="home-note-strip" aria-label="やることリスト付きの付箋">
            {listNotes.map(note => (
              <ChecklistNoteCard key={note.id} note={note} onClick={() => openScheduleDetail(note)} />
            ))}
          </div>
        ) : (
          <p className="home-empty">やることリスト付きの付箋はまだありません</p>
        )}
      </HomeSection>

      <HomeSection
        icon={<Sprout size={16} />}
        title="うさぽんの小さな箱庭"
        actionLabel="編集する"
        onAction={() => onNavigate('settings')}
      >
        <button className="home-garden" type="button" onClick={() => onNavigate('settings')}>
          <img src={`${import.meta.env.BASE_URL}assets/home-garden-reference.jpg`} alt="うさぽんの小さな箱庭" />
          <span>coming soon</span>
        </button>
      </HomeSection>
    </div>
  );
}

function HomeSection({ icon, title, actionLabel, onAction, children }) {
  return (
    <section className="home-section">
      <div className="home-section-header">
        <h2>
          <span>{icon}</span>
          {title}
        </h2>
        <button type="button" onClick={onAction}>
          {actionLabel}
          <ChevronRight size={14} />
        </button>
      </div>
      {children}
    </section>
  );
}

function ChecklistNoteCard({ note, onClick }) {
  const checklist = Array.isArray(note.checklist) ? note.checklist.filter(item => item.text?.trim()) : [];
  const buddy = CATEGORY_BUDDIES[note.category] || CATEGORY_BUDDIES.todo;
  const categoryLabel = CATEGORY_LABELS[note.category] || CATEGORY_LABELS.todo;
  const previewItems = checklist.slice(0, 3);

  return (
    <button type="button" className={`home-check-note sticky-note ${note.category || 'todo'}`} onClick={onClick}>
      <span className="home-check-note-label">{categoryLabel}</span>
      <strong>{note.title}</strong>
      <span className="home-check-note-lines">
        {previewItems.length > 0 ? previewItems.map(item => (
          <span key={item.id} className={item.done ? 'is-done' : ''}>
            <i aria-hidden="true" />
            {item.text}
          </span>
        )) : (
          <span>
            <i aria-hidden="true" />
            メモあり
          </span>
        )}
      </span>
      <img src={buddy.src} alt={buddy.alt} />
    </button>
  );
}
