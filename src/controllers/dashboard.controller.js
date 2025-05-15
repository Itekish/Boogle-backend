const Event = require("../models/event.model");

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Events the user created
    const createdEvents = await Event.find({ organizer: userId });
    console.log(createdEvents)
    
    // Events the user is attending
    const attendingEvents = await Event.find({ attendees: userId });
    console.log(attendingEvents)

    const stats = {
      createdEvents: createdEvents,
      attendingEvents: attendingEvents,
      createdEventsLength: createdEvents.length,
      attendingEventsLength: attendingEvents.length,
      totalEvents: createdEvents.length + attendingEvents.length
    };

    res.status(200).json(stats);
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getDashboardStats };
