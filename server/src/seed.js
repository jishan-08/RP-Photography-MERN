import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { SiteContent, User } from "./models.js";
import { defaultContent } from "./defaultContent.js";

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rp-photography";
await mongoose.connect(uri);

await SiteContent.findOneAndUpdate(
  { key: "main" },
  { key: "main", ...defaultContent },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

const password = await bcrypt.hash("admin123", 12);
await User.findOneAndUpdate(
  { username: "admin" },
  { username: "admin", password, name: "Admin", role: "Super Admin" },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

console.log("Seed complete. Admin login: admin / admin123");
await mongoose.disconnect();
