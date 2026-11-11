export interface Product {
  id: string;
  name: string;
  normalPrice: number;
  memberPrice?: number;
  promoPrice?: number;
  discountPercentage?: number;
  desc: string;
  longDesc?: string;
  img: string;
  galleryImages?: string[];
  category?: string;
  isFeatured?: boolean;
  ingredients?: string[];
  presentation?: string;
  benefits?: string[];
  productUrl?: string;
  checkoutUrl?: string;
  sourceUrl?: string;
  additionalInfo?: string;
  status?: "publicado" | "oculto" | "desactivado";
  promoStartDate?: string;
  promoEndDate?: string;
  updatedAt?: any;
}

export interface Combo {
  id: string;
  name: string;
  comboPrice: number;
  promoPrice?: number;
  desc: string;
  img: string;
  includedProducts?: string[];
  includedComponents?: { name: string; quantity: number }[];
  benefits?: string[];
  isBusinessCombo?: boolean;
  profitPercentage?: number;
  commissionable?: number;
  comboUrl?: string;
  status?: "publicado" | "oculto" | "desactivado";
  additionalInfo?: string;
  promoStartDate?: string;
  promoEndDate?: string;
  updatedAt?: any;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isCombo: boolean;
  img?: string;
}

export interface OrderItemRecord {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  isCombo?: boolean;
}

export type OrderStatus = "pendiente" | "confirmado" | "rechazado" | "cancelado" | "entregado";

export interface OrderStateHistoryItem {
  id?: string;
  estadoAnterior: OrderStatus;
  estadoNuevo: OrderStatus;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioRol: "admin" | "vendedor";
  fecha: any;
  motivo?: string;
}

export type StaticQrPaymentStatus = "PENDIENTE" | "PENDIENTE_VERIFICACION" | "VERIFICADO" | "RECHAZADO";

export interface StaticQrConfig {
  activo: boolean;
  qrImageUrl: string;
  banco: string;
  titular: string;
  numeroCuenta: string;
  tipoCuenta?: string;
  instrucciones?: string;
  ultimaActualizacion?: any;
  actualizadoPor?: {
    uid: string;
    nombre: string;
    email: string;
  };
}

export interface ComprobanteQrRecord {
  id: string;
  pedidoId: string;
  codigoPedido?: string;
  clienteId?: string;
  clienteUid?: string;
  clienteNombre: string;
  clienteCelular: string;
  vendedorId?: string | null;
  vendedorNombre?: string | null;
  monto: number;
  nombreArchivo: string;
  nombreArchivoOriginal?: string;
  rutaAlmacenamiento: string;
  rutaStorage?: string;
  urlArchivo: string;
  archivoUrl?: string;
  tipoArchivo: string;
  tamanoBytes: number;
  fechaEnvio: any;
  estado: StaticQrPaymentStatus;
  revisadoPor?: {
    uid: string;
    nombre: string;
    email: string;
    rol: "admin" | "vendedor";
  } | null;
  fechaRevision?: any;
  motivoRechazo?: string;
  version?: number;
}

export interface OrderRecord {
  id?: string;
  clienteUid?: string;
  clienteNombre: string;
  clienteCelular: string;
  departamento: string;
  pais?: string;
  productos?: { nombre: string; cantidad: number; precioUnitario: number; isCombo?: boolean }[];
  items?: OrderItemRecord[];
  total: number;
  vendedorId?: string | null;
  vendedorNombre?: string | null;
  estado: OrderStatus;
  fecha: any;
  historialEstados?: OrderStateHistoryItem[];
  ultimoMotivo?: string;
  motivoRechazo?: string;
  motivoCancelacion?: string;
  actualizadoPor?: {
    uid: string;
    nombre: string;
    email: string;
    rol: "admin" | "vendedor";
  };
  fechaActualizacion?: any;
  metodoPago?: "pagosya" | "qr_estatico" | "whatsapp";
  pagoPagosya?: {
    checkoutId?: string;
    estado: PagosyaStatus;
    monto?: number;
    ambiente?: PagosyaEnvironment;
    qrImageUrl?: string;
    fechaPago?: any;
    verificadoPorApi?: boolean;
  };
  pagoQrEstatico?: {
    estado: StaticQrPaymentStatus;
    ultimoComprobanteId?: string;
    ultimoComprobanteUrl?: string;
    tipoArchivo?: string;
    nombreArchivo?: string;
    tamanoBytes?: number;
    fechaEnvio?: any;
    fechaRevision?: any;
    revisadoPor?: {
      uid: string;
      nombre: string;
      email: string;
      rol: "admin" | "vendedor";
    };
    motivoRechazo?: string;
    historialComprobantes?: ComprobanteQrRecord[];
  };
}

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  tag?: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  location?: string;
  rating: number;
  text: string;
  date: string;
}

export interface CompanyInfo {
  name: string;
  commercialName: string;
  nit: string;
  senasag: string;
  seprec: string;
  founders: string;
  foundersProfile: string;
  mission: string;
  vision: string;
  values: string;
  defaultWhatsapp: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  actionLabel?: string;
  onAction?: () => void;
}

export type MemberStatus = "pendiente" | "autorizado" | "no_autorizado" | "suspendido" | "inactivo";

export interface MemberUser {
  id: string;
  nombreCompleto: string;
  email: string;
  phone: string; // e.g. "59172019482"
  countryCode?: string;
  role: "admin" | "vendedor";
  status: MemberStatus;
  clics?: number;
  totalVentas?: number;
  notasAdmin?: string;
  termsAccepted?: boolean;
  fechaRegistro?: any;
  updatedAt?: any;
}

export interface AiKnowledgeItem {
  id: string;
  title: string;
  category: "productos" | "negocio" | "legalidad" | "faq" | "protocolos" | "general";
  content: string;
  status: "publicado" | "borrador" | "desactivado";
  tags?: string[];
  createdAt: any;
  updatedAt: any;
  author?: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  category: "miembros" | "catalogo" | "ia" | "pedidos" | "pagos" | "sistema";
  details: string;
  user: string;
  timestamp: any;
}

// ==========================================
// PAGOSYA MULTI-ENVIRONMENT & CHECKOUT TYPES
// ==========================================

export type PagosyaEnvironment = "sandbox" | "production";

export type PagosyaStatus = "pending" | "completed" | "cancelled" | "expired" | "failed" | string;

export interface PagosyaQrDetails {
  data_url?: string;
  base64?: string;
  branded?: boolean;
}

export interface PagosyaQrResponse {
  checkout_id?: string;
  id?: string;
  order_id: string;
  status: PagosyaStatus;
  livemode: boolean;
  qr_code?: string;
  qr_image?: string;
  embedded_enabled?: boolean;
  qr?: PagosyaQrDetails;
  expires_at?: string;
  environment?: PagosyaEnvironment;
  warning?: string;
  checkout_url?: string;
  status_url?: string;
  completed_at?: string;
}

export interface PagosyaCheckoutRecord {
  id?: string;
  orderId: string;
  checkoutId: string;
  monto: number;
  moneda: string;
  cliente?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  items?: {
    id: string;
    nombre: string;
    cantidad: number;
    precio: number;
    isCombo: boolean;
  }[];
  estado: PagosyaStatus;
  livemode: boolean;
  ambiente: PagosyaEnvironment;
  fechaCreacion?: any;
  expiraEn?: any;
  fechaConfirmacion?: any;
  qrImageUrl?: string;
  checkoutUrl?: string;
  statusUrl?: string;
}

export interface PagosyaCreateCheckoutPayload {
  amount: number;
  currency?: string;
  order_id: string;
  success_url?: string;
  cancel_url?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
  expiration_minutes?: number;
}
