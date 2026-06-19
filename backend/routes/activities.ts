import { Router } from "express";
import { getPrisma } from "../db";
import { calculateVolumeHoraire } from "../lib/calculations";
import { loadLocalData, saveLocalData } from "../lib/local_db";
import { notifyUser, notifySecretaires, notifyAdmins } from "../lib/notifications";
import { logAction } from "../lib/audit";

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
      list = list.filter((a: any) => a.id_user === String(userId));
    }
    // Return in descending order of creation
    const sorted = [...list].sort((a: any, b: any) => new Date(b.date_saisie).getTime() - new Date(a.date_saisie).getTime());
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
      list = list.filter((a: any) => a.id_user === String(userId));
    }
    const sorted = [...list].sort((a: any, b: any) => new Date(b.date_saisie).getTime() - new Date(a.date_saisie).getTime());
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
    const user = data.users.find((u: any) => u.id === id_user);
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

    const enriched = enrichActivities([newActivity], data)[0];
    const crs = enriched.cours;
    const usr = enriched.user;

    // 🔔 Notify secretaries: new activity created
    notifySecretaires({
      titre: "📝 Nouvelle activité créée",
      message: `${usr.prenom} ${usr.nom} a créé une activité (${type_action}) pour "${crs?.intitule || 'Cours inconnu'}".`,
      type: "info",
    }).catch(e => console.error("[activities POST] notify error:", e));

    const creator = (req as any).user;
    if (creator) {
      logAction(req, "CREATE_ACTIVITY", creator.id, creator.email, `Création d'une activité (${type_action}) de volume ${volume_horaire}h pour "${crs?.intitule || 'Cours inconnu'}"`).catch(console.error);
    }

    return res.status(201).json(enriched);
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
      },
      include: {
        cours: true,
        user: { select: { nom: true, prenom: true, id: true, photo_url: true, role: true, taux_horaire: true } }
      }
    });

    // 🔔 Notify secretaries: new activity created
    const crs = (activity as any).cours;
    const usr = (activity as any).user;
    notifySecretaires({
      titre: "📝 Nouvelle activité créée",
      message: `${usr?.prenom || ''} ${usr?.nom || ''} a créé une activité (${type_action}) pour "${crs?.intitule || 'Cours inconnu'}".`,
      type: "info",
    }).catch(e => console.error("[activities POST] notify error:", e));

    const creator = (req as any).user;
    if (creator) {
      logAction(req, "CREATE_ACTIVITY", creator.id, creator.email, `Création d'une activité (${type_action}) de volume ${volume_horaire}h pour "${crs?.intitule || 'Cours inconnu'}"`).catch(console.error);
    }

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
    const index = data.activites.findIndex((a: any) => a.id === id);
    if (index !== -1) {
      const current = data.activites[index];
      const prevStatut = current.statut;
      const finalType = type_action || current.type_action;
      const finalNiveau = niveau_complexite || current.niveau_complexite;
      const finalSeqs = nb_sequences === undefined ? current.nb_sequences : nb_sequences;
      const volume_horaire = calculateVolumeHoraire(finalType, finalNiveau, finalSeqs);
      
      const user = data.users.find((u: any) => u.id === current.id_user);
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

      const enriched = enrichActivities([updated], data)[0];
      const crs = enriched.cours;
      const usr = enriched.user;

      // 🔔 Notifications based on status change
      if (statut && statut !== prevStatut) {
        if (statut === 'soumise') {
          // Teacher submitted → notify secretaries + admins
          Promise.all([
            notifySecretaires({
              titre: "📨 Activité soumise pour validation",
              message: `${usr?.prenom || ''} ${usr?.nom || ''} a soumis une activité (${finalType}) pour "${crs?.intitule || 'Cours inconnu'}" en attente de validation.`,
              type: "warning",
            }),
            notifyAdmins({
              titre: "📨 Activité soumise pour validation",
              message: `${usr?.prenom || ''} ${usr?.nom || ''} a soumis une activité (${finalType}) pour "${crs?.intitule || 'Cours inconnu'}".`,
              type: "warning",
            }),
          ]).catch(e => console.error("[activities PUT local] notify error:", e));
        } else if (statut === 'valide') {
          // Secretary validated → notify the teacher
          notifyUser({
            id_utilisateur: current.id_user,
            titre: "✅ Activité validée",
            message: `Votre activité (${finalType}) pour "${crs?.intitule || 'Cours inconnu'}" a été validée avec succès.`,
            type: "success",
          }).catch(e => console.error("[activities PUT local] notify teacher error:", e));
        } else if (statut === 'rejete') {
          // Secretary rejected → notify the teacher
          notifyUser({
            id_utilisateur: current.id_user,
            titre: "❌ Activité rejetée",
            message: `Votre activité (${finalType}) pour "${crs?.intitule || 'Cours inconnu'}" a été rejetée. Motif : ${req.body.motif_rejet || 'Non précisé'}.`,
            type: "error",
          }).catch(e => console.error("[activities PUT local] notify teacher error:", e));
        }
      // 🔔 Audit Log
      const updater = (req as any).user;
      if (updater) {
        let logText = `Modification de l'activité ID: ${id} pour "${crs?.intitule || 'Cours inconnu'}"`;
        if (statut && statut !== prevStatut) {
          if (statut === 'soumise') logText = `Soumission de l'activité ID: ${id} (${finalType}) pour "${crs?.intitule || 'Cours inconnu'}"`;
          else if (statut === 'valide') logText = `Validation de l'activité ID: ${id} (${finalType}) pour "${crs?.intitule || 'Cours inconnu'}"`;
          else if (statut === 'rejete') logText = `Rejet de l'activité ID: ${id} (${finalType}) pour "${crs?.intitule || 'Cours inconnu'}" (Motif: ${req.body.motif_rejet || 'non précisé'})`;
        }
        logAction(req, statut === 'valide' ? "VALIDATE_ACTIVITY" : statut === 'rejete' ? "REJECT_ACTIVITY" : "UPDATE_ACTIVITY", updater.id, updater.email, logText).catch(console.error);
      }

      return res.json(enriched);
    }
    return res.status(404).json({ error: "Activity not found" });
  }

  let updateData = { ...req.body };

  // Recalculate volume_horaire if fields changed
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
    // Get current activity state before update (to detect status change)
    const currentActivity = await prisma.activite.findUnique({ 
      where: { id },
      include: { user: true, cours: true }
    }) as any;
    const prevStatut = currentActivity?.statut;

    const activity = await prisma.activite.update({ 
      where: { id }, 
      data: updateData,
      include: { 
        user: { select: { nom: true, prenom: true, id: true, photo_url: true, role: true, taux_horaire: true } },
        cours: true 
      }
    }) as any;

    const crs = activity.cours;
    const usr = activity.user;

    // 🔔 Notifications based on status change
    if (statut && statut !== prevStatut) {
      if (statut === 'soumise') {
        // Teacher submitted → notify secretaries + admins
        Promise.all([
          notifySecretaires({
            titre: "📨 Activité soumise pour validation",
            message: `${usr?.prenom || ''} ${usr?.nom || ''} a soumis une activité (${activity.type_action}) pour "${crs?.intitule || 'Cours inconnu'}" en attente de validation.`,
            type: "warning",
          }),
          notifyAdmins({
            titre: "📨 Activité soumise pour validation",
            message: `${usr?.prenom || ''} ${usr?.nom || ''} a soumis une activité (${activity.type_action}) pour "${crs?.intitule || 'Cours inconnu'}".`,
            type: "warning",
          }),
        ]).catch(e => console.error("[activities PUT] notify error:", e));
      } else if (statut === 'valide') {
        // Secretary validated → notify the teacher
        notifyUser({
          id_utilisateur: activity.id_user,
          titre: "✅ Activité validée",
          message: `Votre activité (${activity.type_action}) pour "${crs?.intitule || 'Cours inconnu'}" a été validée avec succès.`,
          type: "success",
        }).catch(e => console.error("[activities PUT] notify teacher error:", e));
      } else if (statut === 'rejete') {
        // Secretary rejected → notify the teacher
        notifyUser({
          id_utilisateur: activity.id_user,
          titre: "❌ Activité rejetée",
          message: `Votre activité (${activity.type_action}) pour "${crs?.intitule || 'Cours inconnu'}" a été rejetée. Motif : ${updateData.motif_rejet || 'Non précisé'}.`,
          type: "error",
        }).catch(e => console.error("[activities PUT] notify teacher error:", e));
      }
    }

    // 🔔 Audit Log
    const updater = (req as any).user;
    if (updater) {
      let logText = `Modification de l'activité ID: ${id} pour "${crs?.intitule || 'Cours inconnu'}"`;
      if (statut && statut !== prevStatut) {
        if (statut === 'soumise') logText = `Soumission de l'activité ID: ${id} (${activity.type_action}) pour "${crs?.intitule || 'Cours inconnu'}"`;
        else if (statut === 'valide') logText = `Validation de l'activité ID: ${id} (${activity.type_action}) pour "${crs?.intitule || 'Cours inconnu'}"`;
        else if (statut === 'rejete') logText = `Rejet de l'activité ID: ${id} (${activity.type_action}) pour "${crs?.intitule || 'Cours inconnu'}" (Motif: ${updateData.motif_rejet || 'non précisé'})`;
      }
      logAction(req, statut === 'valide' ? "VALIDATE_ACTIVITY" : statut === 'rejete' ? "REJECT_ACTIVITY" : "UPDATE_ACTIVITY", updater.id, updater.email, logText).catch(console.error);
    }

    res.json(activity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update activity" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();
  
  if (!prisma) {
    const data = loadLocalData();
    const filtered = data.activites.filter((a: any) => a.id !== id);
    if (filtered.length !== data.activites.length) {
      data.activites = filtered;
      saveLocalData(data);

      const deleter = (req as any).user;
      if (deleter) {
        logAction(req, "DELETE_ACTIVITY", deleter.id, deleter.email, `Suppression de l'activité ID: ${id}`).catch(console.error);
      }

      return res.json({ message: "Deleted" });
    }
    return res.status(404).json({ error: "Activity not found" });
  }

  try {
    await prisma.activite.delete({ where: { id } });

    const deleter = (req as any).user;
    if (deleter) {
      logAction(req, "DELETE_ACTIVITY", deleter.id, deleter.email, `Suppression de l'activité ID: ${id}`).catch(console.error);
    }

    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete activity" });
  }
});

export default router;
