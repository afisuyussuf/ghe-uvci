import express from "express";
import { getPrisma } from "../db";
import { loadLocalData, saveLocalData } from "../lib/local_db";
import { notifySecretaires, notifyAdmins } from "../lib/notifications";
import { logAction } from "../lib/audit";

const router = express.Router();

// Get recent availability updates (for dashboard widget — admin/secretaire)
router.get("/recent", async (req, res) => {
  const prisma = getPrisma();

  try {
    if (!prisma) {
      const data = loadLocalData();
      const dispos: any[] = data.disponibilites || [];
      const users: any[] = data.users || [];

      // Group by user
      const grouped: Record<string, any> = {};
      dispos.forEach(d => {
        if (!grouped[d.id_utilisateur]) {
          grouped[d.id_utilisateur] = { id_utilisateur: d.id_utilisateur, count: 0, date_maj: d.date_maj };
        }
        grouped[d.id_utilisateur].count++;
        if (!grouped[d.id_utilisateur].date_maj || d.date_maj > grouped[d.id_utilisateur].date_maj) {
          grouped[d.id_utilisateur].date_maj = d.date_maj;
        }
      });

      const result = Object.values(grouped)
        .sort((a, b) => (b.date_maj || '').localeCompare(a.date_maj || ''))
        .slice(0, 10)
        .map(g => {
          const u = users.find((u: any) => u.id === g.id_utilisateur);
          return { ...g, userName: u ? `${u.prenom} ${u.nom}` : 'Enseignant' };
        });

      return res.json(result);
    }

    // PostgreSQL: aggregate by user
    const grouped = await prisma.disponibilite.groupBy({
      by: ['id_utilisateur'],
      _count: { id: true },
      _max: { date_maj: true },
      orderBy: { _max: { date_maj: 'desc' } },
      take: 10,
    });

    // Fetch user names
    const userIds = grouped.map(g => g.id_utilisateur);
    const usersData = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nom: true, prenom: true },
    });
    const userMap = Object.fromEntries(usersData.map(u => [u.id, `${u.prenom} ${u.nom}`]));

    const result = grouped.map(g => ({
      id_utilisateur: g.id_utilisateur,
      userName: userMap[g.id_utilisateur] || 'Enseignant',
      count: g._count.id,
      date_maj: g._max.date_maj,
    }));

    res.json(result);
  } catch (error) {
    console.error("[disponibilites/recent]", error);
    res.status(500).json({ error: "Failed to fetch recent availability" });
  }
});

// Get all availability for a user
router.get("/", async (req, res) => {
  const { userId } = req.query;
  const prisma = getPrisma();
  
  if (!prisma) {
    const data = loadLocalData();
    const list = (data.disponibilites || []).filter((d: any) => d.id_utilisateur === userId);
    return res.json(list);
  }

  try {
    const list = await prisma.disponibilite.findMany({
      where: { id_utilisateur: userId as string },
      orderBy: { date_maj: 'desc' }
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

// Update availability (bulk)
router.post("/", async (req, res) => {
  const { userId, disponibilites, userName } = req.body;
  const prisma = getPrisma();

  // Helper: get the user's name for the notification message
  const getUserName = async (): Promise<string> => {
    if (userName) return userName;
    try {
      if (prisma) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { nom: true, prenom: true } });
        if (user) return `${user.prenom} ${user.nom}`;
      } else {
        const data = loadLocalData();
        const u = (data.users || []).find((u: any) => u.id === userId);
        if (u) return `${u.prenom} ${u.nom}`;
      }
    } catch {}
    return "Un enseignant";
  };

  if (!prisma) {
    try {
      const data = loadLocalData();
      if (!data.disponibilites) data.disponibilites = [];
      
      // Delete old ones for the user
      data.disponibilites = data.disponibilites.filter((d: any) => d.id_utilisateur !== userId);
      
      // Add new ones
      const newItems = (disponibilites || []).map((d: any, idx: number) => ({
        id: `disp-${userId}-${Date.now()}-${idx}`,
        id_utilisateur: userId,
        jour: d.jour,
        creneau: d.creneau,
        actif: d.actif !== undefined ? d.actif : true,
        date_maj: new Date().toISOString()
      }));
      
      data.disponibilites.push(...newItems);
      saveLocalData(data);

      // 🔔 Notify secretaries and admins
      const name = await getUserName();
      const count = newItems.length;
      const notifPayload = {
        titre: "📅 Disponibilités mises à jour",
        message: `${name} a mis à jour ses disponibilités (${count} créneau${count > 1 ? 'x' : ''}).`,
        type: "info" as const,
      };
      await Promise.all([
        notifySecretaires(notifPayload),
        notifyAdmins(notifPayload),
      ]);

      // 🔔 Audit Log
      const updater = (req as any).user;
      if (updater) {
        logAction(req, "UPDATE_AVAILABILITY", updater.id, updater.email, `Mise à jour des disponibilités (${count} créneaux) pour ${name}`).catch(console.error);
      }

      return res.json({ message: "Availability updated" });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to update local availability" });
    }
  }

  try {
    // Transaction to clear and update
    await prisma.$transaction([
      prisma.disponibilite.deleteMany({ where: { id_utilisateur: userId } }),
      prisma.disponibilite.createMany({
        data: disponibilites.map((d: any) => ({
          id_utilisateur: userId,
          jour: d.jour,
          creneau: d.creneau,
          actif: d.actif || true
        }))
      })
    ]);

    // 🔔 Notify secretaries and admins
    const name = await getUserName();
    const count = (disponibilites || []).length;
    const notifPayload = {
      titre: "📅 Disponibilités mises à jour",
      message: `${name} a mis à jour ses disponibilités (${count} créneau${count > 1 ? 'x' : ''}).`,
      type: "info" as const,
    };
    // Fire notifications without blocking the response
    Promise.all([
      notifySecretaires(notifPayload),
      notifyAdmins(notifPayload),
    ]).catch(e => console.error("[disponibilites] notify error:", e));

    // 🔔 Audit Log
    const updater = (req as any).user;
    if (updater) {
      logAction(req, "UPDATE_AVAILABILITY", updater.id, updater.email, `Mise à jour des disponibilités (${count} créneaux) pour ${name}`).catch(console.error);
    }

    res.json({ message: "Availability updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update availability" });
  }
});

export default router;
