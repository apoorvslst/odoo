const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth");
const invoiceController = require("../controllers/invoiceController");
const paymentController = require("../controllers/paymentController");

router.use(authRequired);
router.get("/", invoiceController.list);
// Create invoice/bill (Admin/Accountant creates both; Vendor submits own bill)
router.post("/", invoiceController.create);
router.get("/:id", invoiceController.getById);
router.post("/:id/post", requireRole("admin", "accountant"), invoiceController.post);
router.post("/:id/remind", requireRole("admin", "accountant"), invoiceController.sendReminder);

// Payments are nested under documents - a payment always belongs to one.
router.get("/:id/payments", paymentController.listForInvoice);
router.post("/:id/payments", requireRole("admin", "accountant"), paymentController.createForInvoice);

module.exports = router;
