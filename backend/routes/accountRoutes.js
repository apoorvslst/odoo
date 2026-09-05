const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth");
const controller = require("../controllers/accountController");

router.use(authRequired);
router.get("/", controller.list);
router.post("/", requireRole("admin", "accountant"), controller.create);
router.get("/:id", controller.getById);
router.put("/:id", requireRole("admin", "accountant"), controller.update);
router.patch("/:id/archive", requireRole("admin"), controller.archive);
router.delete("/:id", requireRole("admin"), controller.remove);

module.exports = router;
