import React, { useState, useRef } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Camera, Sparkles } from 'lucide-react';

export default function DiaryView({ appData, setAppData }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  
  // 今日の記録データ
  const todayRecord = appData.records?.[dateKey] || { text: '', isLandscapeRevealed: false };
  const dailySchedule = appData.schedule?.[dateKey] || [];
  const isPremium = appData.settings?.isPremium || false;
  
  // 写真データのマイグレーション（古いphotoを配列に変換）
  const photos = todayRecord.photos || (todayRecord.photo ? [{ url: todayRecord.photo, comment: '' }] : []);

  
  // 完了したタスクのリスト
  const completedNotes = dailySchedule.filter(n => n.status === 'completed');
  
  const fileInputRef = useRef(null);
  const [changingPhotoIndex, setChangingPhotoIndex] = useState(null);
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);
  const longPressTimerRef = useRef(null);

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
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (changingPhotoIndex !== null) {
      // 変更時は1枚のみ
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

          const newPhotos = [...photos];
          newPhotos[changingPhotoIndex] = { ...newPhotos[changingPhotoIndex], url: compressedDataUrl };
          
          setAppData(prev => ({
            ...prev,
            records: {
              ...(prev.records || {}),
              [dateKey]: { ...todayRecord, photos: newPhotos }
            }
          }));
          setChangingPhotoIndex(null);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
      return;
    }

    // 新規追加時（複数可）
    const maxAllowed = isPremium ? 10 : 1;
    const availableSlots = maxAllowed - photos.length;
    
    if (availableSlots <= 0) {
      alert('これ以上写真を追記できません。');
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);
    let processedCount = 0;
    const newPhotoItems = [];

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          newPhotoItems.push({ url: compressedDataUrl, comment: '' });
          processedCount++;

          if (processedCount === filesToProcess.length) {
            setAppData(prev => ({
              ...prev,
              records: {
                ...(prev.records || {}),
                [dateKey]: { ...todayRecord, photos: [...photos, ...newPhotoItems] }
              }
            }));
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeletePhoto = (index) => {
    const newPhotos = photos.filter((_, idx) => idx !== index);
    setAppData(prev => ({
      ...prev,
      records: {
        ...(prev.records || {}),
        [dateKey]: { ...todayRecord, photos: newPhotos }
      }
    }));
    setActiveMenuIndex(null);
  };

  const handlePhotoCommentChange = (index, comment) => {
    const newPhotos = [...photos];
    newPhotos[index].comment = comment;
    setAppData(prev => ({
      ...prev,
      records: {
        ...(prev.records || {}),
        [dateKey]: { ...todayRecord, photos: newPhotos }
      }
    }));
  };

  const handleRevealLandscape = () => {
    setAppData(prev => ({
      ...prev,
      records: {
        ...(prev.records || {}),
        [dateKey]: { ...todayRecord, isLandscapeRevealed: true }
      }
    }));
  };

  // 景色を動的に生成
  const getLandscape = () => {
    const count = completedNotes.length;
    const hasRoutine = completedNotes.some(n => n.category === 'routine');

    if (count === 0) {
      return {
        background: 'linear-gradient(to bottom, #2C3E50, #3498DB)',
        text: '静かな夜',
        emoji: '🌙✨',
        elements: [
          { src: './assets/lemon.png', size: 40 },
          { src: './assets/piyo.png', size: 50 }
        ]
      };
    } else if (count <= 2) {
      return {
        background: 'linear-gradient(to bottom, #FFB75E, #ED8F03)',
        text: 'あたたかい夕暮れ',
        emoji: '🌅',
        elements: [
          { src: './assets/pon.png', size: 60 },
          { src: './assets/lemon.png', size: 45 }
        ]
      };
    } else {
      return {
        background: 'linear-gradient(to bottom, #83a4d4, #b6fbff)',
        text: 'にぎやかな晴れの日！',
        emoji: '☀️',
        elements: [
          { src: './assets/usa.png', size: 70 },
          { src: './assets/pon.png', size: 60 },
          { src: './assets/piyo.png', size: 50 }
        ]
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
        
        {/* 動的な景色（今日の一枚ボタンで表示される） */}
        {appData.settings?.showLandscape && (
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-sub)', marginBottom: '12px' }}>今日のおつかれさま風景</h3>
            {!todayRecord.isLandscapeRevealed ? (
              <div style={{ 
                height: '140px', borderRadius: '16px', backgroundColor: '#fff', border: '2px dashed var(--color-border)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px'
              }}>
                <p style={{ fontSize: '13px', color: 'var(--color-text-sub)', fontWeight: 'bold' }}>1日の終わりにタップしてね</p>
                <button 
                  onClick={handleRevealLandscape}
                  style={{
                    padding: '12px 24px', borderRadius: '24px', backgroundColor: '#5B9E77', color: '#fff',
                    border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(91,158,119,0.3)', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <Sparkles size={20} />
                  今日の風景を見る
                </button>
              </div>
            ) : (
              <div style={{ 
                background: landscape.background, 
                height: '200px', borderRadius: '16px', position: 'relative', overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
              }}>
                <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)', marginBottom: '16px' }}>
                  {landscape.emoji} {landscape.text}
                </h3>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', height: '80px' }}>
                  {landscape.elements.map((el, i) => (
                    <img 
                      key={i} 
                      src={el.src} 
                      alt="character"
                      style={{ 
                        height: `${el.size}px`, 
                        objectFit: 'contain',
                        animation: `bounce ${2 + i * 0.2}s infinite ease-in-out` 
                      }} 
                    />
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
            )}
          </div>
        )}

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

        {/* 写真のアップロード（プレミアム対応） */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-sub)', marginBottom: '12px' }}>
            思い出の写真 {isPremium && `(${photos.length}/10枚)`}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            {photos.map((photoItem, idx) => (
              <div 
                key={idx} 
                style={{ 
                  width: '100%', maxWidth: '300px', backgroundColor: '#fff', padding: '12px 12px 16px 12px', 
                  borderRadius: '4px', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', 
                  transform: idx % 2 === 0 ? 'rotate(-2deg)' : 'rotate(2deg)',
                  position: 'relative'
                }}
                onTouchStart={() => {
                  longPressTimerRef.current = setTimeout(() => {
                    setActiveMenuIndex(idx);
                  }, 500);
                }}
                onTouchEnd={() => clearTimeout(longPressTimerRef.current)}
                onTouchMove={() => clearTimeout(longPressTimerRef.current)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setActiveMenuIndex(idx);
                }}
              >
                <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#F0F0F0', overflow: 'hidden', marginBottom: '12px' }}>
                  <img src={photoItem.url} alt="思い出" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {isPremium && (
                  <input 
                    type="text" 
                    value={photoItem.comment}
                    onChange={(e) => handlePhotoCommentChange(idx, e.target.value)}
                    placeholder="写真のコメントを記入..."
                    style={{ width: '100%', padding: '8px', border: 'none', borderBottom: '1px dashed #ccc', outline: 'none', fontSize: '13px', textAlign: 'center', backgroundColor: 'transparent' }}
                  />
                )}
                
                {activeMenuIndex === idx && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', gap: '12px', borderRadius: '4px',
                    zIndex: 10
                  }}>
                    <button 
                      onClick={() => {
                        setChangingPhotoIndex(idx);
                        fileInputRef.current.click();
                        setActiveMenuIndex(null);
                      }}
                      style={{ width: '120px', padding: '10px', borderRadius: '20px', border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                    >
                      写真を変更
                    </button>
                    <button 
                      onClick={() => handleDeletePhoto(idx)}
                      style={{ width: '120px', padding: '10px', borderRadius: '20px', border: 'none', backgroundColor: '#FF4D4F', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                    >
                      写真を削除
                    </button>
                    <button 
                      onClick={() => setActiveMenuIndex(null)}
                      style={{ width: '120px', padding: '10px', borderRadius: '20px', border: 'none', backgroundColor: '#f0f0f0', color: '#333', cursor: 'pointer', fontSize: '14px' }}
                    >
                      キャンセル
                    </button>
                  </div>
                )}
              </div>
            ))}

            {((!isPremium && photos.length === 0) || (isPremium && photos.length < 10)) && (
              <div 
                style={{
                  width: '100%', maxWidth: '300px', backgroundColor: '#fff', padding: '12px 12px 40px 12px',
                  borderRadius: '4px', boxShadow: '0 8px 20px rgba(0,0,0,0.06)', border: '2px dashed #ddd',
                  cursor: 'pointer', position: 'relative'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={{ 
                  width: '100%', aspectRatio: '1/1', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', 
                  alignItems: 'center', justifyContent: 'center' 
                }}>
                  <Camera size={32} color="#ccc" style={{ marginBottom: '8px' }} />
                  <span style={{ fontSize: '13px', color: '#aaa', fontWeight: 'bold' }}>タップして写真を追加</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  multiple
                />
              </div>
            )}
          </div>

          {!isPremium && (
            <div style={{ marginTop: '16px', backgroundColor: '#FFF9E6', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid #FDE38A' }}>
              <p style={{ fontSize: '12px', color: '#B8860B', fontWeight: 'bold', margin: 0 }}>
                👑 合言葉を入れると写真が10枚まで貼れるようになります！
              </p>
            </div>
          )}
        </div>
        
        <div style={{ height: '40px' }} /> {/* 余白 */}
      </div>
    </div>
  );
}
