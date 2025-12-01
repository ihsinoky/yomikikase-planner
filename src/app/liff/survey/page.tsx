'use client';

import { useEffect, useState, useCallback } from 'react';
import liff from '@line/liff';

type Grade = 'JUNIOR' | 'MIDDLE' | 'SENIOR';
type ResponseStatus = 'AVAILABLE' | 'UNAVAILABLE';

interface SurveyDate {
  id: string;
  date: string;
  grade: Grade;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  schoolYear: {
    id: string;
    name: string;
  };
  surveyDates: SurveyDate[];
}

interface ExistingResponse {
  id: string;
  responseDetails: {
    surveyDateId: string;
    status: ResponseStatus;
  }[];
}

interface SurveyApiResponse {
  survey: Survey | null;
  existingResponse: ExistingResponse | null;
}

const GRADE_LABELS: Record<Grade, string> = {
  JUNIOR: '年少',
  MIDDLE: '年中',
  SENIOR: '年長',
};

export default function SurveyPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<Record<string, ResponseStatus>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const initializeLiff = useCallback(async () => {
    try {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) {
        setError('LIFF IDが設定されていません');
        setIsInitializing(false);
        return;
      }

      await liff.init({ liffId });

      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      setIsLoggedIn(true);

      const idToken = liff.getIDToken();
      if (!idToken) {
        setError('IDトークンを取得できませんでした');
        setIsInitializing(false);
        return;
      }

      // Fetch the latest survey
      const surveyResponse = await fetch(`/api/liff/survey?idToken=${encodeURIComponent(idToken)}`);
      
      if (!surveyResponse.ok) {
        const errorData = await surveyResponse.json();
        if (surveyResponse.status === 404 || surveyResponse.status === 400) {
          // User not found - redirect to profile registration
          setError('プロフィール登録が必要です。リダイレクト中...');
          setIsInitializing(true);
          window.location.href = '/liff';
          return;
        }
        setError(errorData.error || 'アンケートの取得に失敗しました');
        setIsInitializing(false);
        return;
      }

      const data: SurveyApiResponse = await surveyResponse.json();
      
      if (!data.survey) {
        setSurvey(null);
      } else {
        setSurvey(data.survey);
        
        // If user has already responded, pre-fill the responses
        if (data.existingResponse) {
          const existingResponses: Record<string, ResponseStatus> = {};
          data.existingResponse.responseDetails.forEach((detail) => {
            existingResponses[detail.surveyDateId] = detail.status;
          });
          setResponses(existingResponses);
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

  const handleResponseChange = (surveyDateId: string, status: ResponseStatus) => {
    setResponses((prev) => ({
      ...prev,
      [surveyDateId]: status,
    }));
  };

  const handleSubmit = async () => {
    if (!survey) return;

    // Validate that all dates have responses
    const unansweredDates = survey.surveyDates.filter((sd) => !responses[sd.id]);
    if (unansweredDates.length > 0) {
      setError('すべての候補日について回答してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const idToken = liff.getIDToken();
      if (!idToken) {
        setError('IDトークンを取得できませんでした');
        setIsSubmitting(false);
        return;
      }

      const responseDetails = Object.entries(responses).map(([surveyDateId, status]) => ({
        surveyDateId,
        status,
      }));

      const response = await fetch('/api/liff/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          surveyId: survey.id,
          responseDetails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || '回答の送信に失敗しました');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Submit survey response error:', error);
      setError('回答の送信中にエラーが発生しました');
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

  // Error state (not logged in)
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

  // Submitted state
  if (isSubmitted) {
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
            回答を送信しました
          </h1>
          <p
            style={{
              color: '#666',
              fontSize: '14px',
              marginBottom: '24px',
            }}
          >
            ご協力ありがとうございました
          </p>
          <button
            onClick={() => liff.closeWindow()}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#06c755',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            閉じる
          </button>
        </div>
      </main>
    );
  }

  // No survey available
  if (!survey) {
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
          <p style={{ color: '#666' }}>現在回答可能なアンケートはありません</p>
        </div>
      </main>
    );
  }

  // Survey response form
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1
          style={{
            color: '#333',
            fontSize: '18px',
            marginBottom: '4px',
          }}
        >
          {survey.title}
        </h1>
        <p
          style={{
            color: '#888',
            fontSize: '12px',
            marginBottom: '16px',
          }}
        >
          {survey.schoolYear.name}
        </p>
        {survey.description && (
          <p
            style={{
              color: '#666',
              fontSize: '14px',
              marginBottom: '20px',
              lineHeight: '1.6',
            }}
          >
            {survey.description}
          </p>
        )}

        <div style={{ marginBottom: '24px' }}>
          <p
            style={{
              color: '#333',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '12px',
            }}
          >
            各候補日について参加可否を選択してください
          </p>

          {survey.surveyDates.map((surveyDate) => (
            <div
              key={surveyDate.id}
              style={{
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <p
                  style={{
                    color: '#333',
                    fontSize: '16px',
                    fontWeight: '500',
                    margin: 0,
                  }}
                >
                  {formatDate(surveyDate.date)}
                </p>
                <p
                  style={{
                    color: '#888',
                    fontSize: '12px',
                    margin: '4px 0 0',
                  }}
                >
                  対象: {GRADE_LABELS[surveyDate.grade]}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleResponseChange(surveyDate.id, 'AVAILABLE')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '2px solid',
                    borderColor: responses[surveyDate.id] === 'AVAILABLE' ? '#06c755' : '#ddd',
                    borderRadius: '8px',
                    backgroundColor: responses[surveyDate.id] === 'AVAILABLE' ? '#e8f5e9' : 'white',
                    color: responses[surveyDate.id] === 'AVAILABLE' ? '#06c755' : '#666',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  ⭕ 参加できる
                </button>
                <button
                  type="button"
                  onClick={() => handleResponseChange(surveyDate.id, 'UNAVAILABLE')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '2px solid',
                    borderColor: responses[surveyDate.id] === 'UNAVAILABLE' ? '#e53935' : '#ddd',
                    borderRadius: '8px',
                    backgroundColor: responses[surveyDate.id] === 'UNAVAILABLE' ? '#ffebee' : 'white',
                    color: responses[surveyDate.id] === 'UNAVAILABLE' ? '#e53935' : '#666',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  ❌ 参加できない
                </button>
              </div>
            </div>
          ))}
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
          onClick={handleSubmit}
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
          {isSubmitting ? '送信中...' : '回答を送信'}
        </button>
      </div>
    </main>
  );
}
