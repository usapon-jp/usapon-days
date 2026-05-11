import React, { useState, useEffect } from 'react';
import { Home, Calendar, BookHeart, Settings } from 'lucide-react';
import { loadAppData, saveAppData } from './storageService';
import HomeView from './components/HomeView';
import ScheduleView from './components/ScheduleView';
import DiaryView from './components/DiaryView';
import SettingsView from './components/SettingsView';
import TodoListView from './components/TodoListView';
import WeeklyScheduleSheet from './components/WeeklyScheduleSheet';
import NoteDetailView from './components/NoteDetailView';

import CalendarView from './components/CalendarView';

function App() {
  const [currentTab, setCurrentTab] = useState('schedule');
  const [appData, setAppData] = useState(loadAppData());
  const [weeklySheetState, setWeeklySheetState] = useState('closed');
  const [noteDetailSource, setNoteDetailSource] = useState(null);
  const [noteDetailReturnTab, setNoteDetailReturnTab] = useState('home');

  useEffect(() => {
    saveAppData(appData);
  }, [appData]);

  const handleMarkerClick = (source) => {
    setNoteDetailReturnTab(currentTab);
    setNoteDetailSource(source);
    setWeeklySheetState('closed');
  };

  const handleBackFromNoteDetail = () => {
    setNoteDetailSource(null);
    setCurrentTab(noteDetailReturnTab);
    setWeeklySheetState('half');
  };

  const handleNavigate = (tab) => {
    setCurrentTab(tab);
    setNoteDetailSource(null);
  };

  const renderContent = () => {
    if (noteDetailSource) {
      return (
        <NoteDetailView
          appData={appData}
          setAppData={setAppData}
          source={noteDetailSource}
          onBack={handleBackFromNoteDetail}
        />
      );
    }

    switch (currentTab) {
      case 'home': return <HomeView appData={appData} setAppData={setAppData} onNavigate={handleNavigate} />;
      case 'calendar': return <CalendarView appData={appData} setAppData={setAppData} onNavigate={handleNavigate} />;
      case 'today': return <ScheduleView appData={appData} setAppData={setAppData} />;
      case 'diary': return <DiaryView appData={appData} setAppData={setAppData} />;
      case 'settings': return <SettingsView appData={appData} setAppData={setAppData} />;
      case 'todo': return <TodoListView appData={appData} setAppData={setAppData} onNavigate={handleNavigate} />;
      default: return <ScheduleView appData={appData} setAppData={setAppData} />;
    }
  };

  return (
    <div className="app-container">
      <div className="content-area">
        {renderContent()}
      </div>

      {!noteDetailSource && (
        <WeeklyScheduleSheet
          appData={appData}
          sheetState={weeklySheetState}
          onSheetStateChange={setWeeklySheetState}
          onMarkerClick={handleMarkerClick}
        />
      )}
      
      <nav className="bottom-nav">
        <div className={`nav-item ${currentTab === 'home' && !noteDetailSource ? 'active' : ''}`} onClick={() => handleNavigate('home')}>
          <Home size={24} strokeWidth={currentTab === 'home' ? 2.5 : 2} />
          <span style={{ fontSize: '10px' }}>ホーム</span>
        </div>
        <div className={`nav-item ${currentTab === 'calendar' && !noteDetailSource ? 'active' : ''}`} onClick={() => handleNavigate('calendar')}>
          <Calendar size={24} strokeWidth={currentTab === 'calendar' ? 2.5 : 2} />
          <span style={{ fontSize: '10px' }}>カレンダー</span>
        </div>
        <div className={`nav-item ${currentTab === 'today' && !noteDetailSource ? 'active' : ''}`} onClick={() => handleNavigate('today')}>
          <div style={{ backgroundColor: 'var(--color-primary)', borderRadius: '50%', padding: '8px', color: '#fff', transform: 'translateY(-10px)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <Calendar size={28} strokeWidth={2.5} color="#fff" />
          </div>
          <span style={{ fontSize: '10px', marginTop: '-12px' }}>今日の予定</span>
        </div>
        <div className={`nav-item ${currentTab === 'diary' && !noteDetailSource ? 'active' : ''}`} onClick={() => handleNavigate('diary')}>
          <BookHeart size={24} strokeWidth={currentTab === 'diary' ? 2.5 : 2} />
          <span style={{ fontSize: '10px' }}>記録</span>
        </div>
        <div className={`nav-item ${currentTab === 'settings' && !noteDetailSource ? 'active' : ''}`} onClick={() => handleNavigate('settings')}>
          <Settings size={24} strokeWidth={currentTab === 'settings' ? 2.5 : 2} />
          <span style={{ fontSize: '10px' }}>設定</span>
        </div>
      </nav>
    </div>
  );
}

export default App;
