const db = require("./db");
const WindowMs = parseInt(process.env.WindowMs);
const MaxReqs = parseInt(process.env.MaxReqs);
const BanPeriod = parseInt(process.env.BanPeriod);
const MaxWarns = parseInt(process.env.MaxWarns);
const MaxOffences = parseInt(process.env.MaxOffences);
const SpamIncrement = parseInt(process.env.SpamIncrement);
const SpamIncrementOffence = parseInt(process.env.SpamIncrementOffence);
const SendBanHeaders = parseInt(process.env.SendBanHeaders);

function msg(type, time){
    if(type == 1) {
        //permanent ban
        return "welp! Looks like you got perma banned by our systems"+ 
        ", if you think this was a mistake, feel free to contact us at contact@pihacks.net";
    }
    else if(type == 2){
        //too many req + unban time
        return "Hey!, seems like you have been sending too many requests!\n" + 
        "After repeated offences, our systems have put you in a timeout corner until " + time 
        +  ", if you think this was a mistake, feel free to contact us at contact@pihacks.net";
    }
    else{
        //beshi excited hoi gese
        return "Hey!, seems like you have been sending too many requests!\n" +
        "We understand you might be excited about the event" + 
        "but keep in mind we need to process a lot of requests from other participants too\n" +  
        "please wait "+String(time) + "min(s) before sending another request. " + 
        "if you think this was a mistake, feel free to contact us at contact@pihacks.net";
    }
}

function UnBanFreeze(){
    let UnBanTime = new Date(BanStatus.Start + BanPeriod);
    UnBanTime = UnBanTime.toLocaleString("en-US",{timeZone: 'Asia/Almaty'})
    if(SendBanHeaders) res.set(BanStatus);
    res.status(429).json({
        verdict : "invalid",
        task : "message",
        message : msg(2, UnBanTime)
        });
    db.UpdateIp(ip,BanStatus);
    return;
}

function Ban(){
    //checking 
    if(BanStatus.offences>=MaxOffences){
        if(SendBanHeaders) res.set(BanStatus);
        res.status(429).json({
            verdict : "invalid",
            task : "message",
            message : msg(1, null)
        });
        db.UpdateIp(ip,BanStatus);
        return;
    }
}

async function BanHandler(req, res, next) {
    
    //Init-Start
    var ip = req.ip || req.socket.remoteAddress;
    var BanStatus = {};
    try{
        BanStatus = await db.GetBanStatus(ip);
    }
    catch(err){
        console.log(err);
        next();
        return;
    }
    if(BanStatus == null){
        BanStatus = {
            uids:[],
            Start: Date.now(),
            RemainingReqs : MaxReqs,
            WarningsLeft : MaxWarns,
            isBanned : false,
            offences : 0
        }
    }
    //Init-Done

    //If already banned
    if(BanStatus.isBanned){
        if(Date.now() - BanStatus.Start < BanPeriod){
            UnBanFreeze(); //
        }
        else{
            BanStatus.isBanned=false;
            BanStatus.WarningsLeft=0;
            BanStatus.RemainingReqs = MaxReqs;
            BanStatus.Start = Date.now();
        }
    }

    //checking if Ban kora jai kina
    Ban();

    //TimeFrame er baire gese 
    if(Date.now() - BanStatus.Start >= WindowMs){
        BanStatus.RemainingReqs = MaxReqs;
        BanStatus.Start=Date.now();
    }   

    if(BanStatus.RemainingReqs>0){
        BanStatus.RemainingReqs--;
        db.UpdateIp(ip, BanStatus);
    }

    //Kaabil
    else if(BanStatus.RemainingReqs==0){
        BanStatus.WarningsLeft--;
        BanStatus.RemainingReqs--;
    }

    //Banned
    if(BanStatus.WarningsLeft<0){
        BanStatus.isBanned=true;
        BanStatus.Start=Date.now();
        BanStatus.offences++;
        Ban(); //If possible
        UnBanFreeze(); //else
    }

    //Slow-Death (Gradually Increasing the Window-Timeframe)
    if(BanStatus.RemainingReqs<0){
        BanStatus.Start+=SpamIncrement;
        BanStatus.offences+=(1/SpamIncrementOffence);
        
        if(SendBanHeaders) res.set(BanStatus);
        var WaitTime = (Date.now() > BanStatus.Start ? Math.ceil((WindowMs-(Date.now() - BanStatus.Start))/(1000*60))
         : Math.ceil((WindowMs+(BanStatus.Start-Date.now()))/(1000*60)));
        
         res.status(429).json({
            verdict : "invalid",
            task : "message",
            message : msg(3, WaitTime),
        });
        db.UpdateIp(ip,BanStatus);
        return;
    }

    if(SendBanHeaders) res.set(BanStatus);
    db.UpdateIp(ip,BanStatus); //final-update
    next();
}

module.exports = BanHandler;