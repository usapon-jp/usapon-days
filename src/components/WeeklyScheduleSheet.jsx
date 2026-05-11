import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { formatWeekDateLabel, getWeeklyMarkers, isSameDate } from '../utils/scheduleUtils';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const CATEGORY_COLORS = {
  todo: 'rgba(168, 208, 226, 0.42)',
  routine: 'rgba(238, 216, 177, 0.44)',
  relax: 'rgba(172, 214, 166, 0.42)',
  wakuwaku: 'rgba(255, 218, 95, 0.42)'
};

export default function WeeklyScheduleSheet({ appData, sheetState, onSheetStateChange, onMarkerClick }) {
  const [anchorDate, setAnchorDate] = useState(new Date());
  const touchStartRef = useRef(null);
  const isOpen = sheetState === 'half';
  const { weekDates, markers } = useMemo(() => getWeeklyMarkers(appData, anchorDate), [appData, anchorDate]);
  const today = new Date();

  const toggleSheet = () => onSheetStateChange(isOpen ? 'closed' : 'half');

  const moveAnchorDate = (days) => {
    setAnchorDate(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + days);
      return next;
    });
  };

  const handlePointerDown = (event) => {
    touchStartRef.current = {
      x: event.clientX,
      y: event.clientY
    };
  };

  const handlePointerUp = (event) => {
    if (!touchStartRef.current) return;
    const deltaY = event.clientY - touchStartRef.current.y;
    const deltaX = event.clientX - touchStartRef.current.x;
    touchStartRef.current = null;
    if (Math.abs(deltaX) > 44 && Math.abs(deltaX) > Math.abs(deltaY)) {
      moveAnchorDate(deltaX < 0 ? 1 : -1);
      return;
    }
    if (Math.abs(deltaY) < 28) return;
    onSheetStateChange(deltaY < 0 ? 'half' : 'closed');
  };

  return (
    <section className={`weekly-sheet weekly-sheet-${sheetState}`} aria-label="週間スケジュール">
      <button
        className="weekly-sheet-handle"
        type="button"
        onClick={toggleSheet}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        aria-expanded={isOpen}
      >
        <ChevronUp size={16} />
        <span>週間スケジュール</span>
      </button>

      {isOpen && (
        <div className="weekly-sheet-panel" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
          <div className="weekly-sheet-toolbar">
            <div>
              <h2>週間スケジュール</h2>
            </div>
            <div className="weekly-sheet-actions">
              <button type="button" onClick={() => moveAnchorDate(-1)} aria-label="前の日へ">
                <ChevronLeft size={15} />
              </button>
              <button type="button" onClick={() => setAnchorDate(new Date())}>今日へ</button>
              <button type="button" onClick={() => moveAnchorDate(1)} aria-label="次の日へ">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="weekly-grid-header">
            <div className="weekly-days">
              {weekDates.map((date) => {
                const isToday = isSameDate(date, today);
                return (
                  <div key={date.toISOString()} className={`weekly-day ${isToday ? 'is-today' : ''}`}>
                    <span>{formatWeekDateLabel(date)}</span>
                    <small>{WEEKDAYS[date.getDay()]}</small>
                    {isToday && <em>今日</em>}
                  </div>
                );
              })}
            </div>
          </div>

          {markers.length === 0 ? (
            <div className="weekly-empty">
              <p>この7日間に入っている付箋はまだありません</p>
              <span>付箋に開始予定と締切を入れると、ここにマーカーで表示されます</span>
            </div>
          ) : (
            <div className="weekly-marker-list">
              {markers.map(marker => {
                const note = marker.note;
                const color = CATEGORY_COLORS[note.category] || 'rgba(255, 209, 102, 0.34)';
                return (
                  <button
                    key={`${marker.source.sourceType}-${marker.source.sourceDateKey || 'none'}-${marker.source.id}`}
                    type="button"
                    className="weekly-marker-row"
                    onClick={() => onMarkerClick(marker.source)}
                  >
                    <span className="weekly-marker-track" aria-hidden="true">
                      <span
                        className="weekly-marker-bar"
                        style={{
                          '--marker-start': marker.position.startIndex,
                          '--marker-span': marker.position.span,
                          '--marker-color': color
                        }}
                      >
                        <span>{note.title}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
