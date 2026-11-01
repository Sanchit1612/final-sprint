export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-surface-2" />
      <div className="h-32 animate-pulse rounded-card bg-surface" />
      <div className="h-32 animate-pulse rounded-card bg-surface" />
    </div>
  );
}
