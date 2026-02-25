"use client";

import {
  createContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import { Timestamp } from "firebase/firestore";
import type { SessionWithDrills } from "@/lib/plans/bouldering/types";
import type { CompletedDrill } from "@/lib/firebase/training/bouldering-workouts";
import { updateWorkout } from "@/lib/firebase/training/bouldering-workouts";

export type WorkoutPhase =
  | "pre-check"
  | "drill-list"
  | "instructions"
  | "active"
  | "logging"
  | "resting"
  | "drill-summary"
  | "workout-summary";

export interface SafetyFlag {
  id: string;
  severity: "red" | "yellow";
  message: string;
  action: string;
}

export interface WorkoutState {
  workoutId: string;
  userId: string;
  session: SessionWithDrills;
  /** Completed drill results (same order as session.drills). */
  drills: CompletedDrill[];
  currentDrillIndex: number;
  /** For multi-set drills (e.g. max_hang), current set index 0-based. */
  currentSetIndex: number | null;
  phase: WorkoutPhase;
  startTime: Date | null;
  safetyFlags: SafetyFlag[];
  bodyweight: number;
  weightUnit: "lbs" | "kg";
}

type WorkoutAction =
  | { type: "START_WORKOUT"; payload: { workoutId: string; userId: string } }
  | { type: "JUMP_TO_DRILL"; payload: { drillIndex: number } }
  | { type: "BACK_TO_DRILL_LIST" }
  | { type: "BEGIN_DRILL" }
  | { type: "NEXT_DRILL" }
  | { type: "START_SET"; payload?: { setIndex: number } }
  | {
      type: "LOG_SET";
      payload: { drillIndex: number; data: Record<string, unknown> };
    }
  | { type: "START_REST" }
  | { type: "SKIP_REST" }
  | {
      type: "COMPLETE_DRILL";
      payload: { drillIndex: number; data: Record<string, unknown> };
    }
  | { type: "FINISH_WORKOUT" }
  | { type: "ADD_SAFETY_FLAG"; payload: SafetyFlag }
  | { type: "SHOW_DRILL_SUMMARY" }
  | { type: "SHOW_INSTRUCTIONS" };

function buildInitialDrills(session: SessionWithDrills): CompletedDrill[] {
  const now = Timestamp.now();
  return session.drills.map((d, i) => ({
    drillId: d.id,
    drillType: d.type,
    order: i,
    completed: false,
    data: {},
    completedAt: now,
  }));
}

function workoutReducer(
  state: WorkoutState,
  action: WorkoutAction
): WorkoutState {
  switch (action.type) {
    case "START_WORKOUT":
      return {
        ...state,
        workoutId: action.payload.workoutId,
        userId: action.payload.userId,
        phase: "drill-list",
        startTime: new Date(),
        drills: buildInitialDrills(state.session),
      };

    case "JUMP_TO_DRILL":
      return {
        ...state,
        currentDrillIndex: action.payload.drillIndex,
        currentSetIndex: null,
        phase: "instructions",
      };

    case "BACK_TO_DRILL_LIST":
      return { ...state, phase: "drill-list" };

    case "SHOW_INSTRUCTIONS":
      return { ...state, phase: "instructions" };

    case "BEGIN_DRILL":
      return { ...state, phase: "logging" };

    case "NEXT_DRILL":
      return { ...state, currentSetIndex: null, phase: "drill-list" };

    case "START_SET":
      return {
        ...state,
        phase: "active",
        currentSetIndex: action.payload?.setIndex ?? state.currentSetIndex ?? 0,
      };

    case "LOG_SET": {
      const { drillIndex, data } = action.payload;
      const nextDrills = [...state.drills];
      const drill = nextDrills[drillIndex];
      if (!drill) return state;
      const existingData = (drill.data as Record<string, unknown>) || {};
      const mergedData = { ...existingData, ...data };
      nextDrills[drillIndex] = {
        ...drill,
        data: mergedData,
      };
      return {
        ...state,
        drills: nextDrills,
        phase: "resting",
      };
    }

    case "START_REST":
      return { ...state, phase: "resting" };

    case "SKIP_REST":
      return { ...state, phase: "logging" };

    case "COMPLETE_DRILL": {
      const { drillIndex, data } = action.payload;
      const nextDrills = [...state.drills];
      const drill = nextDrills[drillIndex];
      if (!drill) return state;
      nextDrills[drillIndex] = {
        ...drill,
        completed: true,
        data: { ...(drill.data as Record<string, unknown>), ...data },
        completedAt: Timestamp.now(),
      };
      return {
        ...state,
        drills: nextDrills,
        currentSetIndex: null,
        // Always return to the drill list so the user can pick the next drill
        phase: "drill-list",
      };
    }

    case "SHOW_DRILL_SUMMARY":
      return { ...state, phase: "drill-list" };

    case "FINISH_WORKOUT":
      return { ...state, phase: "workout-summary" };

    case "ADD_SAFETY_FLAG":
      return {
        ...state,
        safetyFlags: [...state.safetyFlags, action.payload],
      };

    default:
      return state;
  }
}

export interface WorkoutContextValue extends WorkoutState {
  dispatch: React.Dispatch<WorkoutAction>;
  currentDrill: SessionWithDrills["drills"][number] | null;
  persistDrills: (drills: CompletedDrill[]) => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export interface WorkoutProviderProps {
  children: ReactNode;
  session: SessionWithDrills;
  workoutId: string;
  userId: string;
  bodyweight?: number;
  weightUnit?: "lbs" | "kg";
}

export function WorkoutProvider({
  children,
  session,
  workoutId,
  userId,
  bodyweight = 150,
  weightUnit = "lbs",
}: WorkoutProviderProps) {
  const [state, dispatch] = useReducer(workoutReducer, {
    workoutId,
    userId,
    session,
    drills: buildInitialDrills(session),
    currentDrillIndex: 0,
    currentSetIndex: null,
    phase: "drill-list",
    startTime: new Date(),
    safetyFlags: [],
    bodyweight,
    weightUnit,
  });

  const currentDrill =
    state.session.drills[state.currentDrillIndex] ?? null;

  const persistDrills = useCallback(
    async (drills: CompletedDrill[]) => {
      await updateWorkout(state.userId, state.workoutId, { drills });
    },
    [state.userId, state.workoutId]
  );

  const value: WorkoutContextValue = {
    ...state,
    dispatch,
    currentDrill,
    persistDrills,
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

export { WorkoutContext };
