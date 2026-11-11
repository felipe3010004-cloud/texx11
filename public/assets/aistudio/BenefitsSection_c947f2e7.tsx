import React from "react";
import { Leaf, Truck, UserCheck, ShieldCheck } from "lucide-react";

export const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: Leaf,
      title: "100% Ingredientes Naturales",
      desc: "Formulaciones libres de químicos agresivos, pesticidas sintéticos o colorantes artificiales nocivos.",
      badge: "Pureza Celular",
    },
    {
      icon: Truck,
      title: "Envíos a toda Bolivia",
      desc: "Despachos rápidos, seguros y con seguro de carga a los 9 departamentos del país.",
      badge: "Cobertura Nacional",
    },
    {
      icon: UserCheck,
      title: "Asesoría Personalizada",
      desc: "Acompañamiento y seguimiento nutricional gratuito de la mano de distribuidores capacitados.",
      badge: "Atención 1 a 1",
    },
    {
      icon: ShieldCheck,
      title: "Calidad Certificada",
      desc: "Registro sanitario oficial y estrictos estándares de buenas prácticas de manufactura en Bolivia.",
      badge: "Seguridad Garantizada",
    },
  ];

  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((b, i) => {
          const Icon = b.icon;
          return (
            <div
              key={i}
              className="p-7 rounded-3xl bg-white border border-[#c8e4ed] hover:border-cyan-400/50 shadow-[0_10px_30px_rgba(8,145,178,0.05)] hover:shadow-[0_15px_35px_rgba(8,145,178,0.12)] hover:-translate-y-1.5 transition-all duration-300 text-left space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#ecfeff] border border-cyan-200 flex items-center justify-center text-[#0891b2] shadow-xs">
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7]">
                {b.badge}
              </div>
              <h4 className="font-display font-bold text-base text-[#082836]">
                {b.title}
              </h4>
              <p className="text-xs text-[#416373] leading-relaxed font-normal">
                {b.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
