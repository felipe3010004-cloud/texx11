import { productsModel } from "../models/productsModel";
import { combosModel } from "../models/combosModel";
import { Product, Combo, AiKnowledgeItem } from "../models/types";
import { db, firebase } from "../models/firebaseModel";
import { auditController } from "./auditController";

export interface AIResponse {
  reply: string;
  recommendedProduct?: Product;
  recommendedCombo?: Combo;
  matchedKnowledge?: AiKnowledgeItem;
}

export class AIController {
  private isSpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private cachedKnowledge: AiKnowledgeItem[] = [];
  private lastKnowledgeFetch: number = 0;

  // Retrieve published knowledge items from Firestore
  public async getPublishedKnowledge(forceRefresh: boolean = false): Promise<AiKnowledgeItem[]> {
    const now = Date.now();
    if (!forceRefresh && this.cachedKnowledge.length > 0 && now - this.lastKnowledgeFetch < 60000) {
      return this.cachedKnowledge;
    }

    try {
      const snap = await db.collection("ai_knowledge").where("status", "==", "publicado").get();
      const list: AiKnowledgeItem[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        list.push({
          id: doc.id,
          title: d.title || "",
          category: d.category || "general",
          content: d.content || "",
          status: "publicado",
          tags: d.tags || [],
          createdAt: d.createdAt ? d.createdAt.toDate?.() || d.createdAt : new Date(),
          updatedAt: d.updatedAt ? d.updatedAt.toDate?.() || d.updatedAt : new Date(),
          author: d.author || "Superadministrador",
        });
      });
      this.cachedKnowledge = list;
      this.lastKnowledgeFetch = now;
      return list;
    } catch (e) {
      console.warn("Nota al leer ai_knowledge de Firestore:", e);
      return this.cachedKnowledge;
    }
  }

  // Superadmin CRUD for knowledge items
  public async getAllKnowledgeItems(): Promise<AiKnowledgeItem[]> {
    try {
      const snap = await db.collection("ai_knowledge").orderBy("updatedAt", "desc").limit(50).get();
      const list: AiKnowledgeItem[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        list.push({
          id: doc.id,
          title: d.title || "",
          category: d.category || "general",
          content: d.content || "",
          status: d.status || "publicado",
          tags: d.tags || [],
          createdAt: d.createdAt ? d.createdAt.toDate?.() || d.createdAt : new Date(),
          updatedAt: d.updatedAt ? d.updatedAt.toDate?.() || d.updatedAt : new Date(),
          author: d.author || "Superadministrador",
        });
      });
      return list;
    } catch (e) {
      console.warn("Error leyendo base de conocimiento completa:", e);
      return [
        {
          id: "k-default-1",
          title: "Legalidad, NIT y Registro Sanitario SENASAG",
          category: "legalidad",
          content:
            "TEAM LIFE COMPANY S.R.L. cuenta con NIT 572065026 (Régimen General, emite Factura Oficial en cada compra), Registro Sanitario SENASAG No. 166/2025 emitido en Santa Cruz el 17 de Febrero de 2025 y Matrícula SEPREC vigente.",
          status: "publicado",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "k-default-2",
          title: "Plan de Carrera y Afiliación Básica (Kit Bs 250)",
          category: "negocio",
          content:
            "El Kit de Bienvenida oficial cuesta Bs 250 e incluye muestras bioactivas, bolígrafo ejecutivo y otorga 40% de descuento vitalicio en toda la línea. Por cada nuevo afiliado directo el socio recibe Bs 150 en mano.",
          status: "publicado",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "k-default-3",
          title: "Política de Despachos y Envíos a los 9 Departamentos",
          category: "protocolos",
          content:
            "Todos los pedidos confirmados por WhatsApp se despachan en menos de 24 horas hábiles hacia La Paz, Santa Cruz, Cochabamba, Oruro, Potosí, Chuquisaca, Tarija, Beni y Pando con guía oficial de encomienda.",
          status: "publicado",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }
  }

  public async saveKnowledgeItem(item: {
    id?: string;
    title: string;
    category: AiKnowledgeItem["category"];
    content: string;
    status: "publicado" | "borrador" | "desactivado";
  }): Promise<string> {
    const data = {
      title: item.title.trim(),
      category: item.category,
      content: item.content.trim(),
      status: item.status,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (item.id) {
      await db.collection("ai_knowledge").doc(item.id).set(data, { merge: true });
      await auditController.logEvent(
        "Modificación de artículo de conocimiento IA",
        "ia",
        `Artículo "${item.title}" actualizado con estado "${item.status}".`
      );
      this.lastKnowledgeFetch = 0; // Invalidate cache
      return item.id;
    } else {
      const docRef = await db.collection("ai_knowledge").add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        author: "Superadministrador",
      });
      await auditController.logEvent(
        "Nuevo artículo de conocimiento IA",
        "ia",
        `Artículo "${item.title}" creado en categoría ${item.category} (${item.status}).`
      );
      this.lastKnowledgeFetch = 0;
      return docRef.id;
    }
  }

  public async deleteKnowledgeItem(id: string, title?: string): Promise<void> {
    await db.collection("ai_knowledge").doc(id).delete();
    await auditController.logEvent(
      "Eliminación de artículo de conocimiento IA",
      "ia",
      `Artículo ID: ${id} ("${title || "Sin título"}") eliminado del centro de conocimiento.`
    );
    this.lastKnowledgeFetch = 0;
  }

  // Generate grounded response connecting to Gemini via secure backend
  public async generateResponse(
    prompt: string,
    history?: Array<{ role: string; text: string }>
  ): Promise<AIResponse> {
    const products = productsModel.getAll();
    const combos = combosModel.getAll();
    const getP = (id: string) => products.find((x) => x.id === id);
    const getC = (id: string) => combos.find((x) => x.id === id);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, history }),
      });

      if (res.ok) {
        const data = await res.json();
        const matchedProd = data.recommendedProductId ? getP(data.recommendedProductId) : undefined;
        const matchedCombo = data.recommendedComboId ? getC(data.recommendedComboId) : undefined;
        return {
          reply: data.reply,
          recommendedProduct: matchedProd,
          recommendedCombo: matchedCombo,
        };
      } else {
        const errorData = await res.json().catch(() => null);
        console.error("Error devuelto por el servidor de IA:", errorData);
        return {
          reply: errorData?.reply || "No se pudo obtener respuesta del servicio de inteligencia artificial. Por favor intenta nuevamente.",
        };
      }
    } catch (err) {
      console.error("Conexión con /api/ai/chat falló:", err);
      return {
        reply: "No se pudo conectar con el servidor del asistente en este momento. Por favor verifica tu conexión a internet o intenta de nuevo.",
      };
    }
  }

  public speak(text: string, onStart?: () => void, onEnd?: () => void) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    this.stopSpeaking();

    const clean = text
      .replace(/[*_#`~]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/Bs\s?(\d+)/gi, "$1 bolivianos")
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "es-ES";
    utterance.rate = 0.98;
    utterance.pitch = 1.02;

    const voices = window.speechSynthesis.getVoices();
    const spanishVoice =
      voices.find(
        (v) =>
          v.lang.startsWith("es") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Sabina") ||
            v.name.includes("Helena") ||
            v.name.includes("Paulina"))
      ) || voices.find((v) => v.lang.startsWith("es"));

    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }
}

export const aiController = new AIController();
