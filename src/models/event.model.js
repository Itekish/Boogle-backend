const mongoose = require("mongoose");
const multer = require("multer");

const ticketSchema = new mongoose.Schema({
  type: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 0 },
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tickets: [ticketSchema],
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  coverImage: { type: String },
  category: { type: String },
  tags: [{ type: String }],
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

const Event = mongoose.model("Event", eventSchema);

module.exports = { Event, upload };
