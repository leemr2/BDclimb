"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";

/**
 * Auth check for training routes. Renders a fixed overlay while auth resolves
 * but never wraps page content — wrapping breaks soft navigation to RSC pages.
 */
export function TrainingAuthRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pending = loading || !user;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (!pending) {
    return null;
  }

  return (
    <div className="training-auth-redirect-overlay loading-container">
      <div>Loading...</div>
    </div>
  );
}
