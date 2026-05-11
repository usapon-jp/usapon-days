import React, { useState } from 'react';

export default function SettingsView({ appData, setAppData }) {
  const startHour = appData.settings?.startHour ?? 6;
  const endHour = appData.settings?.endHour ?? 24;
  const isPremium = appData.settings?.isPremium || false;
  const showLandscape = appData.settings?.showLandscape ?? false;

  const [secretWord, setSecretWord] = useState('');

  const updateSettings = (key, value) => {
    setAppData(prev => ({
      ...prev,
      settings: {
        ...(prev.settings || { startHour: 6, endHour: 24 }),
        [key]: (key === 'startHour' || key === 'endHour') ? parseInt(value, 10) : value
      }
    }));
  };

  const handleUnlockPremium = () => {
    if (secretWord === 'うさぽん' || secretWord === 'usapon') {
      setAppData(prev => ({
        ...prev,
        settings: { ...(prev.settings || {}), isPremium: true }
      }));
      setSecretWord('');
      alert('プレミアム機能が解放されました！🎉');
    } else {
      alert('合言葉が違います🐰💦');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' }}>設定</h2>
      
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>スケジュール表示時間</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select 
            value={startHour} 
            onChange={(e) => updateSettings('startHour', e.target.value)}
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#fff', fontSize: '16px' }}
          >
            {Array.from({ length: 24 }, (_, i) => i).map(h => (
              <option key={h} value={h}>{h}:00</option>
            ))}
          </select>
          <span style={{ fontWeight: 'bold', color: 'var(--color-text-sub)' }}>〜</span>
          <select 
            value={endHour} 
            onChange={(e) => updateSettings('endHour', e.target.value)}
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#fff', fontSize: '16px' }}
          >
            {Array.from({ length: 25 }, (_, i) => i).filter(h => h > startHour).map(h => (
              <option key={h} value={h}>{h}:00</option>
            ))}
          </select>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-sub)', marginTop: '16px', lineHeight: '1.4' }}>
          ※スケジュールのタイムラインの開始と終了時間を設定します。<br />
          夜遅くまで活動する方や、早起きな方に合わせて調整できます。
        </p>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>付箋の重なり時の挙動</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select 
            value={appData.overlapBehavior || 'coexist'}
            onChange={(e) => setAppData(prev => ({ ...prev, overlapBehavior: e.target.value }))}
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#fff', fontSize: '16px' }}
          >
            <option value="coexist">共存（Googleカレンダー風）</option>
            <option value="swap">入替（場所を入れ替える）</option>
          </select>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-sub)', marginTop: '16px', lineHeight: '1.4' }}>
          ※同じ時間帯に付箋が重なった場合の表示方法を設定します。
        </p>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>おつかれさま風景の表示</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-text-main)' }}>「おつかれさま風景」を表示する</span>
          <div 
            onClick={() => updateSettings('showLandscape', !showLandscape)}
            style={{
              width: '50px', height: '26px', borderRadius: '13px',
              backgroundColor: showLandscape ? '#5B9E77' : '#D1D1D1',
              position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s'
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '11px', backgroundColor: '#fff',
              position: 'absolute', top: '2px', left: showLandscape ? '26px' : '2px',
              transition: 'left 0.2s'
            }} />
          </div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-sub)', marginTop: '16px', lineHeight: '1.4' }}>
          ※日記画面の「今日のおつかれさま風景」セクションを表示するかどうかを設定します。
        </p>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#E8A317' }}>👑 プレミアム機能</h3>
        {isPremium ? (
          <div style={{ backgroundColor: '#FFF9E6', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', color: '#B8860B', marginBottom: '8px' }}>プレミアム機能解放済みです！✨</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>日記に写真を10枚まで追加できるようになりました。</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-main)', marginBottom: '12px', lineHeight: '1.5' }}>
              合言葉を入力すると、日記の写真が10枚まで貼れるようになります！
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={secretWord}
                onChange={(e) => setSecretWord(e.target.value)}
                placeholder="合言葉を入力..."
                style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none' }}
              />
              <button 
                onClick={handleUnlockPremium}
                style={{ padding: '0 16px', borderRadius: '8px', backgroundColor: '#E8A317', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                解放
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ margin: '0' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-sub)' }}>
          データのエクスポートやインポートなどの詳細設定は今後追加されます。
        </p>
      </div>
    </div>
  );
}
