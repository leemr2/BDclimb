// Import the functions you need from the SDKs you need
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

// Initialize Firebase
export const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
