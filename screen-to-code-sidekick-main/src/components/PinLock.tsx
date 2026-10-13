import { useEffect, useState, type ReactNode } from "react";

// Device-level PIN lock. The PIN never leaves the device: only a salted
// SHA-256 hash is stored in localStorage, and the unlocked flag lives in
// sessionStorage so the PIN is asked again when the browser is closed.
const hashKey = (uid: string) => `missedmate:pin:${uid}`;
const UNLOCK_KEY = "missedmate:pin-unlocked";

async function digest(pin: string, uid: string): Promise<string> {
  const data = new TextEncoder().encode(`${uid}:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function PinLock({ userId, children }: { userId: string; children: ReactNode }) {
  const [state, setState] = useState<"loading" | "set" | "unlock" | "open">("loading");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const hasPin = !!localStorage.getItem(hashKey(userId));
    const unlocked = sessionStorage.getItem(UNLOCK_KEY) === userId;
    setState(!hasPin ? "set" : unlocked ? "open" : "unlock");
  }, [userId]);

  const setNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{4,8}$/.test(pin)) return setError("Choose a PIN of 4–8 digits.");
    if (pin !== pin2) return setError("The two PINs don't match.");
    localStorage.setItem(hashKey(userId), await digest(pin, userId));
    sessionStorage.setItem(UNLOCK_KEY, userId);
    setState("open");
  };

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const stored = localStorage.getItem(hashKey(userId));
    if (stored && stored === (await digest(pin, userId))) {
      sessionStorage.setItem(UNLOCK_KEY, userId);
      setState("open");
    } else {
      setError("Wrong PIN. Try again.");
      setPin("");
    }
  };

  if (state === "open") return <>{children}</>;
  if (state === "loading") return null;

  const inputCls = "w-full rounded-xl border bg-background px-4 py-2.5 text-center text-lg tracking-[0.5em] outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={state === "set" ? setNewPin : unlock}
        className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 text-center shadow-card">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand text-xl font-bold text-primary-foreground">🔒</div>
        <h1 className="text-xl font-bold">{state === "set" ? "Set your app PIN" : "Enter your PIN"}</h1>
        <p className="text-sm text-muted-foreground">
          {state === "set"
            ? "This PIN locks MissedMate on this device, so others using it can't read your chats."
            : "MissedMate is locked on this device."}
        </p>
        <input type="password" inputMode="numeric" autoFocus value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="••••" aria-label="PIN" className={inputCls} />
        {state === "set" && (
          <input type="password" inputMode="numeric" value={pin2}
            onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="••••" aria-label="Confirm PIN" className={inputCls} />
        )}
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <button type="submit" className="w-full rounded-xl bg-brand px-5 py-2.5 font-semibold text-primary-foreground shadow-card transition hover:opacity-90">
          {state === "set" ? "Save PIN" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
