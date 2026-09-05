const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth");
const controller = require("../controllers/budgetController");

router.use(authRequired);
router.get("/", controller.list);
router.post("/", requireRole("admin", "accountant"), controller.create);
router.get("/:id", controller.getById);
router.get("/:id/report", controller.report);

module.exports = router;
