import { Router } from "express";
import { getPrisma } from "../db";
import { loadLocalData, saveLocalData, LocalDataSchema } from "../lib/local_db";
import fs from "fs";
import path from "path";

const router = Router();

router.get("/annees", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    return res.json(data.annees);
  }
  try {
    const annees = await prisma.anneeAcademique.findMany({ orderBy: { libelle: 'desc' } });
    if (annees.length === 0) {
      const data = loadLocalData();
      return res.json(data.annees);
    }
    res.json(annees);
  } catch (error) {
    const data = loadLocalData();
    res.json(data.annees);
  }
});

router.post("/annees/:id/toggle", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    data.annees = data.annees.map(a => ({ ...a, actif: a.id === id }));
    saveLocalData(data);
    return res.json({ status: "ok", id });
  }
  try {
    await prisma.$transaction([
      prisma.anneeAcademique.updateMany({ data: { actif: false } }),
      prisma.anneeAcademique.update({ where: { id }, data: { actif: true } })
    ]);
    res.json({ status: "ok", id });
  } catch (e) {
    res.status(500).json({ error: "Toggle failed" });
  }
});

router.get("/departements", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    return res.json(data.departements);
  }
  try {
    const depts = await prisma.departement.findMany({ orderBy: { libelle: 'asc' } });
    if (depts.length === 0) {
      const data = loadLocalData();
      return res.json(data.departements);
    }
    res.json(depts);
  } catch (error) {
    const data = loadLocalData();
    res.json(data.departements);
  }
});

router.get("/contrats", (req, res) => res.json([{ id: 'c1', libelle: 'CDI' }, { id: 'c2', libelle: 'Vacataire' }]));
router.get("/grades", (req, res) => res.json([{ id: 'g1', libelle: 'Assistant' }, { id: 'g2', libelle: 'Maître-Assistant' }, { id: 'g3', libelle: 'Professeur Titulaire' }]));
router.get("/statuts", (req, res) => res.json([{ id: 's1', libelle: 'Permanent' }, { id: 's2', libelle: 'Vacataire' }]));
router.get("/roles", (req, res) => res.json([
  { id: 'r1', libelle: 'Administrateur', code: 'admin' },
  { id: 'r2', libelle: 'Enseignant', code: 'enseignant' },
  { id: 'r3', libelle: 'Secrétaire', code: 'secretaire' }
]));

// Niveaux: Get all
router.get("/niveaux", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    return res.json(data.niveaux);
  }
  try {
    const niveaux = await prisma.niveau.findMany();
    if (niveaux.length === 0) {
      const data = loadLocalData();
      return res.json(data.niveaux);
    }
    res.json(niveaux);
  } catch (error) {
    const data = loadLocalData();
    res.json(data.niveaux);
  }
});

// Filieres: Get all
router.get("/filieres", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    return res.json(data.filieres);
  }
  try {
    const filieres = await prisma.filiere.findMany();
    if (filieres.length === 0) {
      const data = loadLocalData();
      return res.json(data.filieres);
    }
    res.json(filieres);
  } catch (error) {
    const data = loadLocalData();
    res.json(data.filieres);
  }
});

// Ressources
router.get("/ressources", async (req, res) => {
  const { id_cours } = req.query;
  const testRessources = [
    { id: 'res-1', id_cours: 'cr-1', titre: 'Introduction', type: 'PDF', description: 'Support de cours introductif' }
  ];
  const prisma = getPrisma();
  if (!prisma) {
    if (id_cours) return res.json(testRessources.filter(r => r.id_cours === id_cours));
    return res.json(testRessources);
  }
  try {
    const rss = await (prisma as any).ressource.findMany({ where: id_cours ? { id_cours: String(id_cours) } : {} });
    res.json(rss);
  } catch (e) { res.json([]); }
});

router.post("/ressources", (req, res) => {
  res.status(201).json({ id: 'new-res-' + Date.now(), ...req.body });
});

router.delete("/ressources/:id", (req, res) => {
  res.json({ status: "deleted" });
});

// Sequences
router.get("/sequences", async (req, res) => {
  const { id_ressource } = req.query;
  const testSequences = [
    { id: 'seq-1', id_ressource: 'res-1', numero: 1, titre: 'Historique', description: 'Histoire de l\'informatique' }
  ];
  const prisma = getPrisma();
  if (!prisma) {
    if (id_ressource) return res.json(testSequences.filter(s => s.id_ressource === id_ressource));
    return res.json(testSequences);
  }
  try {
    const seqs = await (prisma as any).sequence.findMany({ where: id_ressource ? { id_ressource: String(id_ressource) } : {} });
    res.json(seqs);
  } catch (e) { res.json([]); }
});

router.post("/sequences", (req, res) => {
  res.status(201).json({ id: 'new-seq-' + Date.now(), ...req.body });
});

router.delete("/sequences/:id", (req, res) => {
  res.json({ status: "deleted" });
});

router.get("/semestres", (req, res) => {
  const data = loadLocalData();
  res.json(data.semestres || []);
});

router.get("/coefficients", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    return res.json(data.coefficients);
  }
  try {
    const coeff = await (prisma as any).coefficient.findMany();
    if (coeff.length === 0) {
      const data = loadLocalData();
      return res.json(data.coefficients);
    }
    res.json(coeff);
  } catch (error) {
    const data = loadLocalData();
    res.json(data.coefficients);
  }
});

router.post("/coefficients", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    const newCoeff = {
      id: `c-${Date.now()}`,
      type_action: req.body.type_action,
      niveau_complexite: req.body.niveau_complexite,
      valeur: Number(req.body.valeur),
      description: req.body.description
    };
    data.coefficients.push(newCoeff);
    saveLocalData(data);
    return res.status(201).json(newCoeff);
  }
  try {
    const { type_action, niveau_complexite, valeur, description } = req.body;
    const item = await (prisma as any).coefficient.create({
      data: {
        type_action,
        niveau_complexite,
        valeur: Number(valeur),
        description
      }
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to create coefficient" });
  }
});

router.put("/coefficients/:id", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    const idx = data.coefficients.findIndex(c => c.id === id);
    if (idx !== -1) {
      data.coefficients[idx] = {
        ...data.coefficients[idx],
        ...req.body,
        valeur: Number(req.body.valeur ?? data.coefficients[idx].valeur)
      };
      saveLocalData(data);
      return res.json(data.coefficients[idx]);
    }
    return res.status(404).json({ error: "Not found" });
  }
  try {
    const { type_action, niveau_complexite, valeur, description } = req.body;
    const item = await (prisma as any).coefficient.update({
      where: { id },
      data: {
        type_action,
        niveau_complexite,
        valeur: Number(valeur),
        description
      }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to update coefficient" });
  }
});

router.delete("/coefficients/:id", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    data.coefficients = data.coefficients.filter(c => c.id !== id);
    saveLocalData(data);
    return res.json({ status: "deleted" });
  }
  try {
    await (prisma as any).coefficient.delete({
      where: { id }
    });
    res.json({ status: "deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete coefficient" });
  }
});

const CONFIG_FILE_PATH = path.join(process.cwd(), "backend", "lib", "system_config.json");

router.get("/config/system", (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const content = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      return res.json(JSON.parse(content));
    }
  } catch (error) {
    console.error("Failed to read system config file, running fallback...", error);
  }
  res.json({ appName: 'GHE UVCI', defaultAnneeId: 'ann-2', chargeHoraireAnnuelle: 192, signatureUrl: '' });
});

router.post("/config/system", (req, res) => {
  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(req.body, null, 2), "utf-8");
    return res.json({ status: "ok", config: req.body });
  } catch (error) {
    console.error("Failed to write system config file", error);
    return res.status(500).json({ error: "Failed to save system config" });
  }
});

router.post("/maintenance/reset", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    data.activites = [];
    data.paiements = [];
    data.etats = [];
    saveLocalData(data);
    return res.json({ status: "ok", message: "Database reset (memory)" });
  }
  try {
    await prisma.$transaction([
      (prisma as any).auditLog.deleteMany(),
      prisma.activite.deleteMany(),
      prisma.paiement.deleteMany()
    ]);
    res.json({ status: "ok", message: "Database reset items" });
  } catch (e) {
    res.status(500).json({ error: "Reset failed" });
  }
});

// Generic CRUD for other settings
const modelMapping: Record<string, string> = {
  departements: 'departement',
  filieres: 'filiere',
  niveaux: 'niveau',
  annees: 'anneeAcademique',
  coefficients: 'coefficient',
  semestres: 'semestres'
};

const fileModelMapping: Record<string, keyof LocalDataSchema> = {
  departements: 'departements',
  filieres: 'filieres',
  niveaux: 'niveaux',
  annees: 'annees',
  coefficients: 'coefficients',
  semestres: 'semestres'
};

router.post("/:collection", async (req, res) => {
  const { collection } = req.params;
  const prisma = getPrisma();
  const modelName = modelMapping[collection] || collection;

  const fileKey = fileModelMapping[collection];
  const useFileDb = !prisma || !((prisma as any)[modelName]);

  if (useFileDb) {
    if (fileKey) {
      const data = loadLocalData();
      const newItem = {
        id: req.body.id || `${collection.slice(0, 3)}-${Date.now()}`,
        ...req.body
      };
      data[fileKey].push(newItem);
      saveLocalData(data);
      return res.status(201).json(newItem);
    }
    return res.status(201).json({ id: `new-${collection}-${Date.now()}`, ...req.body });
  }

  if (prisma && (prisma as any)[modelName]) {
    try {
      const data = { ...req.body };
      if (modelName === 'anneeAcademique') {
        if (data.date_debut) data.date_debut = new Date(data.date_debut);
        if (data.date_fin) data.date_fin = new Date(data.date_fin);
        if (typeof data.actif !== 'boolean') data.actif = data.actif === 'true';
      }
      if (modelName === 'coefficient') {
        if (data.valeur) data.valeur = Number(data.valeur);
      }
      const item = await (prisma as any)[modelName].create({ data });
      return res.status(201).json(item);
    } catch (e) {
      console.error("Failed to create on collection " + collection, e);
      return res.status(500).json({ error: "Failed to create" });
    }
  }
  res.status(201).json({ id: `new-${collection}-${Date.now()}`, ...req.body });
});

router.put("/:collection/:id", async (req, res) => {
  const { collection, id } = req.params;
  const prisma = getPrisma();
  const modelName = modelMapping[collection] || collection;

  const fileKey = fileModelMapping[collection];
  const useFileDb = !prisma || !((prisma as any)[modelName]);

  if (useFileDb) {
    if (fileKey) {
      const data = loadLocalData();
      const list = data[fileKey] as any[];
      const idx = list.findIndex(item => item.id === id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          ...req.body
        };
        saveLocalData(data);
        return res.json(list[idx]);
      }
      return res.status(404).json({ error: "Not found" });
    }
    return res.json({ id, ...req.body });
  }

  if (prisma && (prisma as any)[modelName]) {
    try {
      const data = { ...req.body };
      if (modelName === 'anneeAcademique') {
        if (data.date_debut) data.date_debut = new Date(data.date_debut);
        if (data.date_fin) data.date_fin = new Date(data.date_fin);
        if (typeof data.actif !== 'boolean') data.actif = data.actif === 'true';
      }
      if (modelName === 'coefficient') {
        if (data.valeur) data.valeur = Number(data.valeur);
      }
      const item = await (prisma as any)[modelName].update({ where: { id }, data });
      return res.json(item);
    } catch (e) {
      console.error("Failed to update on collection " + collection, e);
      return res.status(500).json({ error: "Failed to update" });
    }
  }
  res.json({ id, ...req.body });
});

router.delete("/:collection/:id", async (req, res) => {
  const { collection, id } = req.params;
  const prisma = getPrisma();
  const modelName = modelMapping[collection] || collection;

  const fileKey = fileModelMapping[collection];
  const useFileDb = !prisma || !((prisma as any)[modelName]);

  if (useFileDb) {
    if (fileKey) {
      const data = loadLocalData();
      const list = data[fileKey] as any[];
      data[fileKey] = list.filter(item => item.id !== id) as any;
      saveLocalData(data);
      return res.json({ status: "deleted" });
    }
    return res.json({ status: "deleted" });
  }

  if (prisma && (prisma as any)[modelName]) {
    try {
      await (prisma as any)[modelName].delete({ where: { id } });
      return res.json({ status: "deleted" });
    } catch (e) {
      console.error("Failed to delete on collection " + collection, e);
      return res.status(500).json({ error: "Failed to delete" });
    }
  }
  res.json({ status: "deleted" });
});

export default router;
