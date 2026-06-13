export type EducationGoalType =
  | "bouldering"
  | "route_endurance"
  | "route_power"
  | "route_power_endurance";

export interface EducationPieceMeta {
  slug: string;
  goalType: EducationGoalType;
  title: string;
  subtitle: string;
  readTimeMinutes: number;
  keyTakeaways: string[];
  relatedMetrics: string[];
  filename: string;
}

import type { ReactElement } from "react";

export interface EducationPiece extends EducationPieceMeta {
  content: ReactElement;
}
