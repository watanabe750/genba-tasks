import useAuth from "../providers/useAuth";

export default function Account() {
  const { uid, name } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">アカウント</h1>

      <div className="space-y-3">
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800">
          <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <dt className="text-gray-500 dark:text-gray-400">表示名</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{name ?? "—"}</dd>

            <dt className="text-gray-500 dark:text-gray-400">メール</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100 break-all">{uid ?? "—"}</dd>
          </dl>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ※表示のみ。プロフィール編集やパスワード変更は未対応です。
        </p>
      </div>
    </div>
  );
}
