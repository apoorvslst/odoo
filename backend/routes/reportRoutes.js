const router = require("express").Router();
const { authRequired } = require("../middleware/auth");
const controller = require("../controllers/reportController");

router.use(authRequired);
router.get("/trial-balance", controller.trialBalance);
router.get("/profit-loss", controller.profitLoss);
router.get("/balance-sheet", controller.balanceSheet);
router.get("/ledger/:accountId", controller.ledger);
router.get("/dashboard", controller.dashboard);

module.exports = router;
