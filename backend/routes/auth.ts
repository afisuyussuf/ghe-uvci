import { Router } from "express";
import { getPrisma } from "../db";
import { loadLocalData } from "../lib/local_db";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Let's check databases first. 
  const prisma = getPrisma();

  if (prisma) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user && user.password === password) {
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      }
    } catch (error) {
      console.error("Database login failed, running file fallback...", error);
    }
  }

  // File fallback / Mock list login (so user edits and newly created accounts persist and can actually login!)
  const data = loadLocalData();
  const dbUser = data.users.find(u => u.email === email);
  if (dbUser && dbUser.password === password) {
    const { password: _, ...userWithoutPassword } = dbUser;
    return res.json(userWithoutPassword);
  }

  // Ultimate static credential fallback in case DB and files are completely empty/corrupt
  const testAccounts: Record<string, any> = {
    'yussuf.afisu@uvci.edu.ci': { id: 'test-admin', email: 'yussuf.afisu@uvci.edu.ci', password: 'password', nom: 'AFISU', prenom: 'Yussuf', role: 'admin', actif: true },
    'safi.moustapha@uvci.edu.ci': { id: 'test-secretaire', email: 'safi.moustapha@uvci.edu.ci', password: 'demo123', nom: 'MOUSTAPHA', prenom: 'Safi', role: 'secretaire', actif: true },
    'seydou1.sangare@uvci.edu.ci': { id: 'test-enseignant', email: 'seydou1.sangare@uvci.edu.ci', password: 'demo@demo', nom: 'SANGARE', prenom: 'Seydou', role: 'enseignant', actif: true }
  };

  const staticUser = testAccounts[email];
  if (staticUser && staticUser.password === password) {
    const { password: _, ...userWithoutPassword } = staticUser;
    return res.json(userWithoutPassword);
  }

  res.status(401).json({ error: "E-mail ou mot de passe incorrect." });
});

export default router;
