import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: '読み聞かせプランナー',
  description: '幼稚園の「絵本読み聞かせ」活動を支援するLINEミニアプリです',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      {children}
    </div>
  );
}
