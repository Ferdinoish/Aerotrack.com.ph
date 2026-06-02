import { UserProfile, TrainingPlan, Workout, RunType } from '../types';
import { addDays, format, startOfWeek } from 'date-fns';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Simple VDOT estimation based on target time and distance
function calculatePaces(distance: string, timeMins: number) {
  // Rough pace estimations (mins/km)
  const targetPaceSeconds = (timeMins * 60) / (distance === '5k' ? 5 : distance === '10k' ? 10 : distance === 'half' ? 21.1 : 42.2);
  
  return {
    interval: targetPaceSeconds * 0.9, 
    tempo: targetPaceSeconds * 0.95,
    goal: targetPaceSeconds,
    easy: targetPaceSeconds * 1.3,
    long: targetPaceSeconds * 1.4,
  };
}

function formatPaceStr(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}/km`;
}

export async function generateTrainingPlan(profile: UserProfile): Promise<TrainingPlan> {
  // Simulate network delay for AI generation
  await new Promise(resolve => setTimeout(resolve, 2000));

  const planLengthWeeks = profile.fitnessLevel === 'Beginner' ? 10 : profile.fitnessLevel === 'Advanced' ? 6 : 8;
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start plan on this week's Monday
  
  const paces = calculatePaces(profile.targetDistance, profile.targetTimeMins);
  
  let workouts: Workout[] = [];
  
  // Weekly mileage distribution baseline
  let baseMileage = profile.currentWeeklyMileage || 20;

  for (let week = 0; week < planLengthWeeks; week++) {
    // Increase mileage gradually, peak before taper
    let weekMultiplier = 1;
    if (profile.fitnessLevel === 'Beginner') {
       weekMultiplier = week < planLengthWeeks - 2 ? 1 + (week * 0.08) : 0.6;
    } else if (profile.fitnessLevel === 'Advanced') {
       weekMultiplier = week < planLengthWeeks - 1 ? 1 + (week * 0.15) : 0.4;
    } else {
       weekMultiplier = week < planLengthWeeks - 2 ? 1 + (week * 0.1) : week === planLengthWeeks - 2 ? 0.8 : 0.5;
    }
    const weekMileage = baseMileage * weekMultiplier;
    
    // Distribute run types based on available days
    const availableDays = profile.availableDays.length > 0 ? profile.availableDays : [1, 3, 5, 6]; // Default to Mon, Wed, Fri, Sat
    
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const currentDate = addDays(startDate, week * 7 + dayOfWeek);
      const isAvailable = availableDays.includes(dayOfWeek);
      
      let type: RunType = 'rest';
      let title = 'Rest Day';
      let description = 'Recover and rest.';
      let targetDistanceKm = 0;
      let targetPace = '';

      if (isAvailable) {
        // Simple logic to distribute run types
        if (dayOfWeek === availableDays[availableDays.length - 1]) {
          type = 'long';
          title = 'Long Run';
          description = 'Build endurance. Keep the pace conversational and relaxed.';
          targetDistanceKm = weekMileage * 0.4;
          targetPace = formatPaceStr(paces.long);
        } else if (dayOfWeek === availableDays[0] && week > 1) {
          type = 'interval';
          title = 'Speed Intervals';
          description = '400m repeats at goal pace followed by 400m recovery jog. Warm up 2km before and cool down 2km after.';
          targetDistanceKm = weekMileage * 0.2;
          targetPace = formatPaceStr(paces.interval);
        } else if (dayOfWeek === availableDays[1] && week > 2) {
          type = 'tempo';
          title = 'Tempo Run';
          description = 'Sustain a comfortably hard pace. Good for improving lactate threshold.';
          targetDistanceKm = weekMileage * 0.25;
          targetPace = formatPaceStr(paces.tempo);
        } else {
          type = 'easy';
          title = 'Easy Run';
          description = 'Add volume without stressing the body. Very easy, relaxed pace.';
          targetDistanceKm = weekMileage * 0.15;
          targetPace = formatPaceStr(paces.easy);
        }
      }

      // Race Day logic (Last day of plan)
      if (week === planLengthWeeks - 1 && dayOfWeek === availableDays[availableDays.length - 1]) {
        type = 'tempo'; // race effort
        title = 'Race Day!';
        description = `Target race: ${profile.targetDistance.toUpperCase()}. Give it your all! Target time: ${profile.targetTimeMins} mins.`;
        targetDistanceKm = profile.targetDistance === '5k' ? 5 : profile.targetDistance === '10k' ? 10 : profile.targetDistance === 'half' ? 21.1 : 42.2;
        targetPace = formatPaceStr(paces.goal);
      }

      workouts.push({
        id: generateId(),
        date: format(currentDate, 'yyyy-MM-dd'),
        type,
        title,
        description,
        targetDistanceKm: targetDistanceKm > 0 ? parseFloat(targetDistanceKm.toFixed(1)) : undefined,
        targetPace: targetPace || undefined,
        completed: false
      });
    }
  }

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(addDays(startDate, planLengthWeeks * 7 - 1), 'yyyy-MM-dd'),
    workouts
  };
}
