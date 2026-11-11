import React from "react";
import { X } from "lucide-react";

interface ImageModalProps {
  imgUrl: string | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imgUrl, onClose }) => {
  if (!imgUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-400 border border-white/20 flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Cerrar ampliación"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden border border-white/20 shadow-[0_0_80px_rgba(147,51,234,0.4)] bg-[#0d041e] p-2 cursor-default"
      >
        <img
          src={imgUrl}
          alt="Vista ampliada de producto"
          className="max-h-[80vh] max-w-full object-contain rounded-2xl mx-auto"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://i.ibb.co/Hphn7GnF/logo.png";
          }}
        />
      </div>
    </div>
  );
};
