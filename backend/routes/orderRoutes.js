const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth");
const controller = require("../controllers/orderController");

router.use(authRequired);
router.get("/", controller.list);
router.post("/", requireRole("admin", "accountant"), controller.create);
router.get("/:id", controller.getById);
router.post("/:id/confirm", requireRole("admin", "accountant"), controller.confirm);
router.post("/:id/convert", requireRole("admin", "accountant"), controller.convert);

module.exports = router;
