'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SchoolYear {
  id: string;
  name: string;
}

interface SurveyDate {
  id: string;
  date: string;
  grade: string;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  schoolYear: SchoolYear;
  surveyDates: SurveyDate[];
}

export default function SurveyListPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const response = await fetch('/api/surveys');
        if (!response.ok) {
          throw new Error('Failed to fetch surveys');
        }
        const data = await response.json();
        setSurveys(data);
      } catch {
        setError('アンケートの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurveys();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <Link
              href="/"
              style={{
                color: '#666',
                textDecoration: 'none',
                fontSize: '14px',
                marginBottom: '8px',
                display: 'inline-block',
              }}
            >
              ← ホームに戻る
            </Link>
            <h1 style={{ color: '#333', margin: '8px 0' }}>アンケート一覧</h1>
          </div>
          <Link
            href="/admin/surveys/new"
            style={{
              padding: '12px 24px',
              backgroundColor: '#1976d2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            新規アンケート作成
          </Link>
        </div>

        {isLoading && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px',
              color: '#666',
            }}
          >
            読み込み中...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '4px',
            }}
          >
            {error}
          </div>
        )}

        {!isLoading && !error && surveys.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px',
              color: '#666',
              backgroundColor: 'white',
              borderRadius: '8px',
            }}
          >
            <p>まだアンケートがありません</p>
            <Link
              href="/admin/surveys/new"
              style={{
                color: '#1976d2',
                textDecoration: 'underline',
              }}
            >
              最初のアンケートを作成する
            </Link>
          </div>
        )}

        {!isLoading && !error && surveys.length > 0 && (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#fafafa',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <th
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '500',
                      color: '#666',
                    }}
                  >
                    タイトル
                  </th>
                  <th
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '500',
                      color: '#666',
                    }}
                  >
                    年度
                  </th>
                  <th
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '500',
                      color: '#666',
                    }}
                  >
                    候補日数
                  </th>
                  <th
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '500',
                      color: '#666',
                    }}
                  >
                    作成日
                  </th>
                </tr>
              </thead>
              <tbody>
                {surveys.map((survey) => (
                  <tr
                    key={survey.id}
                    style={{
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <td
                      style={{
                        padding: '16px',
                        color: '#333',
                      }}
                    >
                      {survey.title}
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        color: '#666',
                      }}
                    >
                      {survey.schoolYear.name}
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        color: '#666',
                      }}
                    >
                      {survey.surveyDates.length}件
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        color: '#666',
                      }}
                    >
                      {formatDate(survey.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
