import React, { useState, useRef, useEffect } from "react";
import { Product, Combo } from "../types";
import { Bot, X, Send, Mic, MicOff, Volume2, VolumeX, Sparkles, ShoppingCart, ArrowRight, Loader2, Cpu, MessageSquare } from "lucide-react";

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  combos: Combo[];
  onAddToCart: (productId: string) => void;
  onAddComboToCart: (comboId: string) => void;
  vendedorWhatsapp: string;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  recommendations?: string[];
  audioUrl?: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  products,
  combos,
  onAddToCart,
  onAddComboToCart,
  vendedorWhatsapp,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "¡Hola! Te doy una cordial y cálida bienvenida a Equipo Vida S.R.L. Soy tu Asistente Inteligente con voz de Team Life. Estoy aquí para recomendarte el producto ideal para tu bienestar o explicarte cómo acceder al 40% de descuento permanente adquiriendo tu Membresía Oficial con el Kit de Bienvenida (250 Bs). ¿En qué puedo ayudarte hoy?",
      recommendations: ["kit-de-bienvenida", "tl-colageno", "combo-salud-360"],
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voicePlaybackEnabled, setVoicePlaybackEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "esp32">("chat");
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    "👑 ¿Cómo funciona la Membresía Kit de Bienvenida (250 Bs)?",
    "🦴 ¿Qué me recomiendas para dolor de rodillas y articulaciones?",
    "🌿 ¿Cómo desinflamar el colon y estreñimiento?",
    "⚡ ¿Qué producto me da energía limpia y foco?",
    "🛡️ ¿Cómo subir mis defensas ante resfríos?",
    "💬 Quiero hablar con un asesor humano",
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.slice(-5).map((m) => ({
            role: m.sender,
            text: m.text,
          })),
        }),
      });

      const data = await response.json();
      const replyText = data.reply || "Estoy a tu disposición para ayudarte a elegir el mejor producto de Team Life.";
      const recs = data.recommendations || [];

      let audioUrl: string | undefined = undefined;

      // Generar audio de voz mediante Gemini TTS o síntesis natural de navegador
      if (voicePlaybackEnabled) {
        let played = false;
        try {
          const voiceRes = await fetch("/api/voice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: replyText.slice(0, 300) }),
          });
          if (voiceRes.ok) {
            const voiceData = await voiceRes.json();
            if (voiceData.audioUrl) {
              audioUrl = voiceData.audioUrl;
              playAudio(voiceData.audioUrl, userMsg.id + "-reply");
              played = true;
            }
          }
        } catch {
          // Continuar con síntesis local
        }
        if (!played) {
          speakMessageText(replyText, userMsg.id + "-reply");
        }
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: replyText,
        recommendations: recs,
        audioUrl,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Error al consultar chatbot:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "assistant",
          text: "Puedes consultar nuestro catálogo interactivo o escribirnos directamente a nuestro WhatsApp oficial para atención personalizada.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const speakMessageText = (text: string, id: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find((v) => v.lang.startsWith("es"));
      if (spanishVoice) utterance.voice = spanishVoice;
      setAudioPlaying(id);
      utterance.onend = () => setAudioPlaying(null);
      utterance.onerror = () => setAudioPlaying(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  const playAudio = (url: string, id: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    setAudioPlaying(id);
    audio.play().catch(() => {
      // Fallback a síntesis del navegador si el audio wav falla
      const msg = messages.find((m) => m.id === id);
      if (msg) speakMessageText(msg.text, id);
    });
    audio.onended = () => setAudioPlaying(null);
    audio.onerror = () => setAudioPlaying(null);
  };

  // Reconocimiento de voz por micrófono (Web Speech API)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "assistant",
          text: "El micrófono no está habilitado en este navegador. Puedes escribir tu pregunta directamente en el chat y te responderé de inmediato.",
        },
      ]);
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      handleSendMessage(transcript);
    };

    recognition.start();
  };

  // Encontrar detalles de productos recomendados
  const getProductOrCombo = (id: string) => {
    const p = products.find((prod) => prod.id === id);
    if (p) return { item: p, isCombo: false };
    const c = combos.find((comb) => comb.id === id);
    if (c) return { item: c, isCombo: true };
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl h-[88vh] max-h-[750px] rounded-3xl bg-[#0e0520] border border-purple-500/40 shadow-2xl flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#160833] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-blue-600 to-amber-400 p-[1.5px] shadow-lg shadow-purple-600/40">
              <div className="w-full h-full bg-[#0e0520] rounded-[14px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-purple-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-base sm:text-lg text-white">
                  Asistente de Equipo Vida
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="text-[11px] text-purple-200">
                Impulsado por Gemini 3.8 Flash & Voz TTS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs switcher: Chat vs ESP32 Doc */}
            <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  activeTab === "chat" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Chat & Voz
              </button>
              <button
                onClick={() => setActiveTab("esp32")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                  activeTab === "esp32" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Cpu className="w-3 h-3 text-amber-300" />
                <span>ESP32</span>
              </button>
            </div>

            {/* Voice toggle button */}
            <button
              onClick={() => setVoicePlaybackEnabled(!voicePlaybackEnabled)}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors ${
                voicePlaybackEnabled
                  ? "bg-purple-600/20 border-purple-500/40 text-purple-300"
                  : "bg-white/5 border-white/10 text-slate-500"
              }`}
              title={voicePlaybackEnabled ? "Voz activada" : "Voz silenciada"}
            >
              {voicePlaybackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        {activeTab === "esp32" ? (
          <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300">
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Cpu className="w-5 h-5" />
                <span>Arquitectura Oficial para Dispositivo Físico ESP32</span>
              </div>
              <p>
                Este sistema está preparado para la fase de oficina de Equipo Vida S.R.L., donde un dispositivo físico basado en ESP32 con micrófono interactuará por voz con clientes y distribuidores en la recepción.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm">Flujo de Comunicación:</h4>
              <div className="p-3.5 rounded-xl bg-white/5 font-mono text-xs text-purple-200 border border-white/10 leading-relaxed">
                ESP32 (Micrófono I2S) ➔ WiFi ➔ POST /api/esp32/query ➔ Gemini 3.8 Flash + Firestore ➔ Audio TTS / Respuesta concisa ➔ ESP32 (Altavoz MAX98357A)
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">Prueba del Endpoint ESP32:</h4>
              <p className="text-xs text-slate-400">
                Puedes enviar una solicitud de prueba al endpoint <code>/api/esp32/query</code> para verificar la respuesta compacta para altavoz:
              </p>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/esp32/query", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ queryText: "¿Qué productos tienen para articulaciones y dolor de rodillas?" }),
                    });
                    const d = await res.json();
                    alert(`Respuesta ESP32:\n\n${d.spokenReply}`);
                  } catch (e: any) {
                    alert(`Error en prueba ESP32: ${e.message}`);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs hover:bg-amber-500/30 transition-colors"
              >
                Probar simulación de consulta ESP32
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[78%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-tr-sm shadow-md"
                        : "bg-[#160a2e] border border-white/10 text-slate-200 rounded-tl-sm shadow-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Audio listen button for assistant */}
                    {msg.sender === "assistant" && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (msg.audioUrl) {
                              playAudio(msg.audioUrl, msg.id);
                            } else {
                              speakMessageText(msg.text, msg.id);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{audioPlaying === msg.id ? "Reproduciendo voz..." : "Escuchar con voz"}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Interactive Recommended Products Cards inside Chat */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="mt-3 max-w-[95%] w-full flex flex-col sm:flex-row gap-3 overflow-x-auto py-1">
                      {msg.recommendations.map((recId) => {
                        const rec = getProductOrCombo(recId);
                        if (!rec) return null;
                        const { item, isCombo } = rec;
                        const price = isCombo ? (item as Combo).comboPrice : (item as Product).normalPrice;

                        return (
                          <div
                            key={recId}
                            className="p-3 rounded-2xl bg-[#1b0d38] border border-purple-400/40 min-w-[200px] flex-1 flex flex-col justify-between shadow-lg"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <img
                                src={item.img}
                                alt={item.name}
                                className="w-12 h-12 object-contain rounded-xl bg-black/40 p-1"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://i.ibb.co/Hphn7GnF/logo.png";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-bold text-amber-300 uppercase">
                                  {isCombo ? "Combo VIP" : "Producto"}
                                </span>
                                <h5 className="font-display font-bold text-xs text-white truncate">
                                  {item.name}
                                </h5>
                                <div className="text-xs font-mono font-bold text-amber-400">
                                  Bs {price.toFixed(0)}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                if (isCombo) onAddComboToCart(item.id);
                                else onAddToCart(item.id);
                              }}
                              className="w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>Agregar al carrito</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs pl-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span>El asistente está pensando y redactando tu respuesta...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Chips */}
            <div className="px-4 py-2 border-t border-white/5 flex gap-2 overflow-x-auto whitespace-nowrap bg-[#0b0318]/60">
              {quickPrompts.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-purple-600/20 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-colors shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-[#120629] flex items-center gap-2">
              <button
                onClick={toggleSpeechRecognition}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${
                  isRecording
                    ? "bg-rose-500 border-rose-400 text-white animate-pulse"
                    : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                }`}
                title={isRecording ? "Detener grabación" : "Hablar por micrófono"}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={isRecording ? "Escuchando tu voz..." : "Escribe tu duda sobre productos, combos o precios..."}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white text-xs sm:text-sm focus:outline-none focus:border-purple-500 transition-colors placeholder-slate-400"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || loading}
                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md shadow-purple-600/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
