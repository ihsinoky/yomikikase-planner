import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '読み聞かせプランナー - 管理画面',
  description: '幼稚園の「絵本読み聞かせ」活動を支援する管理画面です',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          fontFamily: '"Noto Sans JP", sans-serif',
          margin: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
