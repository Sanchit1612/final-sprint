"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { saveProfile } from "@/app/actions";
import { profileSchema, type ProfileInput } from "@/lib/schemas";
import { Notice } from "./ui";

// zod preprocessors make the inferred input type loose; the form works with plain strings.
type Values = { full_name: string; college: string; branch: string; graduation_year: string; target_role: string; target_company: string };

export function ProfileForm({ initial, onboarding = false }: { initial: Partial<Values>; onboarding?: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    defaultValues: { full_name: "", college: "", branch: "", graduation_year: "", target_role: "", target_company: "", ...initial },
    resolver: zodResolver(profileSchema) as never,
  });

  const submit = handleSubmit(async (v) => {
    setMsg(null);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const r = await saveProfile({ ...v, timezone: tz } as ProfileInput, onboarding);
    if (!r.ok) return setMsg({ kind: "error", text: r.error });
    if (onboarding) { router.push("/dashboard"); router.refresh(); }
    else setMsg({ kind: "success", text: "Profile saved." });
  });

  const f = (id: keyof Values, label: string, extra: Record<string, unknown> = {}) => (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} className="input" {...extra} {...register(id)} />
      {errors[id] && <p className="field-error">{String(errors[id]?.message)}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {f("full_name", "Your name", { autoComplete: "name" })}
      <div className="grid gap-4 sm:grid-cols-2">{f("college", "College")}{f("branch", "Branch")}</div>
      {f("graduation_year", "Graduation year", { inputMode: "numeric", placeholder: "e.g. 2027" })}
      <div className="grid gap-4 sm:grid-cols-2">{f("target_role", "Target role", { placeholder: "e.g. Software Engineer" })}{f("target_company", "Target company (optional)")}</div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <button className="btn-glow" disabled={isSubmitting}>{isSubmitting ? "Saving…" : onboarding ? "Start my sprint" : "Save profile"}</button>
    </form>
  );
}
