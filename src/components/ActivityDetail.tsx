import React, { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import { Share, ArrowLeft, Loader2, Route, Mountain, Clock } from 'lucide-react';
import { formatTime, calculateDistance } from '../lib/utils';
import * as htmlToImage from 'html-to-image';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis, ReferenceLine } from 'recharts';
import 'leaflet/dist/leaflet.css';

export function ActivityDetail() {
  const { id } = useParams();
  const { activities } = useStore();
  const activity = activities.find(a => a.id === id);
  const [isCapturing, setIsCapturing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
        <Route className="w-12 h-12 mb-4 opacity-50" />
        <p>Activity not found.</p>
        <Link to="/" className="text-lime-400 mt-4 hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  // Calculate center of route for the map
  const route = activity.route || [];
  const validRoute = route.length > 1;
  const center = validRoute 
    ? [
        route.reduce((sum, p) => sum + p[0], 0) / route.length,
        route.reduce((sum, p) => sum + p[1], 0) / route.length
      ] as [number, number]
    : [0, 0] as [number, number];

  const [scrubIndex, setScrubIndex] = useState<number>(validRoute ? route.length - 1 : 0);

  // Prepare elevation chart data
  const hasElevationData = route.some(p => p[2] !== undefined);
  let cumulativeDistance = 0;
  const elevationData = validRoute ? route.map((point, index) => {
    if (index > 0) {
      cumulativeDistance += calculateDistance(route[index-1][0], route[index-1][1], point[0], point[1]);
    }
    return {
      index,
      distance: Number(cumulativeDistance.toFixed(2)),
      elevation: point[2] !== undefined ? Math.round(point[2]) : null,
    };
  }) : [];

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    try {
      setIsCapturing(true);
      
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#09090b', // zinc-950
        style: { transform: 'scale(1)' }
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `run-${activity.id}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Apex Run',
          text: `Just finished a ${activity.distanceKm.toFixed(2)}km run!`,
          files: [file]
        });
      } else {
        const link = document.createElement('a');
        link.download = `run-${activity.id}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('Could not share image.');
    } finally {
      setIsCapturing(false);
    }
  };

  const currentScrubData = elevationData[scrubIndex];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 max-w-2xl mx-auto pb-12">
      <header className="flex items-center justify-between">
        <Link to="/" className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
        </Link>
        <button 
          onClick={handleShare}
          disabled={isCapturing}
          className="bg-lime-400 hover:bg-lime-500 text-zinc-950 px-4 py-2 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg shadow-lime-400/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
        >
          {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share className="w-4 h-4" />}
          {isCapturing ? 'GENERATING...' : 'SHARE RUN'}
        </button>
      </header>

      {/* The capture target */}
      <div 
        ref={cardRef}
        className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-3xl overflow-hidden relative"
      >
        <div className="p-8 pb-4 relative z-10 bg-gradient-to-b from-zinc-900/90 via-zinc-900/40 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-lime-400 rounded-lg flex items-center justify-center text-zinc-950 font-black">
                <Route className="w-5 h-5" />
              </div>
              <div className="drop-shadow-md">
                <h1 className="text-2xl font-black italic tracking-tighter text-white">Afternoon Run</h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                  {new Date(activity.date).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="text-right drop-shadow-md hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-lime-400">APEX RUN</p>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="h-64 sm:h-80 w-full bg-zinc-950 relative">
          {validRoute ? (
            <MapContainer 
              center={center} 
              zoom={14} 
              zoomControl={false}
              dragging={!isCapturing}
              touchZoom={!isCapturing}
              scrollWheelZoom={!isCapturing}
              doubleClickZoom={!isCapturing}
              style={{ width: '100%', height: '100%', backgroundColor: '#09090b', filter: 'brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7)' }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Polyline 
                positions={route as [number, number][]} 
                pathOptions={{ color: '#a3e635', weight: 6, lineCap: 'round', lineJoin: 'round' }} 
              />
              {!isCapturing && route[scrubIndex] && (
                <CircleMarker 
                  center={[route[scrubIndex][0], route[scrubIndex][1]]} 
                  radius={6}
                  pathOptions={{ color: '#09090b', weight: 2, fillColor: '#a3e635', fillOpacity: 1 }}
                />
              )}
            </MapContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
              <Route className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-xs font-bold uppercase tracking-widest">No GPS Data</p>
            </div>
          )}
        </div>

        <div className="p-8 pt-6 bg-zinc-900 z-10 relative border-t border-zinc-800">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">DISTANCE</div>
              <div className="text-2xl font-mono font-black italic text-lime-400">
                {activity.distanceKm.toFixed(2)} <span className="text-xs text-zinc-500 ml-1">KM</span>
              </div>
            </div>
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">AVG PACE</div>
              <div className="text-2xl font-mono font-black italic text-white">
                {activity.averagePace}
              </div>
            </div>
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">TIME</div>
              <div className="text-2xl font-mono font-black italic text-white">
                {formatTime(activity.durationMins * 60)}
              </div>
            </div>
          </div>
          
          {/* Interactive Route Scrubber */}
          {!isCapturing && validRoute && (
            <div className="mt-8 border-t border-zinc-800 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black tracking-widest uppercase text-zinc-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500" /> Route Playback
                </h3>
                {currentScrubData && (
                  <div className="flex gap-4 text-xs font-mono font-bold text-zinc-300">
                    <span>{currentScrubData.distance.toFixed(2)}km</span>
                    {currentScrubData.elevation !== null && (
                      <span className="text-lime-400">{currentScrubData.elevation}m</span>
                    )}
                  </div>
                )}
              </div>
              
              <input 
                type="range"
                min="0"
                max={route.length - 1}
                value={scrubIndex}
                onChange={(e) => setScrubIndex(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lime-400 transition-all hover:accent-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50"
                style={{ WebkitAppearance: 'none' }}
              />
            </div>
          )}

          {/* Elevation Profile */}
          {hasElevationData && (
            <div className="mt-8 relative">
              <div className="flex items-center gap-2 mb-4">
                <Mountain className="w-4 h-4 text-zinc-500" />
                <h3 className="text-[10px] font-black tracking-widest uppercase text-zinc-400">Elevation Profile</h3>
              </div>
              <div className="h-40 w-full bg-zinc-950/50 rounded-2xl border border-zinc-800 p-4 pb-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={elevationData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorElevation" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="distance" 
                      tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} 
                      tickLine={false} 
                      axisLine={false} 
                      minTickGap={30}
                      tickFormatter={(val) => `${val}km`}
                    />
                    <YAxis 
                      tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `${val}m`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                      labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                      itemStyle={{ color: '#a3e635', fontFamily: 'monospace' }}
                      formatter={(value: any) => [`${value}m`, 'Elevation']}
                      labelFormatter={(label) => `${label} km`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="elevation" 
                      stroke="#a3e635" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorElevation)" 
                    />
                    {!isCapturing && currentScrubData && (
                      <ReferenceLine x={currentScrubData.distance} stroke="#a3e635" strokeDasharray="3 3" />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
