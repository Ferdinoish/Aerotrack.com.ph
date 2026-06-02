import React from 'react';
import { useStore } from '../store/useStore';
import { Activity, Route, Trash2, BarChart3, RefreshCw } from 'lucide-react';
import { formatPace, formatTime } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { startOfMonth, endOfMonth, eachWeekOfInterval, endOfWeek, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const { profile, plan, activities, deleteActivity, resetPlan } = useStore();
  const navigate = useNavigate();

  if (!profile || !plan) return null;

  const handleResetPlan = () => {
    if (window.confirm("Are you sure you want to reset your training plan? This will clear your current plan and restart the onboarding process, but will keep your run history.")) {
      resetPlan();
      navigate('/onboarding');
    }
  };

  // Calculate stats
  const totalKmRun = activities.reduce((acc, act) => acc + act.distanceKm, 0);
  const todaysWorkout = plan.workouts.find(w => w.date === new Date().toISOString().split('T')[0]);
  const upcomingWorkouts = plan.workouts
    .filter(w => w.date >= new Date().toISOString().split('T')[0] && !w.completed && w.type !== 'rest')
    .slice(0, 3);

  // Focus on current month's activities for the chart
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const weeksInMonth = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
  
  const weeklyData = weeksInMonth.map((weekStart, index) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    // Filter activities that occurred within this week
    const distance = activities
      .filter(a => {
        const activityDate = new Date(a.date);
        return activityDate >= weekStart && activityDate <= weekEnd;
      })
      .reduce((sum, a) => sum + a.distanceKm, 0);

    return {
      name: `W${index + 1}`,
      distance: Number(distance.toFixed(1)),
      dateRange: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`
    };
  });

  // Social feed mock implementation
  const recentActivities = [...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header section */}
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">
            Targeting {profile.targetDistance.toUpperCase()}
          </h1>
          <p className="text-zinc-400 uppercase font-bold text-xs tracking-widest flex items-center gap-2">
            Goal Time: <span className="text-lime-400 font-mono font-bold text-sm">{profile.targetTimeMins} mins</span>
            <span className="text-zinc-600">•</span>
            {profile.fitnessLevel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleResetPlan}
            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-4 py-3 rounded-full font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">RESET PLAN</span>
          </button>
          <Link 
            to="/live" 
            className="bg-lime-400 hover:bg-lime-500 text-zinc-950 px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-lime-400/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <Activity className="w-5 h-5" />
            START RUN
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Stats & Plan */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Top Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl">
              <div className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-1">Total Distance</div>
              <div className="text-2xl font-black italic font-mono text-white">{totalKmRun.toFixed(1)} <span className="text-sm text-zinc-500 not-italic">KM</span></div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl">
              <div className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-1">Plan Progress</div>
              <div className="text-2xl font-black italic font-mono text-white">
                {plan.workouts.filter(w => w.completed).length} <span className="text-sm text-zinc-500 not-italic">/ {plan.workouts.filter(w => w.type !== 'rest').length}</span>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl">
              <div className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-1">Current Base</div>
              <div className="text-2xl font-black italic font-mono text-white">{profile.currentWeeklyMileage} <span className="text-sm text-zinc-500 not-italic">KM/W</span></div>
            </div>
          </div>

          {/* Today's Focus */}
          {todaysWorkout && todaysWorkout.type !== 'rest' && (
            <div className="bg-gradient-to-br from-lime-400/10 to-transparent border border-lime-400/20 rounded-3xl p-6 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-8 text-lime-400/10">
                <Route className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <span className="inline-flex items-center rounded-full bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-lime-400 ring-1 ring-inset ring-lime-400/20 mb-4">
                  TODAY'S WORKOUT
                </span>
                <h2 className="text-3xl font-black italic tracking-tighter text-white mb-2">{todaysWorkout.title}</h2>
                <p className="text-zinc-300 max-w-md mb-6">{todaysWorkout.description}</p>
                <div className="flex gap-4">
                  {todaysWorkout.targetDistanceKm && (
                    <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                      <div className="text-[10px] uppercase font-bold text-zinc-500">DISTANCE</div>
                      <div className="font-mono text-lg font-bold text-white">{todaysWorkout.targetDistanceKm} <span className="text-[10px] text-zinc-500 ml-1">KM</span></div>
                    </div>
                  )}
                  {todaysWorkout.targetPace && (
                    <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                      <div className="text-[10px] uppercase font-bold text-zinc-500">PACE</div>
                      <div className="font-mono text-lg font-bold text-lime-400">{todaysWorkout.targetPace}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Monthly Volume Chart */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-zinc-500" />
              Monthly Volume
            </h3>
            <div className="h-48 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => `${val}km`} 
                  />
                  <Tooltip
                    cursor={{ fill: '#27272a', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                    itemStyle={{ color: '#a3e635', fontFamily: 'monospace' }}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.dateRange || label}
                    formatter={(value: any) => [`${value} km`, 'Distance']}
                  />
                  <Bar dataKey="distance" fill="#a3e635" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div>
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Upcoming Schedule</h3>
            <div className="space-y-3">
              {upcomingWorkouts.map(w => (
                <div key={w.id} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex flex-col items-center justify-center text-xs font-medium">
                      <span className="text-zinc-400">{new Date(w.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className="text-white text-base">{new Date(w.date).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-200">{w.title}</h4>
                      <div className="text-sm font-mono text-zinc-500">
                        {w.targetDistanceKm} km {w.targetPace && ` @ ${w.targetPace}`}
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase ${
                    w.type === 'interval' ? 'bg-red-500/10 text-red-500' :
                    w.type === 'long' ? 'bg-purple-500/10 text-purple-500' :
                    w.type === 'tempo' ? 'bg-lime-400/10 text-lime-400' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {w.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Right Column - Activity Feed */}
        <div className="bg-zinc-900 border border-zinc-800 shadow-xl rounded-3xl p-6">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6">
            Social Activity
          </h3>
          {recentActivities.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Route className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm">No activities yet.</p>
              <p className="text-xs mt-1 text-zinc-600 uppercase tracking-widest">Start your first run!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {recentActivities.map((activity, index) => (
                <Link to={`/activity/${activity.id}`} key={activity.id} className={`block group cursor-pointer ${index !== 0 ? 'border-t border-zinc-800 pt-6' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center text-zinc-950 font-black text-xs">
                        ME
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-200">Afternoon Run <span className="font-normal text-zinc-500 ml-1">ran {activity.distanceKm.toFixed(1)} km</span></div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{new Date(activity.date).toLocaleString()} • Grind</div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteActivity(activity.id);
                      }}
                      className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-zinc-800 rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                      title="Delete Activity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Decorative Map Thumbnail placeholder */}
                  <div className="w-full h-32 bg-zinc-800 rounded-xl mb-3 overflow-hidden relative opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 bg-[url('https://api.maptiler.com/maps/basic-v2-dark/static/auto/600x300.png?key=get_your_own_OpIi9ZULNHzrESv6T2vL')] bg-cover bg-center mix-blend-luminosity"></div>
                    {/* Simulated Path */}
                    <div className="absolute left-1/4 top-1/4 right-1/4 bottom-1/4 border-2 border-lime-400 rounded-[40%_60%_70%_30%] blur-[0.5px]"></div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="bg-zinc-950/50 px-3 py-2 rounded-lg border border-zinc-800/50">
                      <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Distance</div>
                      <div className="font-mono font-bold text-zinc-200">{activity.distanceKm.toFixed(2)} km</div>
                    </div>
                    <div className="bg-zinc-950/50 px-3 py-2 rounded-lg border border-zinc-800/50">
                      <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Pace</div>
                      <div className="font-mono font-bold text-zinc-200">{activity.averagePace}</div>
                    </div>
                    <div className="bg-zinc-950/50 px-3 py-2 rounded-lg border border-zinc-800/50">
                      <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Time</div>
                      <div className="font-mono font-bold text-zinc-200">{formatTime(activity.durationMins * 60)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
