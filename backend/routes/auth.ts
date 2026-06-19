import { Router } from "express";
import { getPrisma } from "../db";
import { loadLocalData, saveLocalData } from "../lib/local_db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "ghe_uvci_super_secret_key_2026_xyz";

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
  return "Navigateur inconnu";
}

// Helper: compare password — supports both bcrypt hashes and legacy plain text
async function checkPassword(plain: string, stored: string): Promise<boolean> {
  if (!plain || !stored) return false;
  if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
    return bcrypt.compare(plain, stored);
  }
  // Legacy plain text fallback (auto-migrated on next login)
  return plain === stored;
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Gather device info
  const ip_address = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || "Inconnu";
  const user_agent = req.headers['user-agent'] || "";
  const device = `${detectDevice(user_agent)} — ${detectBrowser(user_agent)}`;

  const prisma = getPrisma();

  const createAuditLog = async (userId: string, userEmail: string) => {
    const timestamp = new Date().toISOString();
    if (prisma) {
      try {
        await (prisma as any).auditLog.create({
          data: {
            action: "LOGIN",
            userId,
            userEmail,
            details: `Connexion réussie depuis ${device}`,
            ip_address,
            user_agent,
            device,
            timestamp: new Date(timestamp)
          }
        });
      } catch (e) {
        const data = loadLocalData();
        if (!data.auditLogs) data.auditLogs = [];
        data.auditLogs.push({ id: `log-${Date.now()}`, action: "LOGIN", userId, userEmail, details: `Connexion depuis ${device}`, ip_address, user_agent, device, timestamp });
        saveLocalData(data);
      }
    } else {
      const data = loadLocalData();
      if (!data.auditLogs) data.auditLogs = [];
      data.auditLogs.push({ id: `log-${Date.now()}`, action: "LOGIN", userId, userEmail, details: `Connexion depuis ${device}`, ip_address, user_agent, device, timestamp });
      saveLocalData(data);
    }
  };

  if (prisma) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user && await checkPassword(password, user.password)) {
        // Auto-migrate plain-text password to bcrypt hash
        if (!user.password.startsWith('$2')) {
          const hashed = await bcrypt.hash(password, 10);
          await prisma.user.update({ where: { id: user.id }, data: { password: hashed, last_login: new Date() } });
        } else {
          await prisma.user.update({ where: { id: user.id }, data: { last_login: new Date() } });
        }
        await createAuditLog(user.id, user.email);
        const { password: _, ...userWithoutPassword } = user;
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, user: userWithoutPassword });
      }
    } catch (error) {
      console.error("Database login failed, running file fallback...", error);
    }
  }

  // File fallback
  const data = loadLocalData();
  const dbUser = data.users.find((u: any) => u.email === email);
  if (dbUser && await checkPassword(password, dbUser.password)) {
    // Auto-migrate plain-text to bcrypt in local DB
    if (!dbUser.password.startsWith('$2')) {
      dbUser.password = await bcrypt.hash(password, 10);
      saveLocalData(data);
    }
    await createAuditLog(dbUser.id, dbUser.email);
    const { password: _, ...userWithoutPassword } = dbUser;
    const token = jwt.sign({ id: dbUser.id, email: dbUser.email, role: dbUser.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user: userWithoutPassword });
  }

  // Static fallback accounts (dev only)
  const testAccounts: Record<string, any> = {
    'yussuf.afisu@uvci.edu.ci': { id: 'test-admin', email: 'yussuf.afisu@uvci.edu.ci', password: 'password', nom: 'AFISU', prenom: 'Yussuf', role: 'admin', actif: true },
    'safi.moustapha@uvci.edu.ci': { id: 'test-secretaire', email: 'safi.moustapha@uvci.edu.ci', password: 'demo123', nom: 'MOUSTAPHA', prenom: 'Safi', role: 'secretaire', actif: true },
    'seydou1.sangare@uvci.edu.ci': { id: 'test-enseignant', email: 'seydou1.sangare@uvci.edu.ci', password: 'demo@demo', nom: 'SANGARE', prenom: 'Seydou', role: 'enseignant', actif: true }
  };

  const staticUser = testAccounts[email];
  if (staticUser && staticUser.password === password) {
    await createAuditLog(staticUser.id, staticUser.email);
    const { password: _, ...userWithoutPassword } = staticUser;
    const token = jwt.sign({ id: staticUser.id, email: staticUser.email, role: staticUser.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user: userWithoutPassword });
  }

  res.status(401).json({ error: "E-mail ou mot de passe incorrect." });
});

export default router;
