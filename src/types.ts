export type RunType = 'easy' | 'long' | 'tempo' | 'interval' | 'rest';

export interface Workout {
  id: string;
  date: string; // ISO string
  type: RunType;
  title: string;
  description: string;
  targetDistanceKm?: number;
  targetDurationMins?: number;
  targetPace?: string; // e.g. "5:30/km"
  completed: boolean;
  actualDistanceKm?: number;
  actualDurationMins?: number;
  actualPace?: string;
}

export interface UserProfile {
  targetDistance: string; // '5k', '10k', 'half', 'full'
  targetTimeMins: number;
  currentWeeklyMileage: number;
  fitnessLevel: string;
  recentRaceTimeMins?: number;
  easyPace?: string;
  availableDays: number[]; // 0-6 (Sun-Sat)
  primarySurface: string;
}

export interface TrainingPlan {
  startDate: string;
  endDate: string;
  workouts: Workout[];
}

export interface Activity {
  id: string;
  date: string;
  distanceKm: number;
  durationMins: number;
  averagePace: string;
  elevationGainMtrs?: number;
  route: Array<[number, number, number?]>; // [lat, lng, alt] array
  calories?: number;
}
