const express = require("express");
const app = express();
const easter_egg_hunt = require("./api/routes/easter-egg-hunt");
app.use(express.json());

app.enable('trust proxy');

app.use("/easter-egg-hunt", easter_egg_hunt);

app.get("/", (req, res, next) =>{
    res.status(200).send("working");
});


module.exports = app;