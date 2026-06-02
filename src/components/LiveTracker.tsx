import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import { useStore } from '../store/useStore';
import { calculateDistance, formatTime, formatPace } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { Play, Square, X, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Helper component to center map on current location
function MapTacker({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 16, { animate: true });
  }, [center, map]);
  return null;
}

export function LiveTracker() {
  const liveRun = useStore(s => s.liveRun);
  const updateLiveRun = useStore(s => s.updateLiveRun);
  const clearLiveRun = useStore(s => s.clearLiveRun);
  const addActivity = useStore(s => s.addActivity);

  const isActive = liveRun?.isActive ?? false;
  const isPaused = liveRun?.isPaused ?? false;
  const route = liveRun?.route ?? [];
  const distanceKm = liveRun?.distanceKm ?? 0;
  const durationSecs = liveRun?.durationSecs ?? 0;
  const isFinished = liveRun?.isFinished ?? false;

  const [currentPace, setCurrentPace] = useState<string>('--:--/km');
  const [locationError, setLocationError] = useState<string>('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const navigate = useNavigate();

  // Mock initial location (user's estimated starting point, updated by GPS)
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([0, 0]);
  const [hasLocation, setHasLocation] = useState(false);

  // Initialize location even before starting
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation([pos.coords.latitude, pos.coords.longitude]);
          setHasLocation(true);
        },
        (err) => {
          console.warn('Initial location error:', err);
          setLocationError('Enable location services to track your run.');
        },
        { enableHighAccuracy: true }
      );
    }
    
    // Auto-resume from persistent state if active and not paused (for when user returns to app)
    if (isActive && !isPaused && liveRun?.lastUpdatedTimestamp) {
      const elapsedSecs = Math.floor((Date.now() - liveRun.lastUpdatedTimestamp) / 1000);
      if (elapsedSecs > 0) {
        updateLiveRun({ durationSecs: durationSecs + elapsedSecs });
      }
    }
  }, []);

  const startTrackingLoops = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    timerRef.current = setInterval(() => {
      const state = useStore.getState();
      const currentVal = state.liveRun?.durationSecs ?? 0;
      state.updateLiveRun({ durationSecs: currentVal + 1 });
    }, 1000);

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, altitude } = pos.coords;

          setCurrentLocation(prev => accuracy <= 20 || (prev[0] === 0 && prev[1] === 0) ? [latitude, longitude] : prev);
          
          const state = useStore.getState();
          if (!state.liveRun || state.liveRun.isPaused || state.liveRun.isFinished) return;
          
          const currentRoute = state.liveRun.route || [];
          
          // Reject inaccurate points unless it's our first point
          if (accuracy > 20 && currentRoute.length > 0) return;

          const newPos: [number, number, number?] = [latitude, longitude, altitude ?? undefined];
          
          if (currentRoute.length > 0) {
            const lastPos = currentRoute[currentRoute.length - 1];
            const dist = calculateDistance(lastPos[0], lastPos[1], newPos[0], newPos[1]);
            
            if (dist >= 0.003 && dist <= 0.150) { 
              state.updateLiveRun({ 
                distanceKm: state.liveRun.distanceKm + dist,
                route: [...currentRoute, newPos]
              });
            }
          } else {
            state.updateLiveRun({ route: [newPos] });
          }
        },
        (err) => {
          console.error('Watch error:', err);
          setLocationError('GPS Error: ' + err.message);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
  };

  const stopTrackingLoops = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
  };

  // Manages tracking lifecycle when local state variables change
  useEffect(() => {
    if (isActive && !isPaused && !isFinished) {
      startTrackingLoops();
    } else {
      stopTrackingLoops();
    }
    
    return () => stopTrackingLoops();
  }, [isActive, isPaused, isFinished]);

  const handleStart = () => {
    updateLiveRun({ isActive: true, isPaused: false, isFinished: false });
  };

  const handlePause = () => {
    updateLiveRun({ isPaused: true });
  };

  const handleResume = () => {
    updateLiveRun({ isPaused: false });
  };

  const handleStop = () => {
    updateLiveRun({ isPaused: true, isFinished: true });
  };

  const handleSave = () => {
    if (distanceKm > 0 || durationSecs > 10) { 
      addActivity({
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString(),
        distanceKm,
        durationMins: durationSecs / 60,
        averagePace: currentPace,
        route,
        calories: Math.round(distanceKm * 70),
      });
    }
    clearLiveRun();
    navigate('/');
  };

  const handleDiscard = () => {
    clearLiveRun();
    navigate('/');
  };

  const handleClose = () => {
    // If we're leaving the page, but tracker is active, it stays active in background state.
    // The timers will clear because the component unmounts, but the state stays in Zustand.
    // When the component remounts, the useEffect catches up and restarts timers.
    // Wait, let's keep it paused if they explicitly hit X, OR let it run?
    // Let's let it run if they are just navigating away. We won't pause it.
    navigate('/');
  };

  useEffect(() => {
    if (distanceKm > 0.01 && durationSecs > 5) {
      const paceSeconds = durationSecs / distanceKm;
      setCurrentPace(formatPace(paceSeconds));
    }
  }, [distanceKm, durationSecs]);

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col z-50">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 z-[1000] flex justify-between items-start pointer-events-none">
        <div className="bg-zinc-900/80 backdrop-blur pointer-events-auto px-4 py-2 rounded-full border border-zinc-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          {isFinished ? (
            <><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> FINISHED</>
          ) : isActive && !isPaused ? (
            <><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> RECORDING</>
          ) : isPaused ? (
            <><div className="w-2 h-2 rounded-full bg-yellow-500" /> PAUSED</>
          ) : (
            <><MapPin className="w-4 h-4 text-lime-400" /> GPS READY</>
          )}
        </div>
        
        <button 
          onClick={handleClose}
          className="pointer-events-auto bg-zinc-900/80 backdrop-blur w-10 h-10 rounded-full flex items-center justify-center border border-zinc-800 text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {hasLocation && (
        <div className="flex-1 relative bg-zinc-900">
           <MapContainer 
            center={currentLocation} 
            zoom={16} 
            zoomControl={false}
            style={{ width: '100%', height: '100%', backgroundColor: '#09090b', filter: 'brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7)' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapTacker center={currentLocation} />
            {route.length > 0 && (
              <Polyline 
                positions={route as [number, number][]} 
                pathOptions={{ color: '#a3e635', weight: 6, lineCap: 'round', lineJoin: 'round' }} 
              />
            )}
            {hasLocation && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] pointer-events-none">
                <div className="w-4 h-4 rounded-full bg-lime-400 border-2 border-zinc-950 shadow-[0_0_0_8px_rgba(163,230,53,0.2)] animate-pulse" />
              </div>
            )}
          </MapContainer>
        </div>
      )}

      {!hasLocation && (
        <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 p-8 text-center">
          <MapPin className="w-12 h-12 mb-4 opacity-50 animate-bounce" />
          <p>Acquiring GPS Signal...</p>
          {locationError && <p className="text-red-400 text-sm mt-2">{locationError}</p>}
        </div>
      )}

      {/* Metrics & Controls Panel */}
      <div className="bg-zinc-950 pb-safe pt-6 px-6 relative z-[1000] rounded-t-3xl border-t border-zinc-800 -mt-6">
        <div className="grid grid-cols-3 gap-4 mb-8 text-center pt-2">
          <div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">TIME</div>
            <div className="text-3xl font-mono font-black italic text-white tracking-widest">{formatTime(durationSecs)}</div>
          </div>
          <div className="border-x border-zinc-800">
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">DISTANCE</div>
            <div className="text-3xl font-mono font-black italic text-lime-400 tabular-nums">{distanceKm.toFixed(2)}</div>
            <div className="text-[10px] text-zinc-500 font-bold tracking-widest ml-1">KM</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">AVG PACE</div>
            <div className="text-3xl font-mono font-black italic text-white tabular-nums">{currentPace}</div>
          </div>
        </div>

        <div className="flex justify-center gap-6 mb-8 mt-4">
          {isFinished ? (
            <div className="flex items-center w-full gap-4">
              <button 
                onClick={handleDiscard}
                className="flex-1 py-4 rounded-full border border-red-500/30 text-red-500 font-black uppercase tracking-widest text-xs hover:bg-red-500/10 transition-colors"
              >
                Discard
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-4 rounded-full bg-lime-400 text-zinc-950 font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:bg-lime-500 transition-colors"
              >
                Save Run
              </button>
            </div>
          ) : !isActive && !isPaused ? (
            <button 
              onClick={handleStart}
              className="w-24 h-24 rounded-full bg-lime-400 hover:bg-lime-500 text-zinc-950 flex items-center justify-center shadow-[0_0_30px_rgba(163,230,53,0.3)] transition-transform active:scale-95"
            >
              <div className="font-black tracking-widest text-lg italic">START</div>
            </button>
          ) : (
            <>
              {isPaused ? (
                <button 
                  onClick={handleResume}
                  className="w-20 h-20 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-transform active:scale-95"
                >
                  <Play className="w-8 h-8 ml-1" />
                </button>
              ) : (
                <button 
                  onClick={handlePause}
                  className="w-20 h-20 rounded-full bg-lime-400 hover:bg-lime-500 text-zinc-950 flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.2)] transition-transform active:scale-95 border-[6px] border-zinc-950 ring-2 ring-lime-400/50"
                  style={{ outline: 'none' }}
                >
                  <div className="w-6 h-6 bg-zinc-950 rounded-sm" />
                </button>
              )}
              
              <button 
                onClick={handleStop}
                disabled={!isPaused && isActive}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  (!isPaused && isActive) ? 'bg-zinc-900 text-zinc-700 opacity-50' : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                <Square className="w-7 h-7 fill-current" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
