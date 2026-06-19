/**
 * Centralized Audit Logging Helper.
 * Creates audit logs in DB (Prisma) or local file fallback.
 */
import { getPrisma } from "../db";
import { loadLocalData, saveLocalData } from "./local_db";

// Helper to detect device type from User-Agent string
function detectDevice(userAgent: string): string {
  if (!userAgent) return "Inconnu";
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return "📱 Mobile";
  }
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    return "📟 Tablette";
  }
  return "💻 Desktop";
}

// Helper to get browser name from UA
function detectBrowser(ua: string): string {
  if (!ua) return "Inconnu";
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua)) return "Opera";
  if (/chrome/i.test(ua) && !/chromium/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  return "Navigateur";
}

export async function logAction(
  req: any,
  action: string,
  userId: string,
  userEmail: string,
  details: string
): Promise<void> {
  const ip_address = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || "127.0.0.1";
  const user_agent = req.headers['user-agent'] || "";
  const device = `${detectDevice(user_agent)} — ${detectBrowser(user_agent)}`;
  
  const prisma = getPrisma();
  const timestamp = new Date().toISOString();

  if (prisma) {
    try {
      await (prisma as any).auditLog.create({
        data: {
          action,
          userId,
          userEmail,
          details,
          ip_address,
          user_agent,
          device,
          timestamp: new Date(timestamp)
        }
      });
      return;
    } catch (e) {
      console.error("[logAction] Prisma error, falling back to local:", e);
    }
  }

  // Fallback to local_data.json
  try {
    const data = loadLocalData();
    if (!data.auditLogs) data.auditLogs = [];
    data.auditLogs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp,
      action,
      userId,
      userEmail,
      details,
      ip_address,
      user_agent,
      device
    });
    saveLocalData(data);
  } catch (e) {
    console.error("[logAction] local_db error:", e);
  }
}
