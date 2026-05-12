import { useRef, useState } from 'react';
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

const HOME_CREATE_CATEGORIES = [
  { id: 'todo', label: 'TODO' },
  { id: 'routine', label: 'ルーティン' },
  { id: 'relax', label: 'のんびり' },
  { id: 'wakuwaku', label: 'わくわく' }
];

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

export default function HomeView({ appData, setAppData, onNavigate, onOpenNoteDetail, onCreateNote }) {
  const [actionTarget, setActionTarget] = useState(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayNotes = getTodayNotes(appData, todayKey);
  const schedulePreview = todayNotes.slice(0, 4);
  const listNotes = (appData.todos || [])
    .filter(note => note.status !== 'archived')
    .filter(note => Array.isArray(note.checklist) && note.checklist.some(item => item.text?.trim()))
    .map(note => ({
    ...note,
    _homeSource: { sourceType: 'todos', id: note.id }
  })).slice(0, 6);

  const openScheduleDetail = (note) => {
    onOpenNoteDetail?.({
      sourceType: 'schedule',
      sourceDateKey: todayKey,
      id: note.id,
      returnLabel: 'ホームへ戻る'
    }, 'home');
  };

  const openListNoteDetail = (note) => {
    const source = note._homeSource || {
      sourceType: 'schedule',
      sourceDateKey: todayKey,
      id: note.id
    };
    onOpenNoteDetail?.({
      ...source,
      returnLabel: 'ホームへ戻る'
    }, 'home');
  };

  const closeActionSheet = () => {
    setActionTarget(null);
    setIsReorderMode(false);
  };

  const archiveTodo = (note) => {
    setAppData(prev => ({
      ...prev,
      todos: (prev.todos || []).map(todo => (
        todo.id === note.id ? { ...todo, status: 'archived' } : todo
      ))
    }));
    closeActionSheet();
  };

  const deleteTodo = (note) => {
    const confirmed = window.confirm('このやることリストを削除しますか？');
    if (!confirmed) return;
    setAppData(prev => ({
      ...prev,
      todos: (prev.todos || []).filter(todo => todo.id !== note.id)
    }));
    closeActionSheet();
  };

  const moveTodo = (note, direction) => {
    setAppData(prev => {
      const todos = [...(prev.todos || [])];
      const index = todos.findIndex(todo => todo.id === note.id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= todos.length) return prev;
      [todos[index], todos[nextIndex]] = [todos[nextIndex], todos[index]];
      return { ...prev, todos };
    });
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
          <p>今日はどんな日にする？</p>
          <button className="home-write-note" type="button" onClick={() => onCreateNote?.('todo')}>
            付箋を書く
          </button>
          <div className="home-create-chips" aria-label="付箋の種類">
            {HOME_CREATE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`home-create-chip home-create-chip-${cat.id}`}
                onClick={() => onCreateNote?.(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
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
                <small>{note.status === 'completed' ? '完了' : getStartLabel(note)}</small>
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
        onAction={() => onNavigate('memo')}
      >
        {listNotes.length > 0 ? (
          <div className="home-note-strip" aria-label="やることリスト付きの付箋">
            {listNotes.map(note => (
              <ChecklistNoteCard
                key={`${note._homeSource?.sourceType || 'todos'}-${note.id}`}
                note={note}
                onClick={() => openListNoteDetail(note)}
                onLongPress={() => {
                  setActionTarget(note);
                  setIsReorderMode(false);
                }}
              />
            ))}
          </div>
        ) : (
          <button className="home-empty home-empty-button" type="button" onClick={() => onNavigate('memo')}>
            やることリスト付きの付箋はまだありません
          </button>
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

      {actionTarget && (
        <div className="home-action-sheet-backdrop" onClick={closeActionSheet}>
          <div className="home-action-sheet" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p>{actionTarget.title || 'やることリスト'}</p>
            {isReorderMode ? (
              <>
                <button type="button" onClick={() => moveTodo(actionTarget, -1)}>前へ移動</button>
                <button type="button" onClick={() => moveTodo(actionTarget, 1)}>後ろへ移動</button>
                <button type="button" onClick={() => setIsReorderMode(false)}>戻る</button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => { openListNoteDetail(actionTarget); closeActionSheet(); }}>編集</button>
                <button type="button" onClick={() => setIsReorderMode(true)}>並び替え</button>
                <button type="button" onClick={() => archiveTodo(actionTarget)}>アーカイブ</button>
                <button type="button" className="is-danger" onClick={() => deleteTodo(actionTarget)}>削除</button>
              </>
            )}
            <button type="button" className="is-cancel" onClick={closeActionSheet}>キャンセル</button>
          </div>
        </div>
      )}
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

function ChecklistNoteCard({ note, onClick, onLongPress }) {
  const longPressTimer = useRef(null);
  const didLongPress = useRef(false);
  const checklist = Array.isArray(note.checklist) ? note.checklist.filter(item => item.text?.trim()) : [];
  const buddy = CATEGORY_BUDDIES[note.category] || CATEGORY_BUDDIES.todo;
  const categoryLabel = CATEGORY_LABELS[note.category] || CATEGORY_LABELS.todo;
  const previewItems = checklist.slice(0, 3);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const startLongPress = () => {
    didLongPress.current = false;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress?.();
    }, 520);
  };

  return (
    <button
      type="button"
      className={`home-check-note sticky-note ${note.category || 'todo'}`}
      onPointerDown={startLongPress}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
      onContextMenu={(event) => {
        event.preventDefault();
        onLongPress?.();
      }}
      onClick={(event) => {
        if (didLongPress.current) {
          event.preventDefault();
          didLongPress.current = false;
          return;
        }
        onClick?.();
      }}
    >
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
