import useAuth from "../providers/useAuth";

export default function Account() {
  const { uid, name } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">アカウント</h1>

      <div className="space-y-3">
        <div className="border rounded-xl p-4 bg-white">
          <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <dt className="text-gray-500">表示名</dt>
            <dd className="font-medium">{name ?? "—"}</dd>

            <dt className="text-gray-500">メール</dt>
            <dd className="font-medium break-all">{uid ?? "—"}</dd>
          </dl>
        </div>
        <p className="text-xs text-gray-500">
          ※表示のみ。プロフィール編集やパスワード変更は未対応です。
        </p>
      </div>
    </div>
  );
}
