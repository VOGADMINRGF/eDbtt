"use client";

interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
}

export default function VideoPlayer({ src, title = "Trailer", poster }: VideoPlayerProps) {
  return (
    <div className="overflow-hidden rounded-xl shadow-lg bg-black">
      <video controls poster={poster} className="w-full h-auto max-h-[500px]">
        <source src={src} type="video/mp4" />
        Dein Browser unterstützt dieses Videoformat nicht.
      </video>
      {title && (
        <div className="bg-white text-gray-600 p-2 border-t">
          🎬 {title}
        </div>
      )}
    </div>
  );
}
