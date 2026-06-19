import express from "express";
import fs from "fs";
import path from "path";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import activityRoutes from "./routes/activities";
import courseRoutes from "./routes/courses";
import settingRoutes from "./routes/settings";
import auditRoutes from "./routes/audit";
import etatRoutes from "./routes/etats";
import paiementRoutes from "./routes/paiements";
import notificationRoutes from "./routes/notifications";
import statsRoutes from "./routes/stats";
import documentRoutes from "./routes/documents";
import availabilityRoutes from "./routes/disponibilites";
import { getPrisma } from "./db";
import { loadLocalData, saveLocalData } from "./lib/local_db";
import { verifyToken } from "./middleware/auth";

const app = express();

// Copy logo asset to public folder on startup so Vite can also serve it statically
try {
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicLogoPath = path.join(publicDir, "logo.png");
  if (!fs.existsSync(publicLogoPath)) {
    const srcLogoPath = path.join(process.cwd(), "src", "images", "logoGHE.png");
    const srcIconePath = path.join(process.cwd(), "src", "images", "icone.png");
    if (fs.existsSync(srcLogoPath)) {
      fs.copyFileSync(srcLogoPath, publicLogoPath);
    } else if (fs.existsSync(srcIconePath)) {
      fs.copyFileSync(srcIconePath, publicLogoPath);
    }
  }
} catch (e) {
  console.error("Failed to copy logo.png to public/ folder:", e);
}

app.get("/logo.png", (req, res) => {
  const publicLogoPath = path.join(process.cwd(), "public", "logo.png");
  if (fs.existsSync(publicLogoPath)) {
    res.setHeader("Content-Type", "image/png");
    return res.sendFile(publicLogoPath);
  }
  const srcLogoPath = path.join(process.cwd(), "src", "images", "logoGHE.png");
  if (fs.existsSync(srcLogoPath)) {
    res.setHeader("Content-Type", "image/png");
    return res.sendFile(srcLogoPath);
  }
  const srcIconePath = path.join(process.cwd(), "src", "images", "icone.png");
  if (fs.existsSync(srcIconePath)) {
    res.setHeader("Content-Type", "image/png");
    return res.sendFile(srcIconePath);
  }
  res.status(404).end();
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Main Router
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", verifyToken, userRoutes);
router.use("/activities", verifyToken, activityRoutes);
router.use("/courses", verifyToken, courseRoutes);
router.use("/audit", verifyToken, auditRoutes);
router.use("/etats_heures", verifyToken, etatRoutes);
router.use("/paiements", verifyToken, paiementRoutes);
router.use("/notifications", verifyToken, notificationRoutes);
router.use("/stats", verifyToken, statsRoutes);
router.use("/documents", verifyToken, documentRoutes);
router.use("/disponibilites", verifyToken, availabilityRoutes);
router.use("/", verifyToken, settingRoutes);

const PERMISSIONS_FILE = path.join(process.cwd(), "backend", "lib", "permissions.json");

function loadCustomPermissions() {
  try {
    if (fs.existsSync(PERMISSIONS_FILE)) {
      return JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load permissions file, using defaults", e);
  }
  return {};
}

function saveCustomPermissions(data: any) {
  try {
    const dir = path.dirname(PERMISSIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save permissions file", e);
  }
}

// Additional routes from server.ts that weren't fully categorized
router.get("/permissions/:role", (req, res) => {
  const { role } = req.params;
  const defaults: Record<string, string[]> = {
    admin: ["/", "/enseignants", "/cours", "/activites", "/etats", "/paiements", "/historique", "/utilisateurs", "/parametres", "/profil", "/guide"],
    secretaire: ["/", "/enseignants", "/cours", "/activites", "/etats", "/paiements", "/historique", "/profil", "/guide"],
    enseignant: ["/", "/activites", "/etats", "/paiements", "/profil", "/disponibilites", "/guide"]
  };
  
  const custom = loadCustomPermissions();
  const visible = custom[role] || defaults[role] || ["/", "/guide"];
  res.json({ visible_paths: visible });
});

router.post("/permissions/:role", (req, res) => {
  const { role } = req.params;
  const { visible_paths } = req.body;
  
  if (!Array.isArray(visible_paths)) {
    return res.status(400).json({ error: "visible_paths must be an array" });
  }
  
  const custom = loadCustomPermissions();
  custom[role] = visible_paths;
  saveCustomPermissions(custom);

  const prisma = getPrisma();
  if (!prisma) {
    try {
      const localData = loadLocalData();
      if (!localData.auditLogs) localData.auditLogs = [];
      localData.auditLogs.push({
        id: `perm-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "UPDATE_PERMISSIONS",
        details: `Mise à jour des permissions de menu pour le rôle: ${role}`,
        ip: "127.0.0.1",
        utilisateur: "Administrateur",
        role: "admin"
      });
      saveLocalData(localData);
    } catch (e) {
      console.error(e);
    }
  } else {
    prisma.auditLog.create({
      data: {
        action: "UPDATE_PERMISSIONS",
        details: `Mise à jour des permissions de menu pour le rôle: ${role}`,
        userId: "admin",
        userEmail: "admin"
      }
    }).catch(e => console.error("Prisma audit log failed on permissions update", e));
  }

  res.json({ status: "ok", visible_paths });
});

router.post("/seed", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) return res.status(503).json({ error: "Service de base de données non configuré." });
  
  try {
    console.log("Seeding database via API call...");
    // 1. Clean old data sequentially
    await prisma.userDocument.deleteMany({});
    await prisma.disponibilite.deleteMany({});
    await prisma.activite.deleteMany({});
    await prisma.paiement.deleteMany({});
    await prisma.etatHeures.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.sequence.deleteMany({});
    await (prisma as any).coefficient.deleteMany({});
    await prisma.cours.deleteMany({});
    await prisma.filiere.deleteMany({});
    await prisma.niveau.deleteMany({});
    await prisma.ressource.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.departement.deleteMany({});
    await prisma.anneeAcademique.deleteMany({});

    // 2. Academic Years
    const anneeActive = await prisma.anneeAcademique.create({
      data: {
        libelle: "2025-2026",
        date_debut: new Date("2025-09-01"),
        date_fin: new Date("2026-06-30"),
        actif: true,
      },
    });

    const anneeAncienne = await prisma.anneeAcademique.create({
      data: {
        libelle: "2024-2025",
        date_debut: new Date("2024-09-01"),
        date_fin: new Date("2025-06-30"),
        actif: false,
      },
    });

    // 3. Departments
    const deptISN = await prisma.departement.create({
      data: { libelle: "Informatique et Sciences du Numérique", code: "ISN" }
    });
    const deptRHA = await prisma.departement.create({
      data: { libelle: "Ressources Humaines et Administration", code: "RHA" }
    });
    const deptLSS = await prisma.departement.create({
      data: { libelle: "Langues et Sciences Sociales", code: "LSS" }
    });

    // 4. Users (Admin, Secrétaire, Enseignants)
    const adminUser = await prisma.user.create({
      data: {
        email: "yussuf.afisu@uvci.edu.ci",
        password: "password",
        nom: "AFISU",
        prenom: "Yussuf",
        role: "admin",
        actif: true,
        sexe: "M",
        telephone: "+225 0707070707",
        adresse: "Abidjan, Cocody",
        photo_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      },
    });

    const secretaireUser = await prisma.user.create({
      data: {
        email: "safi.moustapha@uvci.edu.ci",
        password: "demo123",
        nom: "MOUSTAPHA",
        prenom: "Safi",
        role: "secretaire",
        id_departement: deptISN.id,
        actif: true,
        sexe: "F",
        telephone: "+225 0505050505",
        adresse: "Abidjan, Bingerville",
        photo_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
      },
    });

    const enseignant1 = await prisma.user.create({
      data: {
        email: "seydou1.sangare@uvci.edu.ci",
        password: "demo@demo",
        nom: "SANGARE",
        prenom: "Seydou",
        role: "enseignant",
        id_departement: deptISN.id,
        actif: true,
        grade: "Maître-Assistant",
        statut: "Vacataire",
        taux_horaire: 15000,
        salaire_base: 0,
        telephone: "+225 0102030405",
        adresse: "Abidjan, Angré",
        sexe: "M",
        specialisation: "Génie Logiciel et Algorithmique",
        banque: "Société Générale de Côte d'Ivoire (SGCI)",
        iban: "CI12 3456 7890 1234 5678 9012",
        niveaux: ["Licence 1", "Licence 2", "Licence 3"],
        diplomes: ["Doctorat en Informatique", "Master de Recherche en Génie Logiciel"],
      },
    });

    const enseignant2 = await prisma.user.create({
      data: {
        email: "brou.kouassi@uvci.edu.ci",
        password: "demo@demo",
        nom: "KOUASSI",
        prenom: "Brou",
        role: "enseignant",
        id_departement: deptISN.id,
        actif: true,
        grade: "Professeur",
        statut: "Permanent",
        taux_horaire: 20000,
        salaire_base: 850000,
        telephone: "+225 0808080808",
        adresse: "Abidjan, Riviera",
        sexe: "M",
        specialisation: "Cybersécurité et Réseaux",
        banque: "BICICI Abidjan Plateaux",
        iban: "CI45 9876 5432 1098 7654 3210",
        niveaux: ["Licence 3", "Master 1", "Master 2"],
        diplomes: ["Doctorat d'État en Informatique", "Ingénieur de l'INP-HB"],
      },
    });

    const enseignant3 = await prisma.user.create({
      data: {
        email: "aminata.diop@uvci.edu.ci",
        password: "demo@demo",
        nom: "DIOP",
        prenom: "Aminata",
        role: "enseignant",
        id_departement: deptISN.id,
        actif: true,
        grade: "Assistant",
        statut: "Vacataire",
        taux_horaire: 12000,
        salaire_base: 0,
        telephone: "+225 0909090909",
        adresse: "Abidjan, Zone 4",
        sexe: "F",
        specialisation: "Data Science & Big Data",
        banque: "Ecobank Côte d'Ivoire",
        iban: "CI76 1111 2222 3333 4444 5555",
        niveaux: ["Licence 1", "Licence 2"],
        diplomes: ["Master de Spécialité Web & Data"],
      },
    });

    // 5. Study Levels
    const niveauL1 = await prisma.niveau.create({ data: { libelle: "Licence 1 (L1)" } });
    const niveauL2 = await prisma.niveau.create({ data: { libelle: "Licence 2 (L2)" } });
    const niveauL3 = await prisma.niveau.create({ data: { libelle: "Licence 3 (L3)" } });
    const niveauM1 = await prisma.niveau.create({ data: { libelle: "Master 1 (M1)" } });
    const niveauM2 = await prisma.niveau.create({ data: { libelle: "Master 2 (M2)" } });
    const niveauDOC = await prisma.niveau.create({ data: { libelle: "Doctorat" } });

    // 6. Filieres
    const filiereDAS = await prisma.filiere.create({
      data: {
        libelle: "Développement d'Application et e-Services",
        code: "ISN-DAS",
        description: "Formation axée sur la conception d'applications web/mobiles et l'architecture logicielle.",
      },
    });

    const filiereBD = await prisma.filiere.create({
      data: {
        libelle: "Base de Données",
        code: "ISN-BD",
        description: "Administration, modélisation et gestion de bases de données relationnelles et NoSQL.",
      },
    });

    const filiereRSI = await prisma.filiere.create({
      data: {
        libelle: "Réseaux et Sécurité Informatique",
        code: "ISN-RSI",
        description: "Maîtrise de l'administration système, réseau, télécoms et sécurité opérationnelle.",
      },
    });

    const filiereMMX = await prisma.filiere.create({
      data: {
        libelle: "Multimédia Et Arts Numériques",
        code: "ISN-MMX",
        description: "Conception graphique, audiovisuel numérique, design UI/UX et création interactive.",
      },
    });

    const filiereCOM = await prisma.filiere.create({
      data: {
        libelle: "Communication Digitale",
        code: "ISN-COM",
        description: "Stratégies éditoriales, animation de communautés en ligne, rédaction SEO et RP.",
      },
    });

    const filiereCMD = await prisma.filiere.create({
      data: {
        libelle: "e-Commerce et Marketing Digital",
        code: "ISN-CMD",
        description: "Gestion de boutiques e-commerce, publicité numérique et conversion marketing.",
      },
    });

    const filiereATD = await prisma.filiere.create({
      data: {
        libelle: "e-Administration et Transformations Digitales",
        code: "ISN-ATD",
        description: "Numérisation des organisations, modernisation des services publics et droit du numérique.",
      },
    });

    const filiereSTG = await prisma.filiere.create({
      data: {
        libelle: "Sciences et Technologies Géospatiales",
        code: "ISN-STG",
        description: "Cartographie numérique, télédétection satellite et Systèmes d'Information Géographique (SIG).",
      },
    });

    const filiereBC = await prisma.filiere.create({
      data: {
        libelle: "Blockchain",
        code: "ISN-BC",
        description: "Technologies décentralisées, protocoles de consensus et contrats intelligents (Smart Contracts).",
      },
    });

    const filiereCIO = await prisma.filiere.create({
      data: {
        libelle: "Cybersécurité et Internet des Objets",
        code: "ISN-CIO",
        description: "Audit de sécurité, cryptanalyse, réseaux d'objets connectés et architectures embarquées sécurisées.",
      },
    });

    const filiereBDA = await prisma.filiere.create({
      data: {
        libelle: "Big Data Analytics",
        code: "ISN-BDA",
        description: "Ingénierie de données massives, Machine Learning et Business Intelligence décisionnelle.",
      },
    });

    const filiereBCD = await prisma.filiere.create({
      data: {
        libelle: "Business et Communication Digitale",
        code: "ISN-BCD",
        description: "Management de l'innovation, pilotage d'agences numériques et communication de crise.",
      },
    });

    const filiereD2A = await prisma.filiere.create({
      data: {
        libelle: "Design 3D, Animation et Audiovisuel",
        code: "ISN-D2A",
        description: "Modélisation 3D avancée, effets spéciaux, réalité virtuelle et montage audio/vidéo pro.",
      },
    });

    // 7. Course Catalog
    const courseAlgo = await prisma.cours.create({
      data: {
        intitule: "Algorithmique et Programmation C",
        code_cours: "ALG1101",
        nb_heures: 64,
        nb_credits: 4,
        nb_sequences: 160,
        id_filiere: filiereDAS.id,
        id_niveau: niveauL1.id,
        id_semestre: "Semestre 1",
        id_annee_academique: anneeActive.id,
      },
    });

    await prisma.cours.create({
      data: {
        intitule: "Introduction aux Bases de Données",
        code_cours: "BDD1201",
        nb_heures: 48,
        nb_credits: 3,
        nb_sequences: 120,
        id_filiere: filiereBD.id,
        id_niveau: niveauL1.id,
        id_semestre: "Semestre 2",
        id_annee_academique: anneeActive.id,
      },
    });

    await prisma.cours.create({
      data: {
        intitule: "Architecture et Securite des Systemes",
        code_cours: "SYS2101",
        nb_heures: 48,
        nb_credits: 3,
        nb_sequences: 120,
        id_filiere: filiereRSI.id,
        id_niveau: niveauL2.id,
        id_semestre: "Semestre 3",
        id_annee_academique: anneeActive.id,
      },
    });

    const courseBdd = await prisma.cours.create({
      data: {
        intitule: "Modélisation et Bases de Données relationnelles",
        code_cours: "BDD2201",
        nb_heures: 48,
        nb_credits: 3,
        nb_sequences: 120,
        id_filiere: filiereBD.id,
        id_niveau: niveauL2.id,
        id_semestre: "Semestre 4",
        id_annee_academique: anneeActive.id,
      },
    });

    await prisma.cours.create({
      data: {
        intitule: "Design Graphique et Interface Web",
        code_cours: "MMX2102",
        nb_heures: 32,
        nb_credits: 2,
        nb_sequences: 80,
        id_filiere: filiereMMX.id,
        id_niveau: niveauL2.id,
        id_semestre: "Semestre 3",
        id_annee_academique: anneeActive.id,
      },
    });

    const courseReact = await prisma.cours.create({
      data: {
        intitule: "Développement Web Moderne avec React",
        code_cours: "WEB1201",
        nb_heures: 48,
        nb_credits: 3,
        nb_sequences: 120,
        id_filiere: filiereDAS.id,
        id_niveau: niveauL3.id,
        id_semestre: "Semestre 6",
        id_annee_academique: anneeActive.id,
      },
    });

    await prisma.cours.create({
      data: {
        intitule: "Marketing de Contenu et e-Réputation",
        code_cours: "COM3103",
        nb_heures: 32,
        nb_credits: 2,
        nb_sequences: 80,
        id_filiere: filiereCOM.id,
        id_niveau: niveauL3.id,
        id_semestre: "Semestre 5",
        id_annee_academique: anneeActive.id,
      },
    });

    const courseSecWeb = await prisma.cours.create({
      data: {
        intitule: "Sécurité Web et Audit de Code",
        code_cours: "CIO4102",
        nb_heures: 64,
        nb_credits: 4,
        nb_sequences: 160,
        id_filiere: filiereCIO.id,
        id_niveau: niveauM1.id,
        id_semestre: "Semestre 1",
        id_annee_academique: anneeActive.id,
      },
    });

    await prisma.cours.create({
      data: {
        intitule: "Machine Learning et Algorithmes Big Data",
        code_cours: "BDA5101",
        nb_heures: 64,
        nb_credits: 4,
        nb_sequences: 160,
        id_filiere: filiereBDA.id,
        id_niveau: niveauM2.id,
        id_semestre: "Semestre 3",
        id_annee_academique: anneeActive.id,
      },
    });

    await prisma.cours.create({
      data: {
        intitule: "Séminaire de Cryptographie Quantique et Objets Connectés",
        code_cours: "CIO6102",
        nb_heures: 64,
        nb_credits: 4,
        nb_sequences: 160,
        id_filiere: filiereCIO.id,
        id_niveau: niveauDOC.id,
        id_semestre: "Semestre 2",
        id_annee_academique: anneeActive.id,
      },
    });

    // 8. Ressources
    const ressourceAlgo1 = await prisma.ressource.create({
      data: {
        id_cours: courseAlgo.id,
        titre: "Support de Cours - Pointeurs et Structures",
        type: "PDF",
        description: "Manuel officiel décrivant la manipulation de mémoire vive et les types composites en C.",
      },
    });

    const ressourceBdd1 = await prisma.ressource.create({
      data: {
        id_cours: courseBdd.id,
        titre: "Vidéo - Introduction à l'Indexation SQL",
        type: "Video",
        description: "Enregistrement de démonstration d'accélération de requêtes via les index B-Tree.",
      },
    });

    const ressourceReact1 = await prisma.ressource.create({
      data: {
        id_cours: courseReact.id,
        titre: "Support interactif - Hooks & Virtual DOM",
        type: "Interactive",
        description: "TP guidé décrivant le fonctionnement interne du cycle de vie et le hook useEffect.",
      },
    });

    // 9. Activities
    await prisma.activite.create({
      data: {
        id_user: enseignant1.id,
        id_cours: courseAlgo.id,
        id_ressource: ressourceAlgo1.id,
        type_action: "Conception",
        niveau_complexite: "N1",
        nb_sequences: 40,
        volume_horaire: 16,
        montant: 16 * 15000,
        statut: "valide",
        date_saisie: new Date("2026-05-10T10:00:00Z"),
        paye: true,
        date_paiement: new Date("2026-05-15T09:00:00Z"),
      },
    });

    await prisma.activite.create({
      data: {
        id_user: enseignant1.id,
        id_cours: courseBdd.id,
        id_ressource: ressourceBdd1.id,
        type_action: "MAJ",
        niveau_complexite: "N2",
        nb_sequences: 120,
        volume_horaire: 45,
        montant: 45 * 15000,
        statut: "valide",
        date_saisie: new Date("2026-05-12T14:30:00Z"),
        paye: false,
      },
    });

    await prisma.activite.create({
      data: {
        id_user: enseignant1.id,
        id_cours: courseReact.id,
        id_ressource: ressourceReact1.id,
        type_action: "Conception",
        niveau_complexite: "N3",
        nb_sequences: 120,
        volume_horaire: 180,
        montant: 180 * 15000,
        statut: "en_attente",
        date_saisie: new Date("2026-05-18T09:15:00Z"),
        paye: false,
      },
    });

    await prisma.activite.create({
      data: {
        id_user: enseignant3.id,
        id_cours: courseReact.id,
        id_ressource: ressourceReact1.id,
        type_action: "Conception",
        niveau_complexite: "N2",
        nb_sequences: 120,
        volume_horaire: 90,
        montant: 90 * 12000,
        statut: "soumise",
        date_saisie: new Date("2026-05-16T11:00:00Z"),
        paye: false,
      },
    });

    await prisma.activite.create({
      data: {
        id_user: enseignant2.id,
        id_cours: courseSecWeb.id,
        id_ressource: ressourceBdd1.id,
        type_action: "Conception",
        niveau_complexite: "N1",
        nb_sequences: 160,
        volume_horaire: 64,
        montant: 64 * 20000,
        statut: "rejete",
        motif_rejet: "Justificatifs de conception incomplets: veuillez attacher les captures d'écran de l'exercice pour le Niveau 1.",
        date_saisie: new Date("2026-05-14T08:00:00Z"),
        paye: false,
      },
    });

    // 10. Availabilities
    await prisma.disponibilite.create({ data: { id_utilisateur: enseignant1.id, jour: "Lundi", creneau: "Matin", actif: true } });
    await prisma.disponibilite.create({ data: { id_utilisateur: enseignant1.id, jour: "Mardi", creneau: "Apres-midi", actif: true } });
    await prisma.disponibilite.create({ data: { id_utilisateur: enseignant3.id, jour: "Jeudi", creneau: "Matin", actif: true } });

    // 11. Payments
    await prisma.paiement.create({
      data: {
        id_user: enseignant1.id,
        montant: 240000,
        mode_paiement: "Virement Bancaire",
        reference_paiement: "VIR-UVCI-998822",
        periode: "Octobre 2025",
        statut: "valide",
        date_paiement: new Date("2025-11-05"),
      },
    });

    // 12. Documents
    await prisma.userDocument.create({
      data: {
        id_user: enseignant1.id,
        nom: "Contrat_Sante_Seydou_2025_2026.pdf",
        type: "Contrat d'Engagement",
        file_url: "/uploads/contrat-sample.pdf",
        date_upload: new Date("2025-09-01"),
      },
    });

    // 13. Monthly state sheets
    await prisma.etatHeures.create({
      data: {
        id_utilisateur: enseignant1.id,
        periode: "Mars 2026",
        total_heures: 46,
        heures_complementaires: 6,
        nb_activites: 3,
        montant_total: 46 * 15000,
        statut: "valide",
        nom_enseignant: "Seydou SANGARE",
        date_generation: new Date("2026-04-01"),
      },
    });

    // 14. Notifications
    await prisma.notification.create({
      data: {
        id_utilisateur: enseignant1.id,
        titre: "Activité validée par le secrétaire",
        message: "L'activité de mise à jour liée au cours 'Administration de Bases de Données' a été vérifiée et validée.",
        lu: false,
        type: "success",
      },
    });

    // 15. Audit Log
    await prisma.auditLog.create({
      data: {
        action: "Initialisation API",
        userId: adminUser.id,
        userEmail: adminUser.email,
        details: "Restauration et initialisation complète des données standardisées par appel API.",
      },
    });

    // 16. Coefficients
    await (prisma as any).coefficient.create({
      data: {
        type_action: "Conception",
        niveau_complexite: "N1",
        valeur: 1.5,
        description: "Conception simple (cours magistral standard)"
      }
    });
    await (prisma as any).coefficient.create({
      data: {
        type_action: "Conception",
        niveau_complexite: "N2",
        valeur: 2.0,
        description: "Conception moyenne (cours magistral avec quiz)"
      }
    });
    await (prisma as any).coefficient.create({
      data: {
        type_action: "Conception",
        niveau_complexite: "N3",
        valeur: 2.5,
        description: "Conception complexe (cours avec labos interactifs)"
      }
    });
    await (prisma as any).coefficient.create({
      data: {
        type_action: "MAJ",
        niveau_complexite: "N1",
        valeur: 0.5,
        description: "Mise à jour mineure de ressource"
      }
    });
    await (prisma as any).coefficient.create({
      data: {
        type_action: "MAJ",
        niveau_complexite: "N2",
        valeur: 0.8,
        description: "Mise à jour moyenne de syllabus ou quiz"
      }
    });
    await (prisma as any).coefficient.create({
      data: {
        type_action: "MAJ",
        niveau_complexite: "N3",
        valeur: 1.2,
        description: "Mise à jour majeure avec refonte de structure"
      }
    });

    return res.json({ status: "success", message: "La base de données a été alimentée avec succès !" });
  } catch (error: any) {
    console.error("Critical seeding failure in express API:", error);
    res.status(500).json({ error: "Seed failed", details: error?.message || error });
  }
});

router.get("/health", (req, res) => {
  const prisma = getPrisma();
  res.json({ status: "ok", db: prisma ? "connected" : "waiting" });
});

// 404 for unknown API routes
router.use("*", (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

app.use("/api", router);

export default app;
