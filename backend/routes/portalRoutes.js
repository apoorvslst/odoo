const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth");
const controller = require("../controllers/portalController");

// Contact users only: everything is scoped to their own contactId.
router.use(authRequired, requireRole("contact"));
router.get("/documents", controller.listMyDocuments);
router.get("/documents/:id", controller.getMyDocument);
router.post("/documents/:id/pay", controller.payMyDocument);
router.post("/documents/checkout", controller.checkoutStore);

module.exports = router;
