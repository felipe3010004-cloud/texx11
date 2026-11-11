import React, { useState, useEffect } from "react";
import { OrderRecord, MemberUser, MemberStatus, OrderStatus, ComprobanteQrRecord, StaticQrPaymentStatus } from "../models/types";
import { db, firebase } from "../models/firebaseModel";
import { authController } from "../controllers/authController";
import { orderController } from "../controllers/orderController";
import { staticQrController } from "../controllers/staticQrController";
import { OrderDetailModalView } from "./OrderDetailModalView";
import { ComprobanteReviewModalView } from "./ComprobanteReviewModalView";
import {
  LayoutDashboard,
  ShoppingBag,
  Share2,
  Copy,
  Check,
  TrendingUp,
  X,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Search,
  ExternalLink,
  Menu,
  ShieldCheck,
  MessageSquare,
  QrCode,
  DollarSign,
  FileText,
  Eye,
  CheckCircle,
} from "lucide-react";

interface VendorPanelViewProps {
  isOpen: boolean;
  onClose: () => void;
  vendorUid: string;
  vendorEmail: string;
  onLogout: () => void;
}

type VendorTab = "resumen" | "pedidos" | "verificacion_qr" | "herramientas";

export const VendorPanelView: React.FC<VendorPanelViewProps> = ({
  isOpen,
  onClose,
  vendorUid,
  vendorEmail,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<VendorTab>("resumen");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clics, setClics] = useState<number>(0);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);
  const [memberData, setMemberData] = useState<MemberUser | null>(null);

  // Filters for orders
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");

  // Comprobantes QR states
  const [comprobantes, setComprobantes] = useState<ComprobanteQrRecord[]>([]);
  const [selectedComprobante, setSelectedComprobante] = useState<ComprobanteQrRecord | null>(null);
  const [isComprobanteModalOpen, setIsComprobanteModalOpen] = useState(false);
  const [comprobanteStatusFilter, setComprobanteStatusFilter] = useState<string>("todos");
  const [comprobanteSearch, setComprobanteSearch] = useState<string>("");

  // Order Detail Modal state
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const affiliateUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${vendorUid}`;
  const rawPhone = memberData?.phone || "";
  const waUrl = rawPhone ? `https://wa.me/${rawPhone}` : "";
  const memberStatus: MemberStatus = memberData?.status || "pendiente";
  const isAuthorized = memberStatus === "autorizado";

  useEffect(() => {
    if (isOpen) {
      loadVendorData();
    }
  }, [isOpen, vendorUid]);

  const loadVendorData = async () => {
    setLoading(true);
    try {
      // 1. Cargar datos del vendedor
      const user = await authController.getSellerById(vendorUid);
      if (user) {
        setMemberData(user);
        setClics(user.clics || 0);
      } else {
        const userDoc = await db.collection("users").doc(vendorUid).get();
        if (userDoc.exists) {
          const d = userDoc.data()!;
          const data: MemberUser = {
            id: vendorUid,
            nombreCompleto: d.nombreCompleto || d.fullName || "Distribuidor",
            email: d.email || vendorEmail,
            phone: d.phone || "",
            countryCode: d.countryCode || "591",
            role: "vendedor",
            status: d.status || "pendiente",
            clics: d.clics || 0,
            totalVentas: d.totalVentas || 0,
            notasAdmin: d.notasAdmin || "",
            fechaRegistro: d.createdAt ? d.createdAt.toDate?.() || d.createdAt : new Date(),
          };
          setMemberData(data);
          setClics(d.clics || 0);
        }
      }

      // 2. Cargar exclusivamente pedidos que correspondan a este vendedor
      const vendorOrders = await orderController.getOrdersByVendor(vendorUid);
      setOrders(vendorOrders);

      // 3. Cargar comprobantes QR exclusivamente de pedidos asignados a este vendedor
      const vendorComprobantes = await staticQrController.getComprobantes({ vendorUid });
      setComprobantes(vendorComprobantes);

      // Si el modal de comprobante está abierto, refrescar el seleccionado
      if (selectedComprobante) {
        const updatedComp = vendorComprobantes.find((c) => c.id === selectedComprobante.id);
        if (updatedComp) setSelectedComprobante(updatedComp);
      }

      // Si el modal de detalle está abierto, refrescar el seleccionado
      if (selectedOrder) {
        const updated = vendorOrders.find((o) => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (e) {
      console.warn("Aviso carga datos vendedor:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!isAuthorized) return;
    navigator.clipboard.writeText(affiliateUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyWa = () => {
    if (!isAuthorized || !waUrl) return;
    navigator.clipboard.writeText(waUrl);
    setCopiedWa(true);
    setTimeout(() => setCopiedWa(false), 2500);
  };

  const handleOpenOrderDetail = (order: OrderRecord) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  if (!isOpen) return null;

  // KPIs
  const totalOrdersCount = orders.length;
  const pendingOrders = orders.filter((o) => o.estado === "pendiente");
  const confirmedOrders = orders.filter((o) => o.estado === "confirmado");
  const rejectedOrders = orders.filter((o) => o.estado === "rechazado");
  const cancelledOrders = orders.filter((o) => o.estado === "cancelado");

  const totalSalesBs = confirmedOrders.reduce((acc, o) => acc + o.total, 0);
  const conversionRate = clics > 0 ? ((totalOrdersCount / clics) * 100).toFixed(1) : "0";

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "todos" ? true : o.estado === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      o.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.clienteCelular.includes(searchQuery) ||
      (o.id && o.id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // KPIs comprobantes QR
  const pendingComprobantesCount = comprobantes.filter(
    (c) => c.estado === "PENDIENTE_VERIFICACION"
  ).length;
  const verifiedComprobantesCount = comprobantes.filter(
    (c) => c.estado === "VERIFICADO"
  ).length;
  const rejectedComprobantesCount = comprobantes.filter(
    (c) => c.estado === "RECHAZADO"
  ).length;

  // Filtered comprobantes
  const filteredComprobantes = comprobantes.filter((comp) => {
    const matchesStatus =
      comprobanteStatusFilter === "todos" ? true : comp.estado === comprobanteStatusFilter;
    const matchesSearch =
      comprobanteSearch === "" ||
      comp.clienteNombre.toLowerCase().includes(comprobanteSearch.toLowerCase()) ||
      comp.clienteCelular.includes(comprobanteSearch) ||
      (comp.codigoPedido || comp.pedidoId).toLowerCase().includes(comprobanteSearch.toLowerCase()) ||
      comp.id.toLowerCase().includes(comprobanteSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-xs text-slate-900 overflow-hidden text-left">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                TEAM LIFE
              </div>
              <h2 className="font-bold text-base text-white">Panel Distribuidor</h2>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile info */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40">
            <div className="text-xs font-semibold text-white truncate">
              {memberData?.nombreCompleto || vendorEmail}
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">{vendorEmail}</div>
            <div className="mt-2.5 flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  isAuthorized
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : memberStatus === "pendiente"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {memberStatus}
              </span>
              <span className="text-[10px] text-slate-400">ID: {vendorUid.slice(0, 8)}...</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveTab("resumen");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === "resumen"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Resumen de Mis Pedidos</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("pedidos");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === "pedidos"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-slate-400" />
                <span>Pedidos Recibidos</span>
              </div>
              {pendingOrders.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
                  {pendingOrders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("verificacion_qr");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === "verificacion_qr"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Pagos QR de Mis Clientes</span>
              </div>
              {pendingComprobantesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-bold text-[10px]">
                  {pendingComprobantesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("herramientas");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === "herramientas"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Share2 className="w-4 h-4 text-slate-400" />
              <span>Mi Enlace de Afiliado</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/10 transition-colors text-center cursor-pointer"
          >
            Cerrar Sesión
          </button>
          <div className="text-[10px] text-slate-400 text-center">
            Equipo Vida S.R.L. · Acceso Seguro
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-slate-900">
                {activeTab === "resumen" && "Resumen de Rendimiento"}
                {activeTab === "pedidos" && "Gestión de Pedidos Asignados"}
                {activeTab === "verificacion_qr" && "Verificación de Pagos QR Asignados"}
                {activeTab === "herramientas" && "Herramientas de Afiliado y Difusión"}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Solo puedes gestionar pedidos asociados a tu enlace personal de distribuidor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadVendorData}
              disabled={loading}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
              title="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: RESUMEN GENERAL */}
          {activeTab === "resumen" && (
            <div className="space-y-6">
              {/* Account Status Card if not authorized */}
              {!isAuthorized && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">Cuenta de Distribuidor en Estado: {memberStatus.toUpperCase()}</div>
                    <p>
                      Tu cuenta está siendo revisada por la administración central de Equipo Vida S.R.L.
                      Una vez autorizada, tus comisiones y enlaces se habilitarán automáticamente para coordinar despachos.
                    </p>
                  </div>
                </div>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Total Pedidos
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{totalOrdersCount}</div>
                  <div className="text-xs text-slate-500">Recibidos por tu enlace</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                    Pedidos Confirmados
                  </div>
                  <div className="text-2xl font-bold text-emerald-700">{confirmedOrders.length}</div>
                  <div className="text-xs text-emerald-800">Aceptados para despacho</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                    Pedidos Pendientes
                  </div>
                  <div className="text-2xl font-bold text-amber-700">{pendingOrders.length}</div>
                  <div className="text-xs text-amber-800">Requieren tu revisión</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Ventas Confirmadas
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    Bs {totalSalesBs.toFixed(0)}
                  </div>
                  <div className="text-xs text-slate-500">Monto total vendido</div>
                </div>
              </div>

              {/* Affiliate quick bar */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Tu Enlace Personal de Distribuidor</h3>
                    <p className="text-xs text-slate-500">
                      Comparte este enlace con tus clientes. Todos los pedidos registrados se asignarán a tu cuenta.
                    </p>
                  </div>
                  <div className="text-xs text-slate-500">
                    Clics registrados: <strong className="text-slate-900">{clics}</strong> · Conversión:{" "}
                    <strong className="text-slate-900">{conversionRate}%</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={affiliateUrl}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    disabled={!isAuthorized}
                    className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>
              </div>

              {/* Recent Orders Preview */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Últimos Pedidos Asignados</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("pedidos")}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                  >
                    Ver todos ({orders.length}) →
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-500">
                    Aún no has recibido pedidos con tu enlace de distribuidor.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{order.clienteNombre}</div>
                          <div className="text-slate-500 text-[11px]">
                            {order.departamento} · Tel: +{order.clienteCelular.replace(/\+/g, "")}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <div className="font-bold text-slate-900 text-sm">
                              Bs {order.total.toFixed(0)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(order.fecha).toLocaleDateString("es-BO")}
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              order.estado === "confirmado"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                : order.estado === "pendiente"
                                ? "bg-amber-50 text-amber-800 border border-amber-300"
                                : order.estado === "rechazado"
                                ? "bg-rose-50 text-rose-800 border border-rose-300"
                                : "bg-slate-100 text-slate-700 border border-slate-300"
                            }`}
                          >
                            {order.estado}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenOrderDetail(order)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                          >
                            Ver detalle
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PEDIDOS RECIBIDOS (LISTA COMPLETA Y GESTIÓN) */}
          {activeTab === "pedidos" && (
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por cliente, celular o ID de pedido..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>

                {/* Status Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {(["todos", "pendiente", "confirmado", "rechazado", "cancelado"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer capitalize ${
                        statusFilter === st
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {st === "todos" ? "Todos los estados" : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
                {filteredOrders.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="font-semibold text-slate-700">No se encontraron pedidos</div>
                    <p className="text-slate-400 max-w-sm mx-auto">
                      No hay pedidos asignados a tu cuenta bajo los filtros seleccionados.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-3 px-4">ID Pedido</th>
                          <th className="py-3 px-4">Cliente</th>
                          <th className="py-3 px-4">Destino</th>
                          <th className="py-3 px-4">Productos</th>
                          <th className="py-3 px-4 text-right">Total</th>
                          <th className="py-3 px-4">Estado Pedido</th>
                          <th className="py-3 px-4">Pago PagosYa</th>
                          <th className="py-3 px-4">Fecha</th>
                          <th className="py-3 px-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              #{order.id?.slice(-6) || "ORD"}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{order.clienteNombre}</div>
                              <div className="text-[11px] text-slate-500">
                                +{order.clienteCelular.replace(/\+/g, "")}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {order.departamento}
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={order.productos?.map((p) => `${p.nombre} (x${p.cantidad})`).join(", ")}>
                              {order.productos?.map((p) => `${p.nombre} (x${p.cantidad})`).join(", ") || "—"}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                              Bs {order.total.toFixed(0)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                                  order.estado === "confirmado"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                    : order.estado === "pendiente"
                                    ? "bg-amber-50 text-amber-800 border border-amber-300"
                                    : order.estado === "rechazado"
                                    ? "bg-rose-50 text-rose-800 border border-rose-300"
                                    : "bg-slate-100 text-slate-700 border border-slate-300"
                                }`}
                              >
                                {order.estado}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {order.pagoPagosya ? (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    order.pagoPagosya.estado === "completed"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : order.pagoPagosya.estado === "expired"
                                      ? "bg-slate-100 text-slate-600"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {order.pagoPagosya.estado === "completed" ? "Pagado (QR)" : "Pendiente QR"}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {new Date(order.fecha).toLocaleDateString("es-BO")}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenOrderDetail(order)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                              >
                                Gestionar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: VERIFICACIÓN DE PAGOS QR ASIGNADOS */}
          {activeTab === "verificacion_qr" && (
            <div className="space-y-4">
              {/* Notice */}
              <div className="p-4 rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-950 text-xs flex items-start gap-3">
                <QrCode className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-cyan-900">Verificación de Comprobantes de tus Clientes</div>
                  <p className="text-cyan-800 leading-relaxed">
                    Los pagos listados a continuación corresponden <strong>exclusivamente a pedidos asociados a tu enlace personal</strong>.
                    Por seguridad financiera, valida siempre el abono en tu extracto bancario antes de confirmar.
                    Al confirmar o rechazar un comprobante, el cliente podrá ver la actualización en tiempo real.
                  </p>
                </div>
              </div>

              {/* KPIs QR */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Total Comprobantes
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{comprobantes.length}</div>
                  <div className="text-xs text-slate-500">De tus clientes asignados</div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                    Pendientes
                  </div>
                  <div className="text-2xl font-bold text-amber-700">{pendingComprobantesCount}</div>
                  <div className="text-xs text-amber-800">Requieren validación</div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                    Verificados
                  </div>
                  <div className="text-2xl font-bold text-emerald-700">{verifiedComprobantesCount}</div>
                  <div className="text-xs text-emerald-800">Pagos aprobados</div>
                </div>

                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wide">
                    Rechazados
                  </div>
                  <div className="text-2xl font-bold text-rose-700">{rejectedComprobantesCount}</div>
                  <div className="text-xs text-rose-800">Con motivo registrado</div>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={comprobanteSearch}
                    onChange={(e) => setComprobanteSearch(e.target.value)}
                    placeholder="Buscar por cliente, celular, pedido o comprobante..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {[
                    { key: "todos", label: "Todos" },
                    { key: "PENDIENTE_VERIFICACION", label: "Pendientes" },
                    { key: "VERIFICADO", label: "Verificados" },
                    { key: "RECHAZADO", label: "Rechazados" },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setComprobanteStatusFilter(filter.key)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer capitalize ${
                        comprobanteStatusFilter === filter.key
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comprobantes Table */}
              <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
                {filteredComprobantes.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                    <QrCode className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="font-semibold text-slate-700">No hay comprobantes de pago</div>
                    <p className="text-slate-400 max-w-sm mx-auto">
                      No se encontraron comprobantes QR registrados por tus clientes bajo los filtros aplicados.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-3 px-4">Comprobante / Pedido</th>
                          <th className="py-3 px-4">Cliente</th>
                          <th className="py-3 px-4 text-right">Monto</th>
                          <th className="py-3 px-4">Archivo</th>
                          <th className="py-3 px-4">Fecha Envío</th>
                          <th className="py-3 px-4">Estado Pago</th>
                          <th className="py-3 px-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredComprobantes.map((comp) => {
                          const fileName = comp.nombreArchivoOriginal || comp.nombreArchivo || "comprobante";
                          const fileUrl = comp.archivoUrl || comp.urlArchivo || "#";
                          const isPdf = comp.tipoArchivo === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
                          return (
                            <tr key={comp.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-mono font-bold text-slate-900 text-[11px]">
                                  {comp.codigoPedido || `#${comp.pedidoId.slice(-6)}`}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  ID: {comp.id.slice(0, 10)}...
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-900">{comp.clienteNombre}</div>
                                <div className="text-[11px] text-slate-500">
                                  +{comp.clienteCelular.replace(/\+/g, "")}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                                Bs {comp.monto.toFixed(0)}
                              </td>

                              <td className="py-3 px-4">
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                                  title="Ver archivo original"
                                >
                                  {isPdf ? <FileText className="w-3.5 h-3.5 text-rose-500" /> : <Eye className="w-3.5 h-3.5 text-cyan-600" />}
                                  <span className="truncate max-w-[120px]">{fileName}</span>
                                </a>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {(comp.tamanoBytes / (1024 * 1024)).toFixed(2)} MB
                                </div>
                              </td>

                              <td className="py-3 px-4 text-slate-500 text-[11px]">
                                {new Date(comp.fechaEnvio).toLocaleString("es-BO", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>

                              <td className="py-3 px-4">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    comp.estado === "VERIFICADO"
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : comp.estado === "RECHAZADO"
                                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                                      : "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                                  }`}
                                >
                                  {comp.estado === "PENDIENTE_VERIFICACION"
                                    ? "Pendiente Verificación"
                                    : comp.estado}
                                </span>
                                {comp.motivoRechazo && comp.estado === "RECHAZADO" && (
                                  <div className="text-[10px] text-rose-700 truncate max-w-[180px] mt-0.5" title={comp.motivoRechazo}>
                                    Motivo: {comp.motivoRechazo}
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedComprobante(comp);
                                    setIsComprobanteModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Revisar</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HERRAMIENTAS DE AFILIADO */}
          {activeTab === "herramientas" && (
            <div className="space-y-6 max-w-3xl">
              <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-slate-900">Enlace Personal de Vendedor</h3>
                  <p className="text-xs text-slate-600">
                    Cualquier cliente que visite TEAM LIFE a través de tu enlace quedará vinculado contigo durante su compra.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                  <code className="text-xs font-mono text-slate-800 select-all truncate">
                    {affiliateUrl}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    disabled={!isAuthorized}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors inline-flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>

                {waUrl && (
                  <div className="pt-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Hola, te invito a conocer los productos oficiales de nutrición celular de TEAM LIFE | Equipo Vida S.R.L.: ${affiliateUrl}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Compartir por WhatsApp con Contactos</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Account summary & notes from admin */}
              <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                <h3 className="font-bold text-base text-slate-900">Datos de tu Cuenta Oficial</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500">Nombre Completo:</span>
                    <div className="font-semibold text-slate-900">{memberData?.nombreCompleto}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Celular de Contacto:</span>
                    <div className="font-semibold text-slate-900">+{memberData?.phone}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Estado de Aprobación:</span>
                    <div className="font-semibold text-slate-900 capitalize">{memberStatus}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Fecha de Registro:</span>
                    <div className="font-semibold text-slate-900">
                      {memberData?.fechaRegistro
                        ? new Date(memberData.fechaRegistro).toLocaleDateString("es-BO")
                        : "Reciente"}
                    </div>
                  </div>
                </div>

                {memberData?.notasAdmin && (
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-slate-900">Notas de la Administración:</span>{" "}
                    {memberData.notasAdmin}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Reusable Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModalView
          isOpen={isDetailModalOpen}
          order={selectedOrder}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedOrder(null);
          }}
          currentUser={{
            uid: vendorUid,
            nombre: memberData?.nombreCompleto || vendorEmail,
            email: vendorEmail,
            role: "vendedor",
          }}
          onOrderUpdated={loadVendorData}
        />
      )}

      {/* Reusable Comprobante Review Modal */}
      {selectedComprobante && (
        <ComprobanteReviewModalView
          isOpen={isComprobanteModalOpen}
          onClose={() => {
            setIsComprobanteModalOpen(false);
            setSelectedComprobante(null);
          }}
          comprobante={selectedComprobante}
          currentUser={{
            uid: vendorUid,
            nombre: memberData?.nombreCompleto || vendorEmail,
            email: vendorEmail,
            role: "vendedor",
          }}
          onStatusUpdated={() => {
            loadVendorData();
            setIsComprobanteModalOpen(false);
            setSelectedComprobante(null);
          }}
        />
      )}
    </div>
  );
};
