/**
 * Centralized notification helper.
 * Creates notifications in DB (Prisma) or local file fallback.
 */
import { getPrisma } from "../db";
import { loadLocalData, saveLocalData } from "./local_db";

export interface NotifPayload {
  id_utilisateur: string;
  titre: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  lien?: string;
}

/**
 * Send one notification to a single user.
 */
export async function notifyUser(payload: NotifPayload): Promise<void> {
  const prisma = getPrisma();
  const date = new Date().toISOString();

  if (prisma) {
    try {
      await (prisma as any).notification.create({
        data: {
          id_utilisateur: payload.id_utilisateur,
          titre: payload.titre,
          message: payload.message,
          type: payload.type,
          lu: false,
          date: new Date(date),
        },
      });
      return;
    } catch (e) {
      console.error("[notifyUser] Prisma error, falling back to local:", e);
    }
  }

  // Local file fallback
  const data = loadLocalData();
  if (!data.notifications) data.notifications = [];
  data.notifications.push({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    id_utilisateur: payload.id_utilisateur,
    titre: payload.titre,
    message: payload.message,
    type: payload.type,
    lu: false,
    date,
  });
  saveLocalData(data);
}

/**
 * Send a notification to all users with a given role.
 * Works with both Prisma DB and local file fallback.
 */
export async function notifyRole(
  role: "admin" | "secretaire" | "enseignant",
  payload: Omit<NotifPayload, "id_utilisateur">
): Promise<void> {
  const prisma = getPrisma();

  let targetIds: string[] = [];

  if (prisma) {
    try {
      const users = await prisma.user.findMany({
        where: { role, actif: true },
        select: { id: true },
      });
      targetIds = users.map((u) => u.id);
    } catch (e) {
      console.error("[notifyRole] Prisma findMany error, falling back to local:", e);
    }
  }

  if (targetIds.length === 0) {
    // Fallback: get from local data
    const data = loadLocalData();
    targetIds = (data.users || [])
      .filter((u: any) => u.role === role && u.actif !== false)
      .map((u: any) => u.id);
  }

  // Send a notification to each target user (in parallel)
  await Promise.all(
    targetIds.map((id) => notifyUser({ ...payload, id_utilisateur: id }))
  );
}

/**
 * Notify all secretaries (convenience wrapper).
 */
export async function notifySecretaires(
  payload: Omit<NotifPayload, "id_utilisateur">
): Promise<void> {
  return notifyRole("secretaire", payload);
}

/**
 * Notify all admins (convenience wrapper).
 */
export async function notifyAdmins(
  payload: Omit<NotifPayload, "id_utilisateur">
): Promise<void> {
  return notifyRole("admin", payload);
}
