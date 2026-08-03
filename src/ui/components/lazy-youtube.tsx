"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface LazyYouTubeProps {
  videoId: string;
  title: string;
  priority?: boolean;
}

// lazy loads youtube iframe - only loads when user clicks
// this drastically improves FCP/LCP since youtube iframe is super heavy
export function LazyYouTube({ videoId, title, priority = false }: LazyYouTubeProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (isLoaded) {
    return (
      <iframe
        className="w-full h-full rounded-xl"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&loop=1&playlist=${videoId}&controls=1&rel=0`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsLoaded(true)}
      className="w-full h-full bg-neutral-900 rounded-xl flex items-center justify-center cursor-pointer group relative overflow-hidden"
      aria-label={`Play video: ${title}`}
    >
      {/* youtube thumbnail as background - LCP element */}
      <img
        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        loading="eager"
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
      />
      {/* play button overlay */}
      <div className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-primary/90 group-hover:bg-primary transition-colors shadow-lg">
        <Play className="w-10 h-10 text-white fill-white ml-1" />
      </div>
      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
    </button>
  );
}
