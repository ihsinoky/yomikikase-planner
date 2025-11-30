'use client';

import { useEffect, useState, useCallback } from 'react';
import liff from '@line/liff';

type Grade = 'JUNIOR' | 'MIDDLE' | 'SENIOR';

interface UserProfile {
  grade: Grade;
  className: string | null;
  schoolYear: {
    id: string;
    name: string;
  };
}

interface AuthResponse {
  userId: string;
  displayName: string | null;
  hasCurrentYearProfile: boolean;
  activeSchoolYearId: string | null;
  profile: UserProfile | null;
}

interface ProfileResponse {
  userId: string;
  displayName: string | null;
  profile: UserProfile | null;
}

const GRADE_LABELS: Record<Grade, string> = {
  JUNIOR: '年少',
  MIDDLE: '年中',
  SENIOR: '年長',
};

export default function LiffPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [grade, setGrade] = useState<Grade | ''>('');
  const [className, setClassName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile state
  const [hasProfile, setHasProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);

  const initializeLiff = useCallback(async () => {
    try {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) {
        setError('LIFF IDが設定されていません');
        setIsInitializing(false);
        return;
      }

      await liff.init({ liffId });

      // If not logged in, redirect to LINE login
      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      setIsLoggedIn(true);

      // Get the ID token
      const idToken = liff.getIDToken();
      if (!idToken) {
        setError('IDトークンを取得できませんでした');
        setIsInitializing(false);
        return;
      }

      // Authenticate with our backend
      const authResponse = await fetch('/api/liff/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        setError(errorData.error || '認証に失敗しました');
        setIsInitializing(false);
        return;
      }

      const authData: AuthResponse = await authResponse.json();

      // If no active school year, show message
      if (!authData.activeSchoolYearId) {
        setError('現在アクティブな年度がありません。管理者にお問い合わせください。');
        setIsInitializing(false);
        return;
      }

      // If user already has a profile, display it directly from auth response
      if (authData.hasCurrentYearProfile && authData.profile) {
        setHasProfile(true);
        setUserProfile(authData.profile);
        setUserDisplayName(authData.displayName);
      } else {
        // Pre-fill display name from LINE profile if available
        if (authData.displayName) {
          setDisplayName(authData.displayName);
        }
      }

      setIsInitializing(false);
    } catch (e) {
      console.error('LIFF initialization error:', e);
      setError('LIFFの初期化に失敗しました');
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    initializeLiff();
  }, [initializeLiff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const idToken = liff.getIDToken();
      if (!idToken) {
        setError('IDトークンを取得できませんでした');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/liff/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          displayName,
          grade,
          className: className || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'プロフィールの登録に失敗しました');
        setIsSubmitting(false);
        return;
      }

      const data: ProfileResponse = await response.json();
      setHasProfile(true);
      setUserProfile(data.profile);
      setUserDisplayName(data.displayName);
    } catch {
      setError('プロフィールの登録中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isInitializing) {
    return (
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
        }}
      >
        <p style={{ color: '#666' }}>読み込み中...</p>
      </main>
    );
  }

  // Error state
  if (error && !isLoggedIn) {
    return (
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '400px',
          }}
        >
          {error}
        </div>
      </main>
    );
  }

  // Profile already registered
  if (hasProfile && userProfile) {
    return (
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#e8f5e9',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '32px',
            }}
          >
            ✓
          </div>
          <h1
            style={{
              color: '#333',
              fontSize: '20px',
              marginBottom: '8px',
            }}
          >
            プロフィール登録済み
          </h1>
          <p
            style={{
              color: '#666',
              fontSize: '14px',
              marginBottom: '24px',
            }}
          >
            {userProfile.schoolYear.name}のプロフィールが登録されています
          </p>

          <div
            style={{
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'left',
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#888', fontSize: '12px' }}>名前</span>
              <p style={{ color: '#333', margin: '4px 0 0', fontSize: '16px' }}>
                {userDisplayName || '-'}
              </p>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#888', fontSize: '12px' }}>学年</span>
              <p style={{ color: '#333', margin: '4px 0 0', fontSize: '16px' }}>
                {GRADE_LABELS[userProfile.grade]}
              </p>
            </div>
            <div>
              <span style={{ color: '#888', fontSize: '12px' }}>クラス</span>
              <p style={{ color: '#333', margin: '4px 0 0', fontSize: '16px' }}>
                {userProfile.className || '-'}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Profile registration form
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1
          style={{
            color: '#333',
            fontSize: '20px',
            marginBottom: '8px',
            textAlign: 'center',
          }}
        >
          読み聞かせプランナー
        </h1>
        <p
          style={{
            color: '#666',
            fontSize: '14px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          初回プロフィール登録
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="displayName"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#333',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              お名前 <span style={{ color: '#e53935' }}>*</span>
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="例: 山田 花子"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="grade"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#333',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              学年 <span style={{ color: '#e53935' }}>*</span>
            </label>
            <select
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value as Grade)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                backgroundColor: 'white',
              }}
            >
              <option value="">選択してください</option>
              <option value="JUNIOR">年少</option>
              <option value="MIDDLE">年中</option>
              <option value="SENIOR">年長</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="className"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#333',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              クラス名
            </label>
            <input
              id="className"
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="例: さくら組"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#ffebee',
                color: '#c62828',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: isSubmitting ? '#ccc' : '#06c755',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? '登録中...' : '登録する'}
          </button>
        </form>
      </div>
    </main>
  );
}
