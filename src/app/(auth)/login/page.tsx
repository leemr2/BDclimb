"use client";

import NeuralNetworkHero from "@/components/ui/neural-network-hero";
import { useAuth } from "@/lib/firebase/auth";
import { setErrorMessage } from "@/lib/utils/set-error-message";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LoginPage = () => {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignInWithGoogle = () => {
    setGoogleLoading(true);
    signInWithGoogle()
      .then(() => router.push("/"))
      .catch((error) => {
        const { title, description } = setErrorMessage(error);
        alert(title + ": " + description);
      })
      .finally(() => setGoogleLoading(false));
  };

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    signIn(email, password)
      .then(() => router.push("/"))
      .catch((error) => {
        const { title, description } = setErrorMessage(error);
        alert(title + ": " + description);
      });
  };

  return (
    <div className="relative min-h-screen w-full">
      <NeuralNetworkHero
        title="Where the community climbs."
        description="Sign in to access the BD Climbing community — training, events, and messaging."
        badgeText="BD Climbing"
        badgeLabel="Community"
        ctaButtons={[{ text: "Sign up", href: "/signup" }]}
        microDetails={["Secure sign-in", "Google or email", "Free to join"]}
      />

      <div className="absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/70 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <h2 className="text-2xl font-light tracking-tight text-white">
            Sign in
          </h2>

          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={handleSignInWithGoogle}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/20 px-4 py-3 text-sm font-light text-white shadow-lg shadow-black/20 transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-50"
            >
              {googleLoading ? "Signing in…" : "Sign in with Google"}
            </button>

            <div className="relative">
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 px-2 text-xs text-white/50">
                or
              </span>
              <hr className="border-white/10" />
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-light text-white/70"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-light text-white/70"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-2xl border border-white/20 bg-white/20 px-4 py-3 text-sm font-light text-white shadow-lg shadow-black/20 transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                Sign in with email
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-white/60">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-white/80 underline underline-offset-2 hover:text-white"
            >
              Set your password
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-white/50">
            <Link href="/" className="hover:text-white/70">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
