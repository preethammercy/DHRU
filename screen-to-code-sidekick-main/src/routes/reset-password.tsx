import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — MissedMate AI" },
      { name: "description", content: "Choose a new password for your MissedMate AI account." },
      { property: "og:title", content: "Reset password — MissedMate AI" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The recovery link lands here with type=recovery in the URL hash;
    // the Supabase client exchanges it for a recovery session.
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== password2) return setError("The two passwords don't match.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate({ to: "/", replace: true }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the password. Try the reset link again.");
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
          <h1 className="text-2xl font-extrabold tracking-tight">Choose a new password</h1>
        </div>

        {done ? (
          <div className="rounded-2xl border bg-card p-6 text-center shadow-card">
            <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              Password updated! Taking you to the app…
            </p>
          </div>
        ) : ready ? (
          <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-semibold">New password</label>
              <input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters" className={inputCls} autoComplete="new-password" />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-semibold">Repeat new password</label>
              <input id="confirm-password" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)}
                placeholder="Same password again" className={inputCls} autoComplete="new-password" />
            </div>
            {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={busy}
              className="w-full rounded-xl bg-brand px-5 py-2.5 font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-60">
              {busy ? "Please wait…" : "Update password"}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border bg-card p-6 text-center shadow-card">
            <p className="text-sm text-muted-foreground">
              This page only works from the reset link in your email. If the link expired, request a new one.
            </p>
            <button onClick={() => navigate({ to: "/auth" })}
              className="mt-4 rounded-xl bg-brand px-5 py-2.5 font-semibold text-primary-foreground shadow-card transition hover:opacity-90">
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
