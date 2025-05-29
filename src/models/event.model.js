const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  type: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  quantity: { type: Number, required: true },
  sold: { type: Number, required: true, default: 0 }
});


const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tickets: [ticketSchema], // Array of tickets
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ticketType: { type: String, required: true }
  }],
  image: { type: String, required: true }, // Cloudinary image URL
  category: { type: String },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Event", eventSchema);
