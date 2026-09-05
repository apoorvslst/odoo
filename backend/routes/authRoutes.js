const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth");
const controller = require("../controllers/authController");

router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/me", authRequired, controller.me);
router.get("/users", authRequired, requireRole("admin"), controller.listUsers);
router.post("/users", authRequired, requireRole("admin"), controller.createUser);

module.exports = router;
