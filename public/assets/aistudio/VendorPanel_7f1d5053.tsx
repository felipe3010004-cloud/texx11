import React, { useState, useEffect } from "react";
import { OrderRecord } from "../types";
import { db, firebase } from "../lib/firebase";
import { Link2, Copy, MousePointer, CheckCircle, TrendingUp, DollarSign, Calendar, X, RefreshCw, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface VendorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  vendorUid: string;
  vendorEmail: string;
  onLogout: () => void;
}

export const VendorPanel: React.FC<VendorPanelProps> = ({
  isOpen,
  onClose,
  vendorUid,
  vendorEmail,
  onLogout,
}) => {
  const [clics, setClics] = useState<number>(14);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const affiliateUrl = `${window.location.origin}/?ref=${vendorUid}`;

  useEffect(() => {
    if (isOpen) {
      loadVendorData();
    }
  }, [isOpen, vendorUid]);

  const loadVendorData = async () => {
    setLoading(true);
    try {
      // 1. Cargar datos del vendedor
      const userDoc = await db.collection("users").doc(vendorUid).get();
      if (userDoc.exists) {
        const d = userDoc.data();
        setClics(d?.clics || 0);
      }

      // 2. Cargar pedidos atribuidos a este vendedor
      const snap = await db.collection("pedidos").where("vendedorId", "==", vendorUid).get();
      const list: OrderRecord[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        list.push({
          id: doc.id,
          clienteNombre: d.clienteNombre || "Cliente",
          clienteCelular: d.clienteCelular || "",
          departamento: d.departamento || "Bolivia",
          productos: d.productos || [],
          total: Number(d.total) || 0,
          vendedorId: vendorUid,
          estado: d.estado || "pendiente",
          fecha: d.fecha ? d.fecha.toDate() : new Date(),
        });
      });

      if (list.length === 0) {
        // Mock inicial amigable si es nueva cuenta
        setOrders([
          {
            id: "ord-ref-1",
            clienteNombre: "Valeria Roca",
            clienteCelular: "59178945612",
            departamento: "Santa Cruz",
            productos: [
              { nombre: "Colágeno Marino Hidrolizado", cantidad: 1, precioUnitario: 205 },
              { nombre: "Fibernat Detox", cantidad: 1, precioUnitario: 95 },
            ],
            total: 300,
            vendedorId: vendorUid,
            estado: "confirmado",
            fecha: new Date(),
          },
          {
            id: "ord-ref-2",
            clienteNombre: "Rodrigo Morales",
            clienteCelular: "59171239874",
            departamento: "La Paz",
            productos: [
              { nombre: "Coffee Life Premium (Ganoderma + Cordyceps)", cantidad: 1, precioUnitario: 215 },
            ],
            total: 215,
            vendedorId: vendorUid,
            estado: "pendiente",
            fecha: new Date(),
          },
        ]);
      } else {
        setOrders(list);
      }
    } catch (e) {
      console.warn("Aviso Firestore vendedor:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateClick = async () => {
    setClics((prev) => prev + 1);
    try {
      await db.collection("users").doc(vendorUid).set(
        { clics: firebase.firestore.FieldValue.increment(1) },
        { merge: true }
      );
    } catch (e) {
      // Ok
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await db.collection("pedidos").doc(orderId).update({
        estado: "confirmado",
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, estado: "confirmado" } : o))
      );
      confetti({ particleCount: 100, spread: 70 });
    } catch (e: any) {
      alert("Aviso: " + e.message);
    }
  };

  if (!isOpen) return null;

  const totalOrders = orders.length;
  const confirmedSales = orders
    .filter((o) => o.estado === "confirmado")
    .reduce((acc, o) => acc + o.total, 0);
  const conversionRate = clics > 0 ? ((totalOrders / clics) * 100).toFixed(1) : "0";

  return (
    <div className="fixed inset-0 z-50 bg-[#082836]/95 backdrop-blur-xl flex flex-col text-white overflow-hidden animate-in fade-in duration-200">
      
      {/* Header */}
      <header className="p-4 sm:p-5 border-b border-cyan-800 bg-[#061e29] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg sm:text-xl text-white">
              Panel del Distribuidor · Team Life
            </h2>
            <span className="text-xs text-slate-400">
              Usuario: <span className="text-cyan-300 font-mono">{vendorEmail}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadVendorData}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Refrescar métricas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar Sesión
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Affiliate Link Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0b3c4f] via-[#082836] to-[#041a24] border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-300 font-display font-bold text-sm">
              <Link2 className="w-4 h-4" />
              <span>Tu Enlace de Afiliado Oficial (Atribución Automática)</span>
            </div>
            <span className="text-[11px] text-cyan-200 bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
              ID: {vendorUid}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Comparte este link en tus redes sociales o WhatsApp. Los clientes que ingresen tendrán tu número de contacto asignado para sus compras y membresías con el 40% de descuento.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <input
              type="text"
              readOnly
              value={affiliateUrl}
              className="flex-1 px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl font-mono text-xs sm:text-sm text-cyan-200 select-all"
            />
            <button
              onClick={handleCopyLink}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-[#0284c7] hover:from-cyan-500 hover:to-[#0369a1] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <Copy className="w-4 h-4" />
              <span>{copied ? "¡Enlace Copiado!" : "Copiar Enlace"}</span>
            </button>
            <button
              onClick={handleSimulateClick}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              title="Simula que un cliente abrió tu enlace"
            >
              <MousePointer className="w-4 h-4 text-cyan-400" />
              <span>Simular Visita</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-3xl bg-[#0b3c4f]/40 border border-cyan-800 shadow-lg space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Pedidos Recibidos</span>
            </span>
            <div className="font-display font-black text-3xl text-cyan-200">{totalOrders}</div>
          </div>

          <div className="p-6 rounded-3xl bg-[#0b3c4f]/40 border border-cyan-800 shadow-lg space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Ventas Confirmadas</span>
            </span>
            <div className="font-display font-black text-3xl text-emerald-400">
              Bs {confirmedSales.toFixed(0)}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#0b3c4f]/40 border border-cyan-800 shadow-lg space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MousePointer className="w-4 h-4 text-amber-400" />
              <span>Clics en tu Enlace</span>
            </span>
            <div className="font-display font-black text-3xl text-amber-400">{clics}</div>
          </div>

          <div className="p-6 rounded-3xl bg-[#0b3c4f]/40 border border-cyan-800 shadow-lg space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Tasa de Conversión</span>
            </span>
            <div className="font-display font-black text-3xl text-cyan-400">{conversionRate}%</div>
          </div>
        </div>

        {/* Table of Orders */}
        <div className="p-6 rounded-3xl bg-[#0b3c4f]/30 border border-cyan-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-white">Pedidos Asignados a tu Código</h3>
            <span className="text-xs text-slate-400">Total: {orders.length}</span>
          </div>

          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-base text-white">{o.clienteNombre}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        o.estado === "confirmado"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {o.estado}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Celular: <span className="font-mono text-cyan-200">+{o.clienteCelular}</span> · Departamento: <span className="text-cyan-300">{o.departamento}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Productos: {o.productos?.map((p) => `${p.nombre} (x${p.cantidad})`).join(", ")}
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase">Monto Total</div>
                    <div className="font-display font-black text-xl text-cyan-300">Bs {o.total.toFixed(0)}</div>
                  </div>
                  {o.estado !== "confirmado" ? (
                    <button
                      onClick={() => handleConfirmOrder(o.id!)}
                      className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Confirmar Venta
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Aprobado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
