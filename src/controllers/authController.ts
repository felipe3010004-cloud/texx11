import { auth, db, firebase } from "../models/firebaseModel";
import { MemberStatus, MemberUser } from "../models/types";
import { auditController } from "./auditController";

export interface RegisterParams {
  fullName: string;
  email: string;
  phone: string;
  countryCode?: string;
  pass: string;
  termsAccepted: boolean;
}

export class AuthController {
  public normalizeEmail(raw: string): string {
    const clean = raw.trim();
    if (clean.includes("@")) return clean.toLowerCase();
    const digits = clean.replace(/\D/g, "");
    return digits ? `${digits}@gmail.com` : "";
  }

  public cleanPhone(raw: string, defaultCode: string = "591"): string {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("591") && digits.length >= 10) return digits;
    if (digits.length === 8) return `${defaultCode}${digits}`;
    return digits;
  }

  public async login(
    identifier: string,
    pass: string
  ): Promise<{ user: any; role: string; status: MemberStatus; memberData?: MemberUser }> {
    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      throw new Error("Por favor introduce un correo o celular válido.");
    }
    if (!pass || typeof pass !== "string" || !pass.trim()) {
      throw new Error("Por favor introduce tu contraseña.");
    }

    const email = this.normalizeEmail(identifier);
    if (!email) throw new Error("Por favor introduce un correo o celular válido.");

    const cred = await auth.signInWithEmailAndPassword(email, pass);
    const user = cred.user!;
    let role = "vendedor";
    let status: MemberStatus = "pendiente";
    let memberData: MemberUser | undefined;

    try {
      const doc = await db.collection("users").doc(user.uid).get();
      if (doc.exists) {
        const d = doc.data()!;
        role = d.role || "vendedor";
        status = d.status || (role === "admin" ? "autorizado" : "pendiente");
        memberData = {
          id: doc.id,
          nombreCompleto: d.nombreCompleto || d.fullName || user.displayName || "Miembro Team Life",
          email: d.email || email,
          phone: d.phone || "",
          countryCode: d.countryCode || "591",
          role: role as "admin" | "vendedor",
          status,
          clics: d.clics || 0,
          totalVentas: d.totalVentas || 0,
          notasAdmin: d.notasAdmin || "",
          termsAccepted: !!d.termsAccepted,
          fechaRegistro: d.createdAt ? d.createdAt.toDate?.() || d.createdAt : new Date(),
        };
      }
    } catch (e) {
      console.warn("Firestore user lookup error:", e);
    }

    return { user, role, status, memberData };
  }

  public onAuthStateChanged(
    callback: (user: any, role: string | null, status: MemberStatus | null, memberData?: MemberUser) => void
  ): () => void {
    return auth.onAuthStateChanged(async (user) => {
      if (user) {
        let role = "vendedor";
        let status: MemberStatus = "pendiente";
        let memberData: MemberUser | undefined;
        try {
          const doc = await db.collection("users").doc(user.uid).get();
          if (doc.exists) {
            const d = doc.data()!;
            role = d.role || "vendedor";
            status = d.status || (role === "admin" ? "autorizado" : "pendiente");
            memberData = {
              id: doc.id,
              nombreCompleto: d.nombreCompleto || d.fullName || "Miembro Team Life",
              email: d.email || user.email || "",
              phone: d.phone || "",
              countryCode: d.countryCode || "591",
              role: role as "admin" | "vendedor",
              status,
              clics: d.clics || 0,
              totalVentas: d.totalVentas || 0,
              notasAdmin: d.notasAdmin || "",
              termsAccepted: !!d.termsAccepted,
              fechaRegistro: d.createdAt ? d.createdAt.toDate?.() || d.createdAt : new Date(),
            };
          }
        } catch (e) {
          console.warn("Firestore role lookup on auth state change:", e);
        }
        callback(user, role, status, memberData);
      } else {
        callback(null, null, null);
      }
    });
  }

  public async register(params: RegisterParams): Promise<{ user: any; role: string; status: MemberStatus }> {
    const { fullName, email: rawEmail, phone: rawPhone, countryCode = "591", pass, termsAccepted } = params;

    if (!fullName || fullName.trim().length < 3) {
      throw new Error("Por favor introduce tu nombre y apellidos completos.");
    }
    const email = this.normalizeEmail(rawEmail);
    if (!email) throw new Error("Por favor introduce un correo electrónico válido.");
    if (!pass || pass.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres.");
    }
    if (!termsAccepted) {
      throw new Error("Debes aceptar los Términos y Condiciones Comerciales de Team Life.");
    }

    const cleanPhone = this.cleanPhone(rawPhone, countryCode);
    if (cleanPhone.length < 8) {
      throw new Error("Por favor introduce un número de celular o WhatsApp válido.");
    }

    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    const user = cred.user!;
    const status: MemberStatus = "pendiente";

    try {
      await db.collection("users").doc(user.uid).set(
        {
          nombreCompleto: fullName.trim(),
          email,
          phone: cleanPhone,
          countryCode,
          role: "vendedor",
          status: "pendiente",
          clics: 0,
          totalVentas: 0,
          termsAccepted: true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await auditController.logEvent(
        "Registro de nuevo miembro",
        "miembros",
        `Nuevo postulante registrado: ${fullName.trim()} (${email}, +${cleanPhone}). Estado inicial: Pendiente.`
      );
    } catch (e) {
      console.warn("Firestore user registration record error:", e);
    }

    return { user, role: "vendedor", status };
  }

  public async getAllMembers(): Promise<MemberUser[]> {
    try {
      const snap = await db.collection("users").orderBy("createdAt", "desc").limit(100).get();
      const list: MemberUser[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        list.push({
          id: doc.id,
          nombreCompleto: d.nombreCompleto || d.fullName || "Distribuidor",
          email: d.email || "",
          phone: d.phone || "",
          countryCode: d.countryCode || "591",
          role: (d.role || "vendedor") as "admin" | "vendedor",
          status: (d.status || (d.role === "admin" ? "autorizado" : "pendiente")) as MemberStatus,
          clics: d.clics || 0,
          totalVentas: d.totalVentas || 0,
          notasAdmin: d.notasAdmin || "",
          termsAccepted: !!d.termsAccepted,
          fechaRegistro: d.createdAt ? d.createdAt.toDate?.() || d.createdAt : new Date(),
        });
      });
      return list;
    } catch (e) {
      console.warn("Error obteniendo miembros de Firestore:", e);
      // Fallback mock representation for offline display
      return [
        {
          id: "usr-admin-master",
          nombreCompleto: "Superadministrador Team Life",
          email: "admin@teamlife.com",
          phone: "59178945612",
          countryCode: "591",
          role: "admin",
          status: "autorizado",
          clics: 0,
          totalVentas: 15400,
          fechaRegistro: new Date("2025-01-10"),
        },
        {
          id: "usr-vend-1",
          nombreCompleto: "Valeria Roca Morales",
          email: "valeria.roca@teamlife.com",
          phone: "59178945612",
          countryCode: "591",
          role: "vendedor",
          status: "autorizado",
          clics: 142,
          totalVentas: 4890,
          fechaRegistro: new Date("2025-02-01"),
        },
        {
          id: "usr-vend-2",
          nombreCompleto: "Carlos Mendoza Quispe",
          email: "carlos.mendoza@gmail.com",
          phone: "59171239874",
          countryCode: "591",
          role: "vendedor",
          status: "pendiente",
          clics: 18,
          totalVentas: 0,
          fechaRegistro: new Date(),
        },
        {
          id: "usr-vend-3",
          nombreCompleto: "María Luz Fernandez",
          email: "maria.luz@teamlife.com",
          phone: "59168923412",
          countryCode: "591",
          role: "vendedor",
          status: "suspendido",
          clics: 45,
          totalVentas: 1200,
          notasAdmin: "Suspendido por inactividad comercial superior a 90 días.",
          fechaRegistro: new Date("2025-01-20"),
        },
      ];
    }
  }

  public async updateMemberStatus(
    userId: string,
    newStatus: MemberStatus,
    notasAdmin?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      if (notasAdmin !== undefined) {
        updateData.notasAdmin = notasAdmin;
      }
      await db.collection("users").doc(userId).set(updateData, { merge: true });

      await auditController.logEvent(
        "Actualización de estado de miembro",
        "miembros",
        `Miembro ID: ${userId} actualizado a estado "${newStatus}". ${notasAdmin ? `Nota: ${notasAdmin}` : ""}`
      );
    } catch (e: any) {
      console.warn("Error actualizando estado en Firestore:", e);
      throw e;
    }
  }

  public async updateMemberProfile(
    userId: string,
    data: {
      nombreCompleto?: string;
      email?: string;
      phone?: string;
      countryCode?: string;
      role?: "admin" | "vendedor";
      status?: MemberStatus;
      notasAdmin?: string;
    }
  ): Promise<{ success: boolean; requiresAuthReset?: boolean }> {
    const currentSuperadmin = auth.currentUser;
    // Safeguard: Prevent superadmin from revoking their own admin role
    if (currentSuperadmin && currentSuperadmin.uid === userId && data.role === "vendedor") {
      throw new Error("Por seguridad, el Superadministrador no puede revocar sus propios privilegios administrativos.");
    }

    const updatePayload: any = {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (data.nombreCompleto) updatePayload.nombreCompleto = data.nombreCompleto.trim();
    if (data.countryCode) updatePayload.countryCode = data.countryCode;
    if (data.phone) {
      updatePayload.phone = this.cleanPhone(data.phone, data.countryCode || "591");
    }
    if (data.role) updatePayload.role = data.role;
    if (data.status) updatePayload.status = data.status;
    if (data.notasAdmin !== undefined) updatePayload.notasAdmin = data.notasAdmin;

    let requiresAuthReset = false;
    if (data.email) {
      const cleanEmail = this.normalizeEmail(data.email);
      updatePayload.email = cleanEmail;

      // If updating the currently logged-in admin user's email directly
      if (currentSuperadmin && currentSuperadmin.uid === userId && currentSuperadmin.email !== cleanEmail) {
        try {
          await currentSuperadmin.updateEmail(cleanEmail);
        } catch (authErr: any) {
          if (authErr.code === "auth/requires-recent-login") {
            throw new Error(
              "Para cambiar el correo de tu cuenta activa de Firebase Authentication debes cerrar sesión y volver a iniciarla recientemente."
            );
          }
          console.warn("Aviso Auth al actualizar email activo:", authErr);
        }
      } else {
        requiresAuthReset = true;
      }
    }

    await db.collection("users").doc(userId).set(updatePayload, { merge: true });

    await auditController.logEvent(
      "Modificación de perfil de miembro",
      "miembros",
      `Usuario ID: ${userId} (${updatePayload.nombreCompleto || "Usuario"}) modificado por el Superadministrador. Campos: ${Object.keys(
        updatePayload
      ).join(", ")}.`
    );

    return { success: true, requiresAuthReset };
  }

  public async sendPasswordReset(email: string): Promise<void> {
    const clean = this.normalizeEmail(email);
    if (!clean) throw new Error("Correo inválido para restablecimiento.");
    await auth.sendPasswordResetEmail(clean);
    await auditController.logEvent(
      "Envío de enlace de restablecimiento",
      "miembros",
      `Se envió enlace oficial de restablecimiento de contraseña de Firebase Auth a ${clean}.`
    );
  }


  public async createMemberManual(data: {
    fullName: string;
    email: string;
    phone: string;
    countryCode?: string;
    role: "vendedor" | "admin";
    status: MemberStatus;
    notasAdmin?: string;
  }): Promise<void> {
    const cleanPhone = this.cleanPhone(data.phone, data.countryCode || "591");
    const email = this.normalizeEmail(data.email);

    try {
      const docRef = await db.collection("users").add({
        nombreCompleto: data.fullName.trim(),
        email,
        phone: cleanPhone,
        countryCode: data.countryCode || "591",
        role: data.role,
        status: data.status,
        clics: 0,
        totalVentas: 0,
        notasAdmin: data.notasAdmin || "Alta manual por Superadministrador",
        termsAccepted: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      await auditController.logEvent(
        "Alta manual de miembro",
        "miembros",
        `Superadministrador creó manualmente a ${data.fullName} (${email}, +${cleanPhone}) con estado "${data.status}". ID: ${docRef.id}`
      );
    } catch (e: any) {
      console.warn("Error creando miembro manual en Firestore:", e);
      throw e;
    }
  }

  public async getSellerById(sellerId: string): Promise<MemberUser | null> {
    if (!sellerId) return null;
    try {
      const doc = await db.collection("users").doc(sellerId).get();
      if (doc.exists) {
        const d = doc.data()!;
        return {
          id: doc.id,
          nombreCompleto: d.nombreCompleto || d.fullName || "Distribuidor Autorizado",
          email: d.email || "",
          phone: d.phone || "",
          countryCode: d.countryCode || "591",
          role: (d.role || "vendedor") as "admin" | "vendedor",
          status: (d.status || (d.role === "admin" ? "autorizado" : "pendiente")) as MemberStatus,
          clics: d.clics || 0,
          totalVentas: d.totalVentas || 0,
          notasAdmin: d.notasAdmin || "",
          termsAccepted: !!d.termsAccepted,
          fechaRegistro: d.createdAt ? d.createdAt.toDate?.() || d.createdAt : new Date(),
        };
      }
    } catch (e) {
      console.warn("Error buscando vendedor por ID:", e);
    }
    return null;
  }

  public async logout(): Promise<void> {
    try {
      await auth.signOut();
    } catch (e) {
      console.warn("Sign out notice:", e);
    }
  }

  public getCurrentUser(): any {
    return auth.currentUser;
  }
}

export const authController = new AuthController();
