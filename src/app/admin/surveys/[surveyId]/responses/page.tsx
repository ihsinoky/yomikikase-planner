'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Grade, ResponseStatus } from '@prisma/client';

interface SchoolYear {
  id: string;
  name: string;
}

interface SurveyDate {
  id: string;
  date: string;
  grade: Grade;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  schoolYear: SchoolYear;
  surveyDates: SurveyDate[];
}

interface DateStatus {
  surveyDateId: string;
  date: string;
  grade: Grade;
  status: ResponseStatus | null;
}

interface ResponseItem {
  responseId: string;
  userId: string;
  userName: string;
  grade: Grade | null;
  className: string | null;
  createdAt: string;
  dateStatuses: DateStatus[];
}

interface ApiResponse {
  survey: Survey;
  responses: ResponseItem[];
}

const GRADE_LABELS: Record<Grade, string> = {
  JUNIOR: '年少',
  MIDDLE: '年中',
  SENIOR: '年長',
};

const GRADE_OPTIONS: { value: Grade | ''; label: string }[] = [
  { value: '', label: 'すべて' },
  { value: 'JUNIOR', label: '年少' },
  { value: 'MIDDLE', label: '年中' },
  { value: 'SENIOR', label: '年長' },
];

const STATUS_LABELS: Record<ResponseStatus, string> = {
  AVAILABLE: '○',
  UNAVAILABLE: '×',
};

export default function SurveyResponsesPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = params.surveyId as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [gradeFilter, setGradeFilter] = useState<Grade | ''>('');
  const [classNameFilter, setClassNameFilter] = useState('');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  const fetchResponses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (gradeFilter) {
        queryParams.set('grade', gradeFilter);
      }
      if (classNameFilter) {
        queryParams.set('className', classNameFilter);
      }

      const url = `/api/surveys/${surveyId}/responses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);

      // Handle redirect (session expired) or non-JSON response
      if (response.redirected) {
        router.push('/admin/login');
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setError('セッションが切れました。再度ログインしてください。');
        router.push('/admin/login');
        return;
      }

      if (response.status === 404) {
        setError('指定されたアンケートが見つかりません');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch responses');
      }

      const data: ApiResponse = await response.json();
      setSurvey(data.survey);
      setResponses(data.responses);

      // Extract unique class names for filter dropdown
      const classes = [...new Set(data.responses
        .map((r) => r.className)
        .filter((c): c is string => c !== null)
      )].sort();
      setAvailableClasses(classes);
    } catch (err) {
      console.error('Failed to fetch responses:', err);
      setError('回答の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [surveyId, gradeFilter, classNameFilter, router]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const queryParams = new URLSearchParams();
      if (gradeFilter) {
        queryParams.set('grade', gradeFilter);
      }
      if (classNameFilter) {
        queryParams.set('className', classNameFilter);
      }

      const url = `/api/surveys/${surveyId}/responses/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob from response
      const blob = await response.blob();

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'responses.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      // Create download link and trigger download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      setError('CSVのダウンロードに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'numeric',
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
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            href="/admin/surveys"
            style={{
              color: '#666',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            ← アンケート一覧に戻る
          </Link>
          {survey && (
            <>
              <h1 style={{ color: '#333', margin: '8px 0' }}>
                {survey.title} - 回答一覧
              </h1>
              <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>
                {survey.schoolYear.name}
              </p>
            </>
          )}
        </div>

        {/* Filter and Export controls */}
        {survey && (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            {/* Grade filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label
                htmlFor="gradeFilter"
                style={{ color: '#666', fontSize: '14px' }}
              >
                学年:
              </label>
              <select
                id="gradeFilter"
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value as Grade | '')}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                }}
              >
                {GRADE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Class filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label
                htmlFor="classFilter"
                style={{ color: '#666', fontSize: '14px' }}
              >
                クラス:
              </label>
              <select
                id="classFilter"
                value={classNameFilter}
                onChange={(e) => setClassNameFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  minWidth: '120px',
                }}
              >
                <option value="">すべて</option>
                {availableClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={isExporting || responses.length === 0}
              style={{
                padding: '10px 20px',
                backgroundColor: isExporting || responses.length === 0 ? '#ccc' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isExporting || responses.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {isExporting ? 'エクスポート中...' : 'CSVダウンロード'}
            </button>
          </div>
        )}

        {/* Loading state */}
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

        {/* Error state */}
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

        {/* Empty state */}
        {!isLoading && !error && responses.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px',
              color: '#666',
              backgroundColor: 'white',
              borderRadius: '8px',
            }}
          >
            <p>該当する回答がありません</p>
          </div>
        )}

        {/* Responses table */}
        {!isLoading && !error && responses.length > 0 && survey && (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'auto',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '600px',
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
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '500',
                      color: '#666',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    回答者名
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '500',
                      color: '#666',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    学年
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '500',
                      color: '#666',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    クラス
                  </th>
                  {survey.surveyDates.map((surveyDate) => (
                    <th
                      key={surveyDate.id}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '500',
                        color: '#666',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div>{formatShortDate(surveyDate.date)}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {GRADE_LABELS[surveyDate.grade]}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((response) => (
                  <tr
                    key={response.responseId}
                    style={{
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#333',
                      }}
                    >
                      {response.userName}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#666',
                      }}
                    >
                      {response.grade ? GRADE_LABELS[response.grade] : '-'}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#666',
                      }}
                    >
                      {response.className || '-'}
                    </td>
                    {response.dateStatuses.map((dateStatus) => (
                      <td
                        key={dateStatus.surveyDateId}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                          color: dateStatus.status === 'AVAILABLE' ? '#4caf50' : '#f44336',
                          fontWeight: '500',
                          fontSize: '18px',
                        }}
                      >
                        {dateStatus.status ? STATUS_LABELS[dateStatus.status] : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {!isLoading && !error && survey && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              color: '#666',
              fontSize: '14px',
            }}
          >
            回答数: {responses.length}件
          </div>
        )}
      </div>
    </main>
  );
}
