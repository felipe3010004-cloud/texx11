import { Product } from "../models/types";

export interface ExtractedProductData {
  name: string;
  desc: string;
  normalPrice?: number;
  promoPrice?: number;
  img?: string;
  category?: string;
  productUrl?: string;
  sourceUrl: string;
}

export interface ExtractionResult {
  success: boolean;
  data: ExtractedProductData;
  notice?: string;
  isPartial: boolean;
}

/**
 * Validates whether a URL is a secure public HTTP/HTTPS URL and prevents SSRF
 */
export function isSafePublicUrl(rawUrl: string): { valid: boolean; reason?: string; sanitizedUrl?: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, reason: "La URL no puede estar vacía." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: "El formato de la URL no es válido." };
  }

  // Only allow http and https protocols
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, reason: "Únicamente se permiten protocolos seguros HTTP y HTTPS." };
  }

  const hostname = parsed.hostname.toLowerCase();

  // SSRF Protection: Block localhost, local domains, and private IP ranges
  const blockedHosts = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "local",
    "internal",
    "169.254.169.254", // Cloud metadata
    "metadata.google.internal",
  ];

  if (blockedHosts.includes(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return { valid: false, reason: "Por seguridad, no se permiten direcciones locales ni privadas (protección SSRF)." };
  }

  // Check IPv4 private ranges (10.x, 172.16-31.x, 192.168.x)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipMatch = hostname.match(ipv4Regex);
  if (ipMatch) {
    const oct1 = parseInt(ipMatch[1], 10);
    const oct2 = parseInt(ipMatch[2], 10);
    if (
      oct1 === 10 ||
      oct1 === 127 ||
      (oct1 === 172 && oct2 >= 16 && oct2 <= 31) ||
      (oct1 === 192 && oct2 === 168) ||
      (oct1 === 169 && oct2 === 254)
    ) {
      return { valid: false, reason: "Por seguridad, no se permiten rangos de IP privadas (protección SSRF)." };
    }
  }

  return { valid: true, sanitizedUrl: parsed.toString() };
}

/**
 * Extracts product information from a URL using client-side DOM parsing or fallback heuristics
 */
export async function extractProductFromUrl(url: string): Promise<ExtractionResult> {
  const validation = isSafePublicUrl(url);
  if (!validation.valid || !validation.sanitizedUrl) {
    throw new Error(validation.reason || "URL inválida");
  }

  const targetUrl = validation.sanitizedUrl;
  const parsed = new URL(targetUrl);

  // Generate fallback name from slug or pathname
  const pathSegments = parsed.pathname.split("/").filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1] || "";
  const fallbackName = lastSegment
    ? lastSegment
        .replace(/[-_]/g, " ")
        .replace(/\.(html?|php|aspx?)$/i, "")
        .replace(/^\d+/, "")
        .trim()
    : parsed.hostname;

  const defaultData: ExtractedProductData = {
    name: fallbackName
      ? fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1)
      : "Producto Importado",
    desc: `Información referenciada desde ${parsed.hostname}`,
    sourceUrl: targetUrl,
    productUrl: targetUrl,
    category: "Nutrición Celular",
    img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
  };

  try {
    // Attempt standard fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: true,
        isPartial: true,
        data: defaultData,
        notice: `El servidor devolvió estado ${response.status}. Se precargaron los datos de referencia para que los completes manualmente.`,
      };
    }

    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    // Extract OpenGraph / Meta tags
    const getMeta = (prop: string) => {
      const el =
        doc.querySelector(`meta[property="${prop}"]`) ||
        doc.querySelector(`meta[name="${prop}"]`);
      return el?.getAttribute("content")?.trim() || "";
    };

    const title =
      getMeta("og:title") ||
      getMeta("twitter:title") ||
      doc.querySelector("title")?.textContent?.trim() ||
      defaultData.name;

    const desc =
      getMeta("og:description") ||
      getMeta("twitter:description") ||
      getMeta("description") ||
      defaultData.desc;

    let img =
      getMeta("og:image") ||
      getMeta("twitter:image") ||
      doc.querySelector('img[id*="product"], img[class*="product"]')?.getAttribute("src") ||
      defaultData.img;

    // Resolve relative image URLs safely
    if (img && !img.startsWith("http://") && !img.startsWith("https://")) {
      try {
        img = new URL(img, targetUrl).toString();
      } catch {
        img = defaultData.img;
      }
    }

    // Attempt price extraction from meta or schema
    let price: number | undefined;
    const priceStr =
      getMeta("product:price:amount") ||
      getMeta("og:price:amount") ||
      getMeta("price");

    if (priceStr) {
      const parsedPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsedPrice) && parsedPrice > 0) {
        price = parsedPrice;
      }
    }

    return {
      success: true,
      isPartial: false,
      data: {
        name: title.replace(/\s+/g, " ").slice(0, 120),
        desc: desc.replace(/\s+/g, " ").slice(0, 300),
        normalPrice: price,
        promoPrice: price ? Math.round(price * 0.6) : undefined,
        img,
        category: "Nutrición Celular",
        productUrl: targetUrl,
        sourceUrl: targetUrl,
      },
      notice: "¡Datos extraídos con éxito desde la página de origen! Revisa y confirma antes de guardar.",
    };
  } catch (err: any) {
    // Expected CORS or network limitation on client-side requests
    return {
      success: true,
      isPartial: true,
      data: defaultData,
      notice:
        "Debido a las políticas de seguridad (CORS) del sitio externo, no fue posible extraer los metadatos de forma automática. Se han precargado los datos base y el enlace de referencia para que los completes.",
    };
  }
}
