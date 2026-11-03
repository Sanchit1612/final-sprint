"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {authFormSchema} from "@/lib/auth-form-schema";
import { safeAuthRedirect } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/client";
import { Notice } from "./ui";

type Values = z.infer<ReturnType<typeof authFormSchema>>;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeAuthRedirect(sp.get("next"));
  const [error, setError] = useState<string | null>(sp.get("error"));
  const [googlePending,setGooglePending] = useState(false);
  const googleEnabled=process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
  const [info, setInfo] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(authFormSchema(mode)) });

  const onSubmit = handleSubmit(async (v) => {
    if(googlePending)return;
    setError(null); setInfo(null);
    try {
    const supabase = createClient();
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: v.email, password: v.password });
      if (error) return setError(error.message);
      router.push(next); router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: v.email, password: v.password,
        options: { data: { full_name: v.name || undefined }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
      });
      if (error) return setError(error.message);
      if (data.session) { router.push("/onboarding"); router.refresh(); }
      else setInfo("Check your email for a confirmation link to finish creating your account.");
    }
    } catch {setError("Could not connect. Check your connection and try again.");}
  });

  const google = async () => {
    if(!googleEnabled||googlePending||isSubmitting)return;
    setError(null);setGooglePending(true);
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google", options: { queryParams: { prompt: "select_account" }, redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) {setError(error.message);setGooglePending(false);}
    }catch {setError("Google sign-in is unavailable. Please try again.");setGooglePending(false);}
  };

  return (
    <div className="card w-full max-w-md">
      <h1 className="text-2xl">{mode === "login" ? <>Welcome <span className="text-accent">back</span></> : <>Create your <span className="text-accent">account</span></>}</h1>
      <p className="mt-1 text-sm text-muted">{mode === "login" ? "Log in to continue your sprint." : "Free to start. No card needed."}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {mode === "register" && (
          <div><label className="label" htmlFor="name">Name</label><input id="name" className="input" autoComplete="name" {...register("name")} /></div>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" autoComplete="email" {...register("email")} />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" autoComplete={mode === "login" ? "current-password" : "new-password"} {...register("password")} />
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </div>
        {error && <Notice>{error}</Notice>}
        {info && <Notice kind="success">{info}</Notice>}
        <button className="btn-glow w-full" disabled={isSubmitting||googlePending}>{isSubmitting ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      {mode === "login" && <Link href="/forgot-password" className="mt-4 inline-block text-sm text-accent">Forgot password?</Link>}
      <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
      <button type="button" onClick={google} disabled={!googleEnabled||googlePending||isSubmitting} className="btn-ghost w-full">{googlePending?"Opening Google…":googleEnabled?"Continue with Google":"Google sign-in opens after setup"}</button>
      <p className="mt-6 text-center text-sm text-muted">
        {mode === "login" ? <>New here? <Link className="text-accent hover:underline" href={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link></> : <>Already have an account? <Link className="text-accent hover:underline" href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link></>}
      </p>
    </div>
  );
}
