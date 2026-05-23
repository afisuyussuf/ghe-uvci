import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function runSeed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log("Connecting to the database for seeding...");
  const pool = new pg.Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Cleaning up old database records in order...");
    
    // Order matters to satisfy FOREIGN KEY constraints
    await prisma.userDocument.deleteMany({});
    await prisma.disponibilite.deleteMany({});
    await prisma.activite.deleteMany({});
    await prisma.paiement.deleteMany({});
    await prisma.etatHeures.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.sequence.deleteMany({});
    await (prisma as any).coefficient.deleteMany({});
    
    // Clear courses, filieres, and levels
    await prisma.cours.deleteMany({});
    await prisma.filiere.deleteMany({});
    await prisma.niveau.deleteMany({});
    await prisma.ressource.deleteMany({});
    
    // Clear users, departments, and academic years
    await prisma.user.deleteMany({});
    await prisma.departement.deleteMany({});
    await prisma.anneeAcademique.deleteMany({});

    console.log("Database successfully cleaned.");

    // 1. Academic Years
    console.log("Creating academic years...");
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

    // 2. Departments
    console.log("Creating departments...");
    const deptISN = await prisma.departement.create({
      data: {
        libelle: "Informatique et Sciences du Numérique",
        code: "ISN",
      },
    });

    const deptRHA = await prisma.departement.create({
      data: {
        libelle: "Ressources Humaines et Administration",
        code: "RHA",
      },
    });

    const deptLSS = await prisma.departement.create({
      data: {
        libelle: "Langues et Sciences Sociales",
        code: "LSS",
      },
    });

    // 3. User Seed (Admins, Secrétaire, Enseignants)
    console.log("Creating users...");
    
    // Super-Admin
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
        photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      },
    });

    // Secrétaire (gestionnaire)
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
        photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      },
    });

    // Enseignant 1 (Seydou Sangaré - Maitre-Assistant / Vacataire)
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
        banque: "Société Générale Côte d'Ivoire (SGCI)",
        iban: "CI12 3456 7890 1234 5678 9012",
        niveaux: ["Licence 1", "Licence 2", "Licence 3"],
        diplomes: ["Doctorat en Informatique", "Master de Recherche en Génie Logiciel"],
      },
    });

    // Enseignant 2 (Brou Kouassi - Professeur / Permanent)
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

    // Enseignant 3 (Aminata Diop - Assistant / Vacataire)
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

    // 4. Study Levels (Niveaux d'Études)
    console.log("Creating study levels...");
    const niveauL1 = await prisma.niveau.create({ data: { libelle: "Licence 1 (L1)" } });
    const niveauL2 = await prisma.niveau.create({ data: { libelle: "Licence 2 (L2)" } });
    const niveauL3 = await prisma.niveau.create({ data: { libelle: "Licence 3 (L3)" } });
    const niveauM1 = await prisma.niveau.create({ data: { libelle: "Master 1 (M1)" } });
    const niveauM2 = await prisma.niveau.create({ data: { libelle: "Master 2 (M2)" } });
    const niveauDOC = await prisma.niveau.create({ data: { libelle: "Doctorat" } });

    // 5. Filieres (Academic Streams) - 13 Standardized Streams from @donne.md
    console.log("Creating academic streams (filieres) from referentiel...");
    
    // Licence filieres
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

    // Master / Doctorat filieres
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

    // 6. Courses (Standardized hours & credits)
    console.log("Creating courses...");
    
    // Licence 1 courses
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

    const courseIntroBdd = await prisma.cours.create({
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

    // Licence 2 courses
    const courseSecSys = await prisma.cours.create({
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

    const courseDesign = await prisma.cours.create({
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

    const courseGeosp = await prisma.cours.create({
      data: {
        intitule: "Introduction aux Technologies Géospatiales",
        code_cours: "STG2204",
        nb_heures: 32,
        nb_credits: 2,
        nb_sequences: 80,
        id_filiere: filiereSTG.id,
        id_niveau: niveauL2.id,
        id_semestre: "Semestre 4",
        id_annee_academique: anneeActive.id,
      },
    });

    // Licence 3 courses
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

    const courseComDig = await prisma.cours.create({
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

    const courseEcom = await prisma.cours.create({
      data: {
        intitule: "e-Commerce et Tunnel de Vente",
        code_cours: "CMD3102",
        nb_heures: 48,
        nb_credits: 3,
        nb_sequences: 120,
        id_filiere: filiereCMD.id,
        id_niveau: niveauL3.id,
        id_semestre: "Semestre 5",
        id_annee_academique: anneeActive.id,
      },
    });

    const courseEadmin = await prisma.cours.create({
      data: {
        intitule: "Modernisation des Services Publics",
        code_cours: "ATD3201",
        nb_heures: 32,
        nb_credits: 2,
        nb_sequences: 80,
        id_filiere: filiereATD.id,
        id_niveau: niveauL3.id,
        id_semestre: "Semestre 6",
        id_annee_academique: anneeActive.id,
      },
    });

    // Master courses
    const courseSmartContracts = await prisma.cours.create({
      data: {
        intitule: "Gouvernance Blockchain et Smart Contracts",
        code_cours: "BC4101",
        nb_heures: 48,
        nb_credits: 3,
        nb_sequences: 120,
        id_filiere: filiereBC.id,
        id_niveau: niveauM1.id,
        id_semestre: "Semestre 1",
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

    const courseBusStrategy = await prisma.cours.create({
      data: {
        intitule: "Business Strategy pour Managers Digitaux",
        code_cours: "BCD4201",
        nb_heures: 48,
        nb_credits: 3,
        nb_sequences: 120,
        id_filiere: filiereBCD.id,
        id_niveau: niveauM1.id,
        id_semestre: "Semestre 2",
        id_annee_academique: anneeActive.id,
      },
    });

    const courseMachineLearning = await prisma.cours.create({
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

    const courseAnimation3D = await prisma.cours.create({
      data: {
        intitule: "Infographie et Animation 3D Avancée",
        code_cours: "D2A5201",
        nb_heures: 48,
        nb_credits: 3,
        nb_sequences: 120,
        id_filiere: filiereD2A.id,
        id_niveau: niveauM2.id,
        id_semestre: "Semestre 4",
        id_annee_academique: anneeActive.id,
      },
    });

    // Doctorat courses
    const courseDoctoratDist = await prisma.cours.create({
      data: {
        intitule: "Séminaire d'Algorithmes Distribués de Consensus",
        code_cours: "BC6101",
        nb_heures: 64,
        nb_credits: 4,
        nb_sequences: 160,
        id_filiere: filiereBC.id,
        id_niveau: niveauDOC.id,
        id_semestre: "Semestre 1",
        id_annee_academique: anneeActive.id,
      },
    });

    const courseDoctoratQuant = await prisma.cours.create({
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

    // 7. Ressources
    console.log("Creating resources...");
    const ressourceAlgo1 = await prisma.ressource.create({
      data: {
        id_cours: courseAlgo.id,
        titre: "Support de Cours - Pointeurs et Structures",
        type: "PDF",
        description: "Manuel officiel décrivant la manipulation de mémoire vive et les types composites en C.",
      },
    });

    const ressourceAlgo2 = await prisma.ressource.create({
      data: {
        id_cours: courseAlgo.id,
        titre: "Quiz Général d'Évaluation de Programmation C",
        type: "Quiz",
        description: "Série de QCM interactifs pour tester l'assimilation des structures de boucle.",
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

    // 8. Activities (Declarations)
    console.log("Creating activities (declarations)...");
    
    // Seydou Sangaré's validated sessions
    await prisma.activite.create({
      data: {
        id_user: enseignant1.id,
        id_cours: courseAlgo.id,
        id_ressource: ressourceAlgo1.id,
        type_action: "Conception",
        niveau_complexite: "N1",
        nb_sequences: 40,
        volume_horaire: 16, // Verified by Matrix (1 Cr = 40 Seqs: N1 = 16h)
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
        volume_horaire: 45, // Reduction applied for updates
        montant: 45 * 15000,
        statut: "valide",
        date_saisie: new Date("2026-05-12T14:30:00Z"),
        paye: false,
      },
    });

    // Seydou's pending declaration
    await prisma.activite.create({
      data: {
        id_user: enseignant1.id,
        id_cours: courseReact.id,
        id_ressource: ressourceReact1.id,
        type_action: "Conception",
        niveau_complexite: "N3",
        nb_sequences: 120,
        volume_horaire: 180, // Verified by Matrix (3 Cr = 120 Seqs: N3 = 180h)
        montant: 180 * 15000,
        statut: "en_attente",
        date_saisie: new Date("2026-05-18T09:15:00Z"),
        paye: false,
      },
    });

    // Aminata Diop's submitted session (awaiting validation)
    await prisma.activite.create({
      data: {
        id_user: enseignant3.id,
        id_cours: courseReact.id,
        id_ressource: ressourceReact1.id,
        type_action: "Conception",
        niveau_complexite: "N2",
        nb_sequences: 120,
        volume_horaire: 90, // Verified by Matrix (3 Cr = 120 Seqs: N2 = 90h)
        montant: 90 * 12000,
        statut: "soumise",
        date_saisie: new Date("2026-05-16T11:00:00Z"),
        paye: false,
      },
    });

    // Professor Kouassi Brou's rejected declaration with reason (for interactive training)
    await prisma.activite.create({
      data: {
        id_user: enseignant2.id,
        id_cours: courseSecWeb.id,
        id_ressource: ressourceBdd1.id,
        type_action: "Conception",
        niveau_complexite: "N1",
        nb_sequences: 160,
        volume_horaire: 64, // Verified by Matrix (4 Cr = 160 Seqs: N1 = 64h)
        montant: 64 * 20000,
        statut: "rejete",
        motif_rejet: "Justificatifs de conception incomplets: veuillez attacher les captures d'écran de l'exercice pour le Niveau 1.",
        date_saisie: new Date("2026-05-14T08:00:00Z"),
        paye: false,
      },
    });

    // 9. Instructor Availabilities
    console.log("Creating instructor availabilities...");
    await prisma.disponibilite.create({ data: { id_utilisateur: enseignant1.id, jour: "Lundi", creneau: "Matin", actif: true } });
    await prisma.disponibilite.create({ data: { id_utilisateur: enseignant1.id, jour: "Mardi", creneau: "Apres-midi", actif: true } });
    await prisma.disponibilite.create({ data: { id_utilisateur: enseignant1.id, jour: "Mercredi", creneau: "Matin", actif: true } });
    await prisma.disponibilite.create({ data: { id_utilisateur: enseignant1.id, jour: "Vendredi", creneau: "Apres-midi", actif: true } });

    await prisma.disponibilite.create({ data: { id_utilisateur: enseignant3.id, jour: "Jeudi", creneau: "Matin", actif: true } });
    await prisma.disponibilite.create({ data: { id_utilisateur: enseignant3.id, jour: "Mardi", creneau: "Matin", actif: true } });
    await prisma.disponibilite.create({ data: { id_utilisateur: enseignant3.id, jour: "Vendredi", creneau: "Matin", actif: true } });

    // 10. Historic Payment Slips
    console.log("Creating historic payment records...");
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

    await prisma.paiement.create({
      data: {
        id_user: enseignant1.id,
        montant: 450000,
        mode_paiement: "Virement Bancaire",
        reference_paiement: "VIR-UVCI-100293",
        periode: "Décembre 2025",
        statut: "valide",
        date_paiement: new Date("2026-01-05"),
      },
    });

    await prisma.paiement.create({
      data: {
        id_user: enseignant3.id,
        montant: 180000,
        mode_paiement: "Orange Money",
        reference_paiement: "OM-88390-21D",
        periode: "Janvier 2026",
        statut: "valide",
        date_paiement: new Date("2026-02-04"),
      },
    });

    // 11. Instructor Core Documents (CV, Contrat, Diplome)
    console.log("Creating core test documents...");
    await prisma.userDocument.create({
      data: {
        id_user: enseignant1.id,
        nom: "Contrat_Sante_Seydou_2025_2026.pdf",
        type: "Contrat d'Engagement",
        file_url: "/uploads/contrat-sample.pdf",
        date_upload: new Date("2025-09-01"),
      },
    });

    await prisma.userDocument.create({
      data: {
        id_user: enseignant1.id,
        nom: "Diplome_Doctorat_Informatique.pdf",
        type: "Diplôme National",
        file_url: "/uploads/diplome-sample.pdf",
        date_upload: new Date("2025-09-01"),
      },
    });

    await prisma.userDocument.create({
      data: {
        id_user: enseignant2.id,
        nom: "Recapitulatif_Financier_Brou_Kouassi_T1.xlsx",
        type: "Autre Document justificatif",
        file_url: "/uploads/recap-sample.xlsx",
        date_upload: new Date("2026-01-15"),
      },
    });

    // 12. State Payments Sheets (Etats d'heures par mois)
    console.log("Creating states sheets (Etats Heures)...");
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

    await prisma.etatHeures.create({
      data: {
        id_utilisateur: enseignant1.id,
        periode: "Avril 2026",
        total_heures: 32,
        heures_complementaires: 0,
        nb_activites: 2,
        montant_total: 32 * 15000,
        statut: "soumis",
        nom_enseignant: "Seydou SANGARE",
        date_generation: new Date("2026-05-01"),
      },
    });

    // 13. System Notifications
    console.log("Creating notifications...");
    await prisma.notification.create({
      data: {
        id_utilisateur: enseignant1.id,
        titre: "Activité validée par le secrétaire",
        message: "L'activité de mise à jour liée au cours 'Administration de Bases de Données' a été vérifiée et validée.",
        lu: false,
        type: "success",
      },
    });

    await prisma.notification.create({
      data: {
        id_utilisateur: enseignant2.id,
        titre: "Déclaration d'activité rejetée",
        message: "Votre déclaration 'Introduction à la Cryptographie' a été rejetée. Motif: Justificatifs incomplets.",
        lu: false,
        type: "error",
      },
    });

    // 14. Audit logs logs
    console.log("Creating initial audit log metrics...");
    await prisma.auditLog.create({
      data: {
        action: "Initialisation Application",
        userId: adminUser.id,
        userEmail: adminUser.email,
        details: "Lancement du jeu d'échantillons de démarrage (Seeding complet) pour le personnel UVCI.",
      },
    });

    // 15. Coefficients
    console.log("Creating default coefficients...");
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

    console.log("DB SEED COMPLETE! All tables populated successfully.");
  } catch (error) {
    console.error("Uncaught exception while seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runSeed().catch((err) => {
  console.error("Seeding operation failed miserably:", err);
  process.exit(1);
});
