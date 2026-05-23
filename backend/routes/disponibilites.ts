import express from "express";
import { getPrisma } from "../db";
import { loadLocalData, saveLocalData } from "../lib/local_db";

const router = express.Router();

// Get all availability for a user
router.get("/", async (req, res) => {
  const { userId } = req.query;
  const prisma = getPrisma();
  
  if (!prisma) {
    const data = loadLocalData();
    const list = (data.disponibilites || []).filter(d => d.id_utilisateur === userId);
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
  const { userId, disponibilites } = req.body;
  const prisma = getPrisma();

  if (!prisma) {
    try {
      const data = loadLocalData();
      if (!data.disponibilites) data.disponibilites = [];
      
      // Delete old ones for the user
      data.disponibilites = data.disponibilites.filter(d => d.id_utilisateur !== userId);
      
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

    res.json({ message: "Availability updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update availability" });
  }
});

export default router;
