import React from 'react';

interface Segment {
  start: number;
  end: number;
  label: string;
}

interface ClipTimelineProps {
  segments: Segment[];
}

const ClipTimeline: React.FC<ClipTimelineProps> = ({ segments }) => {
  // Determine the maximum time for the timeline scale.
  // Defaults to 60 seconds if all segments end before that.
  const max = Math.max(...segments.map(s => s.end), 60);

  return (
    <div className="w-full bg-white/10 rounded-xl p-3">
      <div className="relative h-10 bg-black/30 rounded-lg overflow-hidden">
        {segments.map((s, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-400 via-lime-400 to-yellow-400/70"
            style={{
              left: `${(s.start / max) * 100}%`,
              width: `${((s.end - s.start) / max) * 100}%`,
            }}
            title={`${s.label} ${s.start.toFixed(1)}-${s.end.toFixed(1)}s`}
          />
        ))}
      </div>
      <div className="mt-2 text-xs text-white/60">
        Auto-selected hooks highlighted
      </div>
    </div>
  );
};

export default ClipTimeline;
