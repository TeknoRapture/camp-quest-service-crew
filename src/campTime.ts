export type CampDayPhase =
  | "earlyMorning"
  | "morning"
  | "midday"
  | "afternoon"
  | "evening"
  | "night";

export interface CampTimeState {
  dayNumber: number;
  minuteOfDay: number;
}

export interface CampTimeTickOptions {
  minutesPerRealSecond?: number;
}

export interface CampTimeFormatOptions {
  includeDayNumber?: boolean;
}

export const CAMP_MINUTES_PER_DAY = 24 * 60;
export const DEFAULT_CAMP_DAY_START_MINUTE = 7 * 60;
export const DEFAULT_CAMP_TIME_ACCELERATION = 1;

const PHASE_RANGES: ReadonlyArray<{
  phase: CampDayPhase;
  startMinute: number;
  endMinute: number;
}> = [
  { phase: "earlyMorning", startMinute: 5 * 60, endMinute: 7 * 60 + 59 },
  { phase: "morning", startMinute: 8 * 60, endMinute: 10 * 60 + 59 },
  { phase: "midday", startMinute: 11 * 60, endMinute: 12 * 60 + 59 },
  { phase: "afternoon", startMinute: 13 * 60, endMinute: 16 * 60 + 59 },
  { phase: "evening", startMinute: 17 * 60, endMinute: 20 * 60 + 59 },
];

export function createInitialCampTime(overrides: Partial<CampTimeState> = {}): CampTimeState {
  return {
    dayNumber: overrides.dayNumber ?? 1,
    minuteOfDay: normalizeMinuteOfDay(overrides.minuteOfDay ?? DEFAULT_CAMP_DAY_START_MINUTE),
  };
}

export function normalizeMinuteOfDay(minuteOfDay: number): number {
  return ((Math.floor(minuteOfDay) % CAMP_MINUTES_PER_DAY) + CAMP_MINUTES_PER_DAY) % CAMP_MINUTES_PER_DAY;
}

export function getCampDayPhase(minuteOfDay: number): CampDayPhase {
  const normalizedMinute = normalizeMinuteOfDay(minuteOfDay);
  const matchingRange = PHASE_RANGES.find(
    ({ startMinute, endMinute }) => normalizedMinute >= startMinute && normalizedMinute <= endMinute,
  );

  return matchingRange?.phase ?? "night";
}

export function formatCampTime(time: CampTimeState, options: CampTimeFormatOptions = {}): string {
  const normalizedMinute = normalizeMinuteOfDay(time.minuteOfDay);
  const hour24 = Math.floor(normalizedMinute / 60);
  const minute = normalizedMinute % 60;
  const hour12 = hour24 % 12 || 12;
  const period = hour24 < 12 ? "AM" : "PM";
  const timeText = `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;

  return options.includeDayNumber ? `Day ${time.dayNumber}, ${timeText}` : timeText;
}

export function tickCampTime(
  time: CampTimeState,
  dtSeconds: number,
  options: CampTimeTickOptions = {},
): CampTimeState {
  const minutesPerRealSecond = options.minutesPerRealSecond ?? DEFAULT_CAMP_TIME_ACCELERATION;
  const currentAbsoluteMinute = (time.dayNumber - 1) * CAMP_MINUTES_PER_DAY + normalizeMinuteOfDay(time.minuteOfDay);
  const nextAbsoluteMinute = currentAbsoluteMinute + dtSeconds * minutesPerRealSecond;
  const dayIndex = Math.floor(nextAbsoluteMinute / CAMP_MINUTES_PER_DAY);

  return {
    dayNumber: dayIndex + 1,
    minuteOfDay: normalizeMinuteOfDay(nextAbsoluteMinute),
  };
}

export function campTimeAt(hour24: number, minute = 0): number {
  return normalizeMinuteOfDay(hour24 * 60 + minute);
}

export function isCampTimeInPhase(time: CampTimeState, phase: CampDayPhase): boolean {
  return getCampDayPhase(time.minuteOfDay) === phase;
}
