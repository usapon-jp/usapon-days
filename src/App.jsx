import React, { useState, useEffect } from 'react';
import { Home, Calendar, BookHeart, Settings } from 'lucide-react';
import { loadAppData, saveAppData } from './storageService';
import HomeView from './components/HomeView';
import ScheduleView from './components/ScheduleView';
import DiaryView from './components/DiaryView';
import SettingsView from './components/SettingsView';
import TodoListView from './components/TodoListView';

function App() {
  const [currentTab, setCurrentTab] = useState('schedule');
  const [appData, setAppData] = useState(loadAppData());

  useEffect(() => {
    saveAppData(appData);
  }, [appData]);

  const renderContent = () => {
    switch (currentTab) {
      case 'home': return <HomeView appData={appData} setAppData={setAppData} onNavigate={setCurrentTab} />;
      case 'schedule': return <ScheduleView appData={appData} setAppData={setAppData} />;
      case 'diary': return <DiaryView appData={appData} setAppData={setAppData} />;
      case 'settings': return <SettingsView appData={appData} setAppData={setAppData} />;
      case 'todo': return <TodoListView appData={appData} setAppData={setAppData} onNavigate={setCurrentTab} />;
      default: return <HomeView appData={appData} setAppData={setAppData} onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="app-container">
      <div className="content-area">
        {renderContent()}
      </div>
      
      <nav className="bottom-nav">
        <div className={`nav-item ${currentTab === 'home' ? 'active' : ''}`} onClick={() => setCurrentTab('home')}>
          <Home size={24} strokeWidth={currentTab === 'home' ? 2.5 : 2} />
          <span>ホーム</span>
        </div>
        <div className={`nav-item ${currentTab === 'schedule' ? 'active' : ''}`} onClick={() => setCurrentTab('schedule')}>
          <Calendar size={24} strokeWidth={currentTab === 'schedule' ? 2.5 : 2} />
          <span>スケジュール</span>
        </div>
        <div className={`nav-item ${currentTab === 'diary' ? 'active' : ''}`} onClick={() => setCurrentTab('diary')}>
          <BookHeart size={24} strokeWidth={currentTab === 'diary' ? 2.5 : 2} />
          <span>日記</span>
        </div>
        <div className={`nav-item ${currentTab === 'settings' ? 'active' : ''}`} onClick={() => setCurrentTab('settings')}>
          <Settings size={24} strokeWidth={currentTab === 'settings' ? 2.5 : 2} />
          <span>設定</span>
        </div>
      </nav>
    </div>
  );
}

export default App;
