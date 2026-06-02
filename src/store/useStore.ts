import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, TrainingPlan, Activity } from '../types';

export interface LiveRunState {
  isActive: boolean;
  isPaused: boolean;
  route: [number, number, number?][];
  distanceKm: number;
  durationSecs: number;
  isFinished: boolean;
  lastUpdatedTimestamp: number | null;
}

interface AppState {
  profile: UserProfile | null;
  plan: TrainingPlan | null;
  activities: Activity[];
  liveRun: LiveRunState | null;
  setProfile: (profile: UserProfile) => void;
  setPlan: (plan: TrainingPlan) => void;
  addActivity: (activity: Activity) => void;
  deleteActivity: (id: string) => void;
  completeWorkout: (workoutId: string) => void;
  updateLiveRun: (update: Partial<LiveRunState>) => void;
  clearLiveRun: () => void;
  reset: () => void;
  resetPlan: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      plan: null,
      activities: [],
      liveRun: null,
      setProfile: (profile) => set({ profile }),
      setPlan: (plan) => set({ plan }),
      addActivity: (activity) => 
        set((state) => ({ activities: [activity, ...state.activities] })),
      deleteActivity: (id) =>
        set((state) => ({ activities: state.activities.filter((a) => a.id !== id) })),
      completeWorkout: (workoutId) =>
        set((state) => {
          if (!state.plan) return state;
          return {
            plan: {
              ...state.plan,
              workouts: state.plan.workouts.map((w) =>
                w.id === workoutId ? { ...w, completed: true } : w
              ),
            },
          };
        }),
      updateLiveRun: (update) => 
        set((state) => ({
          liveRun: state.liveRun ? { ...state.liveRun, ...update, lastUpdatedTimestamp: Date.now() } : {
            isActive: false,
            isPaused: false,
            route: [],
            distanceKm: 0,
            durationSecs: 0,
            isFinished: false,
            lastUpdatedTimestamp: Date.now(),
            ...update
          }
        })),
      clearLiveRun: () => set({ liveRun: null }),
      resetPlan: () => set({ profile: null, plan: null }),
      reset: () => set({ profile: null, plan: null, activities: [], liveRun: null }),
    }),
    {
      name: 'aerotrack-storage',
    }
  )
);
