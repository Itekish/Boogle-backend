const Event                  = require("../models/event.model");
const { normalizeAttendees } = require("../utils/attendeeUtils");

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [createdEvents, attendingRaw] = await Promise.all([
      Event.find({ organizer: userId }),
      Event.find({ "attendees.user": userId })
    ]);

    const enrich = evt => {
      const obj = evt.toObject();
      obj.attendees = normalizeAttendees(obj.attendees);

      const totalSold = obj.tickets.reduce((sum, t) => sum + (t.sold || 0), 0);
      const revenue   = obj.tickets.reduce((sum, t) => sum + t.price * (t.sold || 0), 0);
      const me        = obj.attendees.find(a => a.user === userId);

      return {
        ...obj,
        totalSold,
        revenue,
        userTicketType: me?.ticketType ?? null
      };
    };

    res.json({
      createdEvents:         createdEvents.map(enrich),
      attendingEvents:       attendingRaw.map(enrich),
      createdEventsLength:   createdEvents.length,
      attendingEventsLength: attendingRaw.length,
      totalEvents:           createdEvents.length + attendingRaw.length
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getDashboardStats };
