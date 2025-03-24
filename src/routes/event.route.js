const express = require("express");
const eventController = require("../controllers/event.controller");
const { protectRoute, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.route("/")
  .get(eventController.getAllEvents)
  .post(protectRoute, authorizeRoles("organizer", "admin"), eventController.createEvent);

router.route("/:id")
  .get(eventController.getEventById)
  .patch(protectRoute, authorizeRoles("organizer", "admin"), eventController.updateEvent)
  .delete(protectRoute, authorizeRoles("organizer", "admin"), eventController.deleteEvent);

// Registration & Ticket Purchase (protected)
router.post("/:eventId/register", protectRoute, eventController.registerAttendee);
router.post("/:eventId/tickets/:ticketType", protectRoute, eventController.purchaseTicket);

module.exports = router;
