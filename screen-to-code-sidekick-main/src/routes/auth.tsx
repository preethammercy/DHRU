import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MissedMate AI" },
      { name: "description", content: "Sign in to MissedMate AI to keep your chat catch-ups private to your account." },
      { property: "og:title", content: "Sign in — MissedMate AI" },
      { property: "og:description", content: "Private, on-device catch-up for busy college group chats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  const forgotPassword = async () => {
    setError(""); setNotice("");
    if (!email.trim()) return setError("Enter your email above, then click Forgot password.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setNotice("Password reset link sent! Check your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setNotice("");
    if (!email.trim() || !password) return setError("Please enter your email and password.");
    if (mode === "signup" && !displayName.trim()) return setError("Please enter a display name.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: displayName.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Account created! Check your email for a confirmation link, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
      navigate({ to: "/", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand text-xl font-bold text-primary-foreground">M</div>
          <h1 className="text-2xl font-extrabold tracking-tight">MissedMate AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">Catch up on what matters — privately.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-sm font-semibold">
            <button type="button" onClick={() => { setMode("signin"); setError(""); setNotice(""); }}
              className={`rounded-lg py-2 transition ${mode === "signin" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Sign in</button>
            <button type="button" onClick={() => { setMode("signup"); setError(""); setNotice(""); }}
              className={`rounded-lg py-2 transition ${mode === "signup" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Create account</button>
          </div>

          {mode === "signup" && (
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-semibold">Display name</label>
              <input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Priya" maxLength={50} className={inputCls} autoComplete="name" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu" className={inputCls} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters" className={inputCls}
              autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            {mode === "signin" && (
              <button type="button" onClick={forgotPassword} disabled={busy}
                className="mt-1.5 text-xs font-semibold text-primary hover:underline">
                Forgot password?
              </button>
            )}
          </div>

          {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{notice}</p>}

          <button type="submit" disabled={busy}
            className="w-full rounded-xl bg-brand px-5 py-2.5 font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-60">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Your chats are analysed on your device and never stored on our servers.
          </p>
        </form>
      </div>
    </div>
  );
}
