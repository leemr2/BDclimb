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
        <h1 className="title">The BD Climbing Association</h1>
        <h2>Log in or Sign up to join the community</h2>
        <div className="grid">
          <Link href="/login">
            <div className="card">
              <h2>Login &rarr;</h2>
            </div>
          </Link>
          <Link href="/signup">
            <div className="card">
              <h2>Signup &rarr;</h2>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
