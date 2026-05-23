import { Router } from "express";
import { getPrisma } from "../db";
import { calculateVolumeHoraire } from "../lib/calculations";
import { loadLocalData, saveLocalData } from "../lib/local_db";

const router = Router();

function enrichActivities(activitiesList: any[], data: any) {
  return activitiesList.map(act => {
    const usr = data.users.find((u: any) => u.id === act.id_user) || { nom: 'Inconnu', prenom: 'Utilisateur', role: 'enseignant', taux_horaire: 15000 };
    const crs = data.cours.find((c: any) => c.id === act.id_cours) || { intitule: 'Cours Inexistant', code_cours: 'XYZ' };
    return {
      ...act,
      user: {
        id: usr.id,
        nom: usr.nom,
        prenom: usr.prenom,
        role: usr.role,
        taux_horaire: usr.taux_horaire,
        photo_url: usr.photo_url
      },
      cours: crs
    };
  });
}

router.get("/", async (req, res) => {
  const { userId } = req.query;
  const prisma = getPrisma();
  
  if (!prisma) {
    const data = loadLocalData();
    let list = data.activites;
    if (userId) {
      list = list.filter(a => a.id_user === String(userId));
    }
    // Return in descending order of creation
    const sorted = [...list].sort((a,b) => new Date(b.date_saisie).getTime() - new Date(a.date_saisie).getTime());
    return res.json(enrichActivities(sorted, data));
  }

  const filters: any = {};
  if (userId) filters.id_user = String(userId);

  try {
    const activities = await prisma.activite.findMany({
      where: filters,
      include: { 
        cours: true, 
        user: { select: { nom: true, prenom: true, id: true, photo_url: true, role: true, taux_horaire: true } } 
      },
      orderBy: { date_saisie: 'desc' }
    });
    res.json(activities);
  } catch (error) {
    const data = loadLocalData();
    let list = data.activites;
    if (userId) {
      list = list.filter(a => a.id_user === String(userId));
    }
    const sorted = [...list].sort((a,b) => new Date(b.date_saisie).getTime() - new Date(a.date_saisie).getTime());
    res.json(enrichActivities(sorted, data));
  }
});

router.post("/", async (req, res) => {
  const prisma = getPrisma();
  const { id_user, type_action, niveau_complexite, nb_sequences } = req.body;

  // Auto-calculate
  const volume_horaire = calculateVolumeHoraire(type_action, niveau_complexite, nb_sequences);

  if (!prisma) {
    const data = loadLocalData();
    const user = data.users.find(u => u.id === id_user);
    const taux = user?.taux_horaire || 15000;
    const montant = volume_horaire * taux;

    const newActivity = {
      id: `act-${Date.now()}`,
      statut: 'en_attente',
      paye: false,
      date_saisie: new Date().toISOString(),
      ...req.body,
      volume_horaire,
      montant
    };

    data.activites.push(newActivity);
    saveLocalData(data);
    return res.status(201).json(enrichActivities([newActivity], data)[0]);
  }

  let montant = req.body.montant;
  try {
    const user = await prisma.user.findUnique({ where: { id: id_user }});
    if (user && user.taux_horaire) {
      montant = volume_horaire * user.taux_horaire;
    }
    
    const activity = await prisma.activite.create({ 
      data: {
        ...req.body,
        volume_horaire,
        montant
      } 
    });
    res.json(activity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create activity" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();
  const { type_action, niveau_complexite, nb_sequences, statut } = req.body;

  if (!prisma) {
    const data = loadLocalData();
    const index = data.activites.findIndex(a => a.id === id);
    if (index !== -1) {
      const current = data.activites[index];
      const finalType = type_action || current.type_action;
      const finalNiveau = niveau_complexite || current.niveau_complexite;
      const finalSeqs = nb_sequences === undefined ? current.nb_sequences : nb_sequences;
      const volume_horaire = calculateVolumeHoraire(finalType, finalNiveau, finalSeqs);
      
      const user = data.users.find(u => u.id === current.id_user);
      const taux = user?.taux_horaire || 15000;
      const montant = volume_horaire * taux;

      const updated = {
        ...current,
        ...req.body,
        volume_horaire,
        montant
      };

      data.activites[index] = updated;
      saveLocalData(data);
      return res.json(enrichActivities([updated], data)[0]);
    }
    return res.status(404).json({ error: "Activity not found" });
  }

  let updateData = { ...req.body };

  if (type_action || niveau_complexite || nb_sequences) {
    try {
      const currentActivity = await prisma.activite.findUnique({ where: { id } }) as any;
      const finalType = type_action || currentActivity?.type_action;
      const finalNiveau = niveau_complexite || currentActivity?.niveau_complexite;
      const finalSeqs = nb_sequences || currentActivity?.nb_sequences;
      
      updateData.volume_horaire = calculateVolumeHoraire(finalType as any, finalNiveau as any, finalSeqs as any);
    } catch (e) {}
  }

  try {
    const activity = await prisma.activite.update({ 
      where: { id }, 
      data: updateData,
      include: { user: true, cours: true }
    });

    if (statut && (statut === 'valide' || statut === 'rejete' || statut === 'soumise')) {
      const courseLabel = activity.cours?.intitule || 'Inconnu';
      try {
        await (prisma as any).notification.create({
          data: {
            id_utilisateur: activity.id_user,
            titre: `Activité ${statut === 'valide' ? 'Validée' : statut === 'soumise' ? 'Soumise' : 'Rejetée'}`,
            message: statut === 'valide' 
              ? `Votre activité (${activity.type_action}) pour "${courseLabel}" a été validée.` 
              : statut === 'rejete' 
                ? `Votre activité pour "${courseLabel}" a été rejetée. Motif: ${updateData.motif_rejet || 'Non spécifié'}`
                : `Une nouvelle activité de ${activity.user.nom} pour "${courseLabel}" est en attente de validation.`,
            type: statut === 'valide' ? 'success' : statut === 'rejete' ? 'error' : 'info',
          }
        });
      } catch (e) {}
    }

    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: "Failed to update activity" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();
  
  if (!prisma) {
    const data = loadLocalData();
    const filtered = data.activites.filter(a => a.id !== id);
    if (filtered.length !== data.activites.length) {
      data.activites = filtered;
      saveLocalData(data);
      return res.json({ message: "Deleted" });
    }
    return res.status(404).json({ error: "Activity not found" });
  }

  try {
    await prisma.activite.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete activity" });
  }
});

export default router;
