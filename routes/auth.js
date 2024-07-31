const express = require("express");

const router = express.Router();

const authController = require("../controller/authController");
const { authCheck } = require("../middleware/authCheck");

router.get("/getUser", authController.logUser);
router.post("/kakaoLogin", authController.kakaoLogin);
router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/check", authCheck, authController.check);
router.get("/refresh", authController.refresh);
router.get("/info", authCheck, authController.info);

module.exports = router;
