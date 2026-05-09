import React, { useState, useRef, useEffect } from 'react';
import { Plus, CheckCircle2, MoveRight, Coffee, ListTodo, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import CreateNoteModal from './CreateNoteModal';

const START_HOUR = 6;
const END_HOUR = 24;
const PIXELS_PER_MINUTE = 1; 
const SNAP_MINUTES = 15;

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function ScheduleView({ appData, setAppData }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  
  const dailySchedule = appData.schedule[dateKey] || [];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTray, setShowTray] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState(null);

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveTargetDate, setMoveTargetDate] = useState('');

  const [routineUpdateConfirm, setRoutineUpdateConfirm] = useState(null);

  // Dragging states
  const dragRef = useRef(null);
  const longPressTimer = useRef(null);
  const edgeSwitchTimer = useRef(null);
  const [dragState, setDragState] = useState(null); 
  const [previewNote, setPreviewNote] = useState(null); 
  const [floatingState, setFloatingState] = useState(null); 
  
  const containerRef = useRef(null);

  const handleSaveNote = (noteData) => {
    const newNote = {
      id: generateId(),
      ...noteData,
      startTime: 12 * 60,
      status: 'active',
      createdAt: dateKey
    };
    
    setAppData(prev => {
      const nextState = { ...prev };
      
      if (noteData.repeat) {
        nextState.routines = [...(nextState.routines || []), newNote];
        
        let shouldAppearToday = false;
        if (noteData.repeat.type === 'daily') shouldAppearToday = true;
        if (noteData.repeat.type === 'weekly') shouldAppearToday = noteData.repeat.days.includes(selectedDate.getDay());
        if (noteData.repeat.type === 'monthly') shouldAppearToday = true; 
        if (noteData.repeat.type === 'yearly') shouldAppearToday = true;

        if (shouldAppearToday) {
          nextState.schedule = {
            ...nextState.schedule,
            [dateKey]: [...(nextState.schedule[dateKey] || []), { ...newNote, originalRoutineId: newNote.id }]
          };
          nextState.generatedRoutines = {
            ...(nextState.generatedRoutines || {}),
            [dateKey]: [...(nextState.generatedRoutines?.[dateKey] || []), newNote.id]
          };
        }
      } else {
        nextState.schedule = {
          ...nextState.schedule,
          [dateKey]: [...(nextState.schedule[dateKey] || []), newNote]
        };
      }
      
      return nextState;
    });
    setIsModalOpen(false);
  };

  useEffect(() => {
    const routines = appData.routines || [];
    const generatedForDate = appData.generatedRoutines?.[dateKey] || [];
    
    if (routines.length > 0) {
      const routinesToAdd = routines.filter(routine => {
        if (!routine.repeat) return false;
        if (generatedForDate.includes(routine.id)) return false; 
        
        if (new Date(routine.createdAt) > selectedDate) return false;

        if (routine.repeat.type === 'daily') return true;
        if (routine.repeat.type === 'weekly') return routine.repeat.days.includes(selectedDate.getDay());
        if (routine.repeat.type === 'monthly') return selectedDate.getDate() === new Date(routine.createdAt).getDate();
        if (routine.repeat.type === 'yearly') {
           const cDate = new Date(routine.createdAt);
           return selectedDate.getMonth() === cDate.getMonth() && selectedDate.getDate() === cDate.getDate();
        }
        return false;
      }).map(r => ({ ...r, id: generateId(), originalRoutineId: r.id }));

      if (routinesToAdd.length > 0) {
        setAppData(prev => ({
          ...prev,
          generatedRoutines: {
            ...(prev.generatedRoutines || {}),
            [dateKey]: [...(prev.generatedRoutines?.[dateKey] || []), ...routinesToAdd.map(r => r.originalRoutineId)]
          },
          schedule: {
            ...prev.schedule,
            [dateKey]: [...(prev.schedule[dateKey] || []), ...routinesToAdd]
          }
        }));
      }
    }
  }, [dateKey, selectedDate, appData.routines, appData.generatedRoutines, setAppData]);

  const removeNote = (id) => {
    setAppData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dateKey]: (prev.schedule[dateKey] || []).filter(n => n.id !== id)
      }
    }));
  };

  const handleEdgeDateSwitch = (dir, prevDateKey) => {
    if (!dragRef.current) return;
    
    const currentDate = new Date(dragRef.current.currentDateKey);
    currentDate.setDate(currentDate.getDate() + dir);
    const nextDateKey = format(currentDate, 'yyyy-MM-dd');
    
    dragRef.current.currentDateKey = nextDateKey;
    const currentNoteId = dragRef.current.id;
    
    setAppData(prevData => {
      const note = (prevData.schedule[prevDateKey] || []).find(n => n.id === currentNoteId);
      if (!note) return prevData;
      
      const oldDayNotes = prevData.schedule[prevDateKey].filter(n => n.id !== currentNoteId);
      const nextDayNotes = prevData.schedule[nextDateKey] || [];
      
      return {
        ...prevData,
        schedule: {
          ...prevData.schedule,
          [prevDateKey]: oldDayNotes,
          [nextDateKey]: [...nextDayNotes, note]
        }
      };
    });

    setSelectedDate(currentDate);
  };

  const handlePointerDown = (e, note, type) => {
    e.stopPropagation();
    if (showTray) {
      setShowTray(false);
      setActiveNoteId(null);
      return;
    }
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    dragRef.current = {
      type,
      id: note.id,
      note: note, 
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      originalStartTime: note.startTime,
      originalDuration: note.durationMin,
      originalDateKey: dateKey,
      currentDateKey: dateKey,
      isFloating: false,
      hasMovedWhileFloating: false
    };

    if (type === 'move') {
      longPressTimer.current = setTimeout(() => {
        setActiveNoteId(note.id);
        setShowTray(true);
        dragRef.current.isFloating = true;
        
        setFloatingState({
          note,
          x: dragRef.current.currentX,
          y: dragRef.current.currentY,
        });

        setPreviewNote(null);
      }, 500);
    }

    setDragState(dragRef.current);
    setPreviewNote({ ...note });

    document.addEventListener('mousemove', handlePointerMove, { passive: false });
    document.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('touchend', handlePointerUp);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    if (e.cancelable) e.preventDefault();
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    dragRef.current.currentX = clientX;
    dragRef.current.currentY = clientY;

    const deltaX = clientX - dragRef.current.startX;
    const deltaY = clientY - dragRef.current.startY;
    
    // エッジスワイプ判定（画面端でホールドすると日付移動）
    if (dragRef.current.type === 'move' || dragRef.current.isFloating) {
      const edgeThreshold = 40;
      const screenWidth = window.innerWidth;
      
      if (clientX < edgeThreshold) {
        if (!edgeSwitchTimer.current) {
          edgeSwitchTimer.current = setTimeout(() => {
            handleEdgeDateSwitch(-1, dragRef.current.currentDateKey);
            edgeSwitchTimer.current = null;
          }, 800);
        }
      } else if (clientX > screenWidth - edgeThreshold) {
        if (!edgeSwitchTimer.current) {
          edgeSwitchTimer.current = setTimeout(() => {
            handleEdgeDateSwitch(1, dragRef.current.currentDateKey);
            edgeSwitchTimer.current = null;
          }, 800);
        }
      } else {
        if (edgeSwitchTimer.current) {
          clearTimeout(edgeSwitchTimer.current);
          edgeSwitchTimer.current = null;
        }
      }
    }

    if (dragRef.current.isFloating) {
      dragRef.current.hasMovedWhileFloating = true;
      setFloatingState({
        note: dragRef.current.note,
        x: clientX,
        y: clientY
      });
      return;
    }

    if ((Math.abs(deltaX) > 15 || Math.abs(deltaY) > 15) && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const deltaMinutes = Math.round(deltaY / PIXELS_PER_MINUTE);
    
    if (dragRef.current.type === 'move') {
      let newStart = dragRef.current.originalStartTime + deltaMinutes;
      newStart = Math.round(newStart / SNAP_MINUTES) * SNAP_MINUTES;
      const minTime = START_HOUR * 60;
      const maxTime = END_HOUR * 60 - dragRef.current.originalDuration;
      newStart = Math.max(minTime, Math.min(newStart, maxTime));
      
      setPreviewNote(prev => prev ? { ...prev, startTime: newStart } : null);
    } else if (dragRef.current.type === 'resize') {
      let newDuration = dragRef.current.originalDuration + deltaMinutes;
      newDuration = Math.round(newDuration / SNAP_MINUTES) * SNAP_MINUTES;
      newDuration = Math.max(15, newDuration);
      
      setPreviewNote(prev => prev ? { ...prev, durationMin: newDuration } : null);
    }
  };

  const applyNoteUpdate = (id, newStart, newDuration, targetDateKey) => {
    setAppData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [targetDateKey]: (prev.schedule[targetDateKey] || []).map(n => 
          n.id === id ? { ...n, startTime: newStart, durationMin: newDuration } : n
        )
      }
    }));
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (edgeSwitchTimer.current) {
      clearTimeout(edgeSwitchTimer.current);
      edgeSwitchTimer.current = null;
    }

    if (dragRef.current) {
      const noteElements = document.querySelectorAll('.sticky-note');
      noteElements.forEach(el => el.style.pointerEvents = 'none');
      
      const target = document.elementFromPoint(dragRef.current.currentX, dragRef.current.currentY);
      const dateTarget = target?.closest('[data-date]');
      const actionTarget = target?.closest('[data-tray-action]');

      noteElements.forEach(el => el.style.pointerEvents = '');

      if (dragRef.current.isFloating) {
        if (dateTarget) {
          handleMoveToDate(dateTarget.getAttribute('data-date'), dragRef.current.currentDateKey);
        } else if (actionTarget) {
          handleTrayAction(actionTarget.getAttribute('data-tray-action'));
        } else {
          if (!dragRef.current.hasMovedWhileFloating) {
          } else {
            setShowTray(false);
            setActiveNoteId(null);
          }
        }
        setFloatingState(null);
      } else {
        if (dragRef.current.type === 'move') {
          if (dateTarget) {
            const targetDate = dateTarget.getAttribute('data-date');
            if (targetDate !== dragRef.current.currentDateKey) {
              setActiveNoteId(dragRef.current.id); 
              handleMoveToDate(targetDate, dragRef.current.currentDateKey);
              
              setPreviewNote(null);
              dragRef.current = null;
              setDragState(null);
              document.removeEventListener('mousemove', handlePointerMove);
              document.removeEventListener('mouseup', handlePointerUp);
              document.removeEventListener('touchmove', handlePointerMove);
              document.removeEventListener('touchend', handlePointerUp);
              return;
            }
          }
        }

        let newStart = dragRef.current.originalStartTime;
        let newDuration = dragRef.current.originalDuration;

        const deltaY = dragRef.current.currentY - dragRef.current.startY;
        const deltaMinutes = Math.round(deltaY / PIXELS_PER_MINUTE);

        if (dragRef.current.type === 'move') {
          newStart = dragRef.current.originalStartTime + deltaMinutes;
          newStart = Math.round(newStart / SNAP_MINUTES) * SNAP_MINUTES;
          const minTime = START_HOUR * 60;
          const maxTime = END_HOUR * 60 - dragRef.current.originalDuration;
          newStart = Math.max(minTime, Math.min(newStart, maxTime));
        } else if (dragRef.current.type === 'resize') {
          newDuration = dragRef.current.originalDuration + deltaMinutes;
          newDuration = Math.round(newDuration / SNAP_MINUTES) * SNAP_MINUTES;
          newDuration = Math.max(15, newDuration);
        }
        
        if (newStart !== dragRef.current.originalStartTime || newDuration !== dragRef.current.originalDuration || dragRef.current.originalDateKey !== dragRef.current.currentDateKey) {
          if (dragRef.current.note?.originalRoutineId) {
            setRoutineUpdateConfirm({
              noteId: dragRef.current.id,
              originalRoutineId: dragRef.current.note.originalRoutineId,
              newStartTime: newStart,
              newDurationMin: newDuration,
              targetDateKey: dragRef.current.currentDateKey
            });
          } else {
            applyNoteUpdate(dragRef.current.id, newStart, newDuration, dragRef.current.currentDateKey);
          }
        }
        setPreviewNote(null);
      }

      dragRef.current = null;
      setDragState(null);
      
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('touchend', handlePointerUp);
    }
  };

  const handleConfirmRoutineUpdate = (applyToAll) => {
    const { noteId, originalRoutineId, newStartTime, newDurationMin, targetDateKey } = routineUpdateConfirm;
    
    setAppData(prev => {
      const nextState = { ...prev };
      
      nextState.schedule = {
        ...nextState.schedule,
        [targetDateKey]: (nextState.schedule[targetDateKey] || []).map(n => 
          n.id === noteId ? { ...n, startTime: newStartTime, durationMin: newDurationMin } : n
        )
      };

      if (applyToAll) {
        nextState.routines = (nextState.routines || []).map(r => 
          r.id === originalRoutineId ? { ...r, startTime: newStartTime, durationMin: newDurationMin } : r
        );
        
        const allDates = Object.keys(nextState.schedule);
        for (const dKey of allDates) {
          if (dKey > targetDateKey) {
            nextState.schedule[dKey] = nextState.schedule[dKey].map(n => 
              n.originalRoutineId === originalRoutineId 
                ? { ...n, startTime: newStartTime, durationMin: newDurationMin }
                : n
            );
          }
        }
      }
      return nextState;
    });
    
    setRoutineUpdateConfirm(null);
  };

  const handleMoveToDate = (targetDateString, sourceDateKey) => {
    const srcKey = sourceDateKey || dateKey;
    const noteIdToMove = activeNoteId || dragRef.current?.id;
    
    setAppData(prev => {
      const note = (prev.schedule[srcKey] || []).find(n => n.id === noteIdToMove);
      if (!note) return prev;

      const currentDayNotes = (prev.schedule[srcKey] || []).filter(n => n.id !== note.id);
      const targetDayNotes = prev.schedule[targetDateString] || [];
      return {
        ...prev,
        schedule: {
          ...prev.schedule,
          [srcKey]: currentDayNotes,
          [targetDateString]: [...targetDayNotes, { ...note, status: 'active' }]
        }
      };
    });

    const [y, m, d] = targetDateString.split('-');
    setSelectedDate(new Date(y, m - 1, d));
    
    setShowTray(false);
    setActiveNoteId(null);
    setIsMoveModalOpen(false);
  };

  const handleTrayAction = (action) => {
    const note = dailySchedule.find(n => n.id === activeNoteId);
    if (!note) return;

    if (action === 'できた') {
      setAppData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [dateKey]: (prev.schedule[dateKey] || []).map(n => 
            n.id === note.id ? { ...n, status: 'completed' } : n
          )
        }
      }));
      setActiveNoteId(null);
    } else if (action === '移動') {
      setShowTray(false);
      setMoveTargetDate(format(new Date(selectedDate.getTime() + 86400000), 'yyyy-MM-dd'));
      setIsMoveModalOpen(true);
      return; 
    } else if (action === 'ひとやすみ' || action === 'TODOに戻す') {
      setAppData(prev => ({
        ...prev,
        todos: [...prev.todos, { ...note, status: 'paused' }],
        schedule: {
          ...prev.schedule,
          [dateKey]: (prev.schedule[dateKey] || []).filter(n => n.id !== note.id)
        }
      }));
      setActiveNoteId(null);
    } else if (action === 'やめる') {
      removeNote(note.id);
      setActiveNoteId(null);
    }

    setShowTray(false);
  };

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const formattedDateString = `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日（${weekdays[selectedDate.getDay()]}）`;

  const dateStripList = Array.from({ length: 31 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 15 + i);
    return d;
  });

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {formattedDateString}
          </h2>
        </div>
      </div>

      <div 
        className="hide-scrollbar"
        style={{ 
          display: 'flex', overflowX: 'auto', padding: '8px 20px', 
          gap: '12px', borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg)',
          position: 'sticky', top: 0, zIndex: 10,
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {dateStripList.map((d, i) => {
          const dKey = format(d, 'yyyy-MM-dd');
          const isSelected = dKey === dateKey;
          const isToday = dKey === format(new Date(), 'yyyy-MM-dd');
          
          return (
            <div 
              key={i} 
              data-date={dKey}
              onClick={() => setSelectedDate(d)}
              style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minWidth: '44px', height: '56px', borderRadius: '16px',
                backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                color: isSelected ? '#fff' : (isToday ? 'var(--color-primary)' : 'var(--color-text-main)'),
                cursor: 'pointer', flexShrink: 0,
                border: isToday && !isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: isSelected ? 'bold' : 'normal', pointerEvents: 'none' }}>{weekdays[d.getDay()]}</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', pointerEvents: 'none' }}>{d.getDate()}</span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '0 20px 20px', display: 'flex', flex: 1, overflowY: 'auto' }} ref={containerRef}>
        <div style={{ width: '50px', flexShrink: 0, borderRight: '1px solid var(--color-border)' }}>
          {hours.map(hour => (
            <div key={hour} style={{ height: '60px', color: 'var(--color-text-sub)', fontSize: '12px', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-8px', right: '8px' }}>{hour}:00</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, position: 'relative', minHeight: `${(END_HOUR - START_HOUR) * 60}px` }}>
          {hours.map(hour => (
            <div key={hour} style={{ height: '60px', borderBottom: '1px solid var(--color-border)' }} />
          ))}

          {dailySchedule.filter(n => n.status !== 'completed').map(originalNote => {
            const isFloating = floatingState && floatingState.note.id === originalNote.id;
            const note = (previewNote && previewNote.id === originalNote.id) ? previewNote : originalNote;
            
            const top = (note.startTime - START_HOUR * 60) * PIXELS_PER_MINUTE;
            const height = note.durationMin * PIXELS_PER_MINUTE;
            const isDragging = dragState?.id === note.id;
            const isActive = activeNoteId === note.id;
            
            return (
              <div 
                key={note.id}
                className={`sticky-note ${note.category}`}
                style={{ 
                  position: 'absolute', top: `${top}px`, left: '12px', right: '12px', height: `${height}px`,
                  zIndex: isDragging || isActive ? 100 : 1,
                  opacity: (showTray && !isActive) || isFloating ? 0.3 : 1,
                  boxShadow: isDragging && !isFloating ? '0 8px 16px rgba(0,0,0,0.1)' : '2px 2px 5px var(--color-shadow)',
                  display: 'flex', flexDirection: 'column',
                  touchAction: 'none'
                }}
                onPointerDown={(e) => handlePointerDown(e, note, 'move')}
                onContextMenu={(e) => { e.preventDefault(); setActiveNoteId(note.id); setShowTray(true); }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none', padding: '0 8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', textAlign: 'center', wordBreak: 'break-word', lineHeight: '1.2' }}>{note.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', marginTop: '4px' }}>
                    {Math.floor(note.startTime / 60)}:{String(note.startTime % 60).padStart(2, '0')}〜
                    {Math.floor((note.startTime + note.durationMin) / 60)}:{String((note.startTime + note.durationMin) % 60).padStart(2, '0')} 
                    <span style={{ fontWeight: 'bold', color: 'var(--color-text-main)', marginLeft: '4px' }}>({note.durationMin}分)</span>
                  </div>
                </div>
                
                <div  
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '24px',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    cursor: 'ns-resize', zIndex: 10, touchAction: 'none'
                  }}
                  onPointerDown={(e) => handlePointerDown(e, note, 'resize')}
                >
                  <div style={{ width: '40px', height: '6px', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '3px', pointerEvents: 'none' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {floatingState && (
        <div 
          className={`sticky-note ${floatingState.note.category}`}
          style={{
            position: 'fixed',
            top: floatingState.y - 30, 
            left: floatingState.x - 70,
            width: '140px',
            height: '60px', 
            zIndex: 9999,
            pointerEvents: 'none', 
            opacity: 0.95,
            transform: 'scale(1.05) rotate(-2deg)',
            boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            padding: '0 8px'
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '14px', textAlign: 'center', wordBreak: 'break-word', lineHeight: '1.2' }}>{floatingState.note.title}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', marginTop: '4px' }}>({floatingState.note.durationMin}分)</div>
        </div>
      )}

      {routineUpdateConfirm && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '360px', margin: 0 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>ルーティンの時間を変更しました</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-main)', marginBottom: '24px', lineHeight: '1.5' }}>
              他の日の同じルーティンの時間も変更しますか？
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => handleConfirmRoutineUpdate(true)}
                style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#5B9E77', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                以降のすべても変更する
              </button>
              <button 
                onClick={() => handleConfirmRoutineUpdate(false)}
                style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border-dark)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                今日だけ変更する
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fab" onClick={() => setIsModalOpen(true)}>
        <Plus size={28} />
      </div>

      {isModalOpen && (
        <CreateNoteModal onClose={() => setIsModalOpen(false)} onSave={handleSaveNote} />
      )}

      {showTray && (
        <div style={{ 
          position: 'fixed', bottom: 0, left: 0, right: 0, top: 0, 
          backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 200,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          backdropFilter: 'blur(2px)'
        }} onClick={() => { setShowTray(false); setActiveNoteId(null); }}>
          <div 
            style={{ 
              backgroundColor: 'var(--color-tray-bg)', 
              padding: '24px 16px 40px', 
              borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
              display: 'flex', justifyContent: 'space-around',
              maxWidth: '480px', margin: '0 auto', width: '100%',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <TrayButton icon={<CheckCircle2 color="#5B9E77" size={28} />} label="できた" action="できた" onClick={() => handleTrayAction('できた')} />
            <TrayButton icon={<MoveRight color="#D4B01A" size={28} />} label="移動" action="移動" onClick={() => handleTrayAction('移動')} />
            <TrayButton icon={<Coffee color="#6296C2" size={28} />} label="ひとやすみ" action="ひとやすみ" onClick={() => handleTrayAction('ひとやすみ')} />
            <TrayButton icon={<ListTodo color="#A0A0A0" size={28} />} label="TODOに戻す" action="TODOに戻す" onClick={() => handleTrayAction('TODOに戻す')} />
            <TrayButton icon={<Trash2 color="#A0A0A0" size={28} />} label="やめる" action="やめる" onClick={() => handleTrayAction('やめる')} />
          </div>
        </div>
      )}

      {isMoveModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: 0, position: 'relative' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>スケジュールの移動</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-sub)', marginBottom: '8px' }}>移動先の日付を選んでください</p>
            
            <input 
              type="date" 
              value={moveTargetDate}
              onChange={(e) => setMoveTargetDate(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-dark)', fontSize: '16px', marginBottom: '24px' }}
            />
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => { setIsMoveModalOpen(false); setActiveNoteId(null); }} 
                style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border-dark)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                キャンセル
              </button>
              <button 
                onClick={() => handleMoveToDate(moveTargetDate)} 
                disabled={!moveTargetDate}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: moveTargetDate ? 'var(--color-primary)' : 'var(--color-border)', color: moveTargetDate ? '#fff' : 'var(--color-text-sub)', border: 'none', fontWeight: 'bold', cursor: moveTargetDate ? 'pointer' : 'not-allowed' }}
              >
                移動する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrayButton({ icon, label, action, onClick }) {
  return (
    <div 
      data-tray-action={action}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }} 
      onClick={onClick}
    >
      <div style={{ 
        width: '56px', height: '56px', borderRadius: '50%', 
        backgroundColor: '#fff', border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px var(--color-shadow)', pointerEvents: 'none'
      }}>
        {icon}
      </div>
      <span style={{ fontSize: '11px', color: 'var(--color-text-main)', fontWeight: 'bold', pointerEvents: 'none' }}>{label}</span>
    </div>
  );
}
