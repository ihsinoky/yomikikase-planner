'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SchoolYear {
  id: string;
  name: string;
}

type Grade = 'JUNIOR' | 'MIDDLE' | 'SENIOR';

interface SurveyDateRow {
  id: number; // Temporary ID for React key
  date: string;
  grade: Grade | '';
}

const gradeLabels: Record<Grade, string> = {
  JUNIOR: '年少',
  MIDDLE: '年中',
  SENIOR: '年長',
};

export default function NewSurveyPage() {
  const router = useRouter();
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [isLoadingSchoolYears, setIsLoadingSchoolYears] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [schoolYearId, setSchoolYearId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [surveyDates, setSurveyDates] = useState<SurveyDateRow[]>([
    { id: 1, date: '', grade: '' },
  ]);
  const [nextRowId, setNextRowId] = useState(2);

  useEffect(() => {
    const fetchSchoolYears = async () => {
      try {
        const response = await fetch('/api/school-years');
        if (!response.ok) {
          throw new Error('Failed to fetch school years');
        }
        const data = await response.json();
        setSchoolYears(data);
        // Auto-select the first school year if available
        if (data.length > 0) {
          setSchoolYearId(data[0].id);
        }
      } catch {
        setError('年度の取得に失敗しました');
      } finally {
        setIsLoadingSchoolYears(false);
      }
    };

    fetchSchoolYears();
  }, []);

  const handleAddRow = () => {
    setSurveyDates([...surveyDates, { id: nextRowId, date: '', grade: '' }]);
    setNextRowId(nextRowId + 1);
  };

  const handleRemoveRow = (id: number) => {
    if (surveyDates.length > 1) {
      setSurveyDates(surveyDates.filter((row) => row.id !== id));
    }
  };

  const handleDateChange = (id: number, value: string) => {
    setSurveyDates(
      surveyDates.map((row) => (row.id === id ? { ...row, date: value } : row))
    );
  };

  const handleGradeChange = (id: number, value: Grade | '') => {
    setSurveyDates(
      surveyDates.map((row) => (row.id === id ? { ...row, grade: value } : row))
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Filter out empty rows and validate
    const validDates = surveyDates.filter((row) => row.date && row.grade);
    if (validDates.length === 0) {
      setError('開催候補日を1つ以上追加してください');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolYearId,
          title,
          description: description || undefined,
          surveyDates: validDates.map((row) => ({
            date: row.date,
            grade: row.grade,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'アンケートの作成に失敗しました');
        return;
      }

      // Success - redirect to survey list
      router.push('/admin/surveys');
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
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
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
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
          <h1 style={{ color: '#333', margin: '8px 0' }}>新規アンケート作成</h1>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* School Year */}
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="schoolYear"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#333',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                年度 <span style={{ color: '#c62828' }}>*</span>
              </label>
              {isLoadingSchoolYears ? (
                <div style={{ color: '#666' }}>読み込み中...</div>
              ) : schoolYears.length === 0 ? (
                <div style={{ color: '#c62828' }}>
                  年度が登録されていません。先に年度を作成してください。
                </div>
              ) : (
                <select
                  id="schoolYear"
                  value={schoolYearId}
                  onChange={(e) => setSchoolYearId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                  }}
                >
                  {schoolYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Title */}
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="title"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#333',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                タイトル <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="例: 6月読み聞かせ参加アンケート"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="description"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#333',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                説明文
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="アンケートの説明を入力してください（任意）"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Survey Dates Table */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#333',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                開催候補日 <span style={{ color: '#c62828' }}>*</span>
              </label>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '12px',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#fafafa' }}>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: '500',
                        color: '#666',
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      日付
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: '500',
                        color: '#666',
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      対象学年
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        width: '60px',
                        borderBottom: '1px solid #ddd',
                      }}
                    ></th>
                  </tr>
                </thead>
                <tbody>
                  {surveyDates.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => handleDateChange(row.id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={row.grade}
                          onChange={(e) =>
                            handleGradeChange(row.id, e.target.value as Grade | '')
                          }
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: 'white',
                          }}
                        >
                          <option value="">選択してください</option>
                          <option value="JUNIOR">{gradeLabels.JUNIOR}</option>
                          <option value="MIDDLE">{gradeLabels.MIDDLE}</option>
                          <option value="SENIOR">{gradeLabels.SENIOR}</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          disabled={surveyDates.length === 1}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: surveyDates.length === 1 ? '#eee' : '#ffebee',
                            color: surveyDates.length === 1 ? '#999' : '#c62828',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: surveyDates.length === 1 ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                onClick={handleAddRow}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                + 行を追加
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  borderRadius: '4px',
                  marginBottom: '24px',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit button */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Link
                href="/admin/surveys"
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || isLoadingSchoolYears || schoolYears.length === 0}
                style={{
                  padding: '12px 24px',
                  backgroundColor:
                    isSubmitting || isLoadingSchoolYears || schoolYears.length === 0
                      ? '#ccc'
                      : '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor:
                    isSubmitting || isLoadingSchoolYears || schoolYears.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                {isSubmitting ? '作成中...' : 'アンケートを作成'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
