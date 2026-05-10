import React, { useState } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Plus, ChevronRight, Play, Trash2 } from 'lucide-react';
import CreateNoteModal from './CreateNoteModal';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function TodoListView({ appData, setAppData, onNavigate }) {
  // view: 'menu', 'todo', 'routine', 'relax', 'paused'
  const [currentView, setCurrentView] = useState('menu');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prefilledCategory, setPrefilledCategory] = useState('todo');

  const todos = appData.todos || [];

  const handleSaveNote = (noteData) => {
    const newNote = {
      id: generateId(),
      ...noteData,
      status: currentView === 'paused' ? 'paused' : 'active',
      startTime: 12 * 60,
      createdAt: format(new Date(), 'yyyy-MM-dd')
    };

    if (currentView === 'paused') {
      setAppData(prev => ({ ...prev, todos: [...prev.todos, newNote] }));
      setIsModalOpen(false);
      return;
    }

    const dateKey = format(new Date(), 'yyyy-MM-dd');
    
    setAppData(prev => {
      const nextState = { ...prev };
      
      if (noteData.repeat) {
        nextState.routines = [...(nextState.routines || []), newNote];
        
        let shouldAppearToday = false;
        if (noteData.repeat.type === 'daily') shouldAppearToday = true;
        if (noteData.repeat.type === 'weekly') shouldAppearToday = noteData.repeat.days.includes(new Date().getDay());
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
    onNavigate('schedule');
  };

  const openCreateModal = (category = 'todo') => {
    setPrefilledCategory(category);
    setIsModalOpen(true);
  };

  const renderMenu = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      <div 
        className="card" 
        onClick={() => openCreateModal('todo')} 
        style={{ margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#FFF5E1', border: '1px solid var(--color-primary)' }}
      >
        <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '50%' }}>
          <Plus size={24} color="var(--color-primary)" />
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#B38F00' }}>付箋をつくる</div>
      </div>

      <h3 style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-text-sub)' }}>付箋リスト</h3>

      <MenuButton 
        title="TODO" 
        color="var(--color-todo)" 
        onClick={() => setCurrentView('todo')} 
        count={todos.filter(t => t.category === 'todo' && t.status !== 'paused').length} 
      />
      <MenuButton 
        title="ルーティン" 
        color="var(--color-routine)" 
        onClick={() => setCurrentView('routine')} 
        count={todos.filter(t => t.category === 'routine' && t.status !== 'paused').length} 
      />
      <MenuButton 
        title="のんびり" 
        color="var(--color-relax)" 
        onClick={() => setCurrentView('relax')} 
        count={todos.filter(t => t.category === 'relax' && t.status !== 'paused').length} 
      />
      
      <h3 style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-text-sub)' }}>おやすみ</h3>
      
      <MenuButton 
        title="ひとやすみ中TODO" 
        color="#F0F0F0" 
        onClick={() => setCurrentView('paused')} 
        count={todos.filter(t => t.status === 'paused').length} 
      />
    </div>
  );

  const renderList = () => {
    let filtered = [];
    if (currentView === 'paused') {
      filtered = todos.filter(t => t.status === 'paused');
    } else {
      filtered = todos.filter(t => t.category === currentView && t.status !== 'paused');
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button 
            onClick={() => openCreateModal(currentView === 'paused' ? 'todo' : currentView)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border-dark)', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            <Plus size={16} /> 追加する
          </button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-sub)', marginTop: '40px' }}>
            付箋がありません。
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(note => (
              <div key={note.id} className={`card ${note.category}`} style={{ margin: 0, padding: '16px', borderLeft: `6px solid var(--color-${note.category})`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{note.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-sub)', marginTop: '4px' }}>目安: {note.durationMin}分</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleMoveToToday(note)} 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--color-border)', backgroundColor: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                    title="今日のスケジュールに追加"
                  >
                    <Play size={18} color="var(--color-primary)" />
                  </button>
                  <button 
                    onClick={() => handleDelete(note.id)} 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--color-border)', backgroundColor: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} color="#A0A0A0" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleMoveToToday = (note) => {
    const dateKey = format(new Date(), 'yyyy-MM-dd');
    setAppData(prev => ({
      ...prev,
      todos: prev.todos.filter(n => n.id !== note.id),
      schedule: {
        ...prev.schedule,
        [dateKey]: [...(prev.schedule[dateKey] || []), { ...note, status: 'active', startTime: 12 * 60 }]
      }
    }));
    onNavigate('schedule');
  };

  const handleDelete = (id) => {
    if (confirm('削除しますか？')) {
      setAppData(prev => ({ ...prev, todos: prev.todos.filter(n => n.id !== id) }));
    }
  };

  return (
    <div style={{ padding: '20px 20px 80px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <button 
          onClick={() => currentView === 'menu' ? onNavigate('home') : setCurrentView('menu')} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={24} color="var(--color-text-main)" />
        </button>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
          {currentView === 'menu' ? '付箋' : 
           currentView === 'todo' ? 'TODOリスト' :
           currentView === 'routine' ? 'ルーティン一覧' :
           currentView === 'relax' ? 'のんびり一覧' : 'ひとやすみ中TODO'}
        </h2>
      </div>

      {currentView === 'menu' ? renderMenu() : renderList()}

      {isModalOpen && (
        <CreateNoteModal 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveNote} 
          initialCategory={prefilledCategory}
        />
      )}
    </div>
  );
}

function MenuButton({ title, color, onClick, count }) {
  return (
    <div className="card" onClick={onClick} style={{ margin: 0, padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `6px solid ${color}` }}>
      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {count > 0 && <span style={{ backgroundColor: 'var(--color-border)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', color: 'var(--color-text-sub)' }}>{count}</span>}
        <ChevronRight size={20} color="var(--color-text-sub)" />
      </div>
    </div>
  );
}
