const Event = require("../models/event.model");
const multer = require("multer");
const path = require("path");
const DataUri = require("datauri/parser");
const { uploader, } = require("../utils/cloudinary");
const AppError = require("../utils/appError"); //a custom AppError handler
const cloudinary   = require("../utils/cloudinary");
// Multer memory storage
const storage = multer.memoryStorage();

// Multer upload config for image field
const EventImageUpload = multer({
  storage: storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      return cb(new AppError("Please upload images only", 400));
    }
  }
}).single("image"); // 🔥 Ensure this matches the field name you're using in the frontend

// Data URI converter
const dUri = new DataUri();
const dataUri = (req) =>
  dUri.format(path.extname(req.file.originalname).toString(), req.file.buffer);

// Upload image to Cloudinary
const uploadEventImage = async (req, res, next) => {
  try {
    EventImageUpload(req, res, async function (err) {
      if (err) return next(err);
      if (!req.file) return next(new AppError("Please upload an image", 400));

      const file = dataUri(req).content;
      console.log(file, 'me')
      const result = await uploader.upload(file, { folder: "eventImages" });

      res.status(200).json({
        status: "success",
        message: "Image uploaded successfully",
        data: { url: result.secure_url },
      });
    });
  } catch (error) {
    next(error);
  }
};

// Get all events with optional filters
const getAllEvents = async (req, res) => {
  try {
    const { search, category, location, tags } = req.query;
    let filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (tags) filter.tags = { $in: tags.split(",") };

    const events = await Event.find(filter).populate("organizer", "firstName lastName email");
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get single event by ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("organizer", "firstName lastName email");
    if (!event) return res.status(404).json({ error: "Event not found" });

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create event
// const createEvent = async (req, res) => {
//   try {
//     const { title, description, category, location, date, isPublished, tickets, organizer } = req.body;

//     if (!title || !description || !category || !location || !date || !organizer) {
//       return res.status(400).json({ error: "All fields except image are required." });
//     }

//     let imageUrl = req.body.image || null;
//     if (req.file) {
//       const file = dataUri(req).content;
//       const result = await uploader.upload(file, { folder: "eventImages" });
//       imageUrl = result.secure_url;
//     }
//     if (!imageUrl) {
//       return res.status(400).json({ error: "Image is required." });
//     }

//     // const parsedTickets = tickets ? JSON.parse(tickets) : [];
//     const parsedTickets = tickets || [];


//     const event = new Event({
//       title,
//       description,
//       category,
//       location,
//       date: new Date(date),
//       isPublished: isPublished === "true",
//       tickets: parsedTickets,
//       organizer,
//       image : imageUrl //schema expects 'image'
//     });

//     await event.save();
//     res.status(201).json({ message: "Event created successfully!", event });
//   } catch (error) {
//     console.error("Error creating event:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// };

const createEvent = async (req, res) => {
  try {
    const {
      title, description, category,
      location, date, isPublished,
      tickets, organizer,
    } = req.body;

    // 1) Validate required fields
    if (!title || !description || !category ||
        !location || !date || !organizer) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required." });
    }

    // 2) Build a Data URI from the buffer
    const base64 = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    // 3) Upload the Data URI directly
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "eventImages",
    });
    // uploadResult.secure_url is your hosted image URL

    // 4) Parse tickets if needed
    const parsedTickets = tickets
      ? (typeof tickets === "string" ? JSON.parse(tickets) : tickets)
      : [];

    // 5) Build & save your Event
    const event = new Event({
      title,
      description,
      category,
      location,
      date: new Date(date),
      isPublished: isPublished === "true" || isPublished === true,
      tickets: parsedTickets,
      organizer,
      image: uploadResult.secure_url,
    });
    await event.save();

    res.status(201).json({ message: "Event created successfully!", event });
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// Update event
const updateEvent = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // prevent organizer tampering
    delete updateData.organizer;
    delete updateData.attendees;

    // parse tickets JSON if present
    if (updateData.tickets) updateData.tickets = JSON.parse(updateData.tickets);

    // handle image upload
    if (req.file) {
      const fileContent = dataUri(req).content;
      const uploadResult = await cloudinary.uploader.upload(fileContent, {
        folder: "eventImages",
      });
      updateData.image = uploadResult.secure_url;
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedEvent) return res.status(404).json({ error: "Event not found" });

    res.json({ message: "Event updated successfully", event: updatedEvent });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (req.user.role !== "admin" && event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied: You can only delete your own events" });
    }

    await event.deleteOne();
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Register attendee
const registerAttendee = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.attendees.includes(userId)) {
      return res.status(400).json({ error: "User already registered for this event" });
    }

    event.attendees.push(userId);
    await event.save();

    res.status(200).json({ message: "User registered successfully", event });
  } catch (error) {
    console.error("Error registering attendee:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Purchase ticket
const purchaseTicket = async (req, res) => {
  try {
    const { eventId, ticketType } = req.params;
    const { userId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const ticket = event.tickets.find((t) => t.type === ticketType);
    if (!ticket || ticket.quantity <= 0) {
      return res.status(400).json({ error: "Ticket type not available or sold out" });
    }

    ticket.quantity -= 1;
    event.attendees.push(userId);
    await event.save();

    res.status(200).json({ message: "Ticket purchased successfully", event });
  } catch (error) {
    console.error("Error purchasing ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerAttendee,
  purchaseTicket,
  uploadEventImage,
  EventImageUpload,
};
