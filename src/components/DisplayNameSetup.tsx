"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { getUserProfile, createOrUpdateUserProfile } from "@/lib/firebase/users";

interface DisplayNameSetupProps {
  onComplete: () => void;
}

export const DisplayNameSetup = ({ onComplete }: DisplayNameSetupProps) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.displayName) {
          // User already has a display name, skip setup
          onComplete();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error checking profile:", err);
        setLoading(false);
      }
    };

    checkProfile();
  }, [user, onComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) {
      setError("Please enter a display name");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createOrUpdateUserProfile(
        user.uid,
        user.email || "",
        displayName.trim()
      );
      onComplete();
    } catch (err) {
      console.error("Error saving display name:", err);
      setError("Failed to save display name. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="display-name-setup-overlay">
      <div className="display-name-setup-modal">
        <h2>Welcome to the Climbing Gym Community!</h2>
        <p>Please set a display name that will be shown to other members.</p>
        <form onSubmit={handleSubmit} className="display-name-form">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            maxLength={50}
            required
            disabled={saving}
            className="display-name-input"
          />
          {error && <p className="error-message">{error}</p>}
          <button
            type="submit"
            disabled={saving || !displayName.trim()}
            className="display-name-submit"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};
