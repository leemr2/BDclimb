/**
 * Firestore operations for bouldering assessments (Week 0, 4, 8, 12).
 * See docs/Bouldering_Trainer/Bouldering_trainer_design.md Section 3.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { BoulderingAssessment } from "@/lib/plans/bouldering/types";

/**
 * Create a new assessment document.
 * @returns The created assessment ID
 */
export async function createAssessment(
  userId: string,
  assessmentData: Omit<BoulderingAssessment, "id" | "date">
): Promise<string> {
  const assessmentsRef = collection(
    db,
    "users",
    userId,
    "boulderingAssessments"
  );
  const newAssessmentRef = doc(assessmentsRef);

  const dataToSave = {
    ...assessmentData,
    date: Timestamp.now(),
  };

  await setDoc(newAssessmentRef, dataToSave);
  return newAssessmentRef.id;
}

/**
 * Get a single assessment by ID.
 */
export async function getAssessment(
  userId: string,
  assessmentId: string
): Promise<BoulderingAssessment | null> {
  const assessmentRef = doc(
    db,
    "users",
    userId,
    "boulderingAssessments",
    assessmentId
  );
  const assessmentSnap = await getDoc(assessmentRef);

  if (!assessmentSnap.exists()) {
    return null;
  }

  return { id: assessmentSnap.id, ...assessmentSnap.data() } as BoulderingAssessment;
}

/**
 * Get all assessments for a specific program.
 */
export async function getAssessmentsForProgram(
  userId: string,
  programId: string
): Promise<BoulderingAssessment[]> {
  const assessmentsRef = collection(
    db,
    "users",
    userId,
    "boulderingAssessments"
  );
  const q = query(
    assessmentsRef,
    where("programId", "==", programId),
    orderBy("week", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as BoulderingAssessment)
  );
}

/**
 * Get assessment for a specific week in a program.
 */
export async function getAssessmentForWeek(
  userId: string,
  programId: string,
  week: number
): Promise<BoulderingAssessment | null> {
  const assessmentsRef = collection(
    db,
    "users",
    userId,
    "boulderingAssessments"
  );
  const q = query(
    assessmentsRef,
    where("programId", "==", programId),
    where("week", "==", week)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as BoulderingAssessment;
}

/**
 * Get the most recent (baseline) assessment for target load calculations.
 */
export async function getLatestAssessment(
  userId: string,
  programId: string
): Promise<BoulderingAssessment | null> {
  const assessments = await getAssessmentsForProgram(userId, programId);
  if (assessments.length === 0) return null;

  // Return most recent assessment (highest week number)
  return assessments[assessments.length - 1];
}
