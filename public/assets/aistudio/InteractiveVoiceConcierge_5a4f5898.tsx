import React, { useState, useEffect, useRef } from "react";
import { Bot, Volume2, VolumeX, Sparkles, X, ShoppingCart, ArrowRight, MessageCircle, RefreshCw } from "lucide-react";
import { Product, Combo } from "../types";

interface InteractiveVoiceConciergeProps {
  onAddToCart: (productId: string) => void;
  onAddComboToCart: (comboId: string) => void;
  onOpenFullChat: () => void;
  vendedorWhatsapp: string;
}

interface HealthGuideOption {
  id: string;
  label: string;
  icon: string;
  spokenText: string;
  recommendedId: string;
  isCombo: boolean;
  productName: string;
  price: number;
}

const GUIDE_OPTIONS: HealthGuideOption[] = [
  {
    id: "articular",
    label: "Salud Articular & Cartílagos",
    icon: "🦴",
    spokenText:
      "Para regenerar tus articulaciones, calmar el dolor en rodillas y rejuvenecer tu piel, nuestro producto estrella es el Colágeno Marino Hidrolizado. Sus péptidos bioactivos se absorben en minutos.",
    recommendedId: "tl-colageno",
    isCombo: false,
    productName: "Colágeno Marino Hidrolizado",
    price: 210,
  },
  {
    id: "digestivo",
    label: "Colon Limpio & Desinflamación",
    icon: "🌿",
    spokenText:
      "Si sientes pesadez estomacal o estreñimiento, el Fibernat Digestivo y Detox es tu mejor aliado. Es 100% natural, desinflama el abdomen y normaliza tu tránsito sin cólicos.",
    recommendedId: "tl-fibernat",
    isCombo: false,
    productName: "Fibernat Digestivo & Detox",
    price: 160,
  },
  {
    id: "energia",
    label: "Energía Limpia & Foco Mental",
    icon: "⚡",
    spokenText:
      "Para tener energía sostenida durante todo el día sin taquicardia ni reflujo, te recomiendo Coffee Life Gourmet con Ganoderma Lucidum y maca andina.",
    recommendedId: "tl-coffeelife",
    isCombo: false,
    productName: "Coffee Life Gourmet",
    price: 140,
  },
  {
    id: "inmunidad",
    label: "Blindar Defensas & Respiratorio",
    icon: "🛡️",
    spokenText:
      "Para proteger tus vías respiratorias y aumentar tus glóbulos blancos frente a cambios de clima, Inmune Plus Multi-Defensas con saúco negro y propóleo es ideal.",
    recommendedId: "tl-inmune",
    isCombo: false,
    productName: "Inmune Plus Multi-Defensas",
    price: 190,
  },
  {
    id: "membresia",
    label: "Membresía 40% OFF (Kit de Bienvenida)",
    icon: "👑",
    spokenText:
      "¡Excelente decisión! El 40% de descuento permanente se activa adquiriendo tu Kit de Bienvenida oficial por 250 bolivianos. Recibes tu manual, catálogo y código de socio vitalicio sin recompras forzosas.",
    recommendedId: "kit-de-bienvenida",
    isCombo: true,
    productName: "Kit de Bienvenida (Membresía Oficial)",
    price: 250,
  },
];

const WELCOME_SPEECH =
  "¡Hola! Te doy una cordial bienvenida a Equipo Vida S.R.L. Soy tu asesor de salud inteligente con voz. Dime, ¿deseas aliviar articulaciones, desinflamar tu digestión, subir tus defensas o adquirir tu Kit de Bienvenida para tener el 40% de descuento permanente? Toca una de las opciones para guiarte.";

export const InteractiveVoiceConcierge: React.FC<InteractiveVoiceConciergeProps> = ({
  onAddToCart,
  onAddComboToCart,
  onOpenFullChat,
  vendedorWhatsapp,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechMuted, setSpeechMuted] = useState(false);
  const [currentText, setCurrentText] = useState(WELCOME_SPEECH);
  const [activeRecommendation, setActiveRecommendation] = useState<HealthGuideOption | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Reproducir voz mediante Web Speech API o Gemini TTS
  const speakText = (text: string) => {
    if (speechMuted) return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      // Buscar voz en español
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice =
        voices.find((v) => v.lang.startsWith("es") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Sabina") || v.name.includes("Helena") || v.name.includes("Paulina"))) ||
        voices.find((v) => v.lang.startsWith("es"));

      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  // Saludo proactivo al ingresar a la página (respetando restricciones de navegador)
  useEffect(() => {
    // Si el navegador ya permite autoplay o ante la primera interacción global
    const handleFirstUserGesture = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        speakText(WELCOME_SPEECH);
      }
      window.removeEventListener("click", handleFirstUserGesture);
      window.removeEventListener("touchstart", handleFirstUserGesture);
    };

    window.addEventListener("click", handleFirstUserGesture, { once: true });
    window.addEventListener("touchstart", handleFirstUserGesture, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstUserGesture);
      window.removeEventListener("touchstart", handleFirstUserGesture);
      stopSpeaking();
    };
  }, [hasInteracted]);

  const handleSelectOption = (opt: HealthGuideOption) => {
    setHasInteracted(true);
    setCurrentText(opt.spokenText);
    setActiveRecommendation(opt);
    speakText(opt.spokenText);
  };

  const handleReplay = () => {
    speakText(currentText);
  };

  const handleToggleMute = () => {
    if (isPlaying) {
      stopSpeaking();
      setSpeechMuted(true);
    } else {
      setSpeechMuted(false);
      speakText(currentText);
    }
  };

  const handleAddActiveToCart = () => {
    if (!activeRecommendation) return;
    if (activeRecommendation.isCombo) {
      onAddComboToCart(activeRecommendation.recommendedId);
    } else {
      onAddToCart(activeRecommendation.recommendedId);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
          speakText(WELCOME_SPEECH);
        }}
        className="fixed bottom-24 right-6 z-40 px-4 py-2.5 rounded-full bg-white/95 text-[#063b27] font-display font-bold text-xs shadow-xl border border-emerald-900/20 backdrop-blur-md flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
        </span>
        <Bot className="w-4 h-4 text-emerald-800" />
        <span>Abrir Guía de Voz Gemini</span>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-6 z-40 bg-white/95 text-[#063b27] border border-emerald-900/15 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center gap-3">
        <button
          onClick={() => {
            setIsMinimized(false);
            speakText(currentText);
          }}
          className="flex items-center gap-2 text-xs font-bold hover:text-emerald-700 cursor-pointer"
        >
          <Bot className="w-4 h-4 text-emerald-700 animate-pulse" />
          <span>Guía de Salud con Voz</span>
        </button>
        <button
          onClick={handleToggleMute}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-800"
          title={speechMuted ? "Activar voz" : "Silenciar voz"}
        >
          {speechMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-700" />}
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 left-4 sm:left-8 z-40 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] rounded-3xl bg-white/95 backdrop-blur-xl border border-emerald-950/15 shadow-[0_20px_50px_-10px_rgba(6,59,39,0.25),0_0_0_1px_rgba(217,162,71,0.2)] p-4 sm:p-5 text-slate-900 animate-in slide-in-from-bottom-6 duration-300">
      
      {/* Top Header Row with Soundwave */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#063b27] to-emerald-700 text-white flex items-center justify-center shadow-md">
            <Bot className="w-4 h-4" />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="font-display font-black text-xs sm:text-sm text-[#063b27] flex items-center gap-1.5">
              <span>Asesor Inteligente con Voz</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                Interactivo
              </span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              {isPlaying ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Hablando en voz alta...
                </span>
              ) : (
                <span>Elige tu objetivo y te guiaré</span>
              )}
            </div>
          </div>
        </div>

        {/* Audio & Window Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleReplay}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
            title="Repetir audio con voz"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggleMute}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
            title={speechMuted ? "Activar sonido" : "Silenciar"}
          >
            {speechMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-700" />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer text-xs"
            title="Minimizar"
          >
            _
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
            title="Cerrar guía"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Spoken Speech Transcript Box */}
      <div className="my-3 p-3 rounded-2xl bg-[#faf9f5] border border-emerald-900/10 text-xs text-slate-700 leading-relaxed relative group">
        <p className="font-normal italic">
          "{currentText}"
        </p>
        {!hasInteracted && (
          <button
            onClick={() => {
              setHasInteracted(true);
              speakText(currentText);
            }}
            className="mt-2 w-full py-2 px-3 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-300" />
            <span>Toca aquí para escuchar con voz</span>
          </button>
        )}
      </div>

      {/* Guide Options Carousel / Buttons */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          Selecciona tu objetivo de salud:
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {GUIDE_OPTIONS.map((opt) => {
            const isActive = activeRecommendation?.id === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt)}
                className={`py-2 px-2.5 rounded-xl text-[11px] font-bold text-left transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isActive
                    ? "bg-[#063b27] text-white border-[#063b27] shadow-md shadow-emerald-950/20"
                    : "bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200/80 hover:border-emerald-300"
                }`}
              >
                <span>{opt.icon}</span>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Recommendation Action if selected */}
      {activeRecommendation && (
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="truncate">
            <div className="text-[11px] font-bold text-[#063b27] truncate">
              {activeRecommendation.productName}
            </div>
            <div className="text-[10px] text-slate-500">
              Bs {activeRecommendation.price}
            </div>
          </div>
          <button
            onClick={handleAddActiveToCart}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#063b27] font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>
      )}

      {/* Bottom Footer Actions: Full Chat & WhatsApp */}
      <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
        <button
          onClick={onOpenFullChat}
          className="text-emerald-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Preguntar otra cosa a Gemini</span>
          <ArrowRight className="w-3 h-3" />
        </button>

        <button
          onClick={() => {
            const msg = encodeURIComponent("¡Hola! Deseo asesoría personalizada sobre los productos y la membresía del Kit de Bienvenida de 250 Bs.");
            window.open(`https://wa.me/${vendedorWhatsapp}?text=${msg}`, "_blank");
          }}
          className="text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer font-medium"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>WhatsApp Oficial</span>
        </button>
      </div>

    </div>
  );
};
