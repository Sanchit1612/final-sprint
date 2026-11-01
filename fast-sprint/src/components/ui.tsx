import { AlertTriangle, CheckCircle2, Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function ProgressBar({ value, total, className = "" }: { value: number; total: number; className?: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-surface-2 ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line px-6 py-12 text-center">
      <Inbox className="mb-3 h-8 w-8 text-muted" aria-hidden />
      <p className="font-medium">{title}</p>
      {children && <p className="mt-1 max-w-md text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Notice({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: ReactNode }) {
  const tone = kind === "error" ? "border-danger/40 bg-danger/10 text-red-200" : kind === "success" ? "border-success/40 bg-success/10 text-green-200" : "border-accent/40 bg-accent-soft text-blue-100";
  const Icon = kind === "success" ? CheckCircle2 : AlertTriangle;
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm ${tone}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export const Hl = ({ children }: { children: ReactNode }) => <span className="text-accent">{children}</span>;

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function SetupRequired() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24">
      <div className="card">
        <h1 className="text-2xl">Connect Supabase to continue</h1>
        <p className="mt-2 text-sm text-muted">Fast Sprint needs a Supabase project for sign-in and saved progress.</p>
        <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li>Copy <code className="text-white">.env.example</code> to <code className="text-white">.env.local</code>.</li>
          <li>Add your project URL and anon key.</li>
          <li>Run the SQL in <code className="text-white">supabase/migrations</code>.</li>
          <li>Restart <code className="text-white">npm run dev</code>.</li>
        </ol>
      </div>
    </div>
  );
}
