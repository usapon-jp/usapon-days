import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronRight as ArrowRight } from 'lucide-react';

export default function CalendarView({ appData, setAppData, onNavigate }) {
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
  
  const dateKey = format(selectedDay, 'yyyy-MM-dd');
  const dailySchedule = appData.schedule[dateKey] || [];
  const sortedSchedule = [...dailySchedule].sort((a, b) => a.startTime - b.startTime);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#FAF7F2' }}>
      {/* Top Banner */}
      <div style={{ 
        backgroundColor: '#C5F0E3', 
        height: '140px', 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: '20px',
        borderBottomRightRadius: '20px',
        marginBottom: '20px'
      }}>
        <img src="./assets/lemon.png" style={{ position: 'absolute', left: '20px', top: '30px', width: '60px', transform: 'rotate(-15deg)' }} alt="lemon" />
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '4px', color: '#4A4A4A', zIndex: 10 }}>カレンダー</h1>
        <img src="./assets/lemon.png" style={{ position: 'absolute', right: '110px', top: '70px', width: '25px', transform: 'rotate(15deg)' }} alt="lemon small" />
        <img src="./assets/piyo.png" style={{ position: 'absolute', right: '10px', bottom: '-10px', width: '100px', zIndex: 10 }} alt="piyo" />
      </div>

      {/* Calendar Card */}
      <div style={{ padding: '0 16px' }}>
        <div className="card" style={{ padding: '12px', borderRadius: '20px', margin: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <ChevronLeft size={24} color="#4A4A4A" />
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#4A4A4A' }}>
              {format(currentDate, 'yyyy年M月')}
            </h2>
            <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <ChevronRight size={24} color="#4A4A4A" />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
            {weekdays.map((day, i) => (
              <div key={day} style={{ 
                fontSize: '12px', 
                fontWeight: 'bold', 
                color: i === 0 ? '#FF7A7A' : (i === 6 ? '#5AA1E3' : '#4A4A4A') 
              }}>
                {day}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', rowGap: '4px', textAlign: 'center' }}>
            {calendarDays.map((day, i) => {
              const isSelected = isSameDay(day, selectedDay);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isSunday = day.getDay() === 0;
              const isSaturday = day.getDay() === 6;
              
              let color = '#4A4A4A';
              if (!isCurrentMonth) color = '#D3D3D3';
              else if (isSunday) color = '#FF7A7A';
              else if (isSaturday) color = '#5AA1E3';

              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#FDE38A' : 'transparent',
                    color: isSelected ? '#4A4A4A' : color,
                    fontWeight: isSelected ? 'bold' : 'normal',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {format(day, dateFormat)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div style={{ padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <img src="./assets/lemon.png" style={{ width: '20px', transform: 'rotate(-20deg)' }} alt="icon" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#4A4A4A' }}>きょうの予定</h3>
        </div>
        <div className="hide-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', height: '240px' }}>
          {sortedSchedule.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#A0A0A0', fontSize: '14px', padding: '20px' }}>予定はありません</p>
          ) : (
            sortedSchedule.map((note, idx) => {
              // Alternate background colors for time bubbles based on index
              const timeBgColors = ['#E4F4F1', '#E8F1FC', '#FCF4DB', '#FCE8E8'];
              const timeBgColor = timeBgColors[idx % timeBgColors.length];

              // Pick emoji based on title matching, else default
              let emoji = '📝';
              if (note.title.includes('散歩') || note.title.includes('さんぽ')) emoji = '🌲';
              else if (note.title.includes('休') || note.title.includes('時間')) emoji = '☕️';

              return (
                <div key={note.id} style={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '16px', 
                  padding: '12px 16px',
                  display: 'flex', 
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  position: 'relative',
                  opacity: note.status === 'completed' ? 0.7 : 1
                }}>
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
                    {Math.floor(note.startTime / 60)}:{String(note.startTime % 60).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: '20px', margin: '0 12px' }}>{emoji}</div>
                  <div style={{ flex: 1, fontSize: '15px', fontWeight: 'bold', color: '#4A4A4A' }}>
                    {note.title}
                  </div>
                  <ArrowRight size={20} color="#C0C0C0" />
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Decorative Bottom */}
      <div style={{ height: '60px', position: 'relative', overflow: 'hidden' }}>
        <img src="./assets/lemon.png" style={{ position: 'absolute', left: '30px', top: '10px', width: '30px', transform: 'rotate(-30deg)' }} alt="deco" />
        <img src="./assets/lemon.png" style={{ position: 'absolute', right: '40px', top: '20px', width: '40px', transform: 'rotate(20deg)' }} alt="deco" />
      </div>
    </div>
  );
}
