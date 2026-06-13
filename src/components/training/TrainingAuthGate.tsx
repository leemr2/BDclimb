"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";

interface TrainingAuthGateProps {
  children: React.ReactNode;
}

/** Redirects unauthenticated users; matches other training-center pages. */
export function TrainingAuthGate({ children }: TrainingAuthGateProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="loading-container">
        <div>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
