export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
        backgroundColor: '#f5f5f5',
      }}
    >
      <h1 style={{ color: '#333', marginBottom: '16px' }}>読み聞かせプランナー</h1>
      <h2 style={{ color: '#666', fontWeight: 'normal', marginBottom: '24px' }}>
        管理画面（仮）
      </h2>
      <p style={{ color: '#888' }}>
        幼稚園の「絵本読み聞かせ」活動を支援するアプリケーションです
      </p>
    </main>
  );
}
