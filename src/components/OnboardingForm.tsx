import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { generateTrainingPlan } from '../services/aiCoachService';
import { useNavigate } from 'react-router-dom';
import { Activity, Target, Footprints, CalendarDays, Loader2 } from 'lucide-react';

const DISTANCES = [
  { id: '5k', label: '5K (3.1 miles)' },
  { id: '10k', label: '10K (6.2 miles)' },
  { id: 'half', label: 'Half Marathon' },
  { id: 'full', label: 'Full Marathon' }
];

const DAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' }
];

export function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    targetDistance: '',
    targetTimeMins: '',
    currentWeeklyMileage: '',
    fitnessLevel: 'Beginner',
    availableDays: [] as number[],
    primarySurface: 'Road'
  });
  
  const { setProfile, setPlan } = useStore();
  const navigate = useNavigate();

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day].sort()
    }));
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    const profile = {
      targetDistance: formData.targetDistance,
      targetTimeMins: parseInt(formData.targetTimeMins),
      currentWeeklyMileage: parseInt(formData.currentWeeklyMileage),
      fitnessLevel: formData.fitnessLevel,
      availableDays: formData.availableDays,
      primarySurface: formData.primarySurface
    };
    
    setProfile(profile);
    const plan = await generateTrainingPlan(profile);
    setPlan(plan);
    setIsGenerating(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-lime-400' : 'bg-zinc-800'}`} />
          ))}
        </div>

        {isGenerating ? (
          <div className="py-20 flex flex-col items-center text-center">
            <Loader2 className="w-12 h-12 text-lime-400 animate-spin mb-6" />
            <h2 className="text-2xl font-black italic uppercase tracking-tight mb-2">Generating Your Plan</h2>
            <p className="text-zinc-400">Our AI coach is analyzing your geometry and optimizing the perfect training schedule...</p>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 text-lime-400 mb-2">
                  <Target className="w-6 h-6" />
                  <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">Your Goal</h2>
                </div>
                <p className="text-zinc-400 mb-6 font-bold uppercase tracking-widest text-xs">What are you training for?</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {DISTANCES.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setFormData(p => ({ ...p, targetDistance: d.id }))}
                      className={`p-4 rounded-2xl border-2 text-left transition-all font-bold ${
                        formData.targetDistance === d.id 
                          ? 'border-lime-400 bg-lime-400/10 text-lime-400' 
                          : 'border-zinc-800 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {formData.targetDistance && (
                  <div className="space-y-3 pt-4">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Target Time (minutes)</label>
                    <input
                      type="number"
                      placeholder="e.g. 18 for a Sub-18 5k"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
                      value={formData.targetTimeMins}
                      onChange={e => setFormData(p => ({ ...p, targetTimeMins: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 text-lime-400 mb-2">
                  <Footprints className="w-6 h-6" />
                  <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">Current Fitness</h2>
                </div>
                <p className="text-zinc-400 mb-6 font-bold uppercase tracking-widest text-xs">Let's establish your baseline.</p>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Current Weekly Mileage (km)</label>
                    <input
                      type="number"
                      placeholder="e.g. 30"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
                      value={formData.currentWeeklyMileage}
                      onChange={e => setFormData(p => ({ ...p, currentWeeklyMileage: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Fitness Level</label>
                    <select
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 appearance-none font-bold"
                      value={formData.fitnessLevel}
                      onChange={e => setFormData(p => ({ ...p, fitnessLevel: e.target.value }))}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Primary Running Surface</label>
                    <select
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 appearance-none font-bold"
                      value={formData.primarySurface}
                      onChange={e => setFormData(p => ({ ...p, primarySurface: e.target.value }))}
                    >
                      <option value="Road">Road</option>
                      <option value="Track">Track</option>
                      <option value="Trail">Trail</option>
                      <option value="Treadmill">Treadmill</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 text-lime-400 mb-2">
                  <CalendarDays className="w-6 h-6" />
                  <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">Your Schedule</h2>
                </div>
                <p className="text-zinc-400 mb-6 font-bold uppercase tracking-widest text-xs">Which days can you run?</p>
                
                <div className="flex flex-wrap gap-3">
                  {DAYS.map(day => (
                    <button
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={`px-6 py-3 rounded-xl border-2 transition-all font-bold ${
                        formData.availableDays.includes(day.id)
                          ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                          : 'border-zinc-800 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 flex justify-between pt-6 border-t border-zinc-800">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className="px-6 py-3 text-zinc-400 font-black uppercase tracking-widest text-xs hover:text-white disabled:opacity-0 transition-colors"
              >
                Back
              </button>
              
              <button
                onClick={step === 3 ? handleSubmit : handleNext}
                disabled={
                  (step === 1 && (!formData.targetDistance || !formData.targetTimeMins)) ||
                  (step === 2 && !formData.currentWeeklyMileage) ||
                  (step === 3 && formData.availableDays.length === 0)
                }
                className="px-8 py-3 bg-lime-400 text-zinc-950 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-lime-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {step === 3 ? 'Generate Plan' : 'Continue'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
