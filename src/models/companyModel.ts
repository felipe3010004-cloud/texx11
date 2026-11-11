import { CompanyInfo, VideoItem, TestimonialItem } from "./types";

export interface ExtendedCompanyInfo extends CompanyInfo {
  foundersPhoto: string;
  logo: string;
  presentationPdf: string;
}

export let COMPANY_INFO: ExtendedCompanyInfo = {
  name: "TEAM LIFE COMPANY S.R.L.",
  commercialName: "Equipo Vida S.R.L.",
  nit: "572065026",
  senasag: "Certificado de Registro Sanitario No. 166/2025 (Santa Cruz, 17 de Febrero de 2025)",
  seprec: "Matrícula de Comercio Vigente SEPREC Bolivia",
  founders: "Julian Rodriguez & Mery Ruiz",
  foundersProfile:
    "Experiencia y conocimiento por más de 20 años en el campo de la medicina convencional, estudio en nuevas alternativas medicinales, nutrición y otros. Más de 10 años en network marketing. Líderes visionarios y firmes creyentes de sus conocimientos, capacidades y experiencia, apostando por el talento del LIDERAZGO en BOLIVIA con la convicción de que 'JUNTOS TODO ES POSIBLE'.",
  mission:
    "Desarrollar a cada uno de nuestros distribuidores y líderes para que alcancen su máximo potencial, ofreciendo productos naturales de alta calidad que mejoren su salud, bienestar y estilo de vida para todas sus familias.",
  vision:
    "Ser una de las empresas nacionales líderes en la industria, reconocida por nuestra innovación, calidad y compromiso con la salud y el bienestar de nuestra comunidad. Queremos inspirar y capacitar a millones de personas en todo el mundo para que vivan una vida plena, saludable, próspera y que se conviertan en agentes de cambio positivo.",
  values: "Ética, Respeto, Excelencia y Liderazgo. Plan de compensación con 75% de bonos sin candados.",
  defaultWhatsapp: "59178945612",
  foundersPhoto: "/assets/aistudio/ceo_22d00367.jpeg",
  logo: "/assets/aistudio/logo_f976621f.png",
  presentationPdf: "/assets/aistudio/Presentacion_Oficial_Kit_32fb3d4c.pdf"
};

export function updateCompanyInfo(newData: Partial<ExtendedCompanyInfo>) {
  COMPANY_INFO = { ...COMPANY_INFO, ...newData };
}


export const OFFICIAL_VIDEOS: VideoItem[] = [
  {
    id: "vid-1",
    title: "Presentación Oficial Team Life & Filosofía de Salud Celular",
    url: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0",
    tag: "Institucional"
  },
  {
    id: "vid-2",
    title: "Beneficios de Cordyceps Sinensis y Ganoderma en Coffee Life",
    url: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0",
    tag: "Ciencia Bioactiva"
  },
  {
    id: "vid-3",
    title: "Testimonios de Recuperación Articular con Colágeno Marino",
    url: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0",
    tag: "Testimonios Reales"
  }
];

export const OFFICIAL_TESTIMONIALS: TestimonialItem[] = [
  {
    id: "t-1",
    name: "Dra. Carmen Mendoza",
    location: "La Paz, Bolivia",
    rating: 5,
    text: "Llevo 18 años como médica general. Al analizar la fórmula de Colágeno Marino con Ácido Hialurónico y Açaí de Team Life, comprobé una respuesta de regeneración articular notable en pacientes con artrosis de rodilla.",
    date: "14 Feb 2025"
  },
  {
    id: "t-2",
    name: "Lic. Javier Zeballos",
    location: "Santa Cruz de la Sierra",
    rating: 5,
    text: "El Coffee Life con Cordyceps me cambió la rutina laboral. Aporta energía limpia y enfoque mental constante sin causarme la taquicardia ni acidez que me provocaban otros cafés comerciales.",
    date: "28 Feb 2025"
  },
  {
    id: "t-3",
    name: "Rosmery Ticona",
    location: "Cochabamba, Bolivia",
    rating: 5,
    text: "Inicié consumiendo Fibernat por estreñimiento crónico y en menos de 3 días logré una desinflamación increíble. Hoy formo parte de la red con el Combo 2 y mis ingresos mensuales superan con creces el sueldo mínimo.",
    date: "05 Mar 2025"
  }
];
