'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
        }}
      >
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: isLoggingOut ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            color: '#666',
          }}
        >
          {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </div>
      <h1 style={{ color: '#333', marginBottom: '16px' }}>読み聞かせプランナー</h1>
      <h2 style={{ color: '#666', fontWeight: 'normal', marginBottom: '24px' }}>管理画面</h2>
      <p style={{ color: '#888', marginBottom: '32px' }}>
        幼稚園の「絵本読み聞かせ」活動を支援するアプリケーションです
      </p>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <Link
          href="/admin/surveys"
          style={{
            padding: '16px 32px',
            backgroundColor: '#1976d2',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          📋 アンケート管理
        </Link>
      </div>
    </main>
  );
}
