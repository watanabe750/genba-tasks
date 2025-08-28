export default function Settings() {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">設定</h1>
  
        <section className="space-y-3">
          <div className="border rounded-xl p-4">
            <h2 className="font-semibold mb-2">通知</h2>
            <p className="text-sm text-gray-600">（実装予定）通知オン/オフを切り替えます。</p>
          </div>
          <div className="border rounded-xl p-4">
            <h2 className="font-semibold mb-2">テーマ</h2>
            <p className="text-sm text-gray-600">ヘッダー右上の🌓で切替できます。</p>
          </div>
        </section>
      </div>
    );
  }
  