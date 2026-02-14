"use client";

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
    <div className="container">
      <main className="main">
        <h1 className="title">Login</h1>
        <br />
        <button
          type="button"
          onClick={handleSignInWithGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? "Signing in..." : "Sign in with Google"}
        </button>
        <br />
        <form onSubmit={handleSignIn} className="form">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button type="submit">Submit</button>
        </form>
        <p>
          Don&apos;t have an account?{" "}
          <Link href="/signup">Set your password</Link>
        </p>
        <Link href="/">&larr; Go back</Link>
      </main>
    </div>
  );
};

export default LoginPage;
