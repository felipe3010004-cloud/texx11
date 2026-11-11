import { db, firebase } from "../models/firebaseModel";
import { AuditLogItem } from "../models/types";

export class AuditController {
  public async logEvent(
    action: string,
    category: "miembros" | "catalogo" | "ia" | "pedidos" | "sistema" | "pagos",
    details: string,
    user: string = "Superadministrador"
  ): Promise<void> {
    try {
      await db.collection("audit_logs").add({
        action,
        category,
        details,
        user,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.warn("Nota Firestore audit_log:", e);
    }
  }

  public async getRecentLogs(limitCount: number = 30): Promise<AuditLogItem[]> {
    try {
      const snap = await db
        .collection("audit_logs")
        .orderBy("timestamp", "desc")
        .limit(limitCount)
        .get();

      const items: AuditLogItem[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        items.push({
          id: doc.id,
          action: d.action || "Acción registrada",
          category: d.category || "sistema",
          details: d.details || "",
          user: d.user || "Superadministrador",
          timestamp: d.timestamp ? d.timestamp.toDate() : new Date(),
        });
      });
      return items;
    } catch (e) {
      console.warn("Error leyendo audit_logs:", e);
      return [];
    }
  }
}

export const auditController = new AuditController();
