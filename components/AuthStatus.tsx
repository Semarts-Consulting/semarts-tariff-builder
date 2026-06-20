"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { clearCloudRestoreFlag } from "@/lib/cloud-bootstrap";
import { supabase } from "@/lib/supabase";

export function AuthStatus() {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setIsReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    clearCloudRestoreFlag();
    setSession(null);
  }

  if (!isReady) {
    return <span className="text-sm text-ink/50">Checking session</span>;
  }

  if (!supabase) {
    return (
      <Link href="/auth" className="text-sm font-medium text-ink/70 hover:text-semarts-dark">
        Connect Supabase
      </Link>
    );
  }

  if (!session) {
    return (
      <Link href="/auth" className="text-sm font-medium text-ink/70 hover:text-semarts-dark">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-[180px] truncate text-sm text-ink/60 md:inline">
        {session.user.email}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-md border border-line px-3 py-2 text-sm font-medium hover:border-semarts"
      >
        Sign out
      </button>
    </div>
  );
}
