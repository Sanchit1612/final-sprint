"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-lg text-center">
      <h1 className="text-xl">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">{error.message || "The page could not be loaded."}</p>
      <button className="btn-primary mt-4" onClick={reset}>Try again</button>
    </div>
  );
}
