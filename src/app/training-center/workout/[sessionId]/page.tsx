"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";

export default function WorkoutPlaceholderPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  if (authLoading || !sessionId) {
    return (
      <div className="loading-container">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="training-workout-placeholder">
      <h2>Workout flow (Phase 2)</h2>
      <p>
        Session: <strong>{sessionId}</strong>. Step-by-step workout flow will be
        built in Phase 2.
      </p>
      <Link href="/training-center/dashboard" className="training-center-cta">
        Back to dashboard
      </Link>
    </div>
  );
}
