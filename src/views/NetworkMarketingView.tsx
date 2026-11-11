import React, { useState } from "react";
import {
  Users,
  BookOpen,
  MessageCircle,
  Info,
  ChevronRight,
  X,
  ShieldCheck,
  Calculator,
  Building2,
  FileCheck2,
  Award,
  Plane,
  Smartphone,
  Car,
  Briefcase,
  Crown,
} from "lucide-react";
import { COMPANY_INFO } from "../models/companyModel";

interface NetworkMarketingViewProps {
  vendedorWhatsapp: string;
}

export const NetworkMarketingView: React.FC<NetworkMarketingViewProps> = ({
  vendedorWhatsapp,
}) => {
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [productsPerDay, setProductsPerDay] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<"fundadores" | "combos" | "modelo" | "legal">("fundadores");

  const profitPerProduct = 145; // Colágeno Marino: producto estrella de mayor venta (Bs 145 de ganancia neta por unidad)
  const dailyProfit = productsPerDay * profitPerProduct;
  const monthlyProfit = dailyProfit * 30;
  const yearlyProfit = monthlyProfit * 12;

  const handleJoinWhatsApp = () => {
    const text = encodeURIComponent(
      "¡Hola! Deseo recibir información oficial y asesoría formal sobre cómo unirme al modelo comercial de TEAM LIFE COMPANY S.R.L. (Equipo Vida S.R.L.), conocer los Combos Empresariales (hasta 87% de ganancias) o activar mi Membresía Oficial por 250 Bs."
    );
    window.open(`https://wa.me/${vendedorWhatsapp}?text=${text}`, "_blank");
  };

  return (
    <section id="oportunidad-crecimiento" className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl p-6 sm:p-12 md:p-16 bg-white border border-[#c8e4ed] shadow-[0_20px_60px_-15px_rgba(8,145,178,0.08),0_0_0_1px_rgba(8,145,178,0.12)] overflow-hidden transition-all">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-teal-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-[#082836]/08 to-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto space-y-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-bold uppercase tracking-widest shadow-sm">
            <Building2 className="w-3.5 h-3.5 text-cyan-700" />
            <span>TEAM LIFE COMPANY S.R.L. · La Era de las Conexiones</span>
          </div>

          <div className="space-y-4">
            <h2 className="font-display font-black text-3xl sm:text-5xl text-[#082836] tracking-tight">
              Juntos Todo Es Posible · Liderazgo y Crecimiento en Bolivia
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
              <strong>TEAM LIFE</strong> combina el trabajo en equipo (TEAM) con la promoción de una vida saludable y plena (LIFE). Conoce a nuestros fundadores, la legalidad formal (NIT, SENASAG, SEPREC) y un plan de compensación con hasta <strong>75% de bonos y hasta 87% de ganancias</strong> en venta directa.
            </p>
          </div>

          {/* Nav Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-1.5 rounded-2xl bg-[#f0f7fa] border border-[#c8e4ed] max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => setActiveTab("fundadores")}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "fundadores"
                  ? "bg-gradient-to-r from-cyan-600 to-[#0284c7] text-white shadow-md shadow-cyan-600/20"
                  : "text-slate-600 hover:text-[#082836] hover:bg-white"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>CEOs Fundadores</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("combos")}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "combos"
                  ? "bg-gradient-to-r from-cyan-600 to-[#0284c7] text-white shadow-md shadow-cyan-600/20"
                  : "text-slate-600 hover:text-[#082836] hover:bg-white"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Combos Empresariales</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("modelo")}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "modelo"
                  ? "bg-gradient-to-r from-cyan-600 to-[#0284c7] text-white shadow-md shadow-cyan-600/20"
                  : "text-slate-600 hover:text-[#082836] hover:bg-white"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Bonos & Premios</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("legal")}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "legal"
                  ? "bg-gradient-to-r from-cyan-600 to-[#0284c7] text-white shadow-md shadow-cyan-600/20"
                  : "text-slate-600 hover:text-[#082836] hover:bg-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Legalidad (NIT & SENASAG)</span>
            </button>
          </div>

          {/* TAB 1: FUNDADORES & PRESENTACIÓN */}
          {activeTab === "fundadores" && (
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#f0f7fa] to-white border border-[#c8e4ed] text-left space-y-8 animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Real Photo of CEOs Julian Rodriguez & Mery Ruiz */}
                <div className="md:col-span-5 flex flex-col items-center sm:items-start space-y-4">
                  <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border-2 border-cyan-400 shadow-xl bg-[#082836] group">
                    <img
                      src={COMPANY_INFO.foundersPhoto}
                      alt="Julian Rodriguez y Mery Ruiz - Fundadores Team Life Company S.R.L."
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#082836] via-[#082836]/80 to-transparent p-4 text-white text-center sm:text-left">
                      <div className="font-display font-black text-sm sm:text-base text-cyan-200">
                        Julian Rodriguez & Mery Ruiz
                      </div>
                      <div className="text-[11px] text-cyan-100 font-medium">
                        Fundadores Team Life Company S.R.L.
                      </div>
                    </div>
                  </div>

                  <a
                    href={COMPANY_INFO.presentationPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full max-w-sm py-3 px-4 rounded-2xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 text-cyan-900 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-cyan-700" />
                    <span>Ver Presentación Oficial Completa (PDF)</span>
                  </a>
                </div>

                {/* Profile & Commitments */}
                <div className="md:col-span-7 space-y-5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold uppercase tracking-wider">
                    <Crown className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Liderazgo Visionario en Bolivia</span>
                  </div>

                  <h3 className="font-display font-black text-2xl sm:text-3xl text-[#082836]">
                    Julian Rodriguez & Mery Ruiz
                  </h3>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-700">
                    CEOs Fundadores · Team Life Company S.R.L.
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {COMPANY_INFO.foundersProfile}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-4 rounded-2xl bg-white border border-[#c8e4ed] space-y-1 shadow-xs">
                      <div className="text-lg">🎯</div>
                      <div className="text-xs font-bold text-[#082836]">Misión</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Desarrollar distribuidores y líderes con productos naturales de alta calidad.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#c8e4ed] space-y-1 shadow-xs">
                      <div className="text-lg">💡</div>
                      <div className="text-xs font-bold text-[#082836]">Visión</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Líder nacional e internacional en innovación y salud celular.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#c8e4ed] space-y-1 shadow-xs">
                      <div className="text-lg">💎</div>
                      <div className="text-xs font-bold text-[#082836]">Valores</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Ética, Respeto, Excelencia y 75% en bonos sin candados.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMBOS EMPRESARIALES */}
          {activeTab === "combos" && (
            <div className="space-y-6 text-left animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-7 rounded-3xl bg-[#f0f7fa] border border-[#c8e4ed] hover:border-cyan-400 transition-all shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-100 text-cyan-800">
                      Combo 1 · 6 Productos
                    </span>
                    <span className="font-display font-black text-lg text-emerald-600">60% Ganancias</span>
                  </div>
                  <h4 className="font-display font-black text-xl text-[#082836]">
                    Inversión: Bs 1.360
                  </h4>
                  <div className="text-xs text-cyan-800 font-bold">
                    1.125 Bs Comisionables
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-[#c8e4ed]">
                    <div>• 2x Fibernat Detox (6g/sobre)</div>
                    <div>• 2x Inmune Plus Multi-Defensas</div>
                    <div>• 2x Colágeno Marino Hidrolizado</div>
                  </div>
                </div>

                <div className="p-7 rounded-3xl bg-gradient-to-b from-cyan-50/50 to-white border-2 border-cyan-300 hover:border-cyan-500 transition-all shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-200 text-cyan-900">
                      Combo 2 · 12 Productos
                    </span>
                    <span className="font-display font-black text-lg text-emerald-600">73% Ganancias</span>
                  </div>
                  <h4 className="font-display font-black text-xl text-[#082836]">
                    Inversión: Bs 2.500
                  </h4>
                  <div className="text-xs text-cyan-800 font-bold">
                    2.057 Bs Comisionables
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-cyan-200">
                    <div>• 4x Fibernat Detox</div>
                    <div>• 3x Inmune Plus Multi-Defensas</div>
                    <div>• 4x Colágeno Marino Hidrolizado</div>
                    <div>• 1x Coffee Life con Ganoderma</div>
                  </div>
                </div>

                <div className="p-7 rounded-3xl bg-gradient-to-b from-amber-50/50 to-white border-2 border-amber-300 hover:border-amber-500 transition-all shadow-xl space-y-4 relative">
                  <div className="absolute -top-3 right-6 px-3 py-0.5 bg-amber-500 text-white text-[10px] font-black uppercase rounded-full shadow-sm">
                    Máxima Rentabilidad
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-900">
                      Combo 3 · 25 Productos
                    </span>
                    <span className="font-display font-black text-lg text-amber-700">87% Ganancias</span>
                  </div>
                  <h4 className="font-display font-black text-xl text-[#082836]">
                    Inversión: Bs 4.650
                  </h4>
                  <div className="text-xs text-amber-800 font-bold">
                    3.806 Bs Comisionables · Activa Bono Impulso Plus
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-amber-200">
                    <div>• 10x Fibernat Detox</div>
                    <div>• 6x Inmune Plus Multi-Defensas</div>
                    <div>• 7x Colágeno Marino Hidrolizado</div>
                    <div>• 2x Coffee Life con Ganoderma</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BONOS & PREMIOS */}
          {activeTab === "modelo" && (
            <div className="space-y-6 text-left animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-6 rounded-3xl bg-[#f0f7fa] border border-[#c8e4ed] space-y-2">
                  <div className="text-xs font-bold uppercase text-cyan-800">Bono Patrocinio 5 Niveles</div>
                  <div className="font-display font-black text-2xl text-[#082836]">Bs 835.915</div>
                  <p className="text-xs text-slate-600">
                    N1 (45%), N2 (20%), N3 (10%), N4 (7%), N5 (5%). En 5 directos ganas Bs 8.560 de inmediato.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-[#f0f7fa] border border-[#c8e4ed] space-y-2">
                  <div className="text-xs font-bold uppercase text-cyan-800">Bono Impulso & Plus</div>
                  <div className="font-display font-black text-2xl text-[#082836]">Bs 1.200 - 1.500</div>
                  <p className="text-xs text-slate-600">
                    Bono de 1.200 Bs por inscribir 5 paquetes con puntos, o 1.500 Bs por 5 asociados con Combo 3.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-[#f0f7fa] border border-[#c8e4ed] space-y-2">
                  <div className="text-xs font-bold uppercase text-cyan-800">Bono Regalías 20 Niveles</div>
                  <div className="font-display font-black text-2xl text-[#082836]">Bs 1.327.032</div>
                  <p className="text-xs text-slate-600">
                    15% en Nivel 1, 10% en Nivel 2, 7% en Nivel 3. Proyección de ingresos residuales en 7 niveles.
                  </p>
                </div>
              </div>

              {/* Premios Plan de Carrera */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-[#082836] via-[#0b3c4f] to-[#0891b2] text-white border border-cyan-400/30 space-y-4">
                <div className="text-xs uppercase font-bold text-cyan-200 tracking-wider">
                  Premios Reales por Rango Alcanzado
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                  <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center space-y-1">
                    <Plane className="w-5 h-5 mx-auto text-cyan-300" />
                    <div className="font-bold text-xs text-cyan-200">Rango Esmeralda</div>
                    <div className="text-[11px] text-white font-medium">Viaje Nacional + Bono 100</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center space-y-1">
                    <Smartphone className="w-5 h-5 mx-auto text-cyan-300" />
                    <div className="font-bold text-xs text-cyan-200">Rango Diamante</div>
                    <div className="text-[11px] text-white font-medium">Bono iPhone Oficial</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center space-y-1">
                    <Plane className="w-5 h-5 mx-auto text-cyan-300" />
                    <div className="font-bold text-xs text-cyan-200">Diamante Platino</div>
                    <div className="text-[11px] text-white font-medium">Viaje Internacional</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center space-y-1">
                    <Car className="w-5 h-5 mx-auto text-amber-300" />
                    <div className="font-bold text-xs text-amber-300">Diamante Negro</div>
                    <div className="text-[11px] text-white font-medium">Auto 0 Km ($us 25.000)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LEGALIDAD */}
          {activeTab === "legal" && (
            <div className="p-8 rounded-3xl bg-[#f0f7fa] border border-[#c8e4ed] text-left space-y-6 animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-white border border-[#c8e4ed] space-y-2 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h5 className="font-display font-bold text-[#082836] text-base">Registro SEPREC</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {COMPANY_INFO.seprec}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#c8e4ed] space-y-2 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center justify-center font-bold">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <h5 className="font-display font-bold text-[#082836] text-base">Impuestos Nacionales</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    NIT: {COMPANY_INFO.nit} (Régimen General con emisión oficial de factura fiscal).
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#c8e4ed] space-y-2 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h5 className="font-display font-bold text-[#082836] text-base">Registro SENASAG</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {COMPANY_INFO.senasag}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Calculator based on Colágeno Marino (Bs 145 de ganancia neta por unidad) */}
          <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#082836] via-[#0b3c4f] to-[#041a24] text-white border border-cyan-400/40 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-200 text-xs font-bold uppercase tracking-wider">
                <Calculator className="w-3.5 h-3.5" />
                <span>Simulador de Ganancias · Bs 145 por Colágeno Marino</span>
              </div>

              <h3 className="font-display font-black text-2xl sm:text-3xl text-white">
                ¿Cuánto ganas comercializando Colágeno Marino (Bs 145 en mano por unidad)?
              </h3>

              <p className="text-xs sm:text-sm text-cyan-100/90 leading-relaxed">
                El <strong>Colágeno Marino Hidrolizado</strong> es nuestro producto de mayor demanda y rotación en toda Bolivia. Por cada unidad comercializada ganas <strong>Bs 145 netos</strong>. Desliza para proyectar tus ingresos:
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-100">
                  <span>1 Colágeno / día</span>
                  <span className="text-cyan-200 text-base font-black px-4 py-1 rounded-full bg-white/10 border border-white/15">
                    {productsPerDay} {productsPerDay === 1 ? "Colágeno" : "Colágenos"} al día (Bs {(productsPerDay * profitPerProduct).toLocaleString()}/día)
                  </span>
                  <span>10 Colágenos / día</span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={productsPerDay}
                  onChange={(e) => setProductsPerDay(Number(e.target.value))}
                  className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-center">
                  <div className="text-[11px] uppercase tracking-wider text-cyan-200 font-semibold mb-1">
                    Ganancia Diaria
                  </div>
                  <div className="font-display font-black text-2xl sm:text-3xl text-cyan-300">
                    Bs {dailyProfit.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-cyan-100 mt-1">Margen inmediato en mano</div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-b from-cyan-500/20 to-teal-500/20 border-2 border-cyan-400/50 backdrop-blur-md text-center shadow-lg">
                  <div className="text-[11px] uppercase tracking-wider text-cyan-200 font-bold mb-1">
                    Ganancia Mensual (30 días)
                  </div>
                  <div className="font-display font-black text-3xl sm:text-4xl text-white">
                    Bs {monthlyProfit.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-cyan-200 mt-1">
                    {monthlyProfit >= 2500 ? "¡Supera con creces el salario mínimo en Bolivia!" : "Ingreso adicional clave"}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-center">
                  <div className="text-[11px] uppercase tracking-wider text-cyan-200 font-semibold mb-1">
                    Proyección Anual (12 meses)
                  </div>
                  <div className="font-display font-black text-2xl sm:text-3xl text-cyan-300">
                    Bs {yearlyProfit.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-cyan-100 mt-1">Ventas directas sostenibles</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => setInfoModalOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-cyan-50 text-[#082836] font-display font-bold text-sm tracking-wide flex items-center gap-2 border border-[#c8e4ed] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              <Info className="w-4 h-4 text-cyan-700" />
              <span>Ver Requisitos de Afiliación</span>
            </button>

            <button
              type="button"
              onClick={handleJoinWhatsApp}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#082836] via-[#0891b2] to-[#0284c7] hover:from-[#0b3c4f] hover:to-[#0369a1] text-white font-display font-bold text-sm tracking-wide flex items-center gap-2 shadow-xl shadow-cyan-950/20 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-cyan-500/40"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#082836]" />
              <span>Hablar con un Asesor de Afiliación</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Affiliation Details Modal */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#082836]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-white border border-[#c8e4ed] shadow-2xl text-left space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#c8e4ed]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-800 flex items-center justify-center font-bold border border-cyan-200">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-[#082836]">
                    Guía de Afiliación Oficial · Team Life
                  </h3>
                  <p className="text-xs text-slate-500">Fundada por Julian Rodriguez y Mery Ruiz</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-cyan-50 hover:bg-cyan-100 text-slate-500 hover:text-[#082836] flex items-center justify-center cursor-pointer transition-colors border border-[#c8e4ed]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[65vh] overflow-y-auto pr-2">
              <div className="p-4 rounded-2xl bg-[#f0f7fa] border border-[#c8e4ed] space-y-1.5">
                <div className="font-bold text-[#082836] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-700 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                  <span>Kit de Afiliación (250 Bs) o Combo Empresarial</span>
                </div>
                <p className="text-slate-600 pl-7">
                  Eliges tu <strong>Kit de Afiliación Básica por 250 Bs</strong> o uno de los <strong>Combos Empresariales (hasta 87% de ganancia)</strong>. Activas tu código de socio vitalicio con 40% OFF en todos los productos sin compras forzosas.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f0f7fa] border border-[#c8e4ed] space-y-1.5">
                <div className="font-bold text-[#082836] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-700 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                  <span>Bono de Patrocinio Exprés de 150 Bs</span>
                </div>
                <p className="text-slate-600 pl-7">
                  Por cada nuevo socio consumidor afiliado con su Kit de 250 Bs, ganas inmediatamente <strong>150 Bs en mano</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f0f7fa] border border-[#c8e4ed] space-y-1.5">
                <div className="font-bold text-[#082836] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-700 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                  <span>Enlace Web Personalizado (?ref=tu_codigo)</span>
                </div>
                <p className="text-slate-600 pl-7">
                  Se te asigna tu propio enlace de catálogo virtual con asistente IA para que recibas clientes de La Paz, Santa Cruz, Cochabamba y toda Bolivia directo en tu WhatsApp.
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#c8e4ed]">
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-[#082836] hover:bg-cyan-50 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setInfoModalOpen(false);
                  handleJoinWhatsApp();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-[#0284c7] text-white text-xs font-bold shadow-md shadow-cyan-600/20 cursor-pointer hover:from-cyan-700 hover:to-[#0369a1] flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contactar Asesor por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
