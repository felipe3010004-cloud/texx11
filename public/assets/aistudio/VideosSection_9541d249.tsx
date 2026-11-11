import React, { useState } from "react";
import { VideoItem } from "../types";
import { PlayCircle, Film, Sparkles, Maximize2, X, Volume2 } from "lucide-react";

interface VideosSectionProps {
  videos: VideoItem[];
}

export const VideosSection: React.FC<VideosSectionProps> = ({ videos }) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  return (
    <section id="videos-oficiales" className="py-16 px-4 md:px-8 max-w-7xl mx-auto relative">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ecfeff] border border-cyan-300 text-[#0891b2] text-xs font-bold uppercase tracking-wider mb-3">
          <PlayCircle className="w-3.5 h-3.5 text-cyan-600" />
          <span>Experiencias y Multimedia Oficial</span>
        </div>
        <h2 className="font-display font-black text-3xl sm:text-4xl text-[#082836] tracking-tight">
          Contenido en Video Team Life
        </h2>
        <p className="text-[#416373] text-sm sm:text-base mt-2">
          Testimonios documentados y vivencias de nuestra comunidad en Bolivia. Toca en cualquier video para reproducir y agrandar en pantalla completa.
        </p>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((vid, idx) => (
          <div
            key={idx}
            className="group rounded-3xl p-4 bg-white border border-[#c8e4ed] hover:border-cyan-400/60 shadow-xl shadow-cyan-950/06 hover:shadow-2xl hover:shadow-cyan-900/15 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* Top cinema color bar */}
            <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-sky-600 rounded-full mb-3" />

            <div className="flex items-center justify-between px-2 mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0891b2] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>{vid.tag || "Team Life Oficial"}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-cyan-800 bg-cyan-100/70 px-2 py-0.5 rounded border border-cyan-300">
                  FULL HD
                </span>
                <button
                  onClick={() => setSelectedVideo(vid)}
                  className="px-2 py-0.5 rounded-lg bg-cyan-50 hover:bg-cyan-600 hover:text-white text-[#0891b2] text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-cyan-200"
                  title="Agrandar video en modo cine"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Agrandar</span>
                </button>
              </div>
            </div>

            {/* Video Iframe Frame */}
            <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black border border-slate-200 shadow-inner group/player">
              <iframe
                src={vid.url}
                title={vid.title}
                allowFullScreen
                loading="lazy"
                className="w-full h-full border-none relative z-10"
              />
            </div>

            {/* Video Title & Actions */}
            <div className="pt-4 px-2 flex items-center justify-between gap-3">
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#082836] leading-snug flex items-start gap-2 flex-1 text-left">
                <Film className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{vid.title}</span>
              </h4>
              <button
                onClick={() => setSelectedVideo(vid)}
                className="p-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-[#0891b2] border border-cyan-200 transition-all hover:scale-105 shrink-0 cursor-pointer"
                title="Ver ampliado"
              >
                <Maximize2 className="w-4 h-4 text-cyan-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Cinema Modal Lightbox for Expanded Videos */}
      {selectedVideo && (
        <div
          onClick={() => setSelectedVideo(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl rounded-3xl overflow-hidden bg-[#041a26] border border-cyan-400/40 shadow-[0_0_100px_rgba(6,182,212,0.3)] flex flex-col cursor-default"
          >
            {/* Modal Top Bar */}
            <div className="p-4 sm:p-5 bg-[#082836] border-b border-cyan-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Film className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-bold text-sm sm:text-base text-white line-clamp-1">
                    {selectedVideo.title}
                  </h3>
                  <span className="text-xs text-cyan-300 font-mono">Modo Cinema Dinámico · Pantalla Completa</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/20 flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar reproductor ampliado"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large Video Cinema Canvas */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={selectedVideo.url}
                title={selectedVideo.title}
                allowFullScreen
                className="w-full h-full border-none"
              />
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-3.5 sm:p-4 bg-[#082836] border-t border-cyan-900/60 flex items-center justify-between text-xs text-cyan-200">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Volume2 className="w-4 h-4" /> Audio de alta fidelidad disponible
              </span>
              <button
                onClick={() => setSelectedVideo(null)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
              >
                Volver a la galería
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
