import { Router } from "express";
import { getPrisma } from "../db";
import { loadLocalData, saveLocalData } from "../lib/local_db";

const router = Router();

router.get("/", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    // Sort descending by timestamp
    const sorted = [...(data.auditLogs || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return res.json(sorted);
  }
  try {
    const logs = await (prisma as any).auditLog.findMany({ orderBy: { timestamp: 'desc' } });
    res.json(logs);
  } catch (error) {
    res.json([]);
  }
});

router.post("/", async (req, res) => {
  const prisma = getPrisma();
  const timestamp = new Date().toISOString();
  if (!prisma) {
    const data = loadLocalData();
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp,
      action: req.body.action,
      details: req.body.details,
      ip: req.body.ip || "127.0.0.1",
      utilisateur: req.body.utilisateur,
      role: req.body.role
    };
    data.auditLogs.push(newLog);
    saveLocalData(data);
    return res.json(newLog);
  }
  try {
    const log = await (prisma as any).auditLog.create({ data: { ...req.body, timestamp } });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: "Failed to log" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    data.auditLogs = (data.auditLogs || []).filter(l => l.id !== id);
    saveLocalData(data);
    return res.json({ message: "Deleted" });
  }
  try {
    await (prisma as any).auditLog.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

router.delete("/", async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    const data = loadLocalData();
    data.auditLogs = [];
    saveLocalData(data);
    return res.json({ message: "Cleared" });
  }
  try {
    await (prisma as any).auditLog.deleteMany();
    res.json({ message: "Cleared" });
  } catch (err) {
    res.status(500).json({ error: "Clear failed" });
  }
});

export default router;
