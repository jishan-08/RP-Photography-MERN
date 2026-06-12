import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { SiteContent, User } from "./models.js";
import { defaultContent } from "./defaultContent.js";

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("Missing required environment variable: MONGO_URI");

const adminUsername = process.env.ADMIN_USERNAME?.trim() || "admin";
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword || adminPassword.length < 8) {
  throw new Error("ADMIN_PASSWORD must contain at least 8 characters");
}

await mongoose.connect(uri);

const existingContent = await SiteContent.exists({ key: "main" });
if (!existingContent) {
  await SiteContent.create({ key: "main", ...defaultContent });
}

const password = await bcrypt.hash(adminPassword, 12);
await User.findOneAndUpdate(
  { username: adminUsername },
  { username: adminUsername, password, name: "Admin", role: "Super Admin" },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

console.log(`Seed complete. Admin username: ${adminUsername}`);
await mongoose.disconnect();
