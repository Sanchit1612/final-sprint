"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Notice } from "./ui";

export function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault(); setPending(true); setError(""); setMessage("");
    try {
      const db = createClient();
      if (reset) {
        const { data, error: sessionError } = await db.auth.getUser();
        if (sessionError || !data.user) throw new Error("Open the recovery link from your email first. Request another link if it has expired.");
        const { error } = await db.auth.updateUser({ password: value });
        if (error) throw error;
        const { error: logoutError } = await db.auth.signOut();
        if (logoutError) throw logoutError;
        setMessage("Password updated. Log in with your new password.");
      } else {
        const { error } = await db.auth.resetPasswordForEmail(value, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
        if (error) throw error;
        setMessage("If an account exists for this email, a recovery link will arrive shortly.");
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not complete the request. Try again."); }
    finally { setPending(false); }
  }
  return <main className="mx-auto max-w-md px-4 py-20"><div className="card">
    <h1 className="text-2xl">{reset ? "Set a new password" : "Reset your password"}</h1>
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="label" htmlFor="recovery">{reset ? "New password" : "Email"}</label>
      <input id="recovery" className="input" type={reset ? "password" : "email"} autoComplete={reset ? "new-password" : "email"} required minLength={reset ? 8 : undefined} value={value} onChange={e => setValue(e.target.value)} />
      {error && <Notice>{error}</Notice>}{message && <Notice kind="success">{message}</Notice>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Please wait…" : reset ? "Save password" : "Send recovery link"}</button>
    </form><Link href="/login" className="mt-4 inline-block text-sm text-accent">Back to login</Link>
  </div></main>;
}
