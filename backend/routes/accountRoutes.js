const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth");
const controller = require("../controllers/accountController");

router.use(authRequired);

// showing all accounts
router.get("/", controller.list); 

// naya account banana agar admin ho toh hi
router.post("/", requireRole("admin", "accountant"), controller.create);

// ek account ki details  uske id number ke through
router.get("/:id", controller.getById);

// ek account ko modify krna agar admin ho toh hi
router.put("/:id", requireRole("admin", "accountant"), controller.update);

// ek account ko archive krna agar admin ho toh hi
router.patch("/:id/archive", requireRole("admin"), controller.archive);

// ek account ko delete krna agar admin ho toh hi
router.delete("/:id", requireRole("admin"), controller.remove);

module.exports = router;
