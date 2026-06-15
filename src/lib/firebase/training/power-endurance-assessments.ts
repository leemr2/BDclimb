/**
 * Firestore operations for power-endurance assessments (Week 0, 4, 8, 12).
 * See docs/PowerEndurance_Trainer/Power_endurance_trainer_design.md Section 3.
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type {
  PowerEnduranceAssessment,
  MaxHangAssessment,
  CruxAfterFatigueAssessment,
} from "@/lib/plans/power-endurance/types";
import {
  buildCAFBenchmark,
  normalizeCruxAfterFatigueAssessment,
} from "@/lib/plans/power-endurance/calculations";

const COLLECTION = "powerEnduranceAssessments";

const EMPTY_CAF: CruxAfterFatigueAssessment = {
  benchmark: buildCAFBenchmark({
    entryGrade: "5.9",
    entryMoves: 20,
    cruxDescription: "",
    cruxGrade: "V2",
    cruxTotalMoves: 8,
  }),
  attempts: [],
  sessionCAFScore: 0,
  avgRoundScore: 0,
  avgELS: 0,
  avgCDS: 0,
  successRate: 0,
  avgMovesCompleted: 0,
  avgPumpBeforeCrux: 0,
};

function normalizeAssessment(doc: PowerEnduranceAssessment): PowerEnduranceAssessment {
  const raw = doc.cruxAfterFatigue as unknown as Record<string, unknown>;
  if (!raw) return doc;
  return {
    ...doc,
    cruxAfterFatigue: normalizeCruxAfterFatigueAssessment(raw),
  };
}

export async function createAssessment(
  userId: string,
  assessmentData: Omit<PowerEnduranceAssessment, "id" | "date">
): Promise<string> {
  const assessmentsRef = collection(db, "users", userId, COLLECTION);
  const newAssessmentRef = doc(assessmentsRef);

  await setDoc(newAssessmentRef, {
    ...assessmentData,
    date: Timestamp.now(),
  });

  return newAssessmentRef.id;
}

export async function getAssessment(
  userId: string,
  assessmentId: string
): Promise<PowerEnduranceAssessment | null> {
  const assessmentRef = doc(db, "users", userId, COLLECTION, assessmentId);
  const assessmentSnap = await getDoc(assessmentRef);

  if (!assessmentSnap.exists()) {
    return null;
  }

  return normalizeAssessment({
    id: assessmentSnap.id,
    ...assessmentSnap.data(),
  } as PowerEnduranceAssessment);
}

export async function getAssessmentsForProgram(
  userId: string,
  programId: string
): Promise<PowerEnduranceAssessment[]> {
  const assessmentsRef = collection(db, "users", userId, COLLECTION);
  const q = query(assessmentsRef, where("programId", "==", programId));

  const snapshot = await getDocs(q);
  const assessments = snapshot.docs.map((d) =>
    normalizeAssessment({ id: d.id, ...d.data() } as PowerEnduranceAssessment)
  );
  return assessments.sort((a, b) => a.week - b.week);
}

export async function getAssessmentForWeek(
  userId: string,
  programId: string,
  week: number
): Promise<PowerEnduranceAssessment | null> {
  const assessmentsRef = collection(db, "users", userId, COLLECTION);
  const q = query(
    assessmentsRef,
    where("programId", "==", programId),
    where("week", "==", week)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  const first = snapshot.docs[0];
  return normalizeAssessment({
    id: first.id,
    ...first.data(),
  } as PowerEnduranceAssessment);
}

export async function upsertAssessmentFingerMaxStrength(
  userId: string,
  programId: string,
  week: number,
  fingerMaxStrength: MaxHangAssessment
): Promise<void> {
  const existing = await getAssessmentForWeek(userId, programId, week);

  if (existing?.id) {
    const assessmentRef = doc(db, "users", userId, COLLECTION, existing.id);
    await updateDoc(assessmentRef, { fingerMaxStrength });
    return;
  }

  const latest = await getLatestAssessment(userId, programId);
  await createAssessment(userId, {
    programId,
    week,
    fingerMaxStrength,
    intermittentEndurance: latest?.intermittentEndurance ?? {
      workingLoad: 0,
      protocol: "7on_3off",
      sets: [],
      totalReps: 0,
      totalTimeSeconds: 0,
    },
    cruxAfterFatigue: latest?.cruxAfterFatigue ?? EMPTY_CAF,
    optionalTests: latest?.optionalTests ?? {
      weightedPullup: null,
      campusMaxReach: null,
      routePowerEnduranceTest: null,
    },
    injuryBaseline: latest?.injuryBaseline ?? {
      fingers: {},
      elbowPain: { left: 0, right: 0 },
      shoulderPain: { left: 0, right: 0 },
      morningStiffness: 0,
      concerns: "",
    },
  });
}

export async function getLatestAssessment(
  userId: string,
  programId: string
): Promise<PowerEnduranceAssessment | null> {
  const assessments = await getAssessmentsForProgram(userId, programId);
  if (assessments.length === 0) return null;
  return assessments[assessments.length - 1];
}

export const PE_TEST_WEEKS = [4, 8, 12] as const;

export function isPETestWeek(week: number): boolean {
  return (PE_TEST_WEEKS as readonly number[]).includes(week);
}
