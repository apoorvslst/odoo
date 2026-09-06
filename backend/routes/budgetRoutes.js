const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth");
const controller = require("../controllers/budgetController");

router.use(authRequired,requireRole("admin", "accountant")); 

router.get("/", controller.list); // Saare budgets dekhna (Anyone logged in)

router.post("/", controller.create); // Naya budget banana (Sirf admin & accountant)

router.get("/:id", controller.getById); // Ek budget ki puri detail lines ke saath

router.get("/:id/report", controller.report); // Planned vs Actual ki comparison report!

module.exports = router;
