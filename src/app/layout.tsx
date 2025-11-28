import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '読み聞かせプランナー - 管理画面',
  description: '幼稚園の「絵本読み聞かせ」活動を支援する管理画面です',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
