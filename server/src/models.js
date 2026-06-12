import mongoose from "mongoose";

const looseSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

export const SiteContent = mongoose.model("SiteContent", new mongoose.Schema({
  key: { type: String, unique: true, default: "main" },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  services: { type: [mongoose.Schema.Types.Mixed], default: [] },
  gallery: { type: [mongoose.Schema.Types.Mixed], default: [] },
  pricing: { type: [mongoose.Schema.Types.Mixed], default: [] },
  testimonials: { type: [mongoose.Schema.Types.Mixed], default: [] },
  events: { type: [mongoose.Schema.Types.Mixed], default: [] },
  faqs: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { timestamps: true }));

export const Inquiry = mongoose.model("Inquiry", new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  service: String,
  eventDate: String,
  message: String,
  status: { type: String, enum: ["New", "Pending", "Confirmed", "Completed", "Cancelled"], default: "New" }
}, { timestamps: true }));

export const Booking = mongoose.model("Booking", new mongoose.Schema({
  client: { type: String, required: true, trim: true },
  phone: String,
  service: String,
  eventDate: String,
  amount: { type: Number, default: 0 },
  paid: { type: Number, default: 0 },
  notes: String,
  status: { type: String, enum: ["Pending", "Confirmed", "Completed", "Cancelled"], default: "Confirmed" }
}, { timestamps: true }));

export const User = mongoose.model("User", new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, default: "Admin" },
  role: { type: String, default: "Super Admin" }
}, { timestamps: true }));

export const Upload = mongoose.model("Upload", new mongoose.Schema({
  title: { type: String, trim: true },
  url: { type: String, required: true },
  category: { type: String, default: "Portfolio" },
  filename: String,
  mimetype: String,
  size: Number
}, { timestamps: true }));

export const Activity = mongoose.model("Activity", looseSchema);
