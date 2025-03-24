const Event = require("../models/event.model");

// Get all events with search functionality
const getAllEvents = async (req, res) => {
  try {
    const { search, category, location, tags } = req.query;
    let filter = {};

    // Search by title or description (case-insensitive)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by location
    if (location) {
      filter.location = { $regex: location, $options: "i" }; // Case-insensitive
    }

    // Filter by tags (matches any tag)
    if (tags) {
      filter.tags = { $in: tags.split(",") }; // Split comma-separated tags
    }

    const events = await Event.find(filter).populate("organizer", "firstName lastName email");
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Get an event by ID
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

// Create a new event
const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, organizer, tickets, category, tags, coverImage, isPublished } = req.body;

    if (!title || !date || !location || !organizer) {
      return res.status(400).json({ error: "Title, date, location, and organizer are required" });
    }

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      organizer,
      tickets: tickets || [],
      category,
      tags,
      coverImage,
      isPublished: isPublished || false,
      publishedAt: isPublished ? Date.now() : null,
    });

    await newEvent.save();
    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update an event
const updateEvent = async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedEvent) return res.status(404).json({ error: "Event not found" });

    res.status(200).json({ message: "Event updated successfully", event: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete an event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if user is an admin or the organizer of the event
    if (req.user.role !== "admin" && event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied: You can only delete your own events" });
    }

    await event.deleteOne(); // Delete the event
    res.status(200).json({ message: "Event deleted successfully" });

  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Register an attendee for an event
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

// Purchase a ticket for an event
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

const eventController = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerAttendee,
  purchaseTicket,
}

module.exports = eventController

