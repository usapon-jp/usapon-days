import React from 'react';

export default function SettingsView({ appData, setAppData }) {
  const startHour = appData.settings?.startHour ?? 6;
  const endHour = appData.settings?.endHour ?? 24;

  const updateSettings = (key, value) => {
    setAppData(prev => ({
      ...prev,
      settings: {
        ...(prev.settings || { startHour: 6, endHour: 24 }),
        [key]: parseInt(value, 10)
      }
    }));
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

      <div className="card" style={{ margin: '0' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-sub)' }}>
          データのエクスポートやインポートなどの詳細設定は今後追加されます。
        </p>
      </div>
    </div>
  );
}
