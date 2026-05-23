import { Router } from "express";
import { getPrisma } from "../db";
import { loadLocalData, saveLocalData } from "../lib/local_db";

const router = Router();

// Helper to fill filiere & niveau labels for courses when loaded mock-style
function enrichCourses(coursesList: any[], data: any) {
  return coursesList.map(c => {
    const fil = data.filieres.find((f: any) => f.id === c.id_filiere) || { libelle: 'Spécialité Informatique' };
    const niv = data.niveaux.find((n: any) => n.id === c.id_niveau) || { libelle: 'Licence 1 (L1)' };
    return {
      ...c,
      filiere: { libelle: fil.libelle, code: fil.code },
      niveau: { libelle: niv.libelle }
    };
  });
}

router.get("/", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    return res.json(enrichCourses(data.cours, data));
  }
  try {
    const courses = await prisma.cours.findMany({ include: { filiere: true, niveau: true } });
    if (courses.length === 0) {
      const data = loadLocalData();
      return res.json(enrichCourses(data.cours, data));
    }
    res.json(courses);
  } catch (error) {
    const data = loadLocalData();
    res.json(enrichCourses(data.cours, data));
  }
});

router.post("/", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    const newCourse = {
      id: `course-${Date.now()}`,
      intitule: req.body.intitule,
      code_cours: req.body.code_cours,
      nb_heures: Number(req.body.nb_heures || 0),
      nb_sequences: Number(req.body.nb_sequences || 0),
      id_filiere: req.body.id_filiere || 'f1',
      id_niveau: req.body.id_niveau || 'n1',
      id_semestre: req.body.id_semestre || 'sem1',
      id_annee_academique: req.body.id_annee_academique || 'ann-2',
      id_enseignant: req.body.id_enseignant || ''
    };
    data.cours.push(newCourse);
    saveLocalData(data);
    return res.status(201).json(enrichCourses([newCourse], data)[0]);
  }
  try {
    const dbData = {
      intitule: req.body.intitule,
      code_cours: req.body.code_cours,
      nb_heures: Number(req.body.nb_heures || 0),
      nb_sequences: Number(req.body.nb_sequences || 0),
      id_filiere: req.body.id_filiere,
      id_niveau: req.body.id_niveau,
      id_semestre: req.body.id_semestre || 'sem1',
      id_annee_academique: req.body.id_annee_academique
    };
    const course = await prisma.cours.create({
      data: dbData,
      include: { filiere: true, niveau: true }
    });
    res.status(201).json(course);
  } catch (err) {
    console.error("Course creation failed is database:", err);
    res.status(500).json({ error: "Failed to create course" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    const index = data.cours.findIndex(c => c.id === id);
    if (index !== -1) {
      data.cours[index] = {
        ...data.cours[index],
        ...req.body,
        nb_heures: Number(req.body.nb_heures ?? data.cours[index].nb_heures),
        nb_sequences: Number(req.body.nb_sequences ?? data.cours[index].nb_sequences)
      };
      saveLocalData(data);
      return res.json(enrichCourses([data.cours[index]], data)[0]);
    }
    return res.status(404).json({ error: "Course not found" });
  }
  try {
    const dbData = {
      intitule: req.body.intitule,
      code_cours: req.body.code_cours,
      nb_heures: Number(req.body.nb_heures),
      nb_sequences: Number(req.body.nb_sequences),
      id_filiere: req.body.id_filiere,
      id_niveau: req.body.id_niveau,
      id_semestre: req.body.id_semestre || 'sem1',
      id_annee_academique: req.body.id_annee_academique
    };
    const course = await prisma.cours.update({
      where: { id },
      data: dbData,
      include: { filiere: true, niveau: true }
    });
    res.json(course);
  } catch (err) {
    console.error("Course update failed in database:", err);
    res.status(500).json({ error: "Failed to update course" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    const filtered = data.cours.filter(c => c.id !== id);
    if (filtered.length !== data.cours.length) {
      data.cours = filtered;
      saveLocalData(data);
      return res.json({ status: "deleted" });
    }
    return res.status(404).json({ error: "Course not found" });
  }
  try {
    await prisma.cours.delete({ where: { id } });
    res.json({ status: "deleted" });
  } catch (err) {
    console.error("Course deletion failed in database:", err);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

export default router;
