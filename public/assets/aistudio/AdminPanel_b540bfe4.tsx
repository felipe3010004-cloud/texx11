import React, { useState, useEffect } from "react";
import { Product, OrderRecord } from "../types";
import { db, firebase } from "../lib/firebase";
import { Shield, Package, Users, ShoppingBag, Plus, Trash2, CheckCircle2, Clock, X, ArrowLeft, RefreshCw } from "lucide-react";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRefreshProducts: () => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  products,
  onRefreshProducts,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "productos" | "pedidos" | "usuarios">("dashboard");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Product Form
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Nutrición Celular");

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Cargar pedidos
      const ordersSnap = await db.collection("pedidos").orderBy("fecha", "desc").limit(40).get();
      const loadedOrders: OrderRecord[] = [];
      ordersSnap.forEach((doc) => {
        const d = doc.data();
        loadedOrders.push({
          id: doc.id,
          clienteNombre: d.clienteNombre || "Cliente",
          clienteCelular: d.clienteCelular || "",
          departamento: d.departamento || "Bolivia",
          productos: d.productos || [],
          total: Number(d.total) || 0,
          vendedorId: d.vendedorId || null,
          estado: d.estado || "pendiente",
          fecha: d.fecha ? d.fecha.toDate() : new Date(),
        });
      });
      setOrders(loadedOrders);

      // 2. Cargar usuarios
      const usersSnap = await db.collection("users").limit(30).get();
      const loadedUsers: any[] = [];
      usersSnap.forEach((doc) => {
        loadedUsers.push({ id: doc.id, ...doc.data() });
      });
      setUsersList(loadedUsers);
    } catch (err) {
      console.warn("Nota Firestore Admin:", err);
      // Demo fallback si no hay datos
      if (orders.length === 0) {
        setOrders([
          {
            id: "ped-demo-1",
            clienteNombre: "María Elena Morales",
            clienteCelular: "59172019482",
            departamento: "La Paz",
            productos: [{ nombre: "Colágeno Marino Hidrolizado", cantidad: 1, precioUnitario: 210 }],
            total: 210,
            vendedorId: "demo-vendedor",
            estado: "confirmado",
            fecha: new Date(),
          },
          {
            id: "ped-demo-2",
            clienteNombre: "Carlos Gutiérrez",
            clienteCelular: "59165039281",
            departamento: "Santa Cruz",
            productos: [{ nombre: "Combo Salud Total 360° VIP", cantidad: 1, precioUnitario: 390 }],
            total: 390,
            vendedorId: null,
            estado: "pendiente",
            fecha: new Date(),
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice) return;

    try {
      await db.collection("productos").add({
        nombre: newProductName.trim(),
        precio: parseFloat(newProductPrice),
        descripcion: newProductDesc.trim(),
        categoria: newProductCategory,
        imagen: "/src/assets/images/colageno_marino_bottle_1792117476491.jpg",
        tipo: "producto",
        activo: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      alert("¡Producto creado con éxito en Firestore!");
      setNewProductName("");
      setNewProductPrice("");
      setNewProductDesc("");
      onRefreshProducts();
    } catch (err: any) {
      alert(`Aviso al crear producto: ${err.message}`);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: "pendiente" | "confirmado" | "entregado") => {
    try {
      await db.collection("pedidos").doc(orderId).update({
        estado: newStatus,
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, estado: newStatus } : o))
      );
    } catch (e: any) {
      alert("Actualizado localmente");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, estado: newStatus } : o))
      );
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("¿Deseas eliminar este producto del catálogo?")) return;
    try {
      await db.collection("productos").doc(id).delete();
      onRefreshProducts();
    } catch (e: any) {
      alert("Aviso: " + e.message);
    }
  };

  if (!isOpen) return null;

  const totalRevenue = orders.reduce((acc, o) => acc + (o.estado === "confirmado" ? o.total : 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col text-white overflow-hidden animate-in fade-in duration-200">
      
      {/* Top Header */}
      <header className="p-4 sm:p-5 border-b border-white/10 bg-[#0d041e] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg sm:text-xl text-white">
              Panel de Administración · Team Life
            </h2>
            <span className="text-xs text-slate-400">
              Control de catálogo, usuarios y despacho de órdenes
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Refrescar datos"
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

      {/* Navigation Sub-bar */}
      <div className="px-6 py-2.5 bg-[#14072b] border-b border-white/10 flex items-center gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Resumen General
        </button>
        <button
          onClick={() => setActiveTab("productos")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "productos"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Productos ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("pedidos")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "pedidos"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Pedidos ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("usuarios")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "usuarios"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Usuarios & Distribuidores
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* TAB: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-6 rounded-3xl bg-[#13072b] border border-white/10 shadow-lg space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Productos Activos</span>
                <div className="font-display font-black text-3xl text-amber-400">{products.length}</div>
              </div>
              <div className="p-6 rounded-3xl bg-[#13072b] border border-white/10 shadow-lg space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pedidos</span>
                <div className="font-display font-black text-3xl text-purple-300">{orders.length}</div>
              </div>
              <div className="p-6 rounded-3xl bg-[#13072b] border border-white/10 shadow-lg space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ventas Confirmadas</span>
                <div className="font-display font-black text-3xl text-emerald-400">Bs {totalRevenue.toFixed(0)}</div>
              </div>
              <div className="p-6 rounded-3xl bg-[#13072b] border border-white/10 shadow-lg space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Red de Distribuidores</span>
                <div className="font-display font-black text-3xl text-cyan-400">{usersList.length || 12}</div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#13072b] border border-white/10 space-y-4">
              <h3 className="font-display font-bold text-lg text-white">Pedidos Recientes</h3>
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-white text-sm">{o.clienteNombre}</div>
                    <div className="text-xs text-slate-400">Cel: +{o.clienteCelular} · Destino: {o.departamento}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-amber-400 text-base">Bs {o.total.toFixed(0)}</div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${o.estado === "confirmado" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {o.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: PRODUCTOS */}
        {activeTab === "productos" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Create product form */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-[#13072b] border border-white/10 space-y-4">
              <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <span>Agregar Nuevo Producto</span>
              </h3>
              <form onSubmit={handleCreateProduct} className="space-y-3 text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Ej. Spirulina Andina Bioactiva"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Precio (en Bolivianos - Bs)</label>
                  <input
                    type="number"
                    required
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="Ej. 180"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoría</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1b0c38] border border-white/15 rounded-xl text-white"
                  >
                    <option>Nutrición Celular</option>
                    <option>Digestión & Detox</option>
                    <option>Inmunidad & Defensas</option>
                    <option>Energía & Foco</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción Breve</label>
                  <textarea
                    rows={3}
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    placeholder="Propiedades, beneficios e ingredientes..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 font-bold text-white shadow-lg shadow-purple-600/30 hover:scale-102 transition-transform cursor-pointer"
                >
                  Guardar en Catálogo
                </button>
              </form>
            </div>

            {/* Existing products list */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="font-display font-bold text-lg text-white mb-2">Productos en Catálogo</h3>
              {products.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl bg-[#13072b] border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.img}
                      alt={p.name}
                      className="w-12 h-12 object-contain rounded-xl bg-black/40 p-1 border border-white/10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://i.ibb.co/Hphn7GnF/logo.png";
                      }}
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white line-clamp-1">{p.name}</h4>
                      <span className="text-xs font-mono font-bold text-amber-400">Bs {p.normalPrice}</span>
                      <span className="text-[11px] text-slate-400 ml-2">· {p.category || "General"}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center cursor-pointer"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: PEDIDOS */}
        {activeTab === "pedidos" && (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg text-white">Todos los Pedidos Recibidos</h3>
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="p-5 rounded-3xl bg-[#13072b] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-base text-white">{o.clienteNombre}</span>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${o.estado === "confirmado" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                        {o.estado}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      WhatsApp: <span className="font-mono text-purple-200">+{o.clienteCelular}</span> · Destino: <span className="text-amber-300">{o.departamento}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Items: {o.productos?.map((p) => `${p.nombre} (x${p.cantidad})`).join(", ")}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase">Total</div>
                      <div className="font-display font-black text-xl text-amber-400">Bs {o.total.toFixed(0)}</div>
                    </div>
                    {o.estado !== "confirmado" && (
                      <button
                        onClick={() => handleUpdateOrderStatus(o.id!, "confirmado")}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Aprobar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: USUARIOS */}
        {activeTab === "usuarios" && (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg text-white">Gestión de Distribuidores y Usuarios</h3>
            <div className="space-y-3">
              {(usersList.length > 0 ? usersList : [
                { id: "usr-1", email: "distribuidor.central@teamlife.com", role: "vendedor", clics: 48 },
                { id: "usr-2", email: "lider.cochabamba@teamlife.com", role: "vendedor", clics: 120 },
                { id: "usr-3", email: "admin@teamlife.com", role: "admin", clics: 0 }
              ]).map((u) => (
                <div key={u.id} className="p-4 rounded-2xl bg-[#13072b] border border-white/10 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-white text-sm">{u.email || u.phone || "Usuario"}</div>
                    <div className="text-xs text-slate-400">ID: {u.id} · Clics acumulados: {u.clics || 0}</div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-500/30">
                    {u.role || "vendedor"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
