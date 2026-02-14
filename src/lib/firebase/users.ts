"use client";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./client";

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
}

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  return null;
};

/**
 * Create or update user profile
 */
export const createOrUpdateUserProfile = async (
  userId: string,
  email: string,
  displayName: string
): Promise<void> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // Update existing profile
    await updateDoc(userRef, {
      displayName,
      email,
    });
  } else {
    // Create new profile
    await setDoc(userRef, {
      userId,
      displayName,
      email,
      createdAt: Timestamp.now(),
    });
  }
};

/**
 * Update display name for existing user
 */
export const updateDisplayName = async (
  userId: string,
  displayName: string
): Promise<void> => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    displayName,
  });
};
