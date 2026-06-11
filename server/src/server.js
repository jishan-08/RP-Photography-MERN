import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import multer from "multer";
import { createToken, requireAuth } from "./auth.js";
import { Booking, Inquiry, SiteContent, Upload, User } from "./models.js";
import { defaultContent } from "./defaultContent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const uploadDir = path.resolve(__dirname, "../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors({ origin: process.env.CLIENT_URL?.split(",") || true }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
    cb(null, `${Date.now()}-${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/"))
});

async function getContent() {
  let content = await SiteContent.findOne({ key: "main" }).lean();
  if (!content) {
    content = await SiteContent.create({ key: "main", ...defaultContent });
    content = content.toObject();
  }
  return content;
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/content", async (_req, res, next) => {
  try { res.json(await getContent()); } catch (error) { next(error); }
});

app.post("/api/inquiries", async (req, res, next) => {
  try {
    const inquiry = await Inquiry.create(req.body);
    res.status(201).json(inquiry);
  } catch (error) { next(error); }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user || !(await bcrypt.compare(req.body.password || "", user.password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    res.json({
      token: createToken(user),
      user: { id: user._id, name: user.name, username: user.username, role: user.role }
    });
  } catch (error) { next(error); }
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
  } catch (error) { next(error); }
});

app.get("/api/admin/content", requireAuth, async (_req, res, next) => {
  try { res.json(await getContent()); } catch (error) { next(error); }
});

app.put("/api/admin/content/:section", requireAuth, async (req, res, next) => {
  try {
    const allowed = ["settings", "services", "gallery", "pricing", "testimonials", "events", "faqs"];
    if (!allowed.includes(req.params.section)) return res.status(400).json({ message: "Unknown section" });
    const content = await SiteContent.findOneAndUpdate(
      { key: "main" },
      { $set: { [req.params.section]: req.body } },
      { new: true, upsert: true }
    );
    res.json(content);
  } catch (error) { next(error); }
});

app.get("/api/admin/inquiries", requireAuth, async (_req, res, next) => {
  try { res.json(await Inquiry.find().sort({ createdAt: -1 })); } catch (error) { next(error); }
});
app.patch("/api/admin/inquiries/:id", requireAuth, async (req, res, next) => {
  try { res.json(await Inquiry.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (error) { next(error); }
});
app.delete("/api/admin/inquiries/:id", requireAuth, async (req, res, next) => {
  try { await Inquiry.findByIdAndDelete(req.params.id); res.status(204).end(); } catch (error) { next(error); }
});
app.post("/api/admin/inquiries/:id/booking", requireAuth, async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
    const booking = await Booking.create({
      client: inquiry.name, phone: inquiry.phone, service: inquiry.service,
      eventDate: inquiry.eventDate, notes: inquiry.message, ...req.body
    });
    inquiry.status = "Confirmed";
    await inquiry.save();
    res.status(201).json(booking);
  } catch (error) { next(error); }
});

app.get("/api/admin/bookings", requireAuth, async (_req, res, next) => {
  try { res.json(await Booking.find().sort({ createdAt: -1 })); } catch (error) { next(error); }
});
app.post("/api/admin/bookings", requireAuth, async (req, res, next) => {
  try { res.status(201).json(await Booking.create(req.body)); } catch (error) { next(error); }
});
app.patch("/api/admin/bookings/:id", requireAuth, async (req, res, next) => {
  try { res.json(await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (error) { next(error); }
});
app.delete("/api/admin/bookings/:id", requireAuth, async (req, res, next) => {
  try { await Booking.findByIdAndDelete(req.params.id); res.status(204).end(); } catch (error) { next(error); }
});

app.post("/api/admin/upload", requireAuth, upload.array("images", 20), async (req, res, next) => {
  try {
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

const clientDist = path.join(rootDir, "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ message: error.message || "Server error" });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Atlas Connected Successfully");
    app.listen(port, () => {
      console.log(`🚀 API running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message);
  });
