const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth");
const controller = require("../controllers/journalController");

router.use(authRequired);
router.get("/", controller.list);
router.post("/", requireRole("admin", "accountant"), controller.create);

module.exports = router;
