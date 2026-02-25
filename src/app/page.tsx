"use client";

import NeuralNetworkHero from "@/components/ui/neural-network-hero";
import { useAuth } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-sm font-light text-white/70">Loading…</p>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <NeuralNetworkHero
      logoSrc="/images/The%20Burly%20Burro.png"
      logoAlt="The Burly Burro"
      title="Where the BD comes together to climb."
      description="Sign in to access The Burly Burro — training, events, and messaging."
      badgeText="The Burly Burro"
      badgeLabel="Community."
      ctaButtons={[
        { text: "Sign in", href: "/login", primary: true },
        { text: "Sign up", href: "/signup" },
      ]}
      microDetails={["Secure sign-in", "Google or email", "Free to join"]}
    />
  );
};

export default HomePage;
