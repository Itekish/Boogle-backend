const mongoose = require("mongoose");

function normalizeAttendees(attendees) {
  return (attendees || [])
    .map(a => {
      if (!a) return null;

      // Already a subdoc object
      if (a.user && a.ticketType) {
        return {
          user: a.user.toString(),
          ticketType: a.ticketType
        };
      }

      // Raw ID (ObjectId or string)
      if (typeof a === "string" || a instanceof mongoose.Types.ObjectId) {
        return {
          user: a.toString(),
          ticketType: "Unknown"
        };
      }

      // Unexpected shape—skip it
      return null;
    })
    .filter(entry => entry !== null);
}

module.exports = { normalizeAttendees };
