import { Router } from "express";
import { getPrisma } from "../db";
import { loadLocalData, saveLocalData } from "../lib/local_db";

const router = Router();

router.get("/", async (req, res) => {
  const { userId } = req.query;
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    let list = data.paiements;
    if (userId) {
      list = list.filter(p => p.id_user === String(userId));
    }
    return res.json(list);
  }
  try {
    const paiements = await prisma.paiement.findMany({
      where: userId ? { id_user: String(userId) } : {},
      orderBy: { date_paiement: 'desc' }
    });
    res.json(paiements);
  } catch (error) {
    const data = loadLocalData();
    let list = data.paiements;
    if (userId) {
      list = list.filter(p => p.id_user === String(userId));
    }
    res.json(list);
  }
});

router.post("/", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    const newP = {
      id: `p-${Date.now()}`,
      statut: 'effectue',
      date_paiement: new Date().toISOString(),
      ...req.body
    };
    data.paiements.push(newP);
    
    // Also, we need to mark any matched validated activity as paye = true!
    // Often, the body has something like `activityId` or similar if associated or they do it in the UI.
    // Let's mark matching activities in our local data as paye = true.
    if (req.body.id_user) {
      data.activites = data.activites.map(act => {
        if (act.id_user === req.body.id_user && act.statut === 'valide') {
          return { ...act, paye: true, date_paiement: new Date().toISOString() };
        }
        return act;
      });
    }

    saveLocalData(data);
    return res.json(newP);
  }
  try {
    const p = await prisma.paiement.create({ data: req.body });
    res.json(p);
  } catch (err) {
    console.error("Payment failed in Postgres:", err);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

export default router;
