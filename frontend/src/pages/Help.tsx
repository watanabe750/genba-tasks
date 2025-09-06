export default function Help() {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">ヘルプ</h1>
  
        <div className="space-y-4 text-sm">
          <section className="border rounded-xl p-4 bg-white">
            <h2 className="font-semibold mb-2">概要</h2>
            <p className="text-gray-700">
              タスクの作成・階層管理・画像添付に対応しています。親行のサムネをクリックで詳細ドロワーを開けます。
            </p>
          </section>
  
          <section className="border rounded-xl p-4 bg-white">
            <h2 className="font-semibold mb-2">よくある操作</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>新規タスク作成：一覧上部のフォームから作成</li>
              <li>並び替え：フィルター &amp; 並び替えバーの右端で変更</li>
              <li>画像：親行の「画像」ボタンから追加／変更／削除</li>
            </ul>
          </section>
  
          <section className="border rounded-xl p-4 bg-white">
            <h2 className="font-semibold mb-2">問い合わせ</h2>
            <p className="text-gray-700">example@example.com（ダミー）</p>
          </section>
        </div>
      </div>
    );
  }
  