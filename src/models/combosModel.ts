import { Combo } from "./types";

export const INITIAL_COMBOS: Combo[] = [
  {
    id: "kit-de-bienvenida",
    name: "Kit de Bienvenida (Afiliación Básica 40% OFF)",
    comboPrice: 250,
    desc: "Afiliación básica oficial como consumidor en Team Life Company S.R.L. por solo 250 Bs. Incluye caja de presentación con muestras de Fibernat, Inmune Plus y Colágeno Marino, más bolígrafo oficial. Activa de por vida 40% de descuento en todos los productos y ganas 150 Bs por cada nuevo afiliado directo.",
    includedProducts: [
      "Kit de Afiliación Oficial en caja de lujo",
      "Muestra oficial Fibernat Fibra Soluble (6g)",
      "Muestra oficial Inmune Plus Multi-Defensas (7g)",
      "Muestra oficial Colágeno Marino Hidrolizado (10g)",
      "Bolígrafo ejecutivo oficial Team Life 'Juntos Todo Es Posible'",
      "Código de socio vitalicio con 40% de descuento permanente"
    ],
    benefits: [
      "Descuento del 40% en todos los productos de por vida",
      "Patrocinios directos exprés de otros consumidores: ganas 150 Bs en mano",
      "Sin compras mínimas mensuales obligatorias",
      "Acceso oficial al plan de compensación y capacitaciones"
    ],
    isBusinessCombo: false,
    profitPercentage: 40,
    img: "/assets/aistudio/kit-basico_6d3d0c57.jpeg"
  },
  {
    id: "combo-1-empresarial",
    name: "Combo 1 Empresarial (6 Productos · 60% Ganancias)",
    comboPrice: 1360,
    desc: "Paquete empresarial de 6 productos de alta rotación por Bs 1.360. Asigna Bs 1.125 comisionables y genera 60% de ganancia en mano.",
    commissionable: 1125,
    profitPercentage: 60,
    isBusinessCombo: true,
    includedProducts: [
      "2x Colágeno Marino Hidrolizado (Caja 30 sobres de 10g)",
      "2x Inmune Plus Multi-Defensas Activas (Caja 30 sobres de 7g)",
      "2x Fibernat Fibra Soluble (Caja sobres 6g - 50g neto)"
    ],
    benefits: [
      "60% de ganancias netas en venta directa",
      "1.125 Bs de volumen comisionable para tu red",
      "Combinación clave de regeneración, inmunidad y detox",
      "Surtido de mayor salida y rotación en Bolivia"
    ],
    img: "/assets/aistudio/combo1_5355f4fa.jpeg"
  },
  {
    id: "combo-2-empresarial",
    name: "Combo 2 Empresarial (12 Productos · 73% Ganancias)",
    comboPrice: 2500,
    desc: "Paquete empresarial de 12 productos bioactivos por Bs 2.500. Asigna Bs 2.057 comisionables y genera 73% de rentabilidad.",
    commissionable: 2057,
    profitPercentage: 73,
    isBusinessCombo: true,
    includedProducts: [
      "4x Colágeno Marino Hidrolizado Reforzado",
      "3x Inmune Plus Multi-Defensas Activas",
      "4x Fibernat Fibra Soluble & Detox",
      "1x Coffee Life Premium (Ganoderma + Cordyceps)"
    ],
    benefits: [
      "73% de ganancias sobre tu inversión inicial",
      "2.057 Bs de volumen comisionable para calificaciones",
      "Incluye toda la línea estrella de salud y café gourmet",
      "Ideal para distribuidores activos con cartera de clientes"
    ],
    img: "/assets/aistudio/combo2_d6c89a9f.jpeg"
  },
  {
    id: "combo-3-empresarial",
    name: "Combo 3 Empresarial (25 Productos · 87% Ganancias)",
    comboPrice: 4650,
    desc: "El paquete empresarial de máxima rentabilidad por Bs 4.650. Incluye 25 productos, 3.806 Bs comisionables, 87% de ganancia y activa el Bono Impulso Plus de 1.500 Bs.",
    commissionable: 3806,
    profitPercentage: 87,
    isBusinessCombo: true,
    includedProducts: [
      "7x Colágeno Marino Hidrolizado Reforzado",
      "6x Inmune Plus Multi-Defensas Activas",
      "10x Fibernat Fibra Soluble & Detox",
      "2x Coffee Life Premium (Ganoderma + Cordyceps)"
    ],
    benefits: [
      "87% de ganancias en comercialización directa",
      "3.806 Bs comisionables para plan de carrera y rangos",
      "Activa el Bono Impulso Plus oficial de Bs 1.500 (+Bs 300 ascendente)",
      "Stock completo de alta escala con máxima rentabilidad"
    ],
    img: "/assets/aistudio/combo3_08720b98.jpeg"
  }
];

export class CombosModel {
  private combos: Combo[] = [...INITIAL_COMBOS];

  public getAll(): Combo[] {
    return [...this.combos];
  }

  public getById(id: string): Combo | undefined {
    return this.combos.find((c) => c.id === id);
  }

  public getBusinessCombos(): Combo[] {
    return this.combos.filter((c) => c.isBusinessCombo || (c.profitPercentage && c.profitPercentage > 50));
  }

  public setCombos(newCombos: Combo[]) {
    this.combos = [...newCombos];
  }

  public updateCombo(id: string, updatedData: Partial<Combo>): boolean {
    const idx = this.combos.findIndex((c) => c.id === id);
    if (idx !== -1) {
      this.combos[idx] = { ...this.combos[idx], ...updatedData };
      return true;
    }
    return false;
  }

  public addCombo(combo: Combo): void {
    const existingIdx = this.combos.findIndex((c) => c.id === combo.id);
    if (existingIdx !== -1) {
      this.combos[existingIdx] = combo;
    } else {
      this.combos.unshift(combo);
    }
  }

  public deleteCombo(id: string): boolean {
    const beforeLen = this.combos.length;
    this.combos = this.combos.filter((c) => c.id !== id);
    return this.combos.length < beforeLen;
  }
}

export const combosModel = new CombosModel();

