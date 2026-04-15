const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const SECRET = "mysecret123";
// 🔐 JWT AUTH MIDDLEWARE
// ================================
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token required"
    });
  }

  try {
    const user = jwt.verify(token, SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Invalid token"
    });
  }
};

// ================================
// 🔐 LOGIN API (NO API KEY REQUIRED)
// ================================
app.post("/v1/login", (req, res) => {
  const { email, password } = req.body;

  if (email === "admin@gmail.com" && password === "123456") {
    const token = jwt.sign({ email }, SECRET, { expiresIn: "1h" });

    return res.json({
      success: true,
      token
    });
  }

  res.status(401).json({
    success: false,
    message: "Invalid credentials"
  });
});

// ================================
// 🔐 API KEY MIDDLEWARE
// ================================
const API_KEY = "123456";

app.use((req, res, next) => {
  // ❗ Allow login without API key
  if (req.path === "/v1/login") {
    return next();
  }

  const key = req.headers["x-api-key"];

  if (!key || key !== API_KEY) {
    return res.status(401).json({
      success: false,
      message: "Invalid API Key"
    });
  }

  next();
});
// ================================

// ================================
// 🔒 JWT VERIFY MIDDLEWARE (for admin)
// ================================
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ================================
// 📌 GET ALL STATES
// ================================
app.get("/v1/states", async (req, res) => {
  const start = Date.now();

  try {
    const states = await prisma.state.findMany({
      orderBy: { name: "asc" }
    });

    res.json({
      success: true,
      count: states.length,
      data: states,
      meta: {
        responseTime: Date.now() - start + "ms"
      }
    });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ================================
// 📌 GET DISTRICTS BY STATE
// ================================
app.get("/v1/states/:id/districts", async (req, res) => {
  const start = Date.now();

  try {
    const districts = await prisma.district.findMany({
      where: { state_id: Number(req.params.id) },
      orderBy: { name: "asc" }
    });

    res.json({
      success: true,
      count: districts.length,
      data: districts,
      meta: { responseTime: Date.now() - start + "ms" }
    });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ================================
// 📌 GET SUBDISTRICTS
// ================================
app.get("/v1/districts/:id/subdistricts", async (req, res) => {
  const start = Date.now();

  try {
    const subdistricts = await prisma.subdistrict.findMany({
      where: { district_id: Number(req.params.id) },
      orderBy: { name: "asc" }
    });

    res.json({
      success: true,
      count: subdistricts.length,
      data: subdistricts,
      meta: { responseTime: Date.now() - start + "ms" }
    });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ================================
// 📌 GET VILLAGES
// ================================
app.get("/v1/subdistricts/:id/villages", async (req, res) => {
  const start = Date.now();

  try {
    const villages = await prisma.village.findMany({
      where: { subdistrict_id: Number(req.params.id) },
      orderBy: { name: "asc" }
    });

    res.json({
      success: true,
      count: villages.length,
      data: villages,
      meta: { responseTime: Date.now() - start + "ms" }
    });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ================================
// 🔍 SEARCH
// ================================
app.get("/v1/search", async (req, res) => {
  const start = Date.now();
  const { q, limit = 10 } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Query must be at least 2 characters"
    });
  }

  try {
    const villages = await prisma.village.findMany({
      where: {
        name: { contains: q, mode: "insensitive" }
      },
      take: Number(limit),
      orderBy: { name: "asc" },
      include: {
        subdistrict: {
          include: {
            district: {
              include: { state: true }
            }
          }
        }
      }
    });

    const formatted = villages.map(v => ({
      value: v.id,
      label: v.name,
      fullAddress: `${v.name}, ${v.subdistrict?.name}, ${v.subdistrict?.district?.name}, ${v.subdistrict?.district?.state?.name}, India`
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
      meta: { responseTime: Date.now() - start + "ms" }
    });

  } catch {
    res.status(500).json({ success: false });
  }
});

// ================================
// ⚡ AUTOCOMPLETE
// ================================
app.get("/v1/autocomplete", async (req, res) => {
  const start = Date.now();
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Query must be at least 2 characters"
    });
  }

  try {
    const villages = await prisma.village.findMany({
      where: {
        name: { contains: q, mode: "insensitive" }
      },
      take: 10,
      orderBy: { name: "asc" }
    });

    res.json({
      success: true,
      data: villages.map(v => ({
        value: v.id,
        label: v.name
      })),
      meta: { responseTime: Date.now() - start + "ms" }
    });

  } catch {
    res.status(500).json({ success: false });
  }
});

// ================================
// 🔒 PROTECTED ADMIN ROUTE
// ================================
app.get("/v1/admin", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Welcome Admin 🔐"
  });
});

// ================================
// 🚀 SERVER START
// ================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});