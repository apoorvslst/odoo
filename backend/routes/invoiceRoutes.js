const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth");
const invoiceController = require("../controllers/invoiceController");
const paymentController = require("../controllers/paymentController");

router.use(authRequired);
router.get("/", invoiceController.list);
router.post("/", requireRole("admin", "accountant"), invoiceController.create);
router.get("/:id", invoiceController.getById);
router.post("/:id/post", requireRole("admin", "accountant"), invoiceController.post);

// Payments are nested under documents - a payment always belongs to one.
router.get("/:id/payments", paymentController.listForInvoice);
router.post("/:id/payments", requireRole("admin", "accountant"), paymentController.createForInvoice);

module.exports = router;
