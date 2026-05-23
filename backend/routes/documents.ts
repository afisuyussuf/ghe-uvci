import { Router } from "express";
import { getPrisma } from "../db";

const router = Router();

// Get documents for a user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const prisma = getPrisma();
  if (!prisma) return res.json([]);

  try {
    const docs = await (prisma as any).userDocument.findMany({
      where: { id_user: userId },
      orderBy: { date_upload: 'desc' }
    });
    res.json(docs);
  } catch (error) {
    res.json([]);
  }
});

// Upload a document (Mock for now, normally would handle file upload)
router.post("/upload", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) return res.status(503).json({ error: "DB unavailable" });

  const { id_user, nom, type, file_url } = req.body;

  try {
    const doc = await (prisma as any).userDocument.create({
      data: {
        id_user,
        nom,
        type,
        file_url: file_url || "https://example.com/mock-doc.pdf"
      }
    });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: "Failed to upload document" });
  }
});

// Delete a document
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();
  if (!prisma) return res.status(503).json({ error: "DB unavailable" });

  try {
    await (prisma as any).userDocument.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete document" });
  }
});

export default router;
