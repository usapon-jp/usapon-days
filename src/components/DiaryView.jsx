import React, { useState, useRef } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Camera } from 'lucide-react';

export default function DiaryView({ appData, setAppData }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  
  // 今日の記録データ
  const todayRecord = appData.records?.[dateKey] || { text: '', photo: null };
  const dailySchedule = appData.schedule?.[dateKey] || [];
  
  // 完了したタスクのリスト
  const completedNotes = dailySchedule.filter(n => n.status === 'completed');
  
  const fileInputRef = useRef(null);

  const handleTextChange = (e) => {
    setAppData(prev => ({
      ...prev,
      records: {
        ...(prev.records || {}),
        [dateKey]: { ...todayRecord, text: e.target.value }
      }
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppData(prev => ({
          ...prev,
          records: {
            ...(prev.records || {}),
            [dateKey]: { ...todayRecord, photo: reader.result }
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 景色を動的に生成
  const getLandscape = () => {
    const count = completedNotes.length;
    if (count === 0) {
      return {
        background: 'linear-gradient(to bottom, #2C3E50, #3498DB)',
        text: '静かな夜',
        emoji: '🌙✨',
        elements: ['🌲', '🌲', '🦉']
      };
    } else if (count <= 2) {
      return {
        background: 'linear-gradient(to bottom, #FFB75E, #ED8F03)',
        text: 'あたたかい夕暮れ',
        emoji: '🌅',
        elements: ['🌻', '🐇', '🌻']
      };
    } else {
      return {
        background: 'linear-gradient(to bottom, #83a4d4, #b6fbff)',
        text: 'にぎやかな晴れの日！',
        emoji: '☀️',
        elements: ['🐇', '🌸', '🐇', '🦋', '🌸']
      };
    }
  };

  const landscape = getLandscape();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      {/* ヘッダー部：日付ナビゲーション */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
          <ChevronLeft color="var(--color-text-main)" />
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
          {format(selectedDate, 'yyyy年M月d日')}の記録
        </h2>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
          <ChevronRight color="var(--color-text-main)" />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* 動的な景色 */}
        <div style={{ 
          background: landscape.background, 
          height: '180px', borderRadius: '16px', position: 'relative', overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
        }}>
          <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)', marginBottom: '16px' }}>
            {landscape.emoji} {landscape.text}
          </h3>
          <div style={{ display: 'flex', gap: '16px', fontSize: '32px' }}>
            {landscape.elements.map((el, i) => (
              <span key={i} style={{ animation: `bounce ${2 + i * 0.2}s infinite ease-in-out` }}>{el}</span>
            ))}
          </div>
          <style>{`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
          `}</style>
          <div style={{ position: 'absolute', bottom: '8px', right: '12px', color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 'bold' }}>
            できた付箋: {completedNotes.length}個
          </div>
        </div>

        {/* 完了したことリスト */}
        {completedNotes.length > 0 && (
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-sub)', marginBottom: '12px' }}>今日できたこと</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {completedNotes.map(note => (
                <div key={note.id} style={{ 
                  backgroundColor: 'var(--color-tray-bg)', padding: '8px 12px', borderRadius: '20px', 
                  fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-main)', border: '1px solid var(--color-border)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}>
                  ✅ {note.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ひとこと日記 */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-sub)', marginBottom: '12px' }}>ひとこと日記</h3>
          <textarea 
            value={todayRecord.text}
            onChange={handleTextChange}
            placeholder="今日はどんな日だった？"
            style={{
              width: '100%', height: '100px', border: '1px solid var(--color-border)', resize: 'none',
              backgroundColor: '#fff', padding: '16px', borderRadius: '16px', fontFamily: 'inherit',
              fontSize: '15px', lineHeight: '1.6', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.02)', outline: 'none'
            }}
          />
        </div>

        {/* 今日の1枚（ポラロイド風） */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-sub)', marginBottom: '12px' }}>今日の1枚</h3>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div 
              style={{
                width: '100%', maxWidth: '300px', backgroundColor: '#fff', padding: '12px 12px 40px 12px',
                borderRadius: '4px', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', transform: 'rotate(-2deg)',
                cursor: 'pointer', position: 'relative'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ 
                width: '100%', aspectRatio: '1/1', backgroundColor: '#F0F0F0', display: 'flex', flexDirection: 'column', 
                alignItems: 'center', justifyContent: 'center', overflow: 'hidden' 
              }}>
                {todayRecord.photo ? (
                  <img src={todayRecord.photo} alt="今日の一枚" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <Camera size={32} color="#ccc" style={{ marginBottom: '8px' }} />
                    <span style={{ fontSize: '13px', color: '#aaa', fontWeight: 'bold' }}>タップして写真を追加</span>
                  </>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>
          </div>
        </div>
        
        <div style={{ height: '40px' }} /> {/* 余白 */}
      </div>
    </div>
  );
}
