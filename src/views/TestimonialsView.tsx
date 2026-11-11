import React from "react";
import { TestimonialItem } from "../models/types";
import { Star, MessageSquareQuote } from "lucide-react";

interface TestimonialsViewProps {
  testimonials: TestimonialItem[];
}

export const TestimonialsView: React.FC<TestimonialsViewProps> = ({ testimonials }) => {
  return (
    <section id="testimonios" className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ecfeff] border border-cyan-200 text-[#0891b2] text-xs font-bold uppercase tracking-wider shadow-xs">
          <MessageSquareQuote className="w-3.5 h-3.5 text-cyan-600" />
          <span>Experiencias Verificadas en Bolivia</span>
        </div>
        <h2 className="font-display font-black text-3xl sm:text-4xl text-[#082836] tracking-tight">
          Lo que dicen nuestros clientes y distribuidores
        </h2>
        <p className="text-[#416373] text-sm sm:text-base font-normal">
          Testimonios auténticos de personas y familias que transformaron su salud celular y su economía con Team Life.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((t, idx) => (
          <div
            key={t.id || idx}
            className="p-7 rounded-3xl bg-white/95 backdrop-blur-md border border-[#c8e4ed] hover:border-cyan-400/50 shadow-[0_10px_30px_rgba(8,145,178,0.06)] hover:shadow-[0_15px_40px_rgba(8,145,178,0.12)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-xs sm:text-sm text-[#325261] leading-relaxed italic">
                "{t.text}"
              </p>
            </div>

            <div className="pt-5 mt-5 border-t border-[#e2f1f7] flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#082836] block text-sm">{t.name}</span>
                {t.location && <span className="text-[11px] text-[#527585]">{t.location}</span>}
              </div>
              <span className="text-[11px] text-[#0891b2] font-semibold bg-[#ecfeff] px-2.5 py-1 rounded-full border border-cyan-200">
                {t.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
