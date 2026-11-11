import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load .env with override so user-provided keys take precedence
dotenv.config({ override: true });

const OFFICIAL_KNOWLEDGE_CONTEXT = `
=== INFORMACIÓN OFICIAL Y VERIFICADA DE TEAM LIFE (EQUIPO VIDA S.R.L.) ===

EMPRESA Y RESPALDO LEGAL:
- Razón Social: TEAM LIFE COMPANY S.R.L.
- Nombre Comercial: Equipo Vida S.R.L.
- NIT: 572065026 (Régimen General, emite Factura Oficial en cada compra).
- SENASAG: Certificado de Registro Sanitario No. 166/2025 emitido en Santa Cruz el 17 de Febrero de 2025.
- SEPREC: Matrícula de Comercio Vigente en Bolivia.
- Fundadores: Julian Rodriguez y Mery Ruiz (más de 20 años en medicina convencional y nutrición celular; más de 10 años en Network Marketing).
- Central de Pedidos WhatsApp: +591 78945612.
- Despachos y Envíos: Cobertura garantizada y envíos en menos de 24 horas hábiles a los 9 departamentos de Bolivia (La Paz, Santa Cruz, Cochabamba, Oruro, Potosí, Chuquisaca, Tarija, Beni y Pando) con guía oficial.

CATÁLOGO DE FORMULACIONES BIOACTIVAS OFICIALES (5 PRODUCTOS):

1. Choco Kids+ Nutrition (ID: tl-chocokids)
- Categoría: Nutrición Celular Infantil.
- Presentación: Caja de sobres individuales de 8g c/u.
- Precios oficiales: Regular Bs 409 | Socio 40% OFF: Bs 245.
- Ingredientes oficiales: Proteína Aislada de Soja, Avena en Polvo, Cacao Alcalino, Mix de Vitaminas y Minerales (Calcio, Hierro Aminoquelado, Zinc), Omega 3 DHA/EPA, L-Arginina, Psyllium, Yogurt en Polvo (Probióticos y Prebióticos), Miel en Polvo y Harina de Linaza.
- ¿CONTIENE AZÚCAR?: NO CONTIENE AZÚCAR REFINADA. Está formulado y endulzado naturalmente con miel en polvo y el aporte natural de la avena.
- Para qué sirve y Beneficios: Estimula el crecimiento corporal y la estatura (gracias a L-Arginina y Zinc), apoya el desarrollo cerebral, la memoria y la agudeza visual (Omega 3 DHA), alivia trastornos como el TDAH y la ansiedad escolar infantil, fortalece huesos, dientes y defensas inmunológicas con probióticos activos.

2. Coffee Life Premium (Ganoderma + Cordyceps Sinensis) (ID: tl-coffeelife)
- Categoría: Energía & Foco Celular.
- Presentación: Caja de 30 sachets de 4.5g c/u.
- Precios oficiales: Regular Bs 359 | Socio 40% OFF: Bs 215.
- Ingredientes oficiales: Café Orgánico de Altura, Cordyceps Sinensis, Ganoderma Lucidum y Colágeno Marino Hidrolizado.
- Para qué sirve y Beneficios: Aumenta la oxigenación celular en sangre y la capacidad pulmonar (apoyo para asma, bronquitis), mejora la función renal y la vitalidad sexual, brinda neuroprotección (prevención de Alzheimer y Parkinson), aporta energía celular limpia sin provocar taquicardia ni reflujo gástrico.

3. Colágeno Marino Hidrolizado (Fórmula Reforzada) (ID: tl-colageno)
- Categoría: Nutrición Celular & Articular.
- Presentación: Caja de 30 sobres individuales de 10g c/u (300g peso neto).
- Precios oficiales: Regular Bs 342 | Socio 40% OFF: Bs 205.
- Ingredientes oficiales: Colágeno Marino Hidrolizado de absorción rápida, Ácido Hialurónico, Coenzima Q10, Mix de Vitaminas y Minerales, Pulpa de Açaí Liofilizado.
- Para qué sirve y Beneficios: Regenera articulaciones, cartílagos, ligamentos y tendones; combate el dolor de rodillas y articulaciones; tonifica la piel y combate la flacidez y celulitis; fortalece cabello, uñas y el humor vítreo del ojo.

4. Inmune Plus Multi-Defensas Activas (ID: tl-inmune)
- Categoría: Inmunidad & Defensas.
- Presentación: Caja de 30 sobres individuales de 7g c/u (210g peso neto).
- Precios oficiales: Regular Bs 409 | Socio 40% OFF: Bs 245.
- Ingredientes oficiales: Noni Deshidratado en Polvo, Guanábana, Camu Camu (alta concentración de Vitamina C quelada), Flor de Jamaica, Jengibre, Cúrcuma y Aloe Vera.
- Para qué sirve y Beneficios: Fortalece el sistema inmunológico; acción de choque antiviral y antibacteriana frente a gripe, tos y afecciones bronquiales; ayuda a controlar la hipertensión; depura el hígado graso y previene enfermedades vasculares.

5. Fibernat Fibra Soluble & Detox Intestinal (ID: tl-fibernat)
- Categoría: Digestión & Detox Intestinal.
- Presentación: Caja de sobres individuales de 6g c/u (Contenido Neto 50g).
- Precios oficiales: Regular Bs 159 | Socio 40% OFF: Bs 95.
- Ingredientes oficiales: Psyllium Husk orgánico, Moringa andina, Té Verde, Regaliz, Manzana Verde Liofilizada, Citrato de Magnesio y Pitahaya.
- Para qué sirve y Beneficios: Normaliza las deposiciones y combate el estreñimiento sin generar cólicos ni irritación; regenera la flora intestinal con prebióticos; favorece un vientre plano y desinflamado en 48 horas; apoya en la regulación de glucosa y colesterol.

COMBOS EMPRESARIALES Y AFILIACIÓN:
- Kit de Bienvenida (Afiliación Básica 40% OFF) (ID: kit-de-bienvenida): Precio Bs 250. Incluye muestras oficiales de Fibernat, Inmune Plus y Colágeno, bolígrafo ejecutivo grabado y manual. Otorga 40% de descuento vitalicio sin compras mínimas mensuales obligatorias. Comisión de Bs 150 en mano por cada nuevo afiliado directo.
- Combo 1 Empresarial (6 Productos) (ID: combo-1-empresarial): Precio Bs 1.360 (Bs 1.125 comisionables). Incluye 2 Fibernat, 2 Inmune Plus y 2 Colágeno. 60% de ganancia en mano.
- Combo 2 Empresarial (12 Productos) (ID: combo-2-empresarial): Precio Bs 2.500 (Bs 2.057 comisionables). Incluye 4 Fibernat, 3 Inmune Plus, 4 Colágeno y 1 Coffee Life. 73% de rentabilidad.
- Combo 3 Empresarial (25 Productos) (ID: combo-3-empresarial): Precio Bs 4.650 (Bs 3.806 comisionables). Incluye 10 Fibernat, 6 Inmune Plus, 7 Colágeno y 2 Coffee Life. 87% de ganancia y activa el Bono Impulso Plus de Bs 1.500.
`;

const SYSTEM_INSTRUCTION = `
Eres la Asesora Oficial de Inteligencia Artificial de "TEAM LIFE | Equipo Vida S.R.L." en Bolivia.

Tus directrices OBLIGATORIAS son:
1. VERACIDAD ABSOLUTA: Responde ÚNICAMENTE con la información oficial verificada que se te proporciona en el contexto. No inventes ingredientes, precios, componentes ni certificaciones.
2. RESPUESTA DIRECTA Y PRECISA: Responde exactamente a la pregunta que hace el cliente. Sé concisa, amable, profesional y natural en español.
3. PREGUNTAS ESPECÍFICAS DE PRODUCTOS:
   - Si te preguntan si un producto contiene azúcar (por ejemplo "¿Contiene azúcar el Choco Kid?"), responde directamente indicando con claridad que NO contiene azúcar refinada, y que está formulado y endulzado naturalmente con miel en polvo y avena.
   - Si te preguntan qué ingredientes tiene un producto, enumera sus ingredientes oficiales específicos.
   - Si te preguntan el precio, indica el precio regular oficial en Bolivianos (Bs) y la opción con 40% de descuento para socios.
4. CERO VOLCADO INNECESARIO DE CATÁLOGO: NO enumeres todos los demás productos, ni precios de otros artículos, ni combos, a menos que el cliente pregunte explícitamente por el catálogo completo o las promociones.
5. RECONOCIMIENTO DE LÍMITES: Si la pregunta trata sobre un ingrediente, producto o dato que NO figure en la información oficial provista, responde honestamente indicando que no tienes información oficial confirmada para ese dato en particular, sugiriendo consultar con un asesor de la empresa o compartir la etiqueta. No inventes datos.
6. ORIENTACIÓN PRUDENTE EN SALUD: Si el usuario consulta sobre enfermedades, diagnósticos o afecciones médicas de gravedad (como cáncer, diabetes, artritis severa, etc.), ofrece una orientación prudente y responsable. Aclara que las formulaciones de TEAM LIFE son suplementos nutricionales bioactivos de apoyo al bienestar celular y nutricional, NO son medicamentos milagrosos ni sustituyen un tratamiento o diagnóstico médico profesional. Recomienda consultar siempre con su médico especialista.
7. FORMATO DE RESPUESTA: Responde en texto conversacional fluido, sin markdown excesivo.
`;

export interface ChatResponse {
  reply: string;
  recommendedProductId?: string | null;
  recommendedComboId?: string | null;
}

// Map user prompt to relevant product ID if clearly focused
function detectProductFocus(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes("choco") || t.includes("kid") || t.includes("niño") || t.includes("infantil") || t.includes("crecimiento")) {
    return "tl-chocokids";
  }
  if (t.includes("cordyceps") || t.includes("coffee") || t.includes("cafe") || t.includes("café") || t.includes("ganoderma")) {
    return "tl-coffeelife";
  }
  if (t.includes("colageno") || t.includes("colágeno") || t.includes("articulac") || t.includes("rodilla") || t.includes("piel")) {
    return "tl-colageno";
  }
  if (t.includes("inmune") || t.includes("defens") || t.includes("noni") || t.includes("gripe") || t.includes("guanabana") || t.includes("camu")) {
    return "tl-inmune";
  }
  if (t.includes("fibernat") || t.includes("fibra") || t.includes("digest") || t.includes("colon") || t.includes("estreñ") || t.includes("vientre") || t.includes("pitahaya")) {
    return "tl-fibernat";
  }
  return null;
}

function detectComboFocus(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes("combo 3") || t.includes("4650") || t.includes("25 prod")) return "combo-3-empresarial";
  if (t.includes("combo 2") || t.includes("2500") || t.includes("12 prod")) return "combo-2-empresarial";
  if (t.includes("combo 1") || t.includes("1360") || t.includes("6 prod")) return "combo-1-empresarial";
  if (t.includes("afiliar") || t.includes("kit") || t.includes("membresia") || t.includes("250")) return "kit-de-bienvenida";
  return null;
}

export async function generateGroundedChatResponse(
  prompt: string,
  history?: Array<{ role: string; text: string }>
): Promise<ChatResponse> {
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    return { reply: "Por favor escribe tu consulta para poder orientarte." };
  }

  const focusedProdId = detectProductFocus(trimmedPrompt);
  const focusedComboId = detectComboFocus(trimmedPrompt);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.error("[Google Gemini Error] HTTP Code: 401 | Message: GEMINI_API_KEY no configurada en el servidor.");
    return {
      reply: "[Error de Google Gemini - Código HTTP 401]: GEMINI_API_KEY no está configurada en las variables de entorno del servidor.",
      recommendedProductId: focusedProdId,
      recommendedComboId: focusedComboId,
    };
  }

  // Diagnostic ping check: if user is verifying connection explicitly
  const isDiagnosticCheck =
    trimmedPrompt.toLowerCase().includes("conexión gemini ok") ||
    trimmedPrompt.toLowerCase().includes("conexion gemini ok");

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
        timeout: 15000,
      },
    });

    const conversationContext = history && history.length > 0
      ? "\n\nHISTORIAL RECIENTE DE LA CONVERSACIÓN:\n" +
        history
          .slice(-6)
          .map((m) => `${m.role === "user" ? "Cliente" : "Asistente"}: ${m.text}`)
          .join("\n")
      : "";

    const fullPrompt = `${OFFICIAL_KNOWLEDGE_CONTEXT}
${conversationContext}

Pregunta del Cliente: "${trimmedPrompt}"

Instrucción: Responde en español de forma breve, concisa y directa a la pregunta del cliente basada exclusivamente en la información oficial. No agregues listas completas de otros productos ni combos salvo que el cliente lo pida.`;

    // Candidate models to query: prioritized with fast, accurate production flash models
    const candidateModels = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let responseText: string | null = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await ai.models.generateContent({
            model,
            contents: isDiagnosticCheck ? trimmedPrompt : fullPrompt,
            config: isDiagnosticCheck
              ? undefined
              : {
                  systemInstruction: SYSTEM_INSTRUCTION,
                  temperature: 0.2,
                },
          });

          if (result && result.text) {
            responseText = result.text.trim();
            break;
          }
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || "N/A";
          const rawMsg = err?.message || String(err);
          const safeMsg = rawMsg.replace(/AIza[0-9A-Za-z-_]{35}|AQ\.[0-9A-Za-z-_]{40,}/g, "[REDACTED_KEY]");
          console.error(`[Google Gemini API Error] Model: ${model} | Attempt: ${attempt} | HTTP Code: ${status} | Message: ${safeMsg}`);
          
          // Retry once on 503 or 429
          if (attempt === 1 && (status === 503 || status === 429)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            break;
          }
        }
      }

      if (responseText) {
        break;
      }
    }

    if (responseText) {
      return {
        reply: responseText,
        recommendedProductId: isDiagnosticCheck ? null : focusedProdId,
        recommendedComboId: isDiagnosticCheck ? null : focusedComboId,
      };
    } else {
      const status = lastError?.status || lastError?.code || 500;
      const rawMsg = lastError?.message || (typeof lastError === "object" ? JSON.stringify(lastError) : String(lastError));
      const safeMsg = rawMsg.replace(/AIza[0-9A-Za-z-_]{35}|AQ\.[0-9A-Za-z-_]{40,}/g, "[REDACTED_KEY]");

      console.error(`[Google Gemini Final Error] HTTP Code: ${status} | Message: ${safeMsg}`);

      return {
        reply: `[Error de Google Gemini - Código HTTP ${status}]: ${safeMsg}`,
        recommendedProductId: focusedProdId,
        recommendedComboId: focusedComboId,
      };
    }
  } catch (error: any) {
    const status = error?.status || error?.code || 500;
    const rawMsg = error?.message || String(error);
    const safeMsg = rawMsg.replace(/AIza[0-9A-Za-z-_]{35}|AQ\.[0-9A-Za-z-_]{40,}/g, "[REDACTED_KEY]");

    console.error(`[Google Gemini Fatal Error] HTTP Code: ${status} | Message: ${safeMsg}`);

    return {
      reply: `[Error de Conexión Gemini - Código HTTP ${status}]: ${safeMsg}`,
      recommendedProductId: focusedProdId,
      recommendedComboId: focusedComboId,
    };
  }
}
