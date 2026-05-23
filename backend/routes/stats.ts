import { Router } from "express";
import { getPrisma } from "../db";

const router = Router();

router.get("/summary", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) return res.json({ total_heures: 0, nb_enseignants: 0, nb_activites: 0 });

  try {
    const totalActivities = await prisma.activite.count({ where: { statut: 'valide' } });
    const totalEnseignants = await prisma.user.count({ where: { role: 'enseignant' } });
    const aggregations = await prisma.activite.aggregate({
      where: { statut: 'valide' },
      _sum: { volume_horaire: true, montant: true }
    });

    // Stats by Department
    const statsDept = await (prisma as any).activite.groupBy({
      by: ['id_user'],
      where: { statut: 'valide' },
      _sum: { volume_horaire: true }
    });

    res.json({
      total_heures: aggregations._sum.volume_horaire || 0,
      total_montant: aggregations._sum.montant || 0,
      nb_enseignants: totalEnseignants,
      nb_activites: totalActivities
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/by-type", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) return res.json([]);
  try {
    const stats = await prisma.activite.groupBy({
      by: ['type_action'],
      where: { statut: 'valide' },
      _sum: { volume_horaire: true },
      _count: true
    });
    res.json(stats);
  } catch (error) { res.json([]); }
});

router.get("/by-month", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) return res.json([]);
  try {
    const activites = await prisma.activite.findMany({
      where: { statut: 'valide' },
      select: { volume_horaire: true, date_saisie: true }
    });
    
    // Grouping by month in JS for simplicity
    const months: Record<string, number> = {};
    activites.forEach(a => {
      const m = new Date(a.date_saisie).toLocaleString('fr-FR', { month: 'short' });
      months[m] = (months[m] || 0) + a.volume_horaire;
    });

    res.json(Object.entries(months).map(([name, value]) => ({ name, value })));
  } catch (error) { res.json([]); }
});

export default router;
