"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { clearCloudRestoreFlag, restoreCloudOncePerSession } from "@/lib/cloud-bootstrap";
import { supabase } from "@/lib/supabase";

type AuthMode = "sign-in" | "create-account";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("Supabase is not configured. Check .env.local and restart the dev server.");
      return;
    }

    setIsSubmitting(true);

    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setIsSubmitting(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "create-account" && !result.data.session) {
      setMessage("Account created. Check your email if confirmation is required.");
      return;
    }

    try {
      clearCloudRestoreFlag();
      await restoreCloudOncePerSession();
    } catch (restoreError) {
      setMessage(
        restoreError instanceof Error
          ? `Signed in. Cloud restore failed: ${restoreError.message}`
          : "Signed in. Cloud restore failed."
      );
      return;
    }

    router.push("/projects");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-5 rounded-md border border-line bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="grid grid-cols-2 rounded-md border border-line bg-field p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`rounded px-3 py-2 ${
            mode === "sign-in" ? "bg-white text-semarts-dark shadow-sm" : "text-ink/60"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("create-account")}
          className={`rounded px-3 py-2 ${
            mode === "create-account" ? "bg-white text-semarts-dark shadow-sm" : "text-ink/60"
          }`}
        >
          Create account
        </button>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          minLength={6}
          required
        />
      </label>

      {message ? <p className="text-sm font-medium text-semarts-dark">{message}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark disabled:cursor-not-allowed disabled:bg-ink/30 sm:w-fit"
      >
        {isSubmitting
          ? "Working..."
          : mode === "sign-in"
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}
