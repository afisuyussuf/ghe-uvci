import { Router } from "express";
import { getPrisma } from "../db";
import { loadLocalData, saveLocalData } from "../lib/local_db";

const router = Router();

router.get("/", async (req, res) => {
  const { userId } = req.query;
  const prisma = getPrisma();
  
  if (!prisma) {
    const data = loadLocalData();
    let list = data.notifications || [];
    if (userId) {
      list = list.filter(n => n.id_utilisateur === String(userId));
    }
    if (list.length === 0) {
      list = [
        { id: 'n1', titre: 'Bienvenue', message: 'Bienvenue sur la nouvelle plateforme GHE UVCI.', date: new Date().toISOString(), lu: false, type: 'info', id_utilisateur: userId }
      ];
    }
    return res.json(list);
  }

  try {
    const notifications = await (prisma as any).notification.findMany({
      where: userId ? { id_utilisateur: String(userId) } : {},
      orderBy: { date: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    const data = loadLocalData();
    let list = data.notifications || [];
    if (userId) {
      list = list.filter(n => n.id_utilisateur === String(userId));
    }
    if (list.length === 0) {
      list = [
        { id: 'n1', titre: 'Bienvenue', message: 'Bienvenue sur la nouvelle plateforme GHE UVCI.', date: new Date().toISOString(), lu: false, type: 'info', id_utilisateur: userId }
      ];
    }
    res.json(list);
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();
  if (prisma) {
    try {
      const notif = await (prisma as any).notification.update({
        where: { id },
        data: req.body
      });
      return res.json(notif);
    } catch (e) {
      // Quietly utilize local fallback below
    }
  }
  const data = loadLocalData();
  if (!data.notifications) data.notifications = [];
  const idx = data.notifications.findIndex(n => n.id === id);
  if (idx !== -1) {
    data.notifications[idx] = { ...data.notifications[idx], ...req.body };
  } else {
    data.notifications.push({ id, ...req.body });
  }
  saveLocalData(data);
  const updated = data.notifications.find(n => n.id === id);
  res.json(updated || { id, ...req.body });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();
  if (prisma) {
    try {
      await (prisma as any).notification.delete({ where: { id } });
      return res.json({ status: "deleted" });
    } catch (e) {
      // Quietly utilize local fallback below
    }
  }
  const data = loadLocalData();
  data.notifications = (data.notifications || []).filter(n => n.id !== id);
  saveLocalData(data);
  res.json({ status: "deleted" });
});

export default router;
