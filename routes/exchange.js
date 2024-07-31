const express = require("express");

const router = express.Router();

const exchangeController = require("../controller/exchangeController");

router.get("/getExchanges", exchangeController.getAll);
router.get("/", exchangeController.test);

module.exports = router;
