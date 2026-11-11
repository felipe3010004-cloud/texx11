import { Product } from "./types";

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "tl-colageno",
    name: "Colágeno Marino Hidrolizado (Fórmula Reforzada)",
    normalPrice: 342,
    memberPrice: 205,
    category: "Nutrición Celular",
    isFeatured: true,
    desc: "Péptidos bioactivos de colágeno marino con ácido hialurónico, coenzima Q10 y açaí liofilizado para regeneración articular, cartílagos y piel firme.",
    longDesc: "Fórmula maestra de absorción celular inmediata. Contiene Colágeno Marino Hidrolizado, Ácido Hialurónico, Coenzima Q10, Mix de Vitaminas y Minerales y Pulpa de Açaí Liofilizado. Protege las articulaciones, poderoso antioxidante, ayuda a sanar heridas, fortalece tendones y humor vítreo del ojo, mejora y tonifica la piel, fortalece cabello y uñas, recupera la elasticidad y combate la flacidez facial y la celulitis.",
    presentation: "Caja de 30 sobres individuales de 10g (300g peso neto)",
    ingredients: [
      "Colágeno Marino Hidrolizado",
      "Ácido Hialurónico",
      "Coenzima Q10",
      "Pulpa de Açaí Liofilizado",
      "Mix de Vitaminas y Minerales"
    ],
    benefits: [
      "Protege las articulaciones y ligamentos",
      "Poderoso antioxidante y regenerador",
      "Mejora y tonifica la piel, cabello y uñas",
      "Combate la flacidez facial y la celulitis"
    ],
    img: "/assets/aistudio/colageno_f2bee034.jpeg"
  },
  {
    id: "tl-fibernat",
    name: "Fibernat Fibra Soluble & Detox Intestinal",
    normalPrice: 159,
    memberPrice: 95,
    category: "Digestión & Detox",
    isFeatured: true,
    desc: "Psyllium orgánico, moringa andina, pitahaya y citrato de magnesio para desinflamar el colon, lograr vientre plano y evacuar sin cólicos.",
    longDesc: "Bienestar intestinal óptimo con fórmula original reforzada. Contiene Psyllium, Moringa, Té Verde, Regaliz, Manzana Verde, Citrato de Magnesio y Pitahaya. Normaliza las deposiciones, ayuda a lograr un peso saludable, regenera la flora intestinal, elimina los radicales libres, controla los niveles de azúcar en la sangre, reduce el colesterol y aporta prebióticos activos.",
    presentation: "Caja de sobres de 6g c/u (Contenido Neto 50g)",
    ingredients: [
      "Psyllium Husk",
      "Moringa",
      "Té Verde",
      "Regaliz",
      "Manzana Verde Liofilizada",
      "Citrato de Magnesio",
      "Pitahaya"
    ],
    benefits: [
      "Normaliza las deposiciones y combate estreñimiento",
      "Ayuda a lograr un peso saludable y vientre plano",
      "Regenera la flora intestinal con prebióticos",
      "Controla niveles de azúcar en sangre y colesterol"
    ],
    img: "/assets/aistudio/fibernat_ea4f2feb.jpeg"
  },
  {
    id: "tl-coffeelife",
    name: "Coffee Life Premium (Ganoderma + Cordyceps Sinensis)",
    normalPrice: 359,
    memberPrice: 215,
    category: "Energía & Foco",
    isFeatured: true,
    desc: "Café arábica de altura enriquecido con Cordyceps Sinensis, hongo Ganoderma Lucidum y colágeno para energía celular limpia sin taquicardia ni reflujo.",
    longDesc: "Antioxidantes, energía y bienestar en una taza. Café funcional que combina Café Orgánico de Altura, Cordyceps Sinensis, Ganoderma Lucidum y Colágeno Marino Hidrolizado. Mejora la función renal, aumenta el nivel de oxígeno en la sangre y capacidad pulmonar (asma, bronquitis, tuberculosis), previene Alzheimer y Parkinson, mejora la salud sexual, apoya la recuperación en deportistas y regula el metabolismo de la glucosa.",
    presentation: "Caja de 30 sachets de 4.5g c/u",
    ingredients: [
      "Café Orgánico de Altura",
      "Cordyceps Sinensis",
      "Ganoderma Lucidum",
      "Colágeno Marino Hidrolizado"
    ],
    benefits: [
      "Aumenta el oxígeno en sangre y alivia afecciones respiratorias",
      "Mejora la función renal y la condición sexual",
      "Previene Alzheimer, Parkinson y fortalece el sistema inmune",
      "Aumenta la resistencia física y regula la glucosa"
    ],
    img: "/assets/aistudio/coffe_5b6d7e6d.jpeg"
  },
  {
    id: "tl-inmune",
    name: "Inmune Plus Multi-Defensas Activas",
    normalPrice: 409,
    memberPrice: 245,
    category: "Inmunidad & Defensas",
    isFeatured: true,
    desc: "Extractos bioactivos de Noni, Guanábana, Jengibre, Cúrcuma, Camu Camu y Flor de Jamaica para blindar el sistema respiratorio e inmunitario.",
    longDesc: "Refuerza tu inmunidad y previene enfermedades con fórmula original reforzada. Contiene frutas deshidratadas en polvo de Noni, Guanábana, Flor de Jamaica, Camu Camu, Jengibre, Cúrcuma y Vitamina C. Eleva el sistema inmunológico, controla la hipertensión, poderoso antioxidante, ayuda a bajar de peso, antiviral y antibacteriano, limpia vasos sanguíneos y previene enfermedades cardiovasculares.",
    presentation: "Caja de 30 sobres de 7g (210g peso neto)",
    ingredients: [
      "Noni Deshidratado en Polvo",
      "Guanábana",
      "Camu Camu (Vitamina C concentrada)",
      "Flor de Jamaica",
      "Jengibre",
      "Cúrcuma",
      "Aloe Vera"
    ],
    benefits: [
      "Eleva el sistema inmunológico frente a virus y bacterias",
      "Efectivo en casos de gripe, tos y afecciones bronquiales",
      "Controla hipertensión y limpia los vasos sanguíneos",
      "Ayuda y protege el hígado con potente acción antioxidante"
    ],
    img: "/assets/aistudio/inmune_da4699d2.jpeg"
  },
  {
    id: "tl-chocokids",
    name: "Choco Kids+ Nutrition (Sin Azúcar Refinada)",
    normalPrice: 409,
    memberPrice: 245,
    category: "Nutrición Celular",
    isFeatured: true,
    desc: "Malteada infantil bioactiva con proteína de soya, cacao alcalino, Omega 3 DHA, L-Arginina, probióticos y zinc para crecimiento y concentración.",
    longDesc: "Nutrición inteligente con Chocokids+ Nutrition: ¡crecer fuerte nunca fue tan delicioso! Contiene Proteína Aislada de Soja, Avena en polvo, Cacao Alcalino, Mix de Vitaminas y Minerales (Calcio, Hierro, Zinc), Omega 3, L-Arginina, Psyllium, Yogurt en polvo, Miel en polvo y Harina de Linaza. No contiene azúcar refinada. Estimula el crecimiento corporal, alivia trastornos como el TDAH y ansiedad, apoya el desarrollo cerebral y visual, y fortalece huesos y dientes.",
    presentation: "Caja de sobres de 8g c/u",
    ingredients: [
      "Proteína Aislada de Soja",
      "Avena en Polvo y Cacao Alcalino",
      "Omega 3 DHA/EPA",
      "L-Arginina",
      "Minerales (Calcio, Hierro Aminoquelado, Zinc)",
      "Yogurt en Polvo (Probióticos y Prebióticos)",
      "Miel en Polvo y Harina de Linaza"
    ],
    benefits: [
      "Estimula el crecimiento corporal y estatura (L-Arginina + Zinc)",
      "Ayuda al desarrollo cerebral, memoria y agudeza visual (Omega 3)",
      "Alivia trastornos como el TDAH y la ansiedad infantil",
      "Fortalece huesos, dientes y defensas con probióticos activos"
    ],
    img: "/assets/aistudio/chocokids_1b9b5c24.jpeg"
  }
];

export class ProductsModel {
  private products: Product[] = [...INITIAL_PRODUCTS];

  public getAll(): Product[] {
    return [...this.products];
  }

  public getById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  public search(query: string, category: string = "all"): Product[] {
    const q = query.toLowerCase().trim();
    return this.products.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q));

      const matchesCat = category === "all" || p.category === category;
      return matchesQuery && matchesCat;
    });
  }

  public updateProducts(newProducts: Product[]) {
    this.products = [...newProducts];
  }

  public setProducts(newProducts: Product[]) {
    this.products = [...newProducts];
  }

  public updateProduct(id: string, updatedData: Partial<Product>): boolean {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.products[idx] = { ...this.products[idx], ...updatedData };
      return true;
    }
    return false;
  }

  public addProduct(prod: Product): void {
    const existingIdx = this.products.findIndex((p) => p.id === prod.id);
    if (existingIdx !== -1) {
      this.products[existingIdx] = prod;
    } else {
      this.products.unshift(prod);
    }
  }

  public deleteProduct(id: string): boolean {
    const beforeLen = this.products.length;
    this.products = this.products.filter((p) => p.id !== id);
    return this.products.length < beforeLen;
  }
}

export const productsModel = new ProductsModel();

