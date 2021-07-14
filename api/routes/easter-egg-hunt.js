const express = require("express");
const router = express.Router();

router.use("/",(req, res, next)=>{
    res.status(200).send("also working");
})

module.exports = router;