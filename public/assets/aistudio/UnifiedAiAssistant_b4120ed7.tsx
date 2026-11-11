import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  ShoppingCart,
  ArrowRight,
  MessageCircle,
  RefreshCw,
  Send,
  Maximize2,
  Minimize2,
  ChevronRight,
  CheckCircle2,
  Truck,
  Mic,
  MicOff,
  Building2,
  ShieldCheck,
  Briefcase,
  Users,
} from "lucide-react";
import { Product, Combo } from "../types";
import { COMPANY_INFO } from "../data/initialData";

interface UnifiedAiAssistantProps {
  products: Product[];
  combos: Combo[];
  isOpen: boolean;
  isExpanded: boolean;
  onClose: () => void;
  onOpen: () => void;
  onToggleExpand: () => void;
  onAddToCart: (productId: string) => void;
  onAddComboToCart: (comboId: string) => void;
  vendedorWhatsapp: string;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  recommendedProduct?: Product;
  recommendedCombo?: Combo;
  timestamp: string;
}

interface ShoppingStep {
  id: string;
  label: string;
  icon: string;
  benefit: string;
  spokenText: string;
  targetId: string;
  isCombo: boolean;
  normalPrice: number;
  memberPrice: number;
}

// Client-side local expert engine for Hybrid AI (guarantees instant responses if tokens/offline exhaust)
function generateClientKnowledgeResponse(prompt: string, products: Product[], combos: Combo[]) {
  const p = prompt.toLowerCase();
  let reply = "";
  let matchedProd: Product | undefined;
  let matchedCombo: Combo | undefined;

  const getP = (id: string) => products.find((x) => x.id === id);
  const getC = (id: string) => combos.find((x) => x.id === id);

  if (p.includes("fundador") || p.includes("julian") || p.includes("mery") || p.includes("creador") || p.includes("ceo") || p.includes("dueño")) {
    reply = "TEAM LIFE COMPANY S.R.L. fue fundada por Julian Rodriguez y Mery Ruiz.\n\n• Experiencia Médica: Más de 20 años en medicina convencional, alternativas medicinales y nutrición celular.\n• Liderazgo: Más de 10 años en Network Marketing. Líderes visionarios con la convicción de que 'JUNTOS TODO ES POSIBLE'.\n• Legalidad: NIT 572065026 (Régimen General, con factura fiscal), Registro Sanitario SENASAG No. 166/2025 y Registro SEPREC.";
    matchedCombo = getC("kit-de-bienvenida");
  } else if (p.includes("legal") || p.includes("nit") || p.includes("senasag") || p.includes("seprec") || p.includes("factura")) {
    reply = "TEAM LIFE cuenta con respaldo legal pleno en Bolivia:\n\n1. SEPREC: Matrícula de Comercio vigente.\n2. Impuestos Nacionales: NIT 572065026 (Régimen General, emite Factura Oficial en cada compra).\n3. SENASAG: Certificado de Registro Sanitario No. 166/2025 emitido en Santa Cruz.\n\nTodos los productos y comisiones son 100% legales y transparentes.";
    matchedCombo = getC("kit-de-bienvenida");
  } else if (p.includes("cordyceps") || p.includes("coffee") || p.includes("cafe") || p.includes("café") || p.includes("ganoderma") || p.includes("energia") || p.includes("energía")) {
    reply = "Coffee Life Premium (Ganoderma + Cordyceps Sinensis):\n\n• Presentación: Caja de 30 sachets de 4.5g.\n• Ingredientes: Café Orgánico de Altura, Cordyceps Sinensis, Ganoderma Lucidum y Colágeno Marino Hidrolizado.\n• Para qué sirve: Aumenta el oxígeno en la sangre y capacidad pulmonar (alivia asma y bronquitis), mejora la función renal y salud sexual, neuroprotección (Parkinson y Alzheimer) y energía celular limpia sin taquicardia ni reflujo.\n\n• Precios: Regular Bs 359 · Socio 40% OFF: Bs 215.";
    matchedProd = getP("tl-coffeelife");
  } else if (p.includes("colageno") || p.includes("colágeno") || p.includes("articulac") || p.includes("rodilla") || p.includes("cartilago") || p.includes("piel")) {
    reply = "Colágeno Marino Hidrolizado (Fórmula Reforzada):\n\n• Presentación: Caja de 30 sobres de 10g (300g peso neto).\n• Ingredientes: Colágeno Marino Hidrolizado, Ácido Hialurónico, Coenzima Q10, Mix de Vitaminas y Minerales, Pulpa de Açaí Liofilizado.\n• Para qué sirve: Regenera articulaciones, cartílagos y ligamentos; mejora y tonifica la piel; combate flacidez facial y celulitis; fortalece cabello, uñas y el humor vítreo del ojo.\n\n• Precios: Regular Bs 342 · Socio 40% OFF: Bs 205.";
    matchedProd = getP("tl-colageno");
  } else if (p.includes("inmune") || p.includes("defens") || p.includes("gripe") || p.includes("resfri") || p.includes("noni") || p.includes("guanabana") || p.includes("camu")) {
    reply = "Inmune Plus Multi-Defensas Activas (Previene Enfermedades):\n\n• Presentación: Caja de 30 sobres de 7g (210g peso neto).\n• Ingredientes: Noni, Guanábana, Jengibre, Cúrcuma, Camu Camu, Flor de Jamaica, Aloe Vera y Vitamina C quelada.\n• Para qué sirve: Eleva el sistema inmune, antiviral y antibacteriano de choque para gripe o tos, controla hipertensión, depura el hígado y acción citoprotectora preventiva frente al cáncer.\n\n• Precios: Regular Bs 409 · Socio 40% OFF: Bs 245.";
    matchedProd = getP("tl-inmune");
  } else if (p.includes("fibernat") || p.includes("digest") || p.includes("colon") || p.includes("estreñ") || p.includes("pitahaya") || p.includes("moringa") || p.includes("vientre")) {
    reply = "Fibernat Fibra Soluble & Detox Intestinal:\n\n• Presentación: Sobres de 6g c/u (Cont. Neto: 50g).\n• Ingredientes: Psyllium orgánico, Moringa, Vitamina C, Pitahaya, Citrato de Magnesio y Manzana Verde Liofilizada.\n• Para qué sirve: Normaliza el tránsito intestinal y alivia estreñimiento sin cólicos; regenera flora del colon; logra un vientre plano en 48 hrs y regula glucosa y colesterol.\n\n• Precios: Regular Bs 159 · Socio 40% OFF: Bs 95.";
    matchedProd = getP("tl-fibernat");
  } else if (p.includes("chocokids") || p.includes("niño") || p.includes("infantil") || p.includes("crecimiento") || p.includes("cerebro") || p.includes("tdah")) {
    reply = "Choco Kids+ Nutrition (Sin Azúcar Refinada):\n\n• Presentación: Caja de sobres de 8g.\n• Ingredientes: Proteína Aislada de Soja, Avena, Cacao Alcalino, Vitaminas/Minerales (Calcio, Hierro, Zinc), Omega 3, L-Arginina, Psyllium, Probióticos (yogurt) y Harina de Linaza.\n• Para qué sirve: Estimula el crecimiento en estatura (L-Arginina/Zinc), desarrollo cerebral y visión (Omega 3), disminuye ansiedad escolar y apoya en TDAH; fortalece huesos y defensas.\n\n• Precios: Regular Bs 409 · Socio 40% OFF: Bs 245.";
    matchedProd = getP("tl-chocokids");
  } else if (p.includes("combo 1") || p.includes("combo 2") || p.includes("combo 3") || p.includes("empresarial") || p.includes("ganancia") || p.includes("1360") || p.includes("2500") || p.includes("4650")) {
    reply = "Combos Empresariales Oficiales Team Life:\n\n1. Combo 1 (6 Prod.): 2 Fibernat + 2 Inmune + 2 Colágeno = Bs 1.360 (Bs 1.125 Comisionable) · 60% Ganancia.\n2. Combo 2 (12 Prod.): 4 Fibernat + 3 Inmune + 4 Colágeno + 1 Coffee Life = Bs 2.500 (Bs 2.057 Comisionable) · 73% Ganancia.\n3. Combo 3 (25 Prod.): 10 Fibernat + 6 Inmune + 7 Colágeno + 2 Coffee Life = Bs 4.650 (Bs 3.806 Comisionable) · 87% Ganancia y activa Bono Impulso Plus de Bs 1.500.";
    matchedCombo = getC("combo-3-empresarial") || getC("combo-1-empresarial");
  } else if (p.includes("plan") || p.includes("bono") || p.includes("regalia") || p.includes("impulso") || p.includes("carrera") || p.includes("premio") || p.includes("auto")) {
    reply = "Plan de Compensación Team Life (75% en bonos sin candados):\n\n• Bono Patrocinio (5 niveles): N1 (45%), N2 (20%), N3 (10%), N4 (7%), N5 (5%). Proyección potencial: Bs 835.915.\n• Bono Impulso: Bs 1.200 ($us 171) por 5 activaciones con puntos.\n• Bono Impulso Plus: Bs 1.500 (+Bs 300 ascendente) por 5 asociados con Combo 3.\n• Bono Regalías (20 niveles): Proyección en 7 niveles de Bs 1.327.032.\n• Premios por Rango: Viaje Nacional (Esmeralda), iPhone (Diamante), Viaje Internacional (Diamante Platino), Auto 0 Km $25.000 $us (Diamante Negro).";
    matchedCombo = getC("kit-de-bienvenida");
  } else if (p.includes("afiliar") || p.includes("40%") || p.includes("250") || p.includes("membresia") || p.includes("kit")) {
    reply = "La Afiliación Básica cuesta Bs 250 (Kit de Bienvenida oficial):\n\n• Incluye caja con muestras de producto (Fibernat, Inmune Plus, Colágeno), bolígrafo ejecutivo grabado, manual y catálogo.\n• Beneficio: 40% de descuento vitalicio en toda la línea sin compras mínimas mensuales obligatorias.\n• Patrocinios directos exprés: Ganas Bs 150 en mano por cada nuevo consumidor afiliado.";
    matchedCombo = getC("kit-de-bienvenida");
  } else {
    reply = "En TEAM LIFE COMPANY S.R.L. disponemos de 5 formulaciones bioactivas oficiales (Colágeno Bs 342, Coffee Life Bs 359 con Cordyceps, Inmune Plus Bs 409, Fibernat Bs 159, Chocokids Bs 409), el Kit de Afiliación de Bs 250 (40% OFF) y Combos Empresariales con hasta el 87% de ganancias. Despachos garantizados a los 9 departamentos de Bolivia.";
    matchedProd = getP("tl-colageno");
  }

  return { reply, matchedProd, matchedCombo };
}

export const UnifiedAiAssistant: React.FC<UnifiedAiAssistantProps> = ({
  products,
  combos,
  isOpen,
  isExpanded,
  onClose,
  onOpen,
  onToggleExpand,
  onAddToCart,
  onAddComboToCart,
  vendedorWhatsapp,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechMuted, setSpeechMuted] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"guia" | "chat" | "fundadores" | "envios">("guia");
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);

  const WELCOME_GREETING =
    "¡Hola! Te doy una cordial bienvenida a TEAM LIFE COMPANY S.R.L. Soy tu asesora híbrida con voz. Conozco a fondo nuestras 5 formulaciones con sus ingredientes oficiales, combos de hasta 87% de ganancias y a nuestros fundadores Julian Rodriguez y Mery Ruiz. Elige tu consulta y te responderé con todos los detalles al instante.";

  const [currentSpokenText, setCurrentSpokenText] = useState<string>(WELCOME_GREETING);

  const [activeRecommendation, setActiveRecommendation] = useState<{
    product?: Product;
    combo?: Combo;
  } | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-init",
      sender: "ai",
      text: "¡Hola! Soy tu Asesora Oficial e Inteligencia Híbrida de TEAM LIFE COMPANY S.R.L. (Equipo Vida S.R.L.).\n\nPoseo la información completa de la presentación oficial: fundadores (Julian Rodriguez y Mery Ruiz), NIT 572065026, SENASAG 166/2025, los 5 productos bioactivos, el Kit de Afiliación (250 Bs con 40% OFF) y los Combos Empresariales con hasta el 87% de ganancias.\n\nPuedes preguntarme libremente sobre cualquier producto o tema comercial y te daré todos los datos sin rodeos.",
      timestamp: "Ahora",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const getProduct = (id: string) => products.find((p) => p.id === id);
  const getCombo = (id: string) => combos.find((c) => c.id === id);

  const shoppingObjectives: ShoppingStep[] = [
    {
      id: "articulaciones",
      label: "Articulaciones, Rodillas & Piel",
      icon: "🦴",
      benefit: "Colágeno Marino + Ácido Hialurónico, CoQ10 y Açaí",
      spokenText:
        "Para regenerar articulaciones, rodillas y cartílagos, el Colágeno Marino Hidrolizado Fórmula Reforzada contiene Ácido Hialurónico, Coenzima Q10 y Açaí. Su precio público es 342 bolivianos, o 205 bolivianos para socios al 40% de descuento. ¿Deseas que lo añada a tu carrito?",
      targetId: "tl-colageno",
      isCombo: false,
      normalPrice: 342,
      memberPrice: 205,
    },
    {
      id: "digestivo",
      label: "Colon Limpio & Desinflamación",
      icon: "🌿",
      benefit: "Psyllium, Pitahaya, Moringa y Citrato de Magnesio",
      spokenText:
        "Para un vientre plano y regular el tránsito sin cólicos, Fibernat Fibra Soluble con Pitahaya y Citrato de Magnesio cuesta 159 bolivianos, o 95 bolivianos con tu código de socio al 40% de descuento. ¿Lo agregamos?",
      targetId: "tl-fibernat",
      isCombo: false,
      normalPrice: 159,
      memberPrice: 95,
    },
    {
      id: "energia",
      label: "Energía Sostenida & Foco Mental",
      icon: "⚡",
      benefit: "Café Orgánico con Cordyceps Sinensis y Ganoderma",
      spokenText:
        "Para energía celular, oxigenación pulmonar y resistencia sin taquicardia ni reflujo, Coffee Life Premium con Cordyceps Sinensis y Ganoderma cuesta 359 bolivianos, o 215 bolivianos para socios. ¿Te gustaría añadirlo?",
      targetId: "tl-coffeelife",
      isCombo: false,
      normalPrice: 359,
      memberPrice: 215,
    },
    {
      id: "defensas",
      label: "Blindar Defensas & Respiratorio",
      icon: "🛡️",
      benefit: "Noni, Guanábana, Camu Camu, Jengibre y Cúrcuma",
      spokenText:
        "Para proteger las vías respiratorias y elevar las defensas familiares, Inmune Plus Multi-Defensas cuesta 409 bolivianos (245 bolivianos socio) y Chocokids con Omega 3 y L-Arginina también a 409 bolivianos. ¿Deseas agregarlo?",
      targetId: "tl-inmune",
      isCombo: false,
      normalPrice: 409,
      memberPrice: 245,
    },
    {
      id: "membresia",
      label: "Activar 40% OFF Vitalicio (Kit 250 Bs)",
      icon: "👑",
      benefit: "Muestras de producto, bolígrafo oficial, catálogo y código",
      spokenText:
        "¡La membresía oficial de Team Life! Adquiriendo tu Kit de Afiliación por 250 bolivianos activas de por vida tu 40% de descuento en todos los productos sin compras mínimas mensuales obligatorias, y ganas 150 bolivianos de bono por cada socio directo. ¿Deseas adquirir tu kit?",
      targetId: "kit-de-bienvenida",
      isCombo: true,
      normalPrice: 250,
      memberPrice: 250,
    },
    {
      id: "combos-empresariales",
      label: "Combos Empresariales (Hasta 87% Ganancia)",
      icon: "💼",
      benefit: "Combo 1 (60%), Combo 2 (73%), Combo 3 (87% Ganancias)",
      spokenText:
        "Disponemos de 3 Combos Empresariales de alta rentabilidad: Combo 1 por 1.360 bolivianos (60% ganancia), Combo 2 por 2.500 bolivianos (73% ganancia) y Combo 3 por 4.650 bolivianos (87% ganancia y activa el Bono Impulso Plus de 1.500 bolivianos). ¿Te gustaría conocer los combos?",
      targetId: "combo-1-empresarial",
      isCombo: true,
      normalPrice: 1360,
      memberPrice: 1360,
    },
  ];

  const getBestSpanishVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const naturalKeywords = ["natural", "neural", "google español", "google spanish", "helena", "sabina", "monica", "paulina", "laura", "jorge"];
    const spanishVoices = voices.filter(
      (v) =>
        v.lang.toLowerCase().startsWith("es") ||
        v.lang.toLowerCase().includes("es-es") ||
        v.lang.toLowerCase().includes("es-la") ||
        v.lang.toLowerCase().includes("es-mx") ||
        v.lang.toLowerCase().includes("es-us")
    );

    for (const kw of naturalKeywords) {
      const match = spanishVoices.find((v) => v.name.toLowerCase().includes(kw));
      if (match) return match;
    }
    return spanishVoices[0] || null;
  };

  const speakText = (text: string) => {
    if (speechMuted) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const cleanSpeech = text
      .replace(/[*_#`~]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/Bs\s?(\d+)/gi, "$1 bolivianos")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = "es-ES";
    utterance.rate = 0.96;
    utterance.pitch = 1.02;

    const bestVoice = getBestSpanishVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  const handleSelectObjective = (step: ShoppingStep) => {
    setSelectedObjectiveId(step.id);
    setCurrentSpokenText(step.spokenText);

    let recProduct: Product | undefined;
    let recCombo: Combo | undefined;

    if (step.isCombo) {
      recCombo = getCombo(step.targetId);
      setActiveRecommendation({ combo: recCombo });
    } else {
      recProduct = getProduct(step.targetId);
      setActiveRecommendation({ product: recProduct });
    }

    const aiMsg: Message = {
      id: `ai-step-${Date.now()}`,
      sender: "ai",
      text: step.spokenText,
      recommendedProduct: recProduct,
      recommendedCombo: recCombo,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    speakText(step.spokenText);
  };

  const handleToggleMute = () => {
    if (isPlaying) {
      stopSpeaking();
      setSpeechMuted(true);
    } else {
      setSpeechMuted(false);
      speakText(currentSpokenText);
    }
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("El micrófono no está habilitado en este navegador. Puedes escribir tu consulta en el chat.");
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
      handleSendMessageWithText(transcript);
    };

    recognition.start();
  };

  const handleSendMessageWithText = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    const userText = textToSend.trim();
    setInputText("");

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          products,
          combos,
          history: messages.slice(-4).map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            parts: [{ text: m.text }],
          })),
        }),
      });

      const data = await response.json();
      let aiResponseText = data.reply;
      let matchedProd: Product | undefined;
      let matchedCombo: Combo | undefined;

      if (!aiResponseText) {
        const local = generateClientKnowledgeResponse(userText, products, combos);
        aiResponseText = local.reply;
        matchedProd = local.matchedProd;
        matchedCombo = local.matchedCombo;
      } else {
        const lower = (userText + " " + aiResponseText).toLowerCase();
        if (lower.includes("colágeno") || lower.includes("colageno") || lower.includes("articulac")) {
          matchedProd = getProduct("tl-colageno");
        } else if (lower.includes("fibernat") || lower.includes("digest") || lower.includes("colon")) {
          matchedProd = getProduct("tl-fibernat");
        } else if (lower.includes("coffee") || lower.includes("café") || lower.includes("cordyceps") || lower.includes("ganoderma")) {
          matchedProd = getProduct("tl-coffeelife");
        } else if (lower.includes("inmune") || lower.includes("defens") || lower.includes("resfri")) {
          matchedProd = getProduct("tl-inmune");
        } else if (lower.includes("chocokids") || lower.includes("niño") || lower.includes("cerebro")) {
          matchedProd = getProduct("tl-chocokids");
        } else if (lower.includes("combo 1")) {
          matchedCombo = getCombo("combo-1-empresarial");
        } else if (lower.includes("combo 2")) {
          matchedCombo = getCombo("combo-2-empresarial");
        } else if (lower.includes("combo 3")) {
          matchedCombo = getCombo("combo-3-empresarial");
        } else if (lower.includes("membres") || lower.includes("kit") || lower.includes("250")) {
          matchedCombo = getCombo("kit-de-bienvenida");
        }
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiResponseText,
        recommendedProduct: matchedProd,
        recommendedCombo: matchedCombo,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setCurrentSpokenText(aiResponseText);
      if (matchedProd || matchedCombo) {
        setActiveRecommendation({ product: matchedProd, combo: matchedCombo });
      }
      speakText(aiResponseText);
    } catch {
      // Offline / Exhausted Token Hybrid Fallback
      const local = generateClientKnowledgeResponse(userText, products, combos);
      const aiMsg: Message = {
        id: `ai-local-${Date.now()}`,
        sender: "ai",
        text: local.reply,
        recommendedProduct: local.matchedProd,
        recommendedCombo: local.matchedCombo,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setCurrentSpokenText(local.reply);
      if (local.matchedProd || local.matchedCombo) {
        setActiveRecommendation({ product: local.matchedProd, combo: local.matchedCombo });
      }
      speakText(local.reply);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleSendMessageWithText(inputText);
  };

  // 1. NON-INTRUSIVE DOCKED STATE
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 group">
        {showNotificationBadge && (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white text-[#082836] border border-[#c8e4ed] shadow-xl text-xs font-bold animate-in slide-in-from-right duration-300">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
            <span>¿Deseas asesoría directa o conocer los combos?</span>
            <button
              onClick={() => setShowNotificationBadge(false)}
              className="text-slate-400 hover:text-[#082836] ml-1 p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <button
          onClick={() => {
            setShowNotificationBadge(false);
            onOpen();
          }}
          className="relative px-4 py-3 rounded-full bg-gradient-to-r from-[#082836] via-[#0891b2] to-[#0284c7] text-white font-display font-bold text-xs sm:text-sm shadow-[0_12px_35px_rgba(8,145,178,0.35)] border border-cyan-400/40 flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Abrir Asesora Híbrida Oficial"
          aria-label="Abrir Asesoría de Compra"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-cyan-200 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
          </div>
          <span>Asesora IA Híbrida</span>
          <Volume2 className="w-4 h-4 text-cyan-200" />
        </button>
      </div>
    );
  }

  // 2. EXPANDED FULL VIEW MODAL
  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-[#082836]/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl h-[90vh] max-h-[720px] rounded-3xl bg-white text-[#082836] border border-[#c8e4ed] shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#082836] via-[#0b3c4f] to-[#0891b2] text-white flex items-center justify-between border-b border-cyan-800">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-xs">
                <Bot className="w-6 h-6 text-cyan-300" />
                {isPlaying && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
                )}
              </div>
              <div>
                <h3 className="font-display font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <span>Asesora Oficial Team Life S.R.L.</span>
                  <span className="text-[10px] bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 font-black px-2 py-0.5 rounded-full">
                    IA Híbrida + Voz
                  </span>
                </h3>
                <p className="text-xs text-cyan-100/80">
                  {isPlaying ? "Hablando en voz alta..." : "Formulaciones, Fundadores, Combos 87% y Envíos"}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-100 transition-colors cursor-pointer border border-white/20"
                title={speechMuted ? "Activar voz" : "Silenciar voz"}
              >
                {speechMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-cyan-200" />}
              </button>
              <button
                onClick={onToggleExpand}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-100 transition-colors cursor-pointer border border-white/20"
                title="Minimizar a widget de esquina"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-100 transition-colors cursor-pointer border border-white/20"
                title="Cerrar asistente"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="p-2.5 bg-[#f0f7fa] border-b border-[#c8e4ed] flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("guia")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === "guia"
                  ? "bg-gradient-to-r from-[#0891b2] to-[#0284c7] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-cyan-50 border border-[#c8e4ed]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Guía Rápida</span>
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === "chat"
                  ? "bg-gradient-to-r from-[#0891b2] to-[#0284c7] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-cyan-50 border border-[#c8e4ed]"
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Consulta Libre (IA)</span>
            </button>
            <button
              onClick={() => setActiveTab("fundadores")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === "fundadores"
                  ? "bg-gradient-to-r from-[#0891b2] to-[#0284c7] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-cyan-50 border border-[#c8e4ed]"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-cyan-600" />
              <span>Fundadores & Legal</span>
            </button>
            <button
              onClick={() => setActiveTab("envios")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === "envios"
                  ? "bg-gradient-to-r from-[#0891b2] to-[#0284c7] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-cyan-50 border border-[#c8e4ed]"
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-cyan-600" />
              <span>Envíos</span>
            </button>
          </div>

          {/* Tab 1: Guía Rápida */}
          {activeTab === "guia" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#f0f7fa]">
              <div className="p-4 rounded-2xl bg-white border border-[#c8e4ed] shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-800">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  <span>Selecciona tu necesidad directa de salud o negocio:</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Toca la opción para ver formulación, precios oficiales con 40% OFF y agregar al carrito al instante:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {shoppingObjectives.map((step) => {
                  const isSelected = selectedObjectiveId === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => handleSelectObjective(step)}
                      className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between border ${
                        isSelected
                          ? "bg-white border-cyan-600 shadow-md ring-2 ring-cyan-500/20"
                          : "bg-white hover:bg-cyan-50/50 border-[#c8e4ed] shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{step.icon}</span>
                          <span className="font-bold text-xs text-[#082836]">{step.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-cyan-600 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">{step.benefit}</p>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#082836]">Bs {step.normalPrice}</span>
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {step.isCombo ? "Combo Ahorro" : `Socio 40%: Bs ${step.memberPrice}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Recommendation Card */}
              {activeRecommendation?.product && (
                <div className="p-4 rounded-2xl bg-white border-2 border-cyan-500 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeRecommendation.product.img}
                      alt={activeRecommendation.product.name}
                      className="w-14 h-14 object-contain rounded-xl bg-cyan-50 p-1.5 border border-[#c8e4ed]"
                    />
                    <div>
                      <div className="font-bold text-sm text-[#082836]">
                        {activeRecommendation.product.name}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Precio regular: <strong>Bs {activeRecommendation.product.normalPrice}</strong> · Socio 40% OFF:{" "}
                        <strong className="text-cyan-700 font-bold">Bs {activeRecommendation.product.memberPrice}</strong>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onAddToCart(activeRecommendation.product!.id)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Agregar al Carrito</span>
                  </button>
                </div>
              )}

              {activeRecommendation?.combo && (
                <div className="p-4 rounded-2xl bg-white border-2 border-amber-400 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeRecommendation.combo.img}
                      alt={activeRecommendation.combo.name}
                      className="w-14 h-14 object-contain rounded-xl bg-amber-50/50 p-1.5 border border-amber-200"
                    />
                    <div>
                      <div className="font-bold text-sm text-[#082836]">
                        {activeRecommendation.combo.name}
                      </div>
                      <div className="text-xs text-amber-800 font-bold mt-0.5">
                        Inversión: Bs {activeRecommendation.combo.comboPrice} {activeRecommendation.combo.profitPercentage ? `(${activeRecommendation.combo.profitPercentage}% Ganancias)` : "(40% OFF de por vida)"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onAddComboToCart(activeRecommendation.combo!.id)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <ShoppingCart className="w-4 h-4 fill-white" />
                    <span>Agregar al Carrito</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Consulta Libre (Chat Híbrido) */}
          {activeTab === "chat" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#f0f7fa] flex flex-col justify-between">
              <div className="space-y-4">
                {/* Quick chip buttons */}
                <div className="flex flex-wrap gap-1.5 pb-2 border-b border-[#c8e4ed]">
                  {[
                    "👥 Fundadores Julian & Mery",
                    "⚖️ Legalidad (NIT & SENASAG)",
                    "☕ Coffee Life (Cordyceps)",
                    "🦴 Colágeno Marino",
                    "🛡️ Inmune Plus",
                    "🌿 Fibernat Detox",
                    "🍫 Chocokids",
                    "💼 Combos Empresariales (87%)",
                    "👑 Membresía 250 Bs",
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessageWithText(chip)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-cyan-100 text-[#082836] text-[11px] font-semibold border border-[#c8e4ed] transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.sender === "ai" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#082836] to-cyan-700 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                        <Bot className="w-4 h-4 text-cyan-200" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed ${
                        m.sender === "user"
                          ? "bg-gradient-to-r from-[#0891b2] to-[#0284c7] text-white rounded-br-none shadow-md"
                          : "bg-white text-[#082836] border border-[#c8e4ed] rounded-bl-none shadow-xs"
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                      {m.recommendedProduct && (
                        <div className="mt-3 p-3 rounded-2xl bg-cyan-50/60 border border-[#c8e4ed] flex items-center justify-between gap-3 text-[#082836]">
                          <div className="flex items-center gap-2.5 truncate">
                            <img
                              src={m.recommendedProduct.img}
                              alt={m.recommendedProduct.name}
                              className="w-11 h-11 object-contain rounded-lg bg-white p-1 border border-[#c8e4ed] shrink-0"
                            />
                            <div className="truncate">
                              <div className="font-bold text-xs text-[#082836] truncate">
                                {m.recommendedProduct.name}
                              </div>
                              <div className="text-[11px] text-cyan-800 font-semibold">
                                Bs {m.recommendedProduct.normalPrice} · Socio: Bs {m.recommendedProduct.memberPrice}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => onAddToCart(m.recommendedProduct!.id)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Agregar</span>
                          </button>
                        </div>
                      )}
                      {m.recommendedCombo && (
                        <div className="mt-3 p-3 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between gap-3 text-[#082836]">
                          <div className="flex items-center gap-2.5 truncate">
                            <img
                              src={m.recommendedCombo.img}
                              alt={m.recommendedCombo.name}
                              className="w-11 h-11 object-contain rounded-lg bg-white p-1 border border-amber-200 shrink-0"
                            />
                            <div className="truncate">
                              <div className="font-bold text-xs text-amber-900 truncate">
                                {m.recommendedCombo.name}
                              </div>
                              <div className="text-[11px] text-amber-800 font-bold">
                                Total: Bs {m.recommendedCombo.comboPrice} {m.recommendedCombo.profitPercentage ? `(${m.recommendedCombo.profitPercentage}% Ganancia)` : "(40% OFF)"}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => onAddComboToCart(m.recommendedCombo!.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Agregar</span>
                          </button>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1.5 text-right font-mono">
                        {m.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-[#082836] text-white flex items-center justify-center">
                      <Bot className="w-4 h-4 text-cyan-300 animate-pulse" />
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-[#c8e4ed] flex items-center gap-1.5 text-xs text-slate-600 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce [animation-delay:0.4s]" />
                      <span className="ml-2 font-medium">Consultando catálogo oficial Team Life...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Tab 3: Fundadores & Legalidad */}
          {activeTab === "fundadores" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#f0f7fa]">
              <div className="p-5 rounded-2xl bg-white border border-[#c8e4ed] space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-600" />
                  <span>CEOs Fundadores de Team Life</span>
                </div>
                <h4 className="font-display font-black text-lg text-[#082836]">
                  Julian Rodriguez & Mery Ruiz
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {COMPANY_INFO.foundersProfile}
                </p>
                <div className="pt-2 text-xs font-bold text-cyan-700 italic">
                  "Juntos Todo Es Posible"
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-[#c8e4ed] space-y-1">
                  <div className="font-bold text-xs text-[#082836] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-600" />
                    <span>Registro SENASAG</span>
                  </div>
                  <p className="text-xs text-slate-600 font-mono">
                    Certificado No. 166/2025 (Santa Cruz)
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#c8e4ed] space-y-1">
                  <div className="font-bold text-xs text-[#082836] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                    <span>Impuestos Nacionales</span>
                  </div>
                  <p className="text-xs text-slate-600 font-mono">
                    NIT: 572065026 (Emite Factura)
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-[#0284c7] text-white space-y-1.5">
                <div className="font-bold text-xs">Misión Institucional</div>
                <p className="text-xs text-cyan-50 leading-relaxed">
                  {COMPANY_INFO.mission}
                </p>
              </div>
            </div>
          )}

          {/* Tab 4: Envíos & Cobertura en Bolivia */}
          {activeTab === "envios" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#f0f7fa]">
              <div className="p-4 rounded-2xl bg-white border border-[#c8e4ed] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-800">
                  <Truck className="w-4 h-4 text-cyan-600" />
                  <span>Envíos Asegurados a los 9 Departamentos</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  TEAM LIFE COMPANY despacha de manera formal con número de guía y seguro de carga a toda Bolivia:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  {["La Paz (24 hrs)", "Santa Cruz (24-48 hrs)", "Cochabamba (24 hrs)", "Oruro (24 hrs)", "Potosí (24-48 hrs)", "Chuquisaca (24-48 hrs)", "Tarija (48 hrs)", "Beni (48-72 hrs)", "Pando (72 hrs)"].map((dep, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-cyan-50/50 border border-[#c8e4ed] font-medium text-[#082836] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      <span>{dep}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-[#c8e4ed] flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-3 rounded-2xl border transition-colors cursor-pointer ${
                isRecording
                  ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                  : "bg-cyan-50/50 text-slate-600 hover:text-cyan-700 border-[#c8e4ed]"
              }`}
              title={isRecording ? "Detener grabación" : "Hablar por micrófono"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pregunta sobre los fundadores, Coffee Life, dosis, combos o la membresía..."
              className="flex-1 px-4 py-3 rounded-2xl bg-cyan-50/40 border border-[#c8e4ed] text-[#082836] placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-cyan-600 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-[#0284c7] hover:from-cyan-700 hover:to-cyan-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Consultar</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. COMPACT FLOATING WIDGET
  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] rounded-3xl bg-white/98 backdrop-blur-xl border border-[#c8e4ed] shadow-[0_20px_50px_-10px_rgba(8,40,54,0.18),0_0_0_1px_rgba(8,145,178,0.15)] p-4 sm:p-5 text-[#082836] animate-in slide-in-from-bottom-6 duration-300">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#c8e4ed]">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#082836] to-cyan-700 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4 text-cyan-200" />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="font-display font-black text-xs sm:text-sm text-[#082836] flex items-center gap-1.5">
              <span>Asesora Inteligente Híbrida</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-bold">
                Con Voz
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              {isPlaying ? (
                <span className="text-cyan-700 font-bold flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse" />
                  Hablando en voz alta...
                </span>
              ) : (
                <span>Respuestas y precios oficiales al instante</span>
              )}
            </div>
          </div>
        </div>

        {/* Audio & Window Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => speakText(currentSpokenText)}
            className="w-7 h-7 rounded-xl bg-cyan-50/60 hover:bg-cyan-100/60 text-slate-600 flex items-center justify-center cursor-pointer transition-colors border border-[#c8e4ed]"
            title="Escuchar recomendación con voz"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggleMute}
            className="w-7 h-7 rounded-xl bg-cyan-50/60 hover:bg-cyan-100/60 text-slate-600 flex items-center justify-center cursor-pointer transition-colors border border-[#c8e4ed]"
            title={speechMuted ? "Activar sonido" : "Silenciar"}
          >
            {speechMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-700" />}
          </button>
          <button
            onClick={onToggleExpand}
            className="w-7 h-7 rounded-xl bg-cyan-50/60 hover:bg-cyan-100/60 text-slate-600 flex items-center justify-center cursor-pointer transition-colors border border-[#c8e4ed]"
            title="Expandir a consulta completa"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-cyan-50/60 hover:bg-cyan-100/60 text-slate-600 flex items-center justify-center cursor-pointer border border-[#c8e4ed]"
            title="Ocultar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Spoken Speech Transcript Box */}
      <div className="my-2.5 p-2.5 rounded-2xl bg-[#f0f7fa] border border-[#c8e4ed] text-xs text-slate-700 leading-relaxed relative">
        <p className="font-normal italic">"{currentSpokenText}"</p>
      </div>

      {/* Quick Shopping Guide Buttons */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          Selecciona tu objetivo de salud:
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {shoppingObjectives.slice(0, 4).map((step) => (
            <button
              key={step.id}
              onClick={() => handleSelectObjective(step)}
              className="py-1.5 px-2.5 rounded-xl text-[11px] font-bold text-left transition-all cursor-pointer flex items-center gap-1.5 border bg-white hover:bg-cyan-50/60 text-[#082836] border-[#c8e4ed] hover:border-cyan-600"
            >
              <span>{step.icon}</span>
              <span className="truncate">{step.label}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          {shoppingObjectives.slice(4).map((step) => (
            <button
              key={step.id}
              onClick={() => handleSelectObjective(step)}
              className="py-1.5 px-2.5 rounded-xl text-[11px] font-bold text-left transition-all cursor-pointer flex items-center gap-1.5 border bg-amber-50/50 hover:bg-amber-100/50 text-amber-900 border-amber-200 hover:border-amber-400"
            >
              <span>{step.icon}</span>
              <span className="truncate">{step.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Recommended Product or Combo Card */}
      {activeRecommendation?.product && (
        <div className="mt-2.5 pt-2.5 border-t border-[#c8e4ed] flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="truncate">
            <div className="text-[11px] font-bold text-[#082836] truncate">
              {activeRecommendation.product.name}
            </div>
            <div className="text-[10px] text-slate-600">
              Bs {activeRecommendation.product.normalPrice} · Socio: Bs {activeRecommendation.product.memberPrice}
            </div>
          </div>
          <button
            onClick={() => onAddToCart(activeRecommendation.product!.id)}
            className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>
      )}

      {activeRecommendation?.combo && (
        <div className="mt-2.5 pt-2.5 border-t border-[#c8e4ed] flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="truncate">
            <div className="text-[11px] font-bold text-amber-900 truncate">
              {activeRecommendation.combo.name}
            </div>
            <div className="text-[10px] text-amber-800 font-bold">
              Total: Bs {activeRecommendation.combo.comboPrice} {activeRecommendation.combo.profitPercentage ? `(${activeRecommendation.combo.profitPercentage}% Ganancia)` : "(40% OFF permanente)"}
            </div>
          </div>
          <button
            onClick={() => onAddComboToCart(activeRecommendation.combo!.id)}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>
      )}

      {/* Footer Actions: Expand Chat & WhatsApp */}
      <div className="mt-2.5 pt-2 border-t border-[#c8e4ed] flex items-center justify-between text-[11px]">
        <button
          onClick={onToggleExpand}
          className="text-cyan-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Preguntar libremente a la IA</span>
          <ArrowRight className="w-3 h-3" />
        </button>

        <button
          onClick={() => {
            const msg = encodeURIComponent(
              "¡Hola! Deseo asesoría personalizada sobre los productos de Equipo Vida S.R.L. y los combos con descuento."
            );
            window.open(`https://wa.me/${vendedorWhatsapp}?text=${msg}`, "_blank");
          }}
          className="text-slate-500 hover:text-cyan-800 flex items-center gap-1 cursor-pointer font-medium"
        >
          <MessageCircle className="w-3.5 h-3.5 text-cyan-700" />
          <span>WhatsApp Asesor</span>
        </button>
      </div>
    </div>
  );
};
