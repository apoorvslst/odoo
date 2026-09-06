const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/rateLimiter");
const controller = require("../controllers/contactController");

// Public self-registration ke liye rate limiter: max 5 requests per 15 minutes per IP
const registrationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many registration attempts. Please try again after 15 minutes.",
});

// 1. Customer / Vendor self-registration portal (Public + Rate-limited)
router.post("/register", registrationLimiter, controller.registerPortal);

// 2. Iske neeche ke saare routes ke liye login zaroori hai
router.use(authRequired);

// all list of contacts (supports ?status=pending_approval & ?type=customer)
router.get("/", controller.list);

// create new contact directly (Internal: admin & accountant)
router.post("/", requireRole("admin", "accountant"), controller.create);

// get contact by id
router.get("/:id", controller.getById);

// update contact
router.put("/:id", requireRole("admin", "accountant"), controller.update);

// Accountant vetting: approve / reject pending contacts
router.patch("/:id/approve", requireRole("admin", "accountant"), controller.approve);
router.patch("/:id/reject", requireRole("admin", "accountant"), controller.reject);

// archive contact
router.patch("/:id/archive", requireRole("admin"), controller.archive);

// delete contact
router.delete("/:id", requireRole("admin"), controller.remove);

module.exports = router;
