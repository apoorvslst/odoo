const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth");
const controller = require("../controllers/analyticController");

router.use(authRequired);
router.get("/", controller.list);
router.post("/", requireRole("admin", "accountant"), controller.create);
router.put("/:id", requireRole("admin", "accountant"), controller.update);
router.delete("/:id", requireRole("admin"), controller.remove);

module.exports = router;
