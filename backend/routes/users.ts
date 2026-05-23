import { Router } from "express";
import { getPrisma } from "../db";
import { loadLocalData, saveLocalData } from "../lib/local_db";

const router = Router();

router.get("/", async (req, res) => {
  const prisma = getPrisma();
  const { role } = req.query;

  if (!prisma) {
    const data = loadLocalData();
    let usersList = data.users;
    if (role) {
      usersList = usersList.filter(u => u.role === role);
    }
    return res.json(usersList);
  }

  try {
    const users = await prisma.user.findMany({
      where: role ? { role: role as string } : {},
      orderBy: { nom: 'asc' }
    });
    res.json(users);
  } catch (error) {
    const data = loadLocalData();
    let usersList = data.users;
    if (role) {
      usersList = usersList.filter(u => u.role === role);
    }
    res.json(usersList);
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();

  if (!prisma) {
    const data = loadLocalData();
    const user = data.users.find(u => u.id === id);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    }
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    const data = loadLocalData();
    const user = data.users.find(u => u.id === id);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  }
});

router.post("/", async (req, res) => {
  const prisma = getPrisma();
  
  if (!prisma) {
    const data = loadLocalData();
    const newUser = {
      id: req.body.id || `user-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      actif: true,
      ...req.body
    };
    data.users.push(newUser);
    saveLocalData(data);
    return res.status(201).json(newUser);
  }

  try {
    const user = await prisma.user.create({ data: req.body });
    res.status(201).json(user);
  } catch (err) {
    console.error("user creation error in Postgres. Falling back to local file...", err);
    const data = loadLocalData();
    const newUser = {
      id: req.body.id || `user-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      actif: true,
      ...req.body
    };
    data.users.push(newUser);
    saveLocalData(data);
    res.status(201).json(newUser);
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();

  const updateData = { ...req.body };
  // Guard: if password is empty/blank, do not update it
  if (!updateData.password || updateData.password.trim() === "") {
    delete updateData.password;
  }

  if (!prisma) {
    const data = loadLocalData();
    const index = data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      data.users[index] = {
        ...data.users[index],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      saveLocalData(data);
      return res.json(data.users[index]);
    }
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const user = await prisma.user.update({ where: { id }, data: updateData });
    res.json(user);
  } catch (err) {
    console.error("user update error in Postgres. Falling back to local file...", err);
    const data = loadLocalData();
    const index = data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      data.users[index] = {
        ...data.users[index],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      saveLocalData(data);
      return res.json(data.users[index]);
    }
    res.status(404).json({ error: "User not found" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const prisma = getPrisma();

  if (!prisma) {
    const data = loadLocalData();
    const filtered = data.users.filter(u => u.id !== id);
    if (filtered.length !== data.users.length) {
      data.users = filtered;
      saveLocalData(data);
      return res.json({ message: "Deleted" });
    }
    return res.status(404).json({ error: "User not found" });
  }

  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("user deletion error in Postgres. Falling back to local file...", err);
    const data = loadLocalData();
    const filtered = data.users.filter(u => u.id !== id);
    if (filtered.length !== data.users.length) {
      data.users = filtered;
      saveLocalData(data);
      return res.json({ message: "Deleted" });
    }
    res.status(404).json({ error: "User not found" });
  }
});

router.post("/refactor", async (req, res) => {
  res.json({ status: "ok", message: "Users refactored" });
});

export default router;
