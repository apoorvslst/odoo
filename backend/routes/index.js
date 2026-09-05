const router = require("express").Router();

router.use("/auth", require("./authRoutes"));
router.use("/contacts", require("./contactRoutes"));
router.use("/accounts", require("./accountRoutes"));
router.use("/products", require("./productRoutes"));
router.use("/journals", require("./journalRoutes"));
router.use("/analytic-accounts", require("./analyticRoutes"));
router.use("/budgets", require("./budgetRoutes"));
router.use("/orders", require("./orderRoutes"));
router.use("/invoices", require("./invoiceRoutes")); // kind=invoice|bill - customer invoices AND vendor bills
router.use("/payments", require("./paymentRoutes"));
router.use("/transactions", require("./transactionRoutes"));
router.use("/reports", require("./reportRoutes"));
router.use("/portal", require("./portalRoutes"));

module.exports = router;
