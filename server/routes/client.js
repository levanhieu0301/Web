const express = require("express");
const router = express.Router();

const clientController = require("../controllers/clientController");

router.get(
  "/",
  clientController.client
);

module.exports = router;