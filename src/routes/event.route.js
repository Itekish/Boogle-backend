const express = require("express");
const eventController = require("../controllers/event.controller");
const { protectRoute, authorizeRoles } = require("../middleware/auth");
const uploadImage = require('../middleware/uploadImage')
const router = express.Router();

// Public Routes
// router.route("/")
//   .get(eventController.getAllEvents)
//   .post(
//     protectRoute,
//     authorizeRoles("organizer", "admin"),
//     require("../controllers/event.controller").EventImageUpload, // <- multer memory storage
//     eventController.createEvent
//   );

router
  .route("/")
  .get(eventController.getAllEvents)
  .post(
    protectRoute,
    authorizeRoles("organizer", "admin"),
    uploadImage,                  // ← multer diskStorage
    eventController.createEvent  // ← uploads to Cloudinary, saves to DB
  );


router.route("/:id")
  .get(eventController.getEventById)
  .patch(
    protectRoute,
    authorizeRoles("organizer", "admin"),
    uploadImage, 
    eventController.updateEvent 
  )
  .delete(protectRoute, authorizeRoles("organizer", "admin"), eventController.deleteEvent);

// Registration & Ticket Purchase
router.post("/:eventId/register", protectRoute, eventController.registerAttendee);
router.post("/:eventId/tickets/:ticketType", protectRoute, eventController.purchaseTicket);

module.exports = router;
