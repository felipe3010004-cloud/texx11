import React, { useState, useEffect, useMemo } from "react";
import {
  Product,
  Combo,
  OrderRecord,
  MemberUser,
  MemberStatus,
  AiKnowledgeItem,
  AuditLogItem,
  PagosyaCheckoutRecord,
  ComprobanteQrRecord,
  StaticQrConfig,
  StaticQrPaymentStatus,
} from "../models/types";
import { db, firebase, auth } from "../models/firebaseModel";
import { authController } from "../controllers/authController";
import { aiController } from "../controllers/aiController";
import { auditController } from "../controllers/auditController";
import { pagosyaController } from "../controllers/pagosyaController";
import { orderController } from "../controllers/orderController";
import { staticQrController } from "../controllers/staticQrController";
import { productsModel } from "../models/productsModel";
import { combosModel } from "../models/combosModel";
import { COMPANY_INFO, updateCompanyInfo } from "../models/companyModel";
import { isSafePublicUrl, extractProductFromUrl } from "../utils/urlExtractor";
import { OrderDetailModalView } from "./OrderDetailModalView";
import { ComprobanteReviewModalView } from "./ComprobanteReviewModalView";
import {
  LayoutDashboard,
  Clock,
  ShoppingBag,
  Users,
  UserCheck,
  Shield,
  QrCode,
  Settings,
  Search,
  RefreshCw,
  X,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Phone,
  MapPin,
  Check,
  Copy,
  Bot,
  History,
  AlertTriangle,
  Menu,
  ChevronRight,
  Filter,
  Share2,
  Send,
  Building,
  UploadCloud,
  FileCheck,
  Eye,
  ZoomIn,
} from "lucide-react";

interface AdminPanelViewProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRefreshProducts: () => void;
  onLogout: () => void;
  currentUser?: any;
}

type AdminTab =
  | "resumen"
  | "pedidos"
  | "verificacion_qr"
  | "catalogo"
  | "clientes"
  | "vendedores"
  | "usuarios"
  | "pagosya"
  | "configuracion";

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  isOpen,
  onClose,
  products,
  onRefreshProducts,
  onLogout,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>("resumen");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [combosList, setCombosList] = useState<Combo[]>(() => combosModel.getAll());
  const [knowledgeList, setKnowledgeList] = useState<AiKnowledgeItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [pagosyaCheckouts, setPagosyaCheckouts] = useState<PagosyaCheckoutRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string>("");

  // Operator Info for history tracking
  const currentAdminUser = {
    uid: currentUser?.uid || auth.currentUser?.uid || "admin-root",
    nombre: currentUser?.displayName || auth.currentUser?.displayName || "Administrador Central",
    email: currentUser?.email || auth.currentUser?.email || "admin@teamlife.com",
    role: "admin" as const,
  };

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // -------------------------------------------------------------
  // ORDERS FILTERS
  // -------------------------------------------------------------
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("todos");
  const [orderDateFilter, setOrderDateFilter] = useState<string>("todos");
  const [orderVendorFilter, setOrderVendorFilter] = useState<string>("todos");
  const [orderSearch, setOrderSearch] = useState("");

  // -------------------------------------------------------------
  // STATIC QR PAYMENT VERIFICATION & CONFIG
  // -------------------------------------------------------------
  const [comprobantes, setComprobantes] = useState<ComprobanteQrRecord[]>([]);
  const [comprobanteStatusFilter, setComprobanteStatusFilter] = useState<string>("todos");
  const [comprobanteDateFilter, setComprobanteDateFilter] = useState<string>("todos");
  const [comprobanteVendorFilter, setComprobanteVendorFilter] = useState<string>("todos");
  const [comprobanteSearch, setComprobanteSearch] = useState("");
  const [selectedComprobante, setSelectedComprobante] = useState<ComprobanteQrRecord | null>(null);
  const [isComprobanteModalOpen, setIsComprobanteModalOpen] = useState(false);

  // Static QR Settings modal/panel state
  const [isQrConfigModalOpen, setIsQrConfigModalOpen] = useState(false);
  const [qrConfig, setQrConfig] = useState<StaticQrConfig | null>(null);
  const [qrActive, setQrActive] = useState(true);
  const [qrBank, setQrBank] = useState("Banco Unión S.A.");
  const [qrTitular, setQrTitular] = useState("BAUTISTA HUANCA DIEGO ELVIS");
  const [qrAccount, setQrAccount] = useState("61108714");
  const [qrAccountType, setQrAccountType] = useState("Caja de Ahorro / QR Yasta");
  const [qrInstructions, setQrInstructions] = useState("");
  const [qrImgUrl, setQrImgUrl] = useState("/assets/aistudio/QR1_c0569f21.jpeg");
  const [isSavingQrConfig, setIsSavingQrConfig] = useState(false);
  const [isUploadingQrImage, setIsUploadingQrImage] = useState(false);
  const [zoomedQrImage, setZoomedQrImage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // CATALOG SUBTABS & MODALS
  // -------------------------------------------------------------
  const [catalogSubTab, setCatalogSubTab] = useState<"productos" | "combos">("productos");

  // Edit Product Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState("");
  const [editProdDesc, setEditProdDesc] = useState("");
  const [editProdNormalPrice, setEditProdNormalPrice] = useState("");
  const [editProdMemberPrice, setEditProdMemberPrice] = useState("");
  const [editProdPromoPrice, setEditProdPromoPrice] = useState("");
  const [editProdCategory, setEditProdCategory] = useState("Nutrición Celular");
  const [editProdImg, setEditProdImg] = useState("");
  const [editProdStatus, setEditProdStatus] = useState<"publicado" | "oculto" | "desactivado">("publicado");
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Add Product Manual Modal
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdMemberPrice, setNewProdMemberPrice] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Nutrición Celular");
  const [newProdImg, setNewProdImg] = useState("");

  // Add Product by Link Modal
  const [isAddByLinkOpen, setIsAddByLinkOpen] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState("");
  const [isExtractingLink, setIsExtractingLink] = useState(false);
  const [linkExtractionNotice, setLinkExtractionNotice] = useState<string | null>(null);
  const [extractedPreview, setExtractedPreview] = useState<{
    name: string;
    desc: string;
    normalPrice: string;
    memberPrice: string;
    category: string;
    img: string;
    sourceUrl: string;
    productUrl: string;
  } | null>(null);

  // Edit Combo Modal
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [editComboName, setEditComboName] = useState("");
  const [editComboDesc, setEditComboDesc] = useState("");
  const [editComboPrice, setEditComboPrice] = useState("");
  const [editComboPromoPrice, setEditComboPromoPrice] = useState("");
  const [editComboImg, setEditComboImg] = useState("");
  const [editComboIncludedProducts, setEditComboIncludedProducts] = useState<string[]>([]);
  const [editComboNewComponent, setEditComboNewComponent] = useState("");
  const [editComboStatus, setEditComboStatus] = useState<"publicado" | "oculto" | "desactivado">("publicado");
  const [isSavingCombo, setIsSavingCombo] = useState(false);

  // -------------------------------------------------------------
  // MEMBERS / VENDORS FILTERS & MODALS
  // -------------------------------------------------------------
  const [vendorFilterStatus, setVendorFilterStatus] = useState<string>("todos");
  const [vendorSearch, setVendorSearch] = useState("");
  const [editingMember, setEditingMember] = useState<MemberUser | null>(null);
  const [editMemberRole, setEditMemberRole] = useState<"vendedor" | "admin">("vendedor");
  const [editMemberStatus, setEditMemberStatus] = useState<MemberStatus>("autorizado");
  const [editMemberNotes, setEditMemberNotes] = useState("");
  const [isSavingMember, setIsSavingMember] = useState(false);

  // New Member Modal
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberPass, setNewMemberPass] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"vendedor" | "admin">("vendedor");

  // -------------------------------------------------------------
  // PAGOSYA SUPERVISION FILTERS & VERIFICATION
  // -------------------------------------------------------------
  const [pagosyaFilterStatus, setPagosyaFilterStatus] = useState<string>("todos");
  const [pagosyaFilterEnv, setPagosyaFilterEnv] = useState<string>("todos");
  const [isVerifyingCheckout, setIsVerifyingCheckout] = useState<string | null>(null);

  // -------------------------------------------------------------
  // CONFIGURATION SUBTABS
  // -------------------------------------------------------------
  const [configSubTab, setConfigSubTab] = useState<"empresa" | "ia" | "auditoria">("empresa");
  const [cfgName, setCfgName] = useState(COMPANY_INFO.name);
  const [cfgCommercialName, setCfgCommercialName] = useState(COMPANY_INFO.commercialName);
  const [cfgNit, setCfgNit] = useState(COMPANY_INFO.nit);
  const [cfgSenasag, setCfgSenasag] = useState(COMPANY_INFO.senasag);
  const [cfgSeprec, setCfgSeprec] = useState(COMPANY_INFO.seprec);
  const [cfgFounders, setCfgFounders] = useState(COMPANY_INFO.founders);
  const [cfgDefaultWhatsapp, setCfgDefaultWhatsapp] = useState(COMPANY_INFO.defaultWhatsapp);
  const [cfgMission, setCfgMission] = useState(COMPANY_INFO.mission);
  const [cfgVision, setCfgVision] = useState(COMPANY_INFO.vision);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // AI Knowledge Form
  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeCategory, setKnowledgeCategory] = useState<AiKnowledgeItem["category"]>("general");
  const [knowledgeContent, setKnowledgeContent] = useState("");
  const [testPrompt, setTestPrompt] = useState("");
  const [testResponse, setTestResponse] = useState<string | null>(null);

  // Copied state
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  const showFeedback = (msg: string) => {
    setStatusFeedback(msg);
    setTimeout(() => setStatusFeedback(""), 4500);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Cargar pedidos
      const loadedOrders = await orderController.getAllOrders();
      setOrders(loadedOrders);

      // Si el modal de detalle de pedido está abierto, refrescarlo
      if (selectedOrder) {
        const found = loadedOrders.find((o) => o.id === selectedOrder.id);
        if (found) setSelectedOrder(found);
      }

      // 2. Cargar miembros / distribuidores
      const loadedMembers = await authController.getAllMembers();
      setMembers(loadedMembers);

      // 3. Cargar combos
      setCombosList(combosModel.getAll());

      // 4. Cargar checkouts PagosYa
      try {
        const checkouts = await pagosyaController.getAllCheckouts();
        setPagosyaCheckouts(checkouts);
      } catch (err) {
        console.warn("Nota checkouts PagosYa:", err);
      }

      // 5. Cargar empresa
      try {
        const configDoc = await db.collection("config").doc("empresa").get();
        if (configDoc.exists) {
          const cfg = configDoc.data()!;
          updateCompanyInfo(cfg as any);
          setCfgName(cfg.name || COMPANY_INFO.name);
          setCfgCommercialName(cfg.commercialName || COMPANY_INFO.commercialName);
          setCfgNit(cfg.nit || COMPANY_INFO.nit);
          setCfgSenasag(cfg.senasag || COMPANY_INFO.senasag);
          setCfgSeprec(cfg.seprec || COMPANY_INFO.seprec);
          setCfgFounders(cfg.founders || COMPANY_INFO.founders);
          setCfgDefaultWhatsapp(cfg.defaultWhatsapp || COMPANY_INFO.defaultWhatsapp);
          setCfgMission(cfg.mission || COMPANY_INFO.mission);
          setCfgVision(cfg.vision || COMPANY_INFO.vision);
        }
      } catch {
        // Ok
      }

      // 6. Cargar base de conocimiento IA
      const loadedKnowledge = await aiController.getAllKnowledgeItems();
      setKnowledgeList(loadedKnowledge);

      // 7. Cargar logs de auditoría
      const loadedLogs = await auditController.getRecentLogs(40);
      setAuditLogs(loadedLogs);

      // 8. Cargar comprobantes QR estático
      try {
        const loadedComps = await staticQrController.getComprobantes();
        setComprobantes(loadedComps);
        if (selectedComprobante) {
          const found = loadedComps.find((c) => c.id === selectedComprobante.id);
          if (found) setSelectedComprobante(found);
        }
      } catch (cErr) {
        console.warn("Aviso cargando comprobantes QR:", cErr);
      }

      // 9. Cargar configuración de QR estático
      try {
        const cfg = await staticQrController.getConfig();
        setQrConfig(cfg);
        setQrActive(cfg.activo);
        setQrBank(cfg.banco);
        setQrTitular(cfg.titular);
        setQrAccount(cfg.numeroCuenta);
        setQrAccountType(cfg.tipoCuenta || "Caja de Ahorro / QR Yasta");
        setQrInstructions(cfg.instrucciones || "");
        setQrImgUrl(cfg.qrImageUrl);
      } catch (qErr) {
        console.warn("Aviso cargando config QR estático:", qErr);
      }
    } catch (err) {
      console.warn("Error cargando datos en AdminPanel:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // -------------------------------------------------------------
  // PRODUCT HANDLERS
  // -------------------------------------------------------------
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setEditProdName(prod.name || "");
    setEditProdDesc(prod.desc || "");
    setEditProdNormalPrice(String(prod.normalPrice || ""));
    setEditProdMemberPrice(prod.memberPrice ? String(prod.memberPrice) : "");
    setEditProdPromoPrice(prod.promoPrice ? String(prod.promoPrice) : "");
    setEditProdCategory(prod.category || "Nutrición Celular");
    setEditProdImg(prod.img || "");
    setEditProdStatus(prod.status || "publicado");
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const normalP = parseFloat(editProdNormalPrice);
    if (isNaN(normalP) || normalP <= 0) {
      alert("Introduce un precio normal válido.");
      return;
    }

    setIsSavingProduct(true);
    try {
      const payload: Partial<Product> = {
        name: editProdName.trim(),
        desc: editProdDesc.trim(),
        normalPrice: normalP,
        memberPrice: editProdMemberPrice ? parseFloat(editProdMemberPrice) : Math.round(normalP * 0.6),
        promoPrice: editProdPromoPrice ? parseFloat(editProdPromoPrice) : undefined,
        category: editProdCategory,
        img: editProdImg.trim() || editingProduct.img,
        status: editProdStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("productos").doc(editingProduct.id).set(payload, { merge: true });
      productsModel.updateProduct(editingProduct.id, payload);
      onRefreshProducts();

      await auditController.logEvent(
        `Producto modificado: ${editingProduct.name}`,
        "catalogo",
        `ID: ${editingProduct.id}. Precio: Bs ${normalP}.`,
        currentAdminUser.nombre
      );

      showFeedback(`Producto "${editingProduct.name}" actualizado.`);
      setEditingProduct(null);
      loadAllData();
    } catch (err: any) {
      alert("Error guardando producto: " + err.message);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleCreateProductManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      alert("El nombre del producto es obligatorio.");
      return;
    }
    const priceNum = parseFloat(newProdPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Introduce un precio válido mayor a 0.");
      return;
    }

    try {
      const memberP = newProdMemberPrice ? parseFloat(newProdMemberPrice) : Math.round(priceNum * 0.6);
      const docRef = await db.collection("productos").add({
        nombre: newProdName.trim(),
        descripcion: newProdDesc.trim(),
        precio: priceNum,
        precioSocio: memberP,
        categoria: newProdCategory,
        imagen: newProdImg.trim() || "/assets/aistudio/colageno_f2bee034.jpeg",
        activo: true,
        status: "publicado",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      const newProd: Product = {
        id: docRef.id,
        name: newProdName.trim(),
        desc: newProdDesc.trim(),
        normalPrice: priceNum,
        memberPrice: memberP,
        category: newProdCategory,
        img: newProdImg.trim() || "/assets/aistudio/colageno_f2bee034.jpeg",
        status: "publicado",
      };

      productsModel.addProduct(newProd);
      onRefreshProducts();
      setIsNewProductModalOpen(false);
      setNewProdName("");
      setNewProdDesc("");
      setNewProdPrice("");
      setNewProdMemberPrice("");
      setNewProdImg("");
      showFeedback(`Producto "${newProd.name}" creado con éxito.`);
      loadAllData();
    } catch (err: any) {
      alert("Error creando producto: " + err.message);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!confirm(`¿Eliminar definitivamente el producto "${prod.name}" del catálogo?`)) return;
    try {
      await db.collection("productos").doc(prod.id).delete();
      productsModel.deleteProduct(prod.id);
      onRefreshProducts();
      showFeedback(`Producto "${prod.name}" eliminado.`);
      loadAllData();
    } catch (err: any) {
      alert("Error eliminando: " + err.message);
    }
  };

  // -------------------------------------------------------------
  // ADD PRODUCT BY LINK HANDLERS
  // -------------------------------------------------------------
  const handleExtractFromUrl = async () => {
    if (!linkInputUrl.trim()) return;
    if (!isSafePublicUrl(linkInputUrl)) {
      alert("Por favor ingresa una URL web válida que comience con http:// o https://");
      return;
    }

    setIsExtractingLink(true);
    setLinkExtractionNotice(null);
    try {
      const result = await extractProductFromUrl(linkInputUrl);
      setExtractedPreview({
        name: result.data.name || "Producto Importado",
        desc: result.data.desc || "",
        normalPrice: result.data.normalPrice ? String(result.data.normalPrice) : "190",
        memberPrice: result.data.promoPrice
          ? String(result.data.promoPrice)
          : String(Math.round((result.data.normalPrice || 190) * 0.6)),
        category: result.data.category || "Nutrición Celular",
        img:
          result.data.img ||
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
        sourceUrl: result.data.sourceUrl,
        productUrl: result.data.productUrl || result.data.sourceUrl,
      });

      if (result.notice) setLinkExtractionNotice(result.notice);
    } catch (err: any) {
      alert("Error analizando URL: " + err.message);
    } finally {
      setIsExtractingLink(false);
    }
  };

  const handleConfirmAddByLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractedPreview) return;

    const normalP = parseFloat(extractedPreview.normalPrice);
    if (isNaN(normalP) || normalP <= 0) {
      alert("Introduce un precio válido.");
      return;
    }
    const memberP = extractedPreview.memberPrice
      ? parseFloat(extractedPreview.memberPrice)
      : Math.round(normalP * 0.6);

    try {
      const docRef = await db.collection("productos").add({
        nombre: extractedPreview.name.trim(),
        descripcion: extractedPreview.desc.trim(),
        precio: normalP,
        precioSocio: memberP,
        categoria: extractedPreview.category,
        imagen: extractedPreview.img,
        sourceUrl: extractedPreview.sourceUrl,
        productUrl: extractedPreview.productUrl,
        status: "publicado",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      const newProd: Product = {
        id: docRef.id,
        name: extractedPreview.name.trim(),
        desc: extractedPreview.desc.trim(),
        normalPrice: normalP,
        memberPrice: memberP,
        category: extractedPreview.category,
        img: extractedPreview.img,
        sourceUrl: extractedPreview.sourceUrl,
        productUrl: extractedPreview.productUrl,
        status: "publicado",
      };

      productsModel.addProduct(newProd);
      onRefreshProducts();
      setIsAddByLinkOpen(false);
      setLinkInputUrl("");
      setExtractedPreview(null);
      showFeedback(`Producto "${newProd.name}" importado con éxito.`);
      loadAllData();
    } catch (err: any) {
      alert("Error importando producto: " + err.message);
    }
  };

  // -------------------------------------------------------------
  // COMBO HANDLERS
  // -------------------------------------------------------------
  const handleOpenEditCombo = (combo: Combo) => {
    setEditingCombo(combo);
    setEditComboName(combo.name || "");
    setEditComboDesc(combo.desc || "");
    setEditComboPrice(String(combo.comboPrice || ""));
    setEditComboPromoPrice(combo.promoPrice ? String(combo.promoPrice) : "");
    setEditComboImg(combo.img || "");
    setEditComboIncludedProducts(combo.includedProducts ? [...combo.includedProducts] : []);
    setEditComboNewComponent("");
    setEditComboStatus(combo.status || "publicado");
  };

  const handleSaveEditCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCombo) return;

    const priceNum = parseFloat(editComboPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      alert("Introduce un precio válido.");
      return;
    }

    setIsSavingCombo(true);
    try {
      const updatedPayload: Partial<Combo> = {
        name: editComboName.trim(),
        desc: editComboDesc.trim(),
        comboPrice: priceNum,
        promoPrice: editComboPromoPrice ? parseFloat(editComboPromoPrice) : undefined,
        img: editComboImg.trim() || editingCombo.img,
        includedProducts: editComboIncludedProducts,
        status: editComboStatus,
      };

      await db.collection("combos").doc(editingCombo.id).set(updatedPayload, { merge: true });
      combosModel.updateCombo(editingCombo.id, updatedPayload);
      setCombosList(combosModel.getAll());
      showFeedback(`Combo "${editComboName}" actualizado.`);
      setEditingCombo(null);
    } catch (err: any) {
      alert("Error guardando combo: " + err.message);
    } finally {
      setIsSavingCombo(false);
    }
  };

  const handleDeleteCombo = async (combo: Combo) => {
    if (!confirm(`¿Eliminar el combo "${combo.name}"?`)) return;
    try {
      await db.collection("combos").doc(combo.id).delete();
      combosModel.deleteCombo(combo.id);
      setCombosList(combosModel.getAll());
      showFeedback(`Combo "${combo.name}" eliminado.`);
    } catch (err: any) {
      alert("Error eliminando combo: " + err.message);
    }
  };

  // -------------------------------------------------------------
  // MEMBER / DISTRIBUTOR HANDLERS
  // -------------------------------------------------------------
  const handleOpenEditMember = (m: MemberUser) => {
    setEditingMember(m);
    setEditMemberRole(m.role || "vendedor");
    setEditMemberStatus(m.status || "autorizado");
    setEditMemberNotes(m.notasAdmin || "");
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setIsSavingMember(true);
    try {
      await db.collection("users").doc(editingMember.id).set(
        {
          role: editMemberRole,
          status: editMemberStatus,
          notasAdmin: editMemberNotes.trim(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await auditController.logEvent(
        `Miembro actualizado: ${editingMember.nombreCompleto}`,
        "miembros",
        `Rol: ${editMemberRole}, Estado: ${editMemberStatus}`,
        currentAdminUser.nombre
      );

      showFeedback(`Datos de "${editingMember.nombreCompleto}" actualizados.`);
      setEditingMember(null);
      loadAllData();
    } catch (err: any) {
      alert("Error actualizando miembro: " + err.message);
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleCreateMemberManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      alert("Nombre y correo son obligatorios.");
      return;
    }

    try {
      const cleanPhone = authController.cleanPhone(newMemberPhone);
      const email = authController.normalizeEmail(newMemberEmail);

      const docRef = await db.collection("users").add({
        nombreCompleto: newMemberName.trim(),
        email,
        phone: cleanPhone,
        countryCode: "591",
        role: newMemberRole,
        status: "autorizado",
        clics: 0,
        totalVentas: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      setIsNewMemberModalOpen(false);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberPhone("");
      setNewMemberPass("");
      showFeedback(`Miembro registrado con ID: ${docRef.id}`);
      loadAllData();
    } catch (err: any) {
      alert("Error registrando miembro: " + err.message);
    }
  };

  // -------------------------------------------------------------
  // PAGOSYA CHECKOUT VERIFICATION HANDLER
  // -------------------------------------------------------------
  const handleVerifyPagosyaCheckout = async (checkout: PagosyaCheckoutRecord) => {
    setIsVerifyingCheckout(checkout.checkoutId);
    try {
      const res = await pagosyaController.checkStatus(checkout.checkoutId, checkout.orderId);
      if (res.status === "completed") {
        showFeedback(`¡Pago confirmado oficialmente por PagosYa para pedido #${checkout.orderId}!`);
      } else if (res.status === "expired") {
        showFeedback(`El checkout #${checkout.checkoutId} figura como expirado en PagosYa.`);
      } else {
        showFeedback(`Estado en PagosYa verificado: ${(res.status || "pendiente").toUpperCase()}`);
      }
      loadAllData();
    } catch (err: any) {
      showFeedback(`Error al consultar PagosYa: ${err.message || "Error de red"}`);
    } finally {
      setIsVerifyingCheckout(null);
    }
  };

  // -------------------------------------------------------------
  // COMPANY & KNOWLEDGE HANDLERS
  // -------------------------------------------------------------
  const handleSaveCompanyConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const payload = {
        name: cfgName.trim(),
        commercialName: cfgCommercialName.trim(),
        nit: cfgNit.trim(),
        senasag: cfgSenasag.trim(),
        seprec: cfgSeprec.trim(),
        founders: cfgFounders.trim(),
        defaultWhatsapp: cfgDefaultWhatsapp.trim(),
        mission: cfgMission.trim(),
        vision: cfgVision.trim(),
      };

      await db.collection("config").doc("empresa").set(payload, { merge: true });
      updateCompanyInfo(payload as any);
      showFeedback("Datos corporativos de la empresa actualizados.");
    } catch (err: any) {
      alert("Error guardando datos de empresa: " + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSaveKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!knowledgeTitle.trim() || !knowledgeContent.trim()) {
      alert("Título y contenido requeridos.");
      return;
    }

    try {
      await aiController.saveKnowledgeItem({
        title: knowledgeTitle.trim(),
        category: knowledgeCategory,
        content: knowledgeContent.trim(),
        status: "publicado",
      });
      setKnowledgeTitle("");
      setKnowledgeContent("");
      showFeedback("Artículo agregado a la base de conocimiento IA.");
      loadAllData();
    } catch (err: any) {
      alert("Error guardando conocimiento: " + err.message);
    }
  };

  const handleDeleteKnowledge = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar artículo "${title}"?`)) return;
    try {
      await aiController.deleteKnowledgeItem(id, title);
      showFeedback("Artículo eliminado.");
      loadAllData();
    } catch (err: any) {
      alert("Error eliminando: " + err.message);
    }
  };

  const handleTestAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPrompt.trim()) return;
    setTestResponse("Consultando con Gemini...");
    try {
      const res = await aiController.generateResponse(testPrompt);
      setTestResponse(res.reply);
    } catch {
      setTestResponse("Error al consultar el servicio de IA.");
    }
  };

  // -------------------------------------------------------------
  // DERIVED DATA & FILTERS
  // -------------------------------------------------------------
  // Extract unique clients list from orders
  const clientsList = useMemo(() => {
    const map = new Map<string, {
      nombre: string;
      celular: string;
      departamento: string;
      pedidosCount: number;
      totalGastado: number;
      ultimaFecha: Date;
    }>();

    orders.forEach((o) => {
      const key = o.clienteCelular.replace(/\D/g, "") || o.clienteNombre.toLowerCase();
      const existing = map.get(key);
      const orderDate = new Date(o.fecha);

      if (existing) {
        existing.pedidosCount += 1;
        existing.totalGastado += o.total;
        if (orderDate > existing.ultimaFecha) {
          existing.ultimaFecha = orderDate;
          existing.departamento = o.departamento;
        }
      } else {
        map.set(key, {
          nombre: o.clienteNombre,
          celular: o.clienteCelular,
          departamento: o.departamento,
          pedidosCount: 1,
          totalGastado: o.total,
          ultimaFecha: orderDate,
        });
      }
    });

    return Array.from(map.values());
  }, [orders]);

  // Unique vendors list for filter dropdown
  const uniqueVendorOptions = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.vendedorId) set.add(o.vendedorId);
    });
    return Array.from(set);
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Estado filter
      if (orderStatusFilter !== "todos" && o.estado !== orderStatusFilter) return false;

      // 2. Vendor filter
      if (orderVendorFilter !== "todos") {
        if (orderVendorFilter === "directo" && o.vendedorId) return false;
        if (orderVendorFilter !== "directo" && o.vendedorId !== orderVendorFilter) return false;
      }

      // 3. Date filter
      if (orderDateFilter !== "todos") {
        const orderTime = new Date(o.fecha).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (orderDateFilter === "hoy" && now - orderTime > oneDay) return false;
        if (orderDateFilter === "7dias" && now - orderTime > 7 * oneDay) return false;
        if (orderDateFilter === "mes" && now - orderTime > 30 * oneDay) return false;
      }

      // 4. Search query
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const matchesClient = o.clienteNombre.toLowerCase().includes(q);
        const matchesPhone = o.clienteCelular.includes(q);
        const matchesId = o.id ? o.id.toLowerCase().includes(q) : false;
        if (!matchesClient && !matchesPhone && !matchesId) return false;
      }

      return true;
    });
  }, [orders, orderStatusFilter, orderVendorFilter, orderDateFilter, orderSearch]);

  // Filtered Members (Vendors)
  const filteredVendors = useMemo(() => {
    return members
      .filter((m) => m.role === "vendedor")
      .filter((m) => {
        if (vendorFilterStatus !== "todos" && m.status !== vendorFilterStatus) return false;
        if (vendorSearch.trim()) {
          const q = vendorSearch.toLowerCase();
          return (
            m.nombreCompleto.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.phone.includes(q)
          );
        }
        return true;
      });
  }, [members, vendorFilterStatus, vendorSearch]);

  // Filtered Users (All accounts)
  const filteredUsers = useMemo(() => {
    return members;
  }, [members]);

  // Filtered PagosYa Checkouts
  const filteredPagosyaCheckouts = useMemo(() => {
    return pagosyaCheckouts.filter((c) => {
      if (pagosyaFilterStatus !== "todos" && c.estado !== pagosyaFilterStatus) return false;
      if (pagosyaFilterEnv !== "todos" && c.ambiente !== pagosyaFilterEnv) return false;
      return true;
    });
  }, [pagosyaCheckouts, pagosyaFilterStatus, pagosyaFilterEnv]);

  // KPIs
  const totalSalesAll = orders
    .filter((o) => o.estado === "confirmado")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrdersCount = orders.filter((o) => o.estado === "pendiente").length;
  const confirmedOrdersCount = orders.filter((o) => o.estado === "confirmado").length;
  // Comprobantes Filtering
  const filteredComprobantes = useMemo(() => {
    return comprobantes.filter((c) => {
      if (comprobanteStatusFilter !== "todos" && c.estado !== comprobanteStatusFilter) {
        return false;
      }
      if (comprobanteVendorFilter !== "todos" && c.vendedorId !== comprobanteVendorFilter) {
        return false;
      }
      if (comprobanteSearch.trim()) {
        const q = comprobanteSearch.toLowerCase().trim();
        const matchOrder = c.pedidoId.toLowerCase().includes(q);
        const matchClient = c.clienteNombre.toLowerCase().includes(q);
        const matchPhone = c.clienteCelular.includes(q);
        const matchVendor = (c.vendedorNombre || "").toLowerCase().includes(q);
        if (!matchOrder && !matchClient && !matchPhone && !matchVendor) {
          return false;
        }
      }
      if (comprobanteDateFilter !== "todos") {
        const itemDate = new Date(c.fechaEnvio);
        const now = new Date();
        if (comprobanteDateFilter === "hoy") {
          if (
            itemDate.getDate() !== now.getDate() ||
            itemDate.getMonth() !== now.getMonth() ||
            itemDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (comprobanteDateFilter === "semana") {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < sevenDaysAgo) return false;
        } else if (comprobanteDateFilter === "mes") {
          if (
            itemDate.getMonth() !== now.getMonth() ||
            itemDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        }
      }
      return true;
    });
  }, [comprobantes, comprobanteStatusFilter, comprobanteVendorFilter, comprobanteSearch, comprobanteDateFilter]);

  const pendingComprobantesCount = useMemo(
    () => comprobantes.filter((c) => c.estado === "PENDIENTE_VERIFICACION").length,
    [comprobantes]
  );
  const verifiedComprobantesCount = useMemo(
    () => comprobantes.filter((c) => c.estado === "VERIFICADO").length,
    [comprobantes]
  );
  const rejectedComprobantesCount = useMemo(
    () => comprobantes.filter((c) => c.estado === "RECHAZADO").length,
    [comprobantes]
  );

  const handleSaveQrConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingQrConfig(true);
    try {
      const updated = await staticQrController.saveConfig(
        {
          activo: qrActive,
          banco: qrBank.trim(),
          titular: qrTitular.trim(),
          numeroCuenta: qrAccount.trim(),
          tipoCuenta: qrAccountType.trim(),
          instrucciones: qrInstructions.trim(),
          qrImageUrl: qrImgUrl.trim(),
        },
        currentAdminUser
      );
      setQrConfig(updated);
      showFeedback("Configuración del QR Estático guardada exitosamente.");
      setIsQrConfigModalOpen(false);
    } catch (err: any) {
      alert("Error al guardar configuración: " + (err.message || String(err)));
    } finally {
      setIsSavingQrConfig(false);
    }
  };

  const handleUploadNewQrImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingQrImage(true);
    try {
      const url = await staticQrController.uploadQrImage(file, currentAdminUser);
      setQrImgUrl(url);
      showFeedback("Imagen de QR bancario oficial cargada correctamente.");
    } catch (err: any) {
      alert("Error subiendo imagen QR: " + (err.message || String(err)));
    } finally {
      setIsUploadingQrImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-xs text-slate-900 overflow-hidden text-left">
      {/* ========================================================= */}
      {/* SIDEBAR NAVIGATION */}
      {/* ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                TEAM LIFE | EQUIPO VIDA S.R.L.
              </div>
              <h2 className="font-bold text-base text-white">Panel Administrador</h2>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User profile indicator */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40">
            <div className="text-xs font-semibold text-white truncate">
              {currentAdminUser.nombre}
            </div>
            <div className="text-[11px] text-slate-400 truncate">{currentAdminUser.email}</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                Superadministrador
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveTab("resumen");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                activeTab === "resumen"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Resumen General</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("pedidos");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                activeTab === "pedidos"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Pedidos</span>
              </div>
              {pendingOrdersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("verificacion_qr");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                activeTab === "verificacion_qr"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Verificación Pagos QR</span>
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
                setActiveTab("catalogo");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                activeTab === "catalogo"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              <span>Productos y Combos</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("clientes");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                activeTab === "clientes"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Users className="w-4 h-4 text-slate-400" />
              <span>Clientes ({clientsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("vendedores");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                activeTab === "vendedores"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <UserCheck className="w-4 h-4 text-slate-400" />
              <span>Vendedores ({filteredVendors.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("usuarios");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                activeTab === "usuarios"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Shield className="w-4 h-4 text-slate-400" />
              <span>Usuarios y Roles</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("pagosya");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                activeTab === "pagosya"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <QrCode className="w-4 h-4 text-slate-400" />
              <span>Pasarela PagosYa</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("configuracion");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                activeTab === "configuracion"
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Configuración</span>
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
            TEAM LIFE · Panel Central Seguro
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================= */}
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
                {activeTab === "resumen" && "Resumen General"}
                {activeTab === "pedidos" && "Gestión de Pedidos Registrados"}
                {activeTab === "verificacion_qr" && "Verificación de Pagos QR Bancario"}
                {activeTab === "catalogo" && "Catálogo de Productos y Combos"}
                {activeTab === "clientes" && "Directorio de Clientes"}
                {activeTab === "vendedores" && "Gestión de Vendedores y Distribuidores"}
                {activeTab === "usuarios" && "Administración de Usuarios y Roles"}
                {activeTab === "pagosya" && "Supervisión de Pasarela PagosYa"}
                {activeTab === "configuracion" && "Configuración del Sistema y Empresa"}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Administración general · Control de operaciones, productos, pagos y despacho.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAllData}
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

        {/* Temporary Feedback Notification */}
        {statusFeedback && (
          <div className="px-6 py-2.5 bg-slate-900 text-white text-xs font-medium flex items-center justify-between border-b border-slate-800">
            <span>{statusFeedback}</span>
            <button
              type="button"
              onClick={() => setStatusFeedback("")}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* ========================================================= */}
          {/* TAB 1: RESUMEN GENERAL */}
          {/* ========================================================= */}
          {activeTab === "resumen" && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Total Pedidos
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{orders.length}</div>
                  <div className="text-xs text-slate-500">Registrados en la plataforma</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                    Ventas Confirmadas
                  </div>
                  <div className="text-2xl font-bold text-emerald-700">
                    Bs {totalSalesAll.toFixed(0)}
                  </div>
                  <div className="text-xs text-emerald-800">{confirmedOrdersCount} pedidos aceptados</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                    Pendientes de Revisión
                  </div>
                  <div className="text-2xl font-bold text-amber-700">{pendingOrdersCount}</div>
                  <div className="text-xs text-amber-800">Esperando revisión oficial</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Distribuidores
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {members.filter((m) => m.role === "vendedor").length}
                  </div>
                  <div className="text-xs text-slate-500">Vendedores registrados</div>
                </div>
              </div>

              {/* Quick Actions & Recent Orders Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent orders */}
                <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">Últimos Pedidos Registrados</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("pedidos")}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      Ver todos ({orders.length}) →
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No hay pedidos registrados en el sistema.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {orders.slice(0, 5).map((order) => (
                        <div
                          key={order.id}
                          className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 px-2 rounded-lg transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{order.clienteNombre}</div>
                            <div className="text-slate-500 text-[11px]">
                              {order.departamento} · Vendedor: {order.vendedorNombre || order.vendedorId || "Directo"}
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
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsDetailModalOpen(true);
                              }}
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

                {/* System shortcuts */}
                <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">Accesos Rápidos</h3>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsNewProductModalOpen(true)}
                      className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Agregar Producto al Catálogo</span>
                      <Plus className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAddByLinkOpen(true)}
                      className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Importar Producto por Enlace</span>
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsNewMemberModalOpen(true)}
                      className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Registrar Nuevo Vendedor</span>
                      <UserCheck className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("pagosya")}
                      className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Supervisar Pasarela PagosYa</span>
                      <QrCode className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PEDIDOS (GESTIÓN COMPLETA Y FILTROS) */}
          {/* ========================================================= */}
          {activeTab === "pedidos" && (
            <div className="space-y-4">
              {/* Comprehensive Filter Bar */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Buscar por cliente, celular o ID de pedido..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>

                  {/* Date Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Fecha:</span>
                    <select
                      value={orderDateFilter}
                      onChange={(e) => setOrderDateFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="todos">Todas las fechas</option>
                      <option value="hoy">Hoy</option>
                      <option value="7dias">Últimos 7 días</option>
                      <option value="mes">Este mes</option>
                    </select>
                  </div>

                  {/* Vendor Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Vendedor:</span>
                    <select
                      value={orderVendorFilter}
                      onChange={(e) => setOrderVendorFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="todos">Todos los vendedores</option>
                      <option value="directo">Venta directa central</option>
                      {uniqueVendorOptions.map((v) => (
                        <option key={v} value={v}>
                          Vendedor {v.slice(0, 8)}...
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs border-t border-slate-100">
                  <span className="text-xs font-medium text-slate-500 mr-1">Estado:</span>
                  {(["todos", "pendiente", "confirmado", "rechazado", "cancelado"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer capitalize ${
                        orderStatusFilter === st
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {st === "todos" ? `Todos (${orders.length})` : `${st}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
                {filteredOrders.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="font-semibold text-slate-700">No se encontraron pedidos</div>
                    <p className="text-slate-400 max-w-sm mx-auto">
                      Ningún pedido coincide con los criterios de búsqueda o filtros seleccionados.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-3 px-4">ID Pedido</th>
                          <th className="py-3 px-4">Cliente</th>
                          <th className="py-3 px-4">Vendedor Asignado</th>
                          <th className="py-3 px-4">Destino</th>
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
                              {order.vendedorNombre || order.vendedorId ? (
                                <span className="font-medium text-slate-800">
                                  {order.vendedorNombre || order.vendedorId?.slice(0, 8)}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Central Directo</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {order.departamento}
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
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsDetailModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                              >
                                Ver Detalle
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

          {/* ========================================================= */}
          {/* TAB: VERIFICACIÓN DE PAGOS QR (BANCO UNIÓN / YASTA) */}
          {/* ========================================================= */}
          {activeTab === "verificacion_qr" && (
            <div className="space-y-4">
              {/* Header and Stats */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-700" />
                    <span>Verificación de Pagos QR Bancario</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Revisión y validación manual de comprobantes oficiales de Banco Unión / Red Yasta.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQrConfigModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-600" />
                    <span>Configurar QR Estático</span>
                  </button>

                  <button
                    type="button"
                    onClick={loadAllData}
                    disabled={loading}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                    title="Actualizar lista"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* KPI Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                      Pendientes de Revisión
                    </div>
                    <div className="text-2xl font-bold text-amber-700 mt-0.5">
                      {pendingComprobantesCount}
                    </div>
                  </div>
                  <Clock className="w-6 h-6 text-amber-500/80" />
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">
                      Pagos Verificados
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 mt-0.5">
                      {verifiedComprobantesCount}
                    </div>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500/80" />
                </div>

                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-rose-900 uppercase tracking-wide">
                      Comprobantes Rechazados
                    </div>
                    <div className="text-2xl font-bold text-rose-700 mt-0.5">
                      {rejectedComprobantesCount}
                    </div>
                  </div>
                  <XCircle className="w-6 h-6 text-rose-500/80" />
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Total Recibidos
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-0.5">
                      {comprobantes.length}
                    </div>
                  </div>
                  <QrCode className="w-6 h-6 text-slate-400" />
                </div>
              </div>

              {/* Filters Bar */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={comprobanteSearch}
                      onChange={(e) => setComprobanteSearch(e.target.value)}
                      placeholder="Buscar por código, cliente o vendedor..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-cyan-600 bg-slate-50/50"
                    />
                  </div>

                  {/* Status filter */}
                  <select
                    value={comprobanteStatusFilter}
                    onChange={(e) => setComprobanteStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50 focus:outline-none focus:border-cyan-600"
                  >
                    <option value="todos">Todos los Estados</option>
                    <option value="PENDIENTE_VERIFICACION">Pendientes de Verificación</option>
                    <option value="VERIFICADO">Aprobados / Verificados</option>
                    <option value="RECHAZADO">Rechazados</option>
                  </select>

                  {/* Date filter */}
                  <select
                    value={comprobanteDateFilter}
                    onChange={(e) => setComprobanteDateFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50 focus:outline-none focus:border-cyan-600"
                  >
                    <option value="todos">Todas las Fechas</option>
                    <option value="hoy">Hoy</option>
                    <option value="semana">Últimos 7 días</option>
                    <option value="mes">Este mes</option>
                  </select>

                  {/* Vendor filter */}
                  <select
                    value={comprobanteVendorFilter}
                    onChange={(e) => setComprobanteVendorFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50 focus:outline-none focus:border-cyan-600"
                  >
                    <option value="todos">Todos los Vendedores</option>
                    {members
                      .filter((m) => m.role === "vendedor")
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nombreCompleto}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Comprobantes Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                {filteredComprobantes.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 space-y-2">
                    <QrCode className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No se encontraron comprobantes</p>
                    <p className="text-xs">
                      Los comprobantes enviados por los clientes aparecerán aquí para su verificación inmediata.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3.5">Código Pedido</th>
                          <th className="py-2.5 px-3.5">Cliente</th>
                          <th className="py-2.5 px-3.5">Vendedor Responsable</th>
                          <th className="py-2.5 px-3.5 text-right">Monto</th>
                          <th className="py-2.5 px-3.5">Fecha Envío</th>
                          <th className="py-2.5 px-3.5">Estado Pago</th>
                          <th className="py-2.5 px-3.5 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredComprobantes.map((comp) => (
                          <tr key={comp.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-3.5 font-bold font-mono text-slate-900">
                              <button
                                type="button"
                                onClick={() => {
                                  const ord = orders.find((o) => o.id === comp.pedidoId);
                                  if (ord) {
                                    setSelectedOrder(ord);
                                    setIsDetailModalOpen(true);
                                  }
                                }}
                                className="text-cyan-800 hover:underline cursor-pointer"
                              >
                                #{comp.pedidoId}
                              </button>
                            </td>

                            <td className="py-3 px-3.5">
                              <div className="font-semibold text-slate-900">{comp.clienteNombre}</div>
                              <div className="text-[11px] text-slate-500">
                                <a
                                  href={`https://wa.me/${comp.clienteCelular.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-700 hover:underline inline-flex items-center gap-1"
                                >
                                  +{comp.clienteCelular.replace(/\+/g, "")}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            </td>

                            <td className="py-3 px-3.5 text-slate-700">
                              {comp.vendedorNombre || (comp.vendedorId ? `ID: ${comp.vendedorId}` : "Central Team Life")}
                            </td>

                            <td className="py-3 px-3.5 text-right font-bold text-slate-900">
                              Bs {comp.monto.toFixed(2)}
                            </td>

                            <td className="py-3 px-3.5 text-slate-500">
                              {new Date(comp.fechaEnvio).toLocaleString("es-BO")}
                            </td>

                            <td className="py-3 px-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                  comp.estado === "VERIFICADO"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                    : comp.estado === "RECHAZADO"
                                    ? "bg-rose-50 text-rose-800 border border-rose-300"
                                    : "bg-amber-50 text-amber-800 border border-amber-300"
                                }`}
                              >
                                {comp.estado === "VERIFICADO" && "Verificado"}
                                {comp.estado === "RECHAZADO" && "Rechazado"}
                                {comp.estado === "PENDIENTE_VERIFICACION" && "Pendiente"}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedComprobante(comp);
                                  setIsComprobanteModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Revisar</span>
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

          {/* ========================================================= */}
          {/* TAB 3: PRODUCTOS Y COMBOS */}
          {/* ========================================================= */}
          {activeTab === "catalogo" && (
            <div className="space-y-4">
              {/* Header with Subtabs and Action buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCatalogSubTab("productos")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      catalogSubTab === "productos"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Productos Individuales ({products.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setCatalogSubTab("combos")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      catalogSubTab === "combos"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Combos Promocionales ({combosList.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {catalogSubTab === "productos" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsAddByLinkOpen(true)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>Importar por Link</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsNewProductModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nuevo Producto</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Products Subtab */}
              {catalogSubTab === "productos" && (
                <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-3 px-4">Producto</th>
                          <th className="py-3 px-4">Categoría</th>
                          <th className="py-3 px-4 text-right">Precio Normal</th>
                          <th className="py-3 px-4 text-right">Precio Socio</th>
                          <th className="py-3 px-4">Estado</th>
                          <th className="py-3 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {products.map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 flex items-center gap-3">
                              <img
                                src={prod.img}
                                alt={prod.name}
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                              />
                              <div>
                                <div className="font-semibold text-slate-900">{prod.name}</div>
                                <div className="text-[11px] text-slate-500 truncate max-w-xs">{prod.desc}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{prod.category || "General"}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                              Bs {prod.normalPrice.toFixed(0)}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                              Bs {(prod.memberPrice || Math.round(prod.normalPrice * 0.6)).toFixed(0)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                  prod.status === "publicado" || !prod.status
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {prod.status || "publicado"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                                title="Editar producto"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Combos Subtab */}
              {catalogSubTab === "combos" && (
                <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-3 px-4">Combo</th>
                          <th className="py-3 px-4">Productos Incluidos</th>
                          <th className="py-3 px-4 text-right">Precio Combo</th>
                          <th className="py-3 px-4">Estado</th>
                          <th className="py-3 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {combosList.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 flex items-center gap-3">
                              <img
                                src={c.img}
                                alt={c.name}
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                              />
                              <div>
                                <div className="font-semibold text-slate-900">{c.name}</div>
                                <div className="text-[11px] text-slate-500 truncate max-w-xs">{c.desc}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-[11px]">
                              {c.includedProducts?.join(", ") || "Componentes configurados"}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                              Bs {c.comboPrice.toFixed(0)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                  c.status === "publicado" || !c.status
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {c.status || "publicado"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCombo(c)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                                title="Editar combo"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCombo(c)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600"
                                title="Eliminar combo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: CLIENTES (DIRECTORIO EXTRAÍDO DE PEDIDOS) */}
          {/* ========================================================= */}
          {activeTab === "clientes" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Directorio de Clientes</h3>
                  <p className="text-xs text-slate-500">
                    Historial consolidado de clientes que han generado pedidos en la plataforma.
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                  Total Clientes: {clientsList.length}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
                {clientsList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No hay clientes registrados en los pedidos aún.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-3 px-4">Cliente</th>
                          <th className="py-3 px-4">Contacto WhatsApp</th>
                          <th className="py-3 px-4">Ciudad / Destino</th>
                          <th className="py-3 px-4 text-center">Pedidos</th>
                          <th className="py-3 px-4 text-right">Total Comprado</th>
                          <th className="py-3 px-4">Última Compra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {clientsList.map((client, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {client.nombre}
                            </td>
                            <td className="py-3 px-4">
                              <a
                                href={`https://wa.me/${client.celular.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 hover:underline font-medium inline-flex items-center gap-1"
                              >
                                +{client.celular.replace(/\+/g, "")}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{client.departamento}</td>
                            <td className="py-3 px-4 text-center font-bold text-slate-800">
                              {client.pedidosCount}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                              Bs {client.totalGastado.toFixed(0)}
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {client.ultimaFecha.toLocaleDateString("es-BO")}
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

          {/* ========================================================= */}
          {/* TAB 5: VENDEDORES (DISTRIBUIDORES) */}
          {/* ========================================================= */}
          {activeTab === "vendedores" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    placeholder="Buscar distribuidor por nombre, correo o teléfono..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={vendorFilterStatus}
                    onChange={(e) => setVendorFilterStatus(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="autorizado">Autorizados</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="suspendido">Suspendidos</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsNewMemberModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo Vendedor</span>
                  </button>
                </div>
              </div>

              {/* Vendors Table */}
              <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Distribuidor</th>
                        <th className="py-3 px-4">Contacto</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4">Clics</th>
                        <th className="py-3 px-4">Enlace de Afiliado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredVendors.map((vendor) => {
                        const affiliate = `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${vendor.id}`;
                        return (
                          <tr key={vendor.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{vendor.nombreCompleto}</div>
                              <div className="text-[11px] text-slate-400">ID: {vendor.id.slice(0, 8)}...</div>
                            </td>
                            <td className="py-3 px-4">
                              <div>{vendor.email}</div>
                              <div className="text-[11px] text-slate-500">+{vendor.phone}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  vendor.status === "autorizado"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                    : vendor.status === "pendiente"
                                    ? "bg-amber-50 text-amber-800 border border-amber-300"
                                    : "bg-rose-50 text-rose-800 border border-rose-300"
                                }`}
                              >
                                {vendor.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-700">{vendor.clics || 0}</td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => handleCopy(affiliate, vendor.id)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-mono text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                {copiedText === vendor.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-500" />
                                )}
                                <span>{copiedText === vendor.id ? "Copiado" : "Copiar Enlace"}</span>
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenEditMember(vendor)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                              >
                                Administrar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: USUARIOS Y ROLES */}
          {/* ========================================================= */}
          {activeTab === "usuarios" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Control de Usuarios y Roles de Acceso</h3>
                  <p className="text-xs text-slate-500">
                    Administra los permisos de acceso al panel para Administradores y Distribuidores.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewMemberModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Usuario</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Usuario</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Rol Asignado</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-semibold text-slate-900">{u.nombreCompleto}</td>
                          <td className="py-3 px-4 text-slate-600">{u.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                                u.role === "admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {u.role === "admin" ? "Administrador" : "Vendedor"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                u.status === "autorizado"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                  : "bg-amber-50 text-amber-800 border border-amber-300"
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenEditMember(u)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                            >
                              Editar Rol / Estado
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: PASARELA PAGOSYA (MULTI-AMBIENTE) */}
          {/* ========================================================= */}
          {activeTab === "pagosya" && (() => {
            const completedCount = pagosyaCheckouts.filter((c) => c.estado === "completed").length;
            const pendingCount = pagosyaCheckouts.filter((c) => c.estado === "pending").length;
            const totalBsPaid = pagosyaCheckouts
              .filter((c) => c.estado === "completed")
              .reduce((sum, c) => sum + (c.monto || 0), 0);

            return (
              <div className="space-y-4">
                {/* Header banner */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Supervisión de Pasarela PagosYa (Multiambiente)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Gestión de checkouts QR generados, conciliación de pagos y verificación oficial por API.
                    </p>
                  </div>

                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Ambiente Predeterminado: SANDBOX (Pruebas)</span>
                  </div>
                </div>

                {/* Safety banner */}
                <div className="p-3.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Seguridad estricta:</strong> Los pagos solo pueden marcarse como completados mediante
                    la respuesta oficial de la API de PagosYa o webhooks válidos con firma HMAC-SHA256. El sistema
                    no permite forzar o simular cobros pagados de forma manual.
                  </span>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Total Checkouts
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{pagosyaCheckouts.length}</div>
                    <div className="text-xs text-slate-500">Transacciones generadas</div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1">
                    <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                      Pagos Confirmados
                    </div>
                    <div className="text-2xl font-bold text-emerald-700">Bs {totalBsPaid.toFixed(0)}</div>
                    <div className="text-xs text-emerald-800">{completedCount} verificados</div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1">
                    <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                      Pendientes de Cobro
                    </div>
                    <div className="text-2xl font-bold text-amber-700">{pendingCount}</div>
                    <div className="text-xs text-amber-800">Esperando pago del cliente</div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Expirados / Cancelados
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {pagosyaCheckouts.filter((c) => c.estado === "expired" || c.estado === "cancelled").length}
                    </div>
                    <div className="text-xs text-slate-500">Sin debitar fondos</div>
                  </div>
                </div>

                {/* Filters */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-500">Estado:</span>
                    {(["todos", "pending", "completed", "expired", "cancelled"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setPagosyaFilterStatus(st)}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer capitalize ${
                          pagosyaFilterStatus === st
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {st === "todos" ? "Todos" : st}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-500">Ambiente:</span>
                    {(["todos", "sandbox", "production"] as const).map((env) => (
                      <button
                        key={env}
                        type="button"
                        onClick={() => setPagosyaFilterEnv(env)}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer capitalize ${
                          pagosyaFilterEnv === env
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {env === "todos" ? "Todos" : env}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checkouts Table */}
                <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-3 px-4">Pedido / Checkout ID</th>
                          <th className="py-3 px-4">Cliente</th>
                          <th className="py-3 px-4 text-right">Monto</th>
                          <th className="py-3 px-4">Ambiente</th>
                          <th className="py-3 px-4">Estado</th>
                          <th className="py-3 px-4">Fecha / Expira</th>
                          <th className="py-3 px-4 text-right">Verificación API</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPagosyaCheckouts.map((checkout) => {
                          const isVerifying = isVerifyingCheckout === checkout.checkoutId;
                          return (
                            <tr key={checkout.checkoutId || checkout.orderId} className="hover:bg-slate-50/70">
                              <td className="py-3 px-4 font-mono">
                                <div className="font-bold text-slate-900">#{checkout.orderId}</div>
                                <div className="text-[10px] text-slate-400 truncate max-w-xs">{checkout.checkoutId}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-900">{checkout.cliente?.name || "Cliente"}</div>
                                <div className="text-[11px] text-slate-500">{checkout.cliente?.phone || "Sin teléfono"}</div>
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-slate-900">
                                Bs {checkout.monto.toFixed(2)}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                  {checkout.ambiente}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                    checkout.estado === "completed"
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                      : checkout.estado === "pending"
                                      ? "bg-amber-50 text-amber-800 border border-amber-300"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {checkout.estado}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-[11px]">
                                {checkout.fechaCreacion ? new Date(checkout.fechaCreacion).toLocaleString("es-BO") : "—"}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleVerifyPagosyaCheckout(checkout)}
                                  disabled={isVerifying}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <RefreshCw className={`w-3 h-3 text-slate-500 ${isVerifying ? "animate-spin" : ""}`} />
                                  <span>{isVerifying ? "Consultando..." : "Consultar API"}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================= */}
          {/* TAB 8: CONFIGURACIÓN (EMPRESA, IA, AUDITORÍA) */}
          {/* ========================================================= */}
          {activeTab === "configuracion" && (
            <div className="space-y-4 max-w-4xl">
              {/* Subtabs bar */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl w-fit text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setConfigSubTab("empresa")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    configSubTab === "empresa" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Datos de la Empresa
                </button>
                <button
                  type="button"
                  onClick={() => setConfigSubTab("ia")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    configSubTab === "ia" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Centro de Conocimiento IA
                </button>
                <button
                  type="button"
                  onClick={() => setConfigSubTab("auditoria")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    configSubTab === "auditoria" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Historial de Auditoría
                </button>
              </div>

              {/* Subtab Empresa */}
              {configSubTab === "empresa" && (
                <form onSubmit={handleSaveCompanyConfig} className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
                  <h3 className="font-bold text-base text-slate-900">Datos Corporativos e Institucionales</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Razón Social:</label>
                      <input
                        type="text"
                        value={cfgName}
                        onChange={(e) => setCfgName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Nombre Comercial:</label>
                      <input
                        type="text"
                        value={cfgCommercialName}
                        onChange={(e) => setCfgCommercialName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">NIT Oficial:</label>
                      <input
                        type="text"
                        value={cfgNit}
                        onChange={(e) => setCfgNit(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Registro SENASAG:</label>
                      <input
                        type="text"
                        value={cfgSenasag}
                        onChange={(e) => setCfgSenasag(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Matrícula SEPREC:</label>
                      <input
                        type="text"
                        value={cfgSeprec}
                        onChange={(e) => setCfgSeprec(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">WhatsApp Central:</label>
                      <input
                        type="text"
                        value={cfgDefaultWhatsapp}
                        onChange={(e) => setCfgDefaultWhatsapp(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-slate-700">Misión Corporativa:</label>
                    <textarea
                      rows={2}
                      value={cfgMission}
                      onChange={(e) => setCfgMission(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-slate-700">Visión Corporativa:</label>
                    <textarea
                      rows={2}
                      value={cfgVision}
                      onChange={(e) => setCfgVision(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingConfig}
                      className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingConfig ? "Guardando..." : "Guardar Cambios de Empresa"}
                    </button>
                  </div>
                </form>
              )}

              {/* Subtab IA Knowledge */}
              {configSubTab === "ia" && (
                <div className="space-y-6">
                  {/* Form to add article */}
                  <form onSubmit={handleSaveKnowledge} className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
                    <h3 className="font-bold text-base text-slate-900">Alimentar Base de Conocimiento IA</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Título / Pregunta Frecuente:</label>
                        <input
                          type="text"
                          value={knowledgeTitle}
                          onChange={(e) => setKnowledgeTitle(e.target.value)}
                          placeholder="Ej: ¿El colágeno marino tiene contraindicaciones?"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Categoría:</label>
                        <select
                          value={knowledgeCategory}
                          onChange={(e) => setKnowledgeCategory(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                        >
                          <option value="productos">Productos y Salud</option>
                          <option value="negocio">Oportunidad de Negocio</option>
                          <option value="legalidad">Legalidad y Registros</option>
                          <option value="faq">Preguntas Frecuentes</option>
                          <option value="protocolos">Protocolos de Uso</option>
                          <option value="general">General</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-slate-700">Contenido Exacto / Respuesta:</label>
                      <textarea
                        rows={3}
                        value={knowledgeContent}
                        onChange={(e) => setKnowledgeContent(e.target.value)}
                        placeholder="Ingresa la respuesta oficial para que el asistente de IA responda con veracidad..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
                      >
                        Guardar en Cerebro IA
                      </button>
                    </div>
                  </form>

                  {/* Simulator */}
                  <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                    <h3 className="font-bold text-base text-slate-900">Simulador de Pruebas de IA</h3>
                    <form onSubmit={handleTestAi} className="flex gap-2">
                      <input
                        type="text"
                        value={testPrompt}
                        onChange={(e) => setTestPrompt(e.target.value)}
                        placeholder="Haz una pregunta como si fueras un cliente..."
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
                      >
                        Simular
                      </button>
                    </form>

                    {testResponse && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 whitespace-pre-wrap">
                        {testResponse}
                      </div>
                    )}
                  </div>

                  {/* Knowledge list */}
                  <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700">
                      Artículos Activos ({knowledgeList.length})
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {knowledgeList.map((item) => (
                        <div key={item.id} className="p-4 flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900">{item.title}</div>
                            <p className="text-slate-600 text-[11px]">{item.content}</p>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold uppercase">
                              {item.category}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteKnowledge(item.id, item.title)}
                            className="p-1 rounded text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab Auditoría */}
              {configSubTab === "auditoria" && (
                <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700">
                    Historial de Auditoría de la Plataforma
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Acción</th>
                          <th className="py-2.5 px-4">Categoría</th>
                          <th className="py-2.5 px-4">Detalle</th>
                          <th className="py-2.5 px-4">Usuario</th>
                          <th className="py-2.5 px-4">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-4 font-semibold text-slate-900">{log.action}</td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                {log.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 max-w-sm truncate" title={log.details}>
                              {log.details}
                            </td>
                            <td className="py-2.5 px-4 text-slate-800 font-medium">{log.user}</td>
                            <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString("es-BO") : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================= */}
      {/* REUSABLE ORDER DETAIL MODAL */}
      {/* ========================================================= */}
      {selectedOrder && (
        <OrderDetailModalView
          isOpen={isDetailModalOpen}
          order={selectedOrder}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedOrder(null);
          }}
          currentUser={currentAdminUser}
          onOrderUpdated={loadAllData}
        />
      )}

      {/* ========================================================= */}
      {/* EDIT PRODUCT MODAL */}
      {/* ========================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base">Editar Producto</h3>
              <button type="button" onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nombre del Producto:</label>
                <input
                  type="text"
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Precio Normal (Bs):</label>
                  <input
                    type="number"
                    value={editProdNormalPrice}
                    onChange={(e) => setEditProdNormalPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Precio Socio (Bs):</label>
                  <input
                    type="number"
                    value={editProdMemberPrice}
                    onChange={(e) => setEditProdMemberPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">URL de Imagen:</label>
                <input
                  type="text"
                  value={editProdImg}
                  onChange={(e) => setEditProdImg(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Descripción:</label>
                <textarea
                  rows={2}
                  value={editProdDesc}
                  onChange={(e) => setEditProdDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                  {isSavingProduct ? "Guardando..." : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD PRODUCT MANUAL MODAL */}
      {/* ========================================================= */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base">Crear Nuevo Producto</h3>
              <button type="button" onClick={() => setIsNewProductModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProductManual} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nombre:</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Precio Normal (Bs):</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Precio Socio (Bs):</label>
                  <input
                    type="number"
                    value={newProdMemberPrice}
                    onChange={(e) => setNewProdMemberPrice(e.target.value)}
                    placeholder="Auto 40% descuento si vacío"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">URL Imagen:</label>
                <input
                  type="text"
                  value={newProdImg}
                  onChange={(e) => setNewProdImg(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Descripción:</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                  Crear Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD PRODUCT BY LINK MODAL */}
      {/* ========================================================= */}
      {isAddByLinkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base">Importar Producto por Enlace</h3>
              <button type="button" onClick={() => setIsAddByLinkOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkInputUrl}
                  onChange={(e) => setLinkInputUrl(e.target.value)}
                  placeholder="https://ejemplo.com/producto-nutricion"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={handleExtractFromUrl}
                  disabled={isExtractingLink}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium disabled:opacity-50"
                >
                  {isExtractingLink ? "Extrayendo..." : "Analizar"}
                </button>
              </div>

              {linkExtractionNotice && (
                <div className="p-2.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                  {linkExtractionNotice}
                </div>
              )}

              {extractedPreview && (
                <form onSubmit={handleConfirmAddByLink} className="p-3 border border-slate-200 rounded-lg space-y-2 bg-slate-50">
                  <div className="font-bold text-slate-900 text-xs">{extractedPreview.name}</div>
                  <p className="text-[11px] text-slate-500">{extractedPreview.desc}</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 font-bold">Precio Normal:</label>
                      <input
                        type="number"
                        value={extractedPreview.normalPrice}
                        onChange={(e) =>
                          setExtractedPreview({ ...extractedPreview, normalPrice: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 font-bold">Precio Socio:</label>
                      <input
                        type="number"
                        value={extractedPreview.memberPrice}
                        onChange={(e) =>
                          setExtractedPreview({ ...extractedPreview, memberPrice: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs"
                    >
                      Confirmar e Importar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT COMBO MODAL */}
      {/* ========================================================= */}
      {editingCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base">Editar Combo Promocional</h3>
              <button type="button" onClick={() => setEditingCombo(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCombo} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nombre del Combo:</label>
                <input
                  type="text"
                  value={editComboName}
                  onChange={(e) => setEditComboName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Precio del Combo (Bs):</label>
                  <input
                    type="number"
                    value={editComboPrice}
                    onChange={(e) => setEditComboPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Estado:</label>
                  <select
                    value={editComboStatus}
                    onChange={(e) => setEditComboStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  >
                    <option value="publicado">Publicado</option>
                    <option value="oculto">Oculto</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Descripción:</label>
                <textarea
                  rows={2}
                  value={editComboDesc}
                  onChange={(e) => setEditComboDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCombo(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCombo}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                  {isSavingCombo ? "Guardando..." : "Guardar Combo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT MEMBER MODAL */}
      {/* ========================================================= */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base">
                Administrar Miembro: {editingMember.nombreCompleto}
              </h3>
              <button type="button" onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Rol:</label>
                <select
                  value={editMemberRole}
                  onChange={(e) => setEditMemberRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                >
                  <option value="vendedor">Distribuidor / Vendedor</option>
                  <option value="admin">Administrador Central</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Estado de Acceso:</label>
                <select
                  value={editMemberStatus}
                  onChange={(e) => setEditMemberStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                >
                  <option value="autorizado">Autorizado</option>
                  <option value="pendiente">Pendiente de Aprobación</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="no_autorizado">No Autorizado</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Notas Administrativas:</label>
                <textarea
                  rows={2}
                  value={editMemberNotes}
                  onChange={(e) => setEditMemberNotes(e.target.value)}
                  placeholder="Observaciones de la administración..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingMember}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                  {isSavingMember ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* NEW MEMBER MODAL */}
      {/* ========================================================= */}
      {isNewMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base">Registrar Nuevo Distribuidor / Vendedor</h3>
              <button type="button" onClick={() => setIsNewMemberModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMemberManual} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nombre Completo:</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Ej: Marcelo Quiroga"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Correo Electrónico:</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="vendedor@teamlife.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Teléfono WhatsApp (Bolivia 591):</label>
                <input
                  type="tel"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  placeholder="70012345"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Rol:</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                >
                  <option value="vendedor">Distribuidor / Vendedor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewMemberModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* COMPROBANTE REVIEW MODAL */}
      {/* ========================================================= */}
      {isComprobanteModalOpen && selectedComprobante && (
        <ComprobanteReviewModalView
          isOpen={isComprobanteModalOpen}
          comprobante={selectedComprobante}
          currentUser={currentAdminUser}
          onClose={() => {
            setIsComprobanteModalOpen(false);
            setSelectedComprobante(null);
          }}
          onStatusUpdated={() => {
            loadAllData();
            setIsComprobanteModalOpen(false);
            setSelectedComprobante(null);
          }}
        />
      )}

      {/* ========================================================= */}
      {/* STATIC QR SETTINGS MODAL */}
      {/* ========================================================= */}
      {isQrConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 my-6 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-800" />
                <h3 className="font-bold text-base text-slate-900">
                  Configuración del Método de Pago QR Estático
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQrConfig} className="space-y-4 text-xs">
              {/* Toggle Activo / Desactivado */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">
                    Estado del Método de Pago
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {qrActive
                      ? "El método QR Estático está habilitado para los clientes en el carrito."
                      : "El método QR Estático está desactivado temporalmente."}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qrActive}
                    onChange={(e) => setQrActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-700"></div>
                </label>
              </div>

              {/* QR Image Display and Upload */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="font-semibold text-slate-800 flex items-center justify-between">
                  <span>Imagen Oficial del QR Bancario:</span>
                  <button
                    type="button"
                    onClick={() => setZoomedQrImage(qrImgUrl)}
                    className="text-[11px] text-cyan-800 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Ver imagen ampliada</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-28 h-36 rounded-xl border border-slate-200 p-1.5 bg-slate-50 flex items-center justify-center shrink-0 shadow-2xs">
                    <img
                      src={qrImgUrl || "/assets/aistudio/QR1_c0569f21.jpeg"}
                      alt="QR actual"
                      className="max-h-full max-w-full object-contain rounded"
                    />
                  </div>

                  <div className="flex-1 space-y-2 text-left w-full">
                    <label className="block font-medium text-slate-700">
                      Subir nueva imagen de QR original (JPG o PNG):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadNewQrImage}
                      disabled={isUploadingQrImage}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-800 hover:file:bg-cyan-100 cursor-pointer"
                    />
                    <div className="text-[11px] text-slate-400">
                      Ruta o URL actual: <span className="font-mono truncate block max-w-xs">{qrImgUrl}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Entidad Bancaria:</label>
                  <input
                    type="text"
                    required
                    value={qrBank}
                    onChange={(e) => setQrBank(e.target.value)}
                    placeholder="Ej. Banco Unión S.A."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Titular de la Cuenta:</label>
                  <input
                    type="text"
                    required
                    value={qrTitular}
                    onChange={(e) => setQrTitular(e.target.value)}
                    placeholder="Ej. BAUTISTA HUANCA DIEGO ELVIS"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Número de Cuenta:</label>
                  <input
                    type="text"
                    required
                    value={qrAccount}
                    onChange={(e) => setQrAccount(e.target.value)}
                    placeholder="Ej. 61108714"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tipo de Cuenta / Red:</label>
                  <input
                    type="text"
                    value={qrAccountType}
                    onChange={(e) => setQrAccountType(e.target.value)}
                    placeholder="Ej. Caja de Ahorro / QR Yasta"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Instrucciones para el Cliente:</label>
                <textarea
                  rows={3}
                  value={qrInstructions}
                  onChange={(e) => setQrInstructions(e.target.value)}
                  placeholder="Instrucciones paso a paso que verá el cliente..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQrConfigModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingQrConfig || isUploadingQrImage}
                  className="px-4 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-xs shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSavingQrConfig ? "Guardando..." : "Guardar Configuración"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox for zooming QR */}
      {zoomedQrImage && (
        <div
          onClick={() => setZoomedQrImage(null)}
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md cursor-zoom-out"
        >
          <div className="relative max-w-md max-h-[90vh]">
            <button
              type="button"
              onClick={() => setZoomedQrImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomedQrImage}
              alt="QR ampliado"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl bg-white p-3"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
