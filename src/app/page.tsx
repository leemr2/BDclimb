"use client";

import { useAuth } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

const HomePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/community");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="container">
        <main className="main">
          <div>Loading...</div>
        </main>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="container">
      <main className="main">
        <Link href="/login">
          <h1 className="title">Login</h1>
        </Link>
      </main>
    </div>
  );
};

export default HomePage;
