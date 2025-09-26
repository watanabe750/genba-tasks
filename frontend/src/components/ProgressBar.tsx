
export default function ProgressBar({ value, "data-testid": testId }: { value: number; "data-testid"?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-2 w-full rounded bg-gray-200/80" aria-label="進捗バー" data-testid={testId}>
      <div className="h-2 rounded bg-blue-500" style={{ width: `${v}%` }} />
    </div>
  );
}
