import React, { useState, useRef, useEffect } from 'react';
import { Plus, CheckCircle2, MoveRight, Coffee, ListTodo, Trash2, Star } from 'lucide-react';
import { format } from 'date-fns';
import CreateNoteModal from './CreateNoteModal';

const PIXELS_PER_MINUTE = 1; 
const SNAP_MINUTES = 15;

const generateId = () => Math.random().toString(36).substr(2, 9);

const CATEGORY_BUDDIES = {
  todo: { src: `${import.meta.env.BASE_URL}assets/usa.png`, alt: 'グレーのうさぎ' },
  routine: { src: `${import.meta.env.BASE_URL}assets/pon.png`, alt: '茶色のうさぎ' },
  relax: { src: `${import.meta.env.BASE_URL}assets/piyo.png`, alt: 'ひよこ' },
  wakuwaku: { src: `${import.meta.env.BASE_URL}assets/lemon.png`, alt: 'レモン' }
};

export default function ScheduleView({ appData, setAppData, onOpenNoteDetail }) {
  const START_HOUR = appData.settings?.startHour ?? 6;
  const END_HOUR = appData.settings?.endHour ?? 24;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  
  const dailySchedule = appData.schedule[dateKey] || [];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTray, setShowTray] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [expandedChecklistNoteId, setExpandedChecklistNoteId] = useState(null);

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveTargetDate, setMoveTargetDate] = useState('');

  const [routineUpdateConfirm, setRoutineUpdateConfirm] = useState(null);
  const [routineDeleteConfirm, setRoutineDeleteConfirm] = useState(null);

  // Dragging states
  const dragRef = useRef(null);
  const longPressTimer = useRef(null);
  const edgeSwitchTimer = useRef(null);
  const lastTapRef = useRef({ time: 0, id: null });
  const [dragState, setDragState] = useState(null); 
  const [previewNote, setPreviewNote] = useState(null); 
  const [isDragMode, setIsDragMode] = useState(false); 
  
  const containerRef = useRef(null);

  const handleSaveNote = (noteData) => {
    let startTime = 12 * 60; // デフォルトは12:00
    const existingNotes = appData.schedule[dateKey] || [];
    const maxIterations = 24; // 無限ループ防止
    let iterations = 0;

    // 同じ時間に既に付箋がある場合は30分ずつずらす
    while (existingNotes.some(n => n.startTime === startTime && n.status !== 'completed') && iterations < maxIterations) {
      startTime += 30;
      // 終了時間を超える場合は開始時間にループ
      if (startTime + noteData.durationMin > END_HOUR * 60) {
        startTime = START_HOUR * 60;
      }
      iterations++;
    }

    const newNote = {
      id: generateId(),
      ...noteData,
      startTime: startTime,
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
      
      const currentHistory = prev.history || [];
      const newHistoryItem = { title: noteData.title, category: noteData.category, durationMin: noteData.durationMin };
      const filteredHistory = currentHistory.filter(h => h.title !== noteData.title);
      nextState.history = [newHistoryItem, ...filteredHistory].slice(0, 20);
      
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

  const toggleFavorite = (note) => {
    setAppData(prev => {
      const favs = prev.favorites || [];
      const isFav = favs.some(f => f.title === note.title && f.category === note.category);
      if (isFav) {
        return { ...prev, favorites: favs.filter(f => !(f.title === note.title && f.category === note.category)) };
      } else {
        return { ...prev, favorites: [...favs, { title: note.title, category: note.category, durationMin: note.durationMin }] };
      }
    });
  };

  const toggleChecklistItem = (noteId, itemId, done) => {
    setAppData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dateKey]: (prev.schedule[dateKey] || []).map(note => {
          if (note.id !== noteId) return note;
          return {
            ...note,
            checklist: (note.checklist || []).map(item => (
              item.id === itemId ? { ...item, done } : item
            ))
          };
        })
      }
    }));
  };

  const applyNoteUpdate = (noteId, newStartTime, newDurationMin, targetDateKey) => {
    setAppData(prev => {
      const nextState = { ...prev };
      const sourceDateKey = dragRef.current.originalDateKey;
      
      const note = (nextState.schedule[sourceDateKey] || []).find(n => n.id === noteId);
      if (!note) return nextState;

      const updatedNote = { ...note, startTime: newStartTime, durationMin: newDurationMin };

      if (sourceDateKey === targetDateKey) {
        const dayNotes = nextState.schedule[targetDateKey] || [];
        const overlappingNote = dayNotes.find(n => 
          n.id !== noteId && n.status !== 'completed' &&
          ((newStartTime >= n.startTime && newStartTime < n.startTime + n.durationMin) ||
           (newStartTime + newDurationMin > n.startTime && newStartTime + newDurationMin <= n.startTime + n.durationMin))
        );

        if (overlappingNote && prev.overlapBehavior === 'swap') {
          const tempStartTime = overlappingNote.startTime;
          nextState.schedule[targetDateKey] = dayNotes.map(n => {
            if (n.id === noteId) return { ...n, startTime: tempStartTime, durationMin: newDurationMin };
            if (n.id === overlappingNote.id) return { ...n, startTime: dragRef.current.originalStartTime };
            return n;
          });
        } else {
          nextState.schedule[targetDateKey] = dayNotes.map(n => 
            n.id === noteId ? updatedNote : n
          );
        }
      } else {
        nextState.schedule[sourceDateKey] = nextState.schedule[sourceDateKey].filter(n => n.id !== noteId);
        nextState.schedule[targetDateKey] = [...(nextState.schedule[targetDateKey] || []), updatedNote];
      }

      return nextState;
    });
  };

  const handleEdgeDateSwitch = (dir, prevDateKey) => {
    if (!dragRef.current) return;
    
    const currentDate = new Date(dragRef.current.currentDateKey);
    currentDate.setDate(currentDate.getDate() + dir);
    const nextDateKey = format(currentDate, 'yyyy-MM-dd');
    
    dragRef.current.currentDateKey = nextDateKey;
    setSelectedDate(currentDate);
  };

  const handlePointerDown = (e, note, type) => {
    e.stopPropagation();
    


    if (showTray) {
      setShowTray(false);
      setActiveNoteId(null);
      return;
    }

    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

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
      isDragMode: false
    };

    setPreviewNote({ ...note });

    // 長押しタイマー（移動を優先させるため、resize時もセットする）
    longPressTimer.current = setTimeout(() => {
      if (dragRef.current) {
        dragRef.current.type = 'move'; // 長押しされたら移動モードに切り替える
        dragRef.current.isDragMode = true;
        setIsDragMode(true);
        setDragState({ ...dragRef.current });
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }, 400);

    if (type === 'resize') {
      setIsDragMode(true);
      setDragState({ ...dragRef.current });
    }

    document.addEventListener('pointermove', handlePointerMove, { passive: false });
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('touchend', handlePointerUp);
    document.addEventListener('touchcancel', handlePointerUp);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    
    const deltaX = clientX - dragRef.current.startX;
    const deltaY = clientY - dragRef.current.startY;

    // リサイズ中に動いた場合は長押しタイマーを解除
    if (dragRef.current.isDragMode && dragRef.current.type === 'resize') {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    if (!dragRef.current.isDragMode) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        dragRef.current.isDragMode = true;
        setIsDragMode(true);
        setDragState({ ...dragRef.current });
      } else {
        return; // 10px以上動いていない場合は何もしない
      }
    }

    if (e.cancelable) e.preventDefault();
    
    dragRef.current.currentX = clientX;
    dragRef.current.currentY = clientY;

    if (dragRef.current.type === 'move') {
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
    } else if (dragRef.current.type === 'resize-top') {
      let proposedStart = dragRef.current.originalStartTime + deltaMinutes;
      proposedStart = Math.round(proposedStart / SNAP_MINUTES) * SNAP_MINUTES;
      const maxStart = dragRef.current.originalStartTime + dragRef.current.originalDuration - 15;
      proposedStart = Math.min(proposedStart, maxStart);
      
      let newDuration = dragRef.current.originalDuration - (proposedStart - dragRef.current.originalStartTime);
      
      setPreviewNote(prev => prev ? { ...prev, startTime: proposedStart, durationMin: newDuration } : null);
    }
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
      if (dragRef.current.isDragMode) {
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
        } else if (dragRef.current.type === 'resize-top') {
          let proposedStart = dragRef.current.originalStartTime + deltaMinutes;
          proposedStart = Math.round(proposedStart / SNAP_MINUTES) * SNAP_MINUTES;
          const maxStart = dragRef.current.originalStartTime + dragRef.current.originalDuration - 15;
          proposedStart = Math.min(proposedStart, maxStart);
          
          newStart = proposedStart;
          newDuration = dragRef.current.originalDuration - (proposedStart - dragRef.current.originalStartTime);
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
      }
      
      setPreviewNote(null);
      setIsDragMode(false);
      dragRef.current = null;
      setDragState(null);
      
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('touchend', handlePointerUp);
      document.removeEventListener('touchcancel', handlePointerUp);
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

  const handleConfirmRoutineDelete = (deleteType) => {
    const { noteId, originalRoutineId } = routineDeleteConfirm;
    
    setAppData(prev => {
      const nextState = { ...prev };
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day; 
        return new Date(d.setDate(diff));
      };
      
      const startOfThisWeek = format(getStartOfWeek(new Date()), 'yyyy-MM-dd');

      if (deleteType === 'all') {
        nextState.routines = (nextState.routines || []).filter(r => r.id !== originalRoutineId);
        const allDates = Object.keys(nextState.schedule);
        for (const dKey of allDates) {
          nextState.schedule[dKey] = nextState.schedule[dKey].filter(n => n.originalRoutineId !== originalRoutineId && n.id !== noteId);
        }
      } else if (deleteType === 'today_onwards') {
        nextState.routines = (nextState.routines || []).filter(r => r.id !== originalRoutineId);
        const allDates = Object.keys(nextState.schedule);
        for (const dKey of allDates) {
          if (dKey >= todayStr) {
            nextState.schedule[dKey] = nextState.schedule[dKey].filter(n => n.originalRoutineId !== originalRoutineId && n.id !== noteId);
          }
        }
      } else if (deleteType === 'this_week_onwards') {
        nextState.routines = (nextState.routines || []).filter(r => r.id !== originalRoutineId);
        const allDates = Object.keys(nextState.schedule);
        for (const dKey of allDates) {
          if (dKey >= startOfThisWeek) {
            nextState.schedule[dKey] = nextState.schedule[dKey].filter(n => n.originalRoutineId !== originalRoutineId && n.id !== noteId);
          }
        }
      }
      
      return nextState;
    });
    
    setRoutineDeleteConfirm(null);
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
    } else if (action === 'ひとやすみ') {
      setAppData(prev => ({
        ...prev,
        todos: [...prev.todos, { ...note, status: 'paused' }],
        schedule: {
          ...prev.schedule,
          [dateKey]: (prev.schedule[dateKey] || []).filter(n => n.id !== note.id)
        }
      }));
      setActiveNoteId(null);
    } else if (action === '詳細追加') {
      onOpenNoteDetail?.({
        id: note.id,
        sourceType: 'schedule',
        sourceDateKey: dateKey
      }, 'today');
      setActiveNoteId(null);
    } else if (action === 'やめる') {
      if (note.originalRoutineId) {
        setRoutineDeleteConfirm({
          noteId: note.id,
          originalRoutineId: note.originalRoutineId
        });
      } else {
        removeNote(note.id);
      }
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
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ padding: '16px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {formattedDateString}
            </h2>
          </div>
        </div>

        <div 
          className="hide-scrollbar"
          style={{ 
            display: 'flex', overflowX: 'auto', padding: '8px 20px 12px', 
            gap: '12px',
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
      </div>

      <div key={dateKey} className="slide-in" style={{ padding: '20px 20px 80px', display: 'flex', flex: 1 }} ref={containerRef}>
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

          {(() => {
            const activeNotes = dailySchedule.filter(n => n.status !== 'completed' && n.id !== previewNote?.id);
            if (previewNote && dragRef.current?.currentDateKey === dateKey) {
              activeNotes.push(previewNote);
            }
            
            const notesWithLayout = activeNotes.map(n => ({ ...n, left: '12px', width: 'calc(100% - 24px)', topOffset: 0 }));
            
            if (appData.overlapBehavior === 'coexist' || !appData.overlapBehavior) {
              for (let i = 0; i < notesWithLayout.length; i++) {
                for (let j = i + 1; j < notesWithLayout.length; j++) {
                  const n1 = notesWithLayout[i];
                  const n2 = notesWithLayout[j];
                  const overlap = (n1.startTime >= n2.startTime && n1.startTime < n2.startTime + n2.durationMin) ||
                                  (n2.startTime >= n1.startTime && n2.startTime < n1.startTime + n1.durationMin);
                  if (overlap) {
                    n1.width = 'calc(50% - 14px)';
                    n2.width = 'calc(50% - 14px)';
                    n2.left = 'calc(50% + 2px)';
                  }
                }
              }
            } else if (appData.overlapBehavior === 'swap' && previewNote && dragRef.current?.currentDateKey === dateKey) {
              const pStart = previewNote.startTime;
              const pEnd = pStart + previewNote.durationMin;
              const originalStart = dragRef.current.originalStartTime;
              
              for (let i = 0; i < notesWithLayout.length; i++) {
                const n = notesWithLayout[i];
                if (n.id === previewNote.id) continue;
                
                const nStart = n.startTime;
                const nEnd = nStart + n.durationMin;
                
                const overlap = (pStart >= nStart && pStart < nEnd) || (pEnd > nStart && pEnd <= nEnd) || (pStart <= nStart && pEnd >= nEnd);
                
                if (overlap) {
                  n.topOffset = originalStart - n.startTime;
                }
              }
            }
            return notesWithLayout;
          })().map(note => {
            const top = (note.startTime + (note.topOffset || 0) - START_HOUR * 60) * PIXELS_PER_MINUTE;
            const height = note.durationMin * PIXELS_PER_MINUTE;
            const isDragging = dragState?.id === note.id && isDragMode;
            const isActive = activeNoteId === note.id;
            const isFavorite = (appData.favorites || []).some(f => f.title === note.title && f.category === note.category);
            const checklist = Array.isArray(note.checklist) ? note.checklist.filter(item => item.text?.trim()) : [];
            const hasChecklist = checklist.length > 0;
            const hasMemo = Boolean(note.memo?.trim());
            const hasBuddyDetails = hasChecklist || hasMemo;
            const buddy = CATEGORY_BUDDIES[note.category] || CATEGORY_BUDDIES.todo;
            const isChecklistOpen = expandedChecklistNoteId === note.id;
            
            return (
              <div 
                key={note.id}
                className={`sticky-note ${note.category} ${isDragging ? 'dragging-shake' : ''}`}
                style={{ 
                  position: 'absolute', top: `${top}px`, left: note.left, width: note.width, height: `${height}px`,
                  zIndex: isDragging || isActive || isChecklistOpen ? 100 : 1,
                  opacity: (showTray && !isActive) ? 0.3 : (isDragging ? 0.8 : 1),
                  boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.2)' : '2px 2px 5px var(--color-shadow)',
                  transition: isDragging ? 'none' : 'all 0.2s',
                  display: 'flex', flexDirection: 'column',
                  touchAction: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
                onPointerDown={(e) => handlePointerDown(e, note, 'move')}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setActiveNoteId(note.id);
                  setShowTray(true);
                }}
                onContextMenu={(e) => { e.preventDefault(); }}
              >
                <div 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(note); }}
                  style={{ position: 'absolute', top: '4px', right: hasBuddyDetails ? 'auto' : '4px', left: hasBuddyDetails ? '4px' : 'auto', padding: '4px', cursor: 'pointer', zIndex: 30 }}
                >
                  <Star size={16} fill={isFavorite ? '#FFD700' : 'none'} color={isFavorite ? '#FFD700' : 'rgba(0,0,0,0.2)'} strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none', padding: hasBuddyDetails ? '0 42px 0 8px' : '0 8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', textAlign: 'center', wordBreak: 'break-word', lineHeight: '1.2' }}>{note.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', marginTop: '4px' }}>
                    {Math.floor(note.startTime / 60)}:{String(note.startTime % 60).padStart(2, '0')}〜
                    {Math.floor((note.startTime + note.durationMin) / 60)}:{String((note.startTime + note.durationMin) % 60).padStart(2, '0')} 
                    <span style={{ fontWeight: 'bold', color: 'var(--color-text-main)', marginLeft: '4px' }}>({note.durationMin}分)</span>
                  </div>
                </div>

                {hasBuddyDetails && (
                  <>
                    <button
                      type="button"
                      className="schedule-buddy-button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTray(false);
                        setActiveNoteId(null);
                        setExpandedChecklistNoteId(prev => prev === note.id ? null : note.id);
                      }}
                      aria-label={`${note.title}の詳細`}
                    >
                      <img src={buddy.src} alt={buddy.alt} />
                    </button>

                    {isChecklistOpen && (
                      <div
                        className={`schedule-checklist-popover schedule-checklist-${note.category || 'todo'}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="schedule-checklist-header">
                          <img src={buddy.src} alt="" aria-hidden="true" />
                          <span>{note.title}</span>
                        </div>
                        {hasMemo && (
                          <p className="schedule-checklist-memo">{note.memo}</p>
                        )}
                        {hasChecklist && (
                          <div className="schedule-checklist-items">
                            {checklist.map(item => (
                              <label key={item.id || item.text}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.done)}
                                  onChange={(e) => toggleChecklistItem(note.id, item.id, e.target.checked)}
                                />
                                <span>{item.text}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                
                <div  
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '16px',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    cursor: 'ns-resize', zIndex: 10, touchAction: 'none'
                  }}
                  onPointerDown={(e) => handlePointerDown(e, note, 'resize-top')}
                >
                  <div style={{ width: '40px', height: '4px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '2px', pointerEvents: 'none' }} />
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

      {routineDeleteConfirm && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '360px', margin: 0 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>ルーティンを削除</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-main)', marginBottom: '24px', lineHeight: '1.5' }}>
              このルーティンをどのように削除しますか？
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => handleConfirmRoutineDelete('today_onwards')}
                style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#FF4D4F', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                今日以降を削除
              </button>
              <button 
                onClick={() => handleConfirmRoutineDelete('this_week_onwards')}
                style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#FF4D4F', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                今週以降を削除
              </button>
              <button 
                onClick={() => handleConfirmRoutineDelete('all')}
                style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#FF4D4F', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                全て削除
              </button>
              <button 
                onClick={() => setRoutineDeleteConfirm(null)}
                style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border-dark)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fab" onClick={() => setIsModalOpen(true)}>
        <Plus size={28} strokeWidth={2.5} />
      </div>

      {isModalOpen && (
        <CreateNoteModal appData={appData} onClose={() => setIsModalOpen(false)} onSave={handleSaveNote} />
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
            <TrayButton icon={<CheckCircle2 color="#5B9E77" size={28} strokeWidth={2.5} />} label="できた" action="できた" onClick={() => handleTrayAction('できた')} />
            <TrayButton icon={<MoveRight color="#D4B01A" size={28} strokeWidth={2.5} />} label="移動" action="移動" onClick={() => handleTrayAction('移動')} />
            <TrayButton icon={<Coffee color="#6296C2" size={28} strokeWidth={2.5} />} label="ひとやすみ" action="ひとやすみ" onClick={() => handleTrayAction('ひとやすみ')} />
            <TrayButton icon={<ListTodo color="#A0A0A0" size={28} strokeWidth={2.5} />} label="詳細追加" action="詳細追加" onClick={() => handleTrayAction('詳細追加')} />
            <TrayButton icon={<Trash2 color="#A0A0A0" size={28} strokeWidth={2.5} />} label="やめる" action="やめる" onClick={() => handleTrayAction('やめる')} />
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
