import React from 'react';

export default function SettingsView() {
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' }}>設定</h2>
      <div className="card" style={{ margin: '0' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-sub)' }}>
          データのエクスポートやインポート、アプリの設定項目がここに入ります。
        </p>
      </div>
    </div>
  );
}
