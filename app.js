
//@ts-check
const express = require("express");
const app = express();
const BanHandler = require("./api/libs/BanHandler")
const easter_egg_hunt = require("./api/routes/easter-egg-hunt");
app.use(express.json());

app.use((req, res, next)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers","*");
    if(req.method === 'OPTIONS'){
        res.header("Access-Control-Allow-Methods", "*");
        return res.status(200).json({});
    }
})


app.enable('trust proxy');
app.use(BanHandler);

app.use("/easter-egg-hunt", easter_egg_hunt);

app.get("/", (req, res, next) =>{
    res.status(200).send("NERRDDDD");
});


module.exports = app;