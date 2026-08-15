import "dotenv/config";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import multer from "multer";
import { createToken, requireAuth } from "./auth.js";
import { getConfig } from "./config.js";
import { Booking, Inquiry, SiteContent, Upload, User } from "./models.js";
import { defaultContent } from "./defaultContent.js";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const config = getConfig();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const uploadDir = path.resolve(__dirname, "../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const app = express();

app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});
app.use(cors((req, callback) => {
  const origin = req.get("origin");
  let sameOrigin = false;
  if (origin) {
    try {
      sameOrigin = new URL(origin).host === req.get("host");
    } catch {
      sameOrigin = false;
    }
  }
  if (!origin || sameOrigin || config.clientOrigins.includes(origin)) {
    return callback(null, { origin: true });
  }
  const error = new Error("Origin is not allowed by CORS");
  error.status = 403;
  callback(error);
}));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(uploadDir));

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
    callback(null, `${Date.now()}-${randomUUID()}-${safeName}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (allowedImageTypes.has(file.mimetype)) return callback(null, true);
    const error = new Error("Only JPEG, PNG, WebP, GIF, and AVIF images are allowed");
    error.status = 415;
    callback(error);
  }
});

function pick(source, fields) {
  return Object.fromEntries(
    fields
      .filter((field) => source[field] !== undefined)
      .map((field) => [field, source[field]])
  );
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => typeof body[field] !== "string" || !body[field].trim());
  if (!missing.length) return;
  const error = new Error(`Missing required fields: ${missing.join(", ")}`);
  error.status = 400;
  throw error;
}

async function getContent() {
  let content = await SiteContent.findOne({ key: "main" }).lean();
  if (!content) {
    content = (await SiteContent.create({ key: "main", ...defaultContent })).toObject();
  }
  return {
    ...defaultContent,
    ...content,
    settings: {
      ...defaultContent.settings,
      ...(content.settings || {})
    },
    services: content.services || defaultContent.services,
    gallery: content.gallery || defaultContent.gallery,
    pricing: content.pricing || defaultContent.pricing,
    testimonials: content.testimonials || defaultContent.testimonials,
    events: content.events || defaultContent.events,
    faqs: content.faqs || defaultContent.faqs
  };
}

app.get("/api/health", (_req, res) => {
  const database = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(database === "connected" ? 200 : 503).json({
    ok: database === "connected",
    database
  });
});

app.get("/api/content", async (_req, res, next) => {
  try {
    res.json(await getContent());
  } catch (error) {
    next(error);
  }
});

app.post("/api/inquiries", async (req, res, next) => {
  try {
    requireFields(req.body, ["name", "phone"]);
    const inquiry = await Inquiry.create(
      pick(req.body, ["name", "phone", "email", "service", "eventDate", "message"])
    );
    res.status(201).json(inquiry);
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    requireFields(req.body, ["username", "password"]);
    const user = await User.findOne({ username: req.body.username.trim() });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    res.json({
      token: createToken(user),
      user: { id: user._id, name: user.name, username: user.username, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/dashboard", requireAuth, async (_req, res, next) => {
  try {
    const [content, inquiryCount, newCount, bookingCount, recent] = await Promise.all([
      getContent(),
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: "New" }),
      Booking.countDocuments(),
      Inquiry.find().sort({ createdAt: -1 }).limit(6).lean()
    ]);
    res.json({
      stats: {
        inquiries: inquiryCount,
        newInquiries: newCount,
        bookings: bookingCount,
        gallery: content.gallery.length,
        services: content.services.length
      },
      recent
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/content", requireAuth, async (_req, res, next) => {
  try {
    res.json(await getContent());
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/content/:section", requireAuth, async (req, res, next) => {
  try {
    const allowed = ["settings", "services", "gallery", "pricing", "testimonials", "events", "faqs"];
    if (!allowed.includes(req.params.section)) {
      return res.status(400).json({ message: "Unknown section" });
    }

    const expectsArray = req.params.section !== "settings";
    const invalidSettings = !expectsArray && (!req.body || Array.isArray(req.body) || typeof req.body !== "object");
    if ((expectsArray && !Array.isArray(req.body)) || invalidSettings) {
      return res.status(400).json({ message: `${req.params.section} has an invalid format` });
    }

    const content = await SiteContent.findOneAndUpdate(
      { key: "main" },
      { $set: { [req.params.section]: req.body } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(content);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/inquiries", requireAuth, async (_req, res, next) => {
  try {
    res.json(await Inquiry.find().sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/inquiries/:id", requireAuth, async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      pick(req.body, ["name", "phone", "email", "service", "eventDate", "message", "status"]),
      { new: true, runValidators: true }
    );
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
    res.json(inquiry);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/inquiries/:id", requireAuth, async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/inquiries/:id/booking", requireAuth, async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
    const booking = await Booking.create({
      client: inquiry.name,
      phone: inquiry.phone,
      service: inquiry.service,
      eventDate: inquiry.eventDate,
      notes: inquiry.message,
      ...pick(req.body, ["client", "phone", "service", "eventDate", "amount", "paid", "notes", "status"])
    });
    inquiry.status = "Confirmed";
    await inquiry.save();
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/bookings", requireAuth, async (_req, res, next) => {
  try {
    res.json(await Booking.find().sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/bookings", requireAuth, async (req, res, next) => {
  try {
    requireFields(req.body, ["client"]);
    const booking = await Booking.create(
      pick(req.body, ["client", "phone", "service", "eventDate", "amount", "paid", "notes", "status"])
    );
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/bookings/:id", requireAuth, async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      pick(req.body, ["client", "phone", "service", "eventDate", "amount", "paid", "notes", "status"]),
      { new: true, runValidators: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/bookings/:id", requireAuth, async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/upload", requireAuth, upload.array("images", 20), async (req, res, next) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ message: "Select at least one image" });
    }
    const uploads = await Upload.create(req.files.map((file) => ({
      title: path.parse(file.originalname).name,
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      category: req.body.category || "Portfolio"
    })));
    res.status(201).json(uploads.map((item) => ({
      image: item.url,
      title: item.title,
      category: item.category,
      id: item._id
    })));
  } catch (error) {
    next(error);
  }
});

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found" });
});

const clientDist = path.join(rootDir, "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof multer.MulterError) {
    return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ message: error.message });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid resource ID" });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: "A record with that value already exists" });
  }
  res.status(error.status || 500).json({
    message: error.status ? error.message : "Server error"
  });
});

async function start() {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log("MongoDB connected");
    const server = app.listen(config.port, () => {
      console.log(`API running at http://localhost:${config.port}`);
    });

    async function shutdown(signal) {
      console.log(`${signal} received, shutting down`);
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
    }

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exitCode = 1;
  }
}

start();
