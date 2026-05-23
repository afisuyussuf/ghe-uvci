import { Router } from "express";
import { getPrisma } from "../db";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { loadLocalData, saveLocalData } from "../lib/local_db";

const router = Router();

router.get("/", async (req, res) => {
  const { userId } = req.query;
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    let list = data.etats;
    if (userId) {
      list = list.filter(e => e.id_utilisateur === String(userId));
    }
    return res.json(list);
  }
  try {
    const etats = await (prisma as any).etatHeures.findMany({
      where: userId ? { id_utilisateur: String(userId) } : {},
      orderBy: { periode: 'desc' }
    });
    res.json(etats);
  } catch (error) {
    const data = loadLocalData();
    let list = data.etats;
    if (userId) {
      list = list.filter(e => e.id_utilisateur === String(userId));
    }
    res.json(list);
  }
});

router.post("/generate", async (req, res) => {
  const prisma = getPrisma();
  
  if (!prisma) {
    const data = loadLocalData();
    const period = format(new Date(), 'MMMM yyyy', { locale: fr });
    
    // Find validated activities for local database that have no state sheet linked yet
    const unlinked = data.activites.filter(act => act.statut === 'valide' && !act.id_etat_heures);
    if (unlinked.length === 0) {
      return res.json({ message: "Aucune activité à traiter." });
    }

    const groups: Record<string, { hours: number, amount: number, count: number, name: string }> = {};
    unlinked.forEach(act => {
      const user = data.users.find(u => u.id === act.id_user);
      const name = user ? `${user.prenom} ${user.nom}` : 'Enseignant Inconnu';
      if (!groups[act.id_user]) {
        groups[act.id_user] = { hours: 0, amount: 0, count: 0, name };
      }
      groups[act.id_user].hours += act.volume_horaire;
      groups[act.id_user].amount += act.montant || 0;
      groups[act.id_user].count += 1;
    });

    const results = [];
    for (const [userId, gData] of Object.entries(groups)) {
      const newEtat = {
        id: `etat-${Date.now()}-${userId}`,
        id_utilisateur: userId,
        periode: period,
        total_heures: gData.hours,
        nb_activites: gData.count,
        montant_total: gData.amount,
        nom_enseignant: gData.name,
        statut: 'valide',
        date_generation: new Date().toISOString()
      };

      data.etats.push(newEtat);

      // Link them locally
      data.activites = data.activites.map(act => {
        if (act.id_user === userId && act.statut === 'valide' && !act.id_etat_heures) {
          return { ...act, id_etat_heures: newEtat.id };
        }
        return act;
      });

      results.push(newEtat);
    }

    saveLocalData(data);
    return res.json({ message: `${results.length} états d'heures générés.`, count: results.length });
  }

  try {
    const period = format(new Date(), 'MMMM yyyy', { locale: fr });
    
    // 1. Get all validated activities not yet linked to a state
    const activities = await prisma.activite.findMany({
      where: {
        statut: 'valide',
        id_etat_heures: null
      } as any,
      include: { user: true } as any
    });

    if (activities.length === 0) {
      return res.json({ message: "Aucune activité à traiter." });
    }

    // 2. Group by user
    const userGroups: Record<string, { hours: number, amount: number, count: number, name: string }> = {};
    
    activities.forEach((a: any) => {
      if (!userGroups[a.id_user]) {
        userGroups[a.id_user] = { hours: 0, amount: 0, count: 0, name: `${a.user.prenom} ${a.user.nom}` };
      }
      userGroups[a.id_user].hours += a.volume_horaire;
      userGroups[a.id_user].amount += a.montant || 0;
      userGroups[a.id_user].count += 1;
    });

    // 3. Create States and link activities
    const results = [];
    for (const [userId, data] of Object.entries(userGroups)) {
      const etat = await (prisma as any).etatHeures.create({
        data: {
          id_utilisateur: userId,
          periode: period,
          total_heures: data.hours,
          nb_activites: data.count,
          montant_total: data.amount,
          nom_enseignant: data.name,
          statut: 'valide'
        }
      });

      // Update activities to link them
      await prisma.activite.updateMany({
        where: { id_user: userId, statut: 'valide', id_etat_heures: null } as any,
        data: { id_etat_heures: etat.id } as any
      });
      
      results.push(etat);
    }

    res.json({ message: `${results.length} états d'heures générés.`, count: results.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Generation failed" });
  }
});

export default router;
