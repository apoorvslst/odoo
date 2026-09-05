const router = require("express").Router();
const { authRequired } = require("../middleware/auth");
const controller = require("../controllers/paymentController");

router.use(authRequired);
router.get("/", controller.listAll);

module.exports = router;
