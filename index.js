const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"]
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // max 100 requests
  message: {
    success: false,
    message: "Too many requests, please try again later"
  }
});

app.use(limiter);

// ================================
// 🔐 ENV VARIABLES (IMPORTANT)
// ================================
const API_KEY = process.env.API_KEY;
const SECRET = process.env.JWT_SECRET;

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
app.use((req, res, next) => {
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
// 🔒 JWT VERIFY (ADMIN)
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
// 📌 STATES
// ================================
app.get("/v1/states", async (req, res) => {
  try {
    const states = await prisma.state.findMany({
      orderBy: { name: "asc" }
    });

    res.json({
      success: true,
      data: states
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch states"
    });
  }
});
// ================================
// 📌 DISTRICTS (WITH TRY-CATCH)
// ================================
app.get("/v1/states/:id/districts", async (req, res) => {
  try {
    const districts = await prisma.district.findMany({
      where: {
        state_id: Number(req.params.id)
      },
      orderBy: {
        name: "asc"
      }
    });

    res.json({
      success: true,
      data: districts
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch districts"
    });
  }
});


// ================================
// 📌 SUBDISTRICTS (WITH TRY-CATCH)
// ================================
app.get("/v1/districts/:id/subdistricts", async (req, res) => {
  try {
    const subdistricts = await prisma.subdistrict.findMany({
      where: {
        district_id: Number(req.params.id)
      },
      orderBy: {
        name: "asc"
      }
    });

    res.json({
      success: true,
      data: subdistricts
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subdistricts"
    });
  }
});


// ================================
// 📌 VILLAGES (WITH TRY-CATCH)
// ================================
app.get("/v1/subdistricts/:id/villages", async (req, res) => {
  try {
    const villages = await prisma.village.findMany({
      where: {
        subdistrict_id: Number(req.params.id)
      },
      orderBy: {
        name: "asc"
      }
    });

    res.json({
      success: true,
      data: villages
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch villages"
    });
  }
});


// ================================
// 🔍 SEARCH (WITH TRY-CATCH)
// ================================
app.get("/v1/search", async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Query must be at least 2 characters"
      });
    }

    const villages = await prisma.village.findMany({
      where: {
        name: {
          contains: q,
          mode: "insensitive"
        }
      },
      take: Number(limit),
      orderBy: {
        name: "asc"
      },
      include: {
        subdistrict: {
          include: {
            district: {
              include: {
                state: true
              }
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
      data: formatted
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to search villages"
    });
  }
});
// ================================
// 🔒 ADMIN ROUTE
// ================================
app.get("/v1/admin", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Welcome Admin 🔐"
  });
});
// ================================
// ❤️ HEALTH CHECK ROUTE
// ================================
app.get("/", (req, res) => {
  res.send("Village API Backend Running Successfully 🚀");
});

// ================================
// 🚀 START SERVER
// ================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});