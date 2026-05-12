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
import WelcomeView from './components/WelcomeView';
import MemoView from './components/MemoView';

import CalendarView from './components/CalendarView';

function App() {
  const [appData, setAppData] = useState(loadAppData());
  const [currentTab, setCurrentTab] = useState(appData.settings?.hasSeenWelcome ? 'home' : 'welcome');
  const [weeklySheetState, setWeeklySheetState] = useState('closed');
  const [noteDetailSource, setNoteDetailSource] = useState(null);
  const [noteDetailReturnTab, setNoteDetailReturnTab] = useState('home');
  const [createNoteRequest, setCreateNoteRequest] = useState(null);
  const [scheduleDateRequest, setScheduleDateRequest] = useState(null);
  const [scheduleReturnTab, setScheduleReturnTab] = useState(null);

  useEffect(() => {
    saveAppData(appData);
  }, [appData]);

  const handleMarkerClick = (source) => {
    setNoteDetailReturnTab(currentTab);
    setNoteDetailSource({
      ...source,
      returnLabel: '週間スケジュールへ戻る',
      returnToWeekly: true
    });
    setWeeklySheetState('closed');
  };

  const handleOpenNoteDetail = (source, returnTab = currentTab) => {
    setNoteDetailReturnTab(returnTab);
    setNoteDetailSource(source);
    setWeeklySheetState('closed');
  };

  const handleBackFromNoteDetail = () => {
    setNoteDetailSource(null);
    setCurrentTab(noteDetailReturnTab);
    setWeeklySheetState(noteDetailSource?.returnToWeekly ? 'half' : 'closed');
  };

  const handleNavigate = (tab) => {
    setCurrentTab(tab);
    setNoteDetailSource(null);
    setScheduleReturnTab(null);
  };

  const handleCreateNoteFromHome = (category) => {
    setNoteDetailSource(null);
    setWeeklySheetState('closed');
    setScheduleReturnTab(null);
    setCreateNoteRequest({
      category,
      requestId: Date.now()
    });
    setCurrentTab('today');
  };

  const handleOpenScheduleDate = (dateKey) => {
    setNoteDetailSource(null);
    setWeeklySheetState('closed');
    setScheduleReturnTab('calendar');
    setScheduleDateRequest({
      dateKey,
      requestId: Date.now()
    });
    setCurrentTab('today');
  };

  const handleStartWelcome = () => {
    setAppData(prev => ({
      ...prev,
      settings: {
        ...(prev.settings || {}),
        hasSeenWelcome: true
      }
    }));
    setCurrentTab('home');
  };

  const renderContent = () => {
    if (currentTab === 'welcome') {
      return <WelcomeView onStart={handleStartWelcome} />;
    }

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
      case 'home': return <HomeView appData={appData} setAppData={setAppData} onNavigate={handleNavigate} onOpenNoteDetail={handleOpenNoteDetail} onCreateNote={handleCreateNoteFromHome} />;
      case 'calendar': return <CalendarView appData={appData} setAppData={setAppData} onNavigate={handleNavigate} onOpenScheduleDate={handleOpenScheduleDate} />;
      case 'memo': return <MemoView appData={appData} setAppData={setAppData} onNavigate={handleNavigate} />;
      case 'today': return (
        <ScheduleView
          appData={appData}
          setAppData={setAppData}
          onOpenNoteDetail={handleOpenNoteDetail}
          createNoteRequest={createNoteRequest}
          onCreateNoteRequestConsumed={() => setCreateNoteRequest(null)}
          scheduleDateRequest={scheduleDateRequest}
          onScheduleDateRequestConsumed={() => setScheduleDateRequest(null)}
          onBack={scheduleReturnTab ? () => handleNavigate(scheduleReturnTab) : null}
        />
      );
      case 'diary': return <DiaryView appData={appData} setAppData={setAppData} />;
      case 'settings': return <SettingsView appData={appData} setAppData={setAppData} />;
      case 'todo': return <TodoListView appData={appData} setAppData={setAppData} onNavigate={handleNavigate} />;
      default: return <ScheduleView appData={appData} setAppData={setAppData} onOpenNoteDetail={handleOpenNoteDetail} />;
    }
  };

  return (
    <div className="app-container">
      <div className="content-area">
        {renderContent()}
      </div>

      {currentTab !== 'welcome' && currentTab !== 'memo' && !noteDetailSource && (
        <WeeklyScheduleSheet
          appData={appData}
          sheetState={weeklySheetState}
          onSheetStateChange={setWeeklySheetState}
          onMarkerClick={handleMarkerClick}
        />
      )}
      
      {currentTab !== 'welcome' && (
      <nav className="bottom-nav">
        <div className={`nav-item ${currentTab === 'home' && !noteDetailSource ? 'active' : ''}`} onClick={() => handleNavigate('home')}>
          <Home size={24} strokeWidth={currentTab === 'home' ? 2.5 : 2} />
          <span>ホーム</span>
        </div>
        <div className={`nav-item ${currentTab === 'calendar' && !noteDetailSource ? 'active' : ''}`} onClick={() => handleNavigate('calendar')}>
          <Calendar size={24} strokeWidth={currentTab === 'calendar' ? 2.5 : 2} />
          <span>カレンダー</span>
        </div>
        <div className={`nav-item nav-item-primary ${currentTab === 'today' && !noteDetailSource ? 'active' : ''}`} onClick={() => handleNavigate('today')}>
          <div>
            <Calendar size={28} strokeWidth={2.5} color="#fff" />
          </div>
          <span>今日の予定</span>
        </div>
        <div className={`nav-item ${currentTab === 'diary' && !noteDetailSource ? 'active' : ''}`} onClick={() => handleNavigate('diary')}>
          <BookHeart size={24} strokeWidth={currentTab === 'diary' ? 2.5 : 2} />
          <span>記録</span>
        </div>
        <div className={`nav-item ${currentTab === 'settings' && !noteDetailSource ? 'active' : ''}`} onClick={() => handleNavigate('settings')}>
          <Settings size={24} strokeWidth={currentTab === 'settings' ? 2.5 : 2} />
          <span>設定</span>
        </div>
      </nav>
      )}
    </div>
  );
}

export default App;
