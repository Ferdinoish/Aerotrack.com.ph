import React from 'react';
import { useStore } from '../store/useStore';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

export function CalendarView() {
  const { plan, completeWorkout } = useStore();

  if (!plan) return null;

  const workoutsByDate = plan.workouts.reduce((acc, w) => {
    acc[w.date] = w;
    return acc;
  }, {} as Record<string, typeof plan.workouts[0]>);

  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);
  const calendarStart = startOfWeek(start, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(end, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
      <header>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">Training Calendar</h1>
        <p className="text-zinc-400 font-bold uppercase text-xs tracking-widest">Your structured path to success.</p>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-950/50">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 grid-rows-[6]">
          {days.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const workout = workoutsByDate[dateStr];
            const isCurrentMonth = isSameMonth(day, start); // simplified
            
            return (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "min-h-[120px] p-2 border-r border-b border-zinc-800/50 flex flex-col transition-colors hover:bg-zinc-800/30",
                  !isCurrentMonth && "bg-zinc-950/30 opacity-50",
                  isToday(day) && "bg-lime-400/5"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={cn(
                    "text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full",
                    isToday(day) ? "bg-lime-400 text-zinc-950" : "text-zinc-500"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {workout && workout.type !== 'rest' && (
                    <button 
                      onClick={() => !workout.completed && completeWorkout(workout.id)}
                      className={cn(
                        "text-zinc-600 hover:text-lime-400 transition-colors",
                        workout.completed && "text-lime-400 pointer-events-none"
                      )}
                    >
                      {workout.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                {workout && workout.type !== 'rest' && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className={cn(
                        "text-[9px] font-black tracking-widest uppercase mb-1 inline-block px-1.5 py-0.5 rounded-sm",
                        workout.type === 'interval' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                        workout.type === 'long' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        workout.type === 'tempo' ? 'bg-lime-400/20 text-lime-400 border border-lime-400/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      )}>
                        {workout.type}
                      </div>
                      <div className="text-xs font-bold text-zinc-300 leading-tight italic">
                        {workout.title}
                      </div>
                    </div>
                    {workout.targetDistanceKm && (
                      <div className="text-[10px] font-mono font-bold text-zinc-500 mt-2">
                        {workout.targetDistanceKm} KM
                        {workout.targetPace && <span className="block">{workout.targetPace}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
