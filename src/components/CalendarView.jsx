import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronRight as ArrowRight, Plus } from 'lucide-react';

const CATEGORY_DOT_COLORS = {
  todo: '#A8D0E2',
  routine: '#EED8B1',
  relax: '#ACD6A6',
  wakuwaku: '#FFD95F'
};

export default function CalendarView({ appData, setAppData, onNavigate, onOpenScheduleDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Create an array of days for the calendar grid
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
  
  const endDate = new Date(monthEnd);
  if (endDate.getDay() !== 6) {
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday
  }
  
  const dateFormat = "d";
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  
  // Current selected day (defaults to today, or first of month if we changed month)
  const [selectedDay, setSelectedDay] = useState(new Date());

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const selectedDateKey = format(selectedDay, 'yyyy-MM-dd');
  const selectedSchedule = [...(appData.schedule?.[selectedDateKey] || [])]
    .sort((a, b) => (a.startTime ?? 9999) - (b.startTime ?? 9999));
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', backgroundColor: '#FFFEFB' }}>
      {/* Top Banner */}
      <div style={{ 
        height: '250px', 
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        padding: '82px 38px 0',
        overflow: 'hidden',
        marginBottom: '-32px'
      }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '4px', height: '72px', background: '#EEF6E9', borderTopLeftRadius: '50% 42px', borderTopRightRadius: '50% 44px' }} />
        <img src="./assets/lemon.png" style={{ position: 'absolute', left: '22px', top: '58px', width: '24px', transform: 'rotate(-20deg)', opacity: 0.72 }} alt="" aria-hidden="true" />
        <img src="./assets/lemon.png" style={{ position: 'absolute', left: '221px', top: '64px', width: '18px', transform: 'rotate(16deg)', opacity: 0.46 }} alt="" aria-hidden="true" />
        <img src="./assets/lemon.png" style={{ position: 'absolute', right: '54px', top: '60px', width: '18px', transform: 'rotate(-28deg)', opacity: 0.46 }} alt="" aria-hidden="true" />
        <h1 style={{ fontSize: '34px', fontWeight: 'bold', letterSpacing: '0', color: '#3F3F3F', zIndex: 10 }}>カレンダー</h1>
        <img src="./assets/usa.png" style={{ position: 'absolute', right: '205px', bottom: '30px', width: '86px', zIndex: 8 }} alt="グレーのうさぎ" />
        <img src="./assets/pon.png" style={{ position: 'absolute', right: '122px', bottom: '31px', width: '86px', zIndex: 8 }} alt="茶色のうさぎ" />
        <img src="./assets/piyo.png" style={{ position: 'absolute', right: '37px', bottom: '25px', width: '88px', zIndex: 8 }} alt="ピヨ" />
      </div>

      {/* Calendar Card */}
      <div style={{ padding: '0 18px', position: 'relative', zIndex: 12 }}>
        <div className="card" style={{ padding: '28px 20px 26px', borderRadius: '22px', margin: 0, boxShadow: '0 16px 28px rgba(0,0,0,0.055)', border: '1px solid rgba(242,242,242,0.92)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 48px', alignItems: 'center', marginBottom: '20px' }}>
            <button onClick={handlePrevMonth} style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F8F8F5', border: 'none', cursor: 'pointer', padding: '4px', display: 'grid', placeItems: 'center' }}>
              <ChevronLeft size={24} color="#4A4A4A" />
            </button>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#343434', textAlign: 'center' }}>
              {format(currentDate, 'yyyy年M月')}
            </h2>
            <button onClick={handleNextMonth} style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F8F8F5', border: 'none', cursor: 'pointer', padding: '4px', display: 'grid', placeItems: 'center' }}>
              <ChevronRight size={24} color="#4A4A4A" />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '12px' }}>
            {weekdays.map((day, i) => (
              <div key={day} style={{ 
                fontSize: '17px', 
                fontWeight: 'bold', 
                color: i === 0 ? '#FF7A7A' : (i === 6 ? '#5AA1E3' : '#4A4A4A') 
              }}>
                {day}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', rowGap: '12px', textAlign: 'center' }}>
            {calendarDays.map((day, i) => {
              const isSelected = isSameDay(day, selectedDay);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isSunday = day.getDay() === 0;
              const isSaturday = day.getDay() === 6;
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayNotes = appData.schedule?.[dayKey] || [];
              const dotColors = [...new Set(dayNotes.map(note => note.category || 'todo'))]
                .slice(0, 4)
                .map(category => CATEGORY_DOT_COLORS[category] || CATEGORY_DOT_COLORS.todo);
              
              let color = '#4A4A4A';
              if (!isCurrentMonth) color = '#D3D3D3';
              else if (isSunday) color = '#FF7A7A';
              else if (isSaturday) color = '#5AA1E3';

              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDay(day);
                  }}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                    aspectRatio: '1',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? '#FDE38A' : 'transparent',
                    color: isSelected ? '#4A4A4A' : color,
                    fontWeight: isSelected ? 'bold' : 'normal',
                    cursor: 'pointer',
                    fontSize: '19px'
                  }}
                >
                  <span>{format(day, dateFormat)}</span>
                  <span style={{ display: 'flex', justifyContent: 'center', gap: '2px', minHeight: '7px', marginTop: '2px' }}>
                    {dotColors.map((dotColor, dotIndex) => (
                      <span
                        key={`${dayKey}-${dotColor}-${dotIndex}`}
                        aria-hidden="true"
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: dotColor,
                          opacity: isCurrentMonth ? 0.95 : 0.45
                        }}
                      />
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div style={{ padding: '24px 20px 10px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '0 22px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#343434' }}>きょうの予定</h3>
          <span style={{ color: '#A0A0A0', fontSize: '12px' }}>
            {format(selectedDay, 'M/d')}
          </span>
          <button type="button" onClick={() => onOpenScheduleDate?.(selectedDateKey)} style={{ marginLeft: 'auto', minHeight: '34px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', border: '1px solid #D7D7D3', borderRadius: '999px', background: '#fff', color: '#5B9E77', font: 'inherit', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            <Plus size={16} />
            追加
          </button>
        </div>
        <div className="hide-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '250px', padding: '0 18px 4px' }}>
          {selectedSchedule.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#A0A0A0', fontSize: '14px', padding: '20px' }}>予定はありません</p>
          ) : (
            selectedSchedule.map((note, idx) => {
              const timeBgColors = ['#E4F4F1', '#E8F1FC', '#FCF4DB', '#FCE8E8'];
              const timeBgColor = timeBgColors[idx % timeBgColors.length];
              let emoji = '📝';
              if (note.title.includes('散歩') || note.title.includes('さんぽ')) emoji = '🌲';
              else if (note.title.includes('休') || note.title.includes('時間')) emoji = '☕️';

              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onOpenScheduleDate?.(selectedDateKey)}
                  style={{
                    width: '100%',
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 7px 18px rgba(0,0,0,0.035)',
                    cursor: 'pointer',
                    position: 'relative',
                    opacity: note.status === 'completed' ? 0.7 : 1,
                    font: 'inherit',
                    textAlign: 'left'
                  }}
                >
                  {note.status === 'completed' && (
                    <div style={{
                      position: 'absolute',
                      right: '40px',
                      border: '2px solid #5B9E77',
                      color: '#5B9E77',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      transform: 'rotate(-10deg)',
                      backgroundColor: '#fff',
                      zIndex: 1
                    }}>
                      完了
                    </div>
                  )}
                  <div style={{
                    backgroundColor: timeBgColor,
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#4A4A4A',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {typeof note.startTime === 'number'
                      ? `${Math.floor(note.startTime / 60)}:${String(note.startTime % 60).padStart(2, '0')}`
                      : '予定'}
                  </div>
                  <div style={{ fontSize: '20px', margin: '0 12px' }}>{emoji}</div>
                  <div style={{ flex: 1, fontSize: '15px', fontWeight: 'bold', color: '#4A4A4A', minWidth: 0 }}>
                    {note.title}
                  </div>
                  <ArrowRight size={20} color="#C0C0C0" />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Decorative Bottom */}
      <div style={{ height: '50px', position: 'relative', overflow: 'hidden' }}>
        <img src="./assets/lemon.png" style={{ position: 'absolute', left: '30px', top: '10px', width: '30px', transform: 'rotate(-30deg)' }} alt="deco" />
        <img src="./assets/lemon.png" style={{ position: 'absolute', right: '40px', top: '20px', width: '40px', transform: 'rotate(20deg)' }} alt="deco" />
      </div>
    </div>
  );
}
