// @ts-check

//Initalize
const events = require("events");
const EventEmitter = new events.EventEmitter();
const firebase = require("firebase/app").default;
require("firebase/database");

let firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    databaseURL: process.env.databaseURL,
    projectId: process.env.projectId,
    storageBucket: process.env.projectId,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
    measurementId: process.env.measurementId
};
let EasterEggBasePath = process.env.EasterEggBasePath;

firebase.initializeApp(firebaseConfig);
var database = firebase.database();
database.ref(EasterEggBasePath + "/").on("value", () => { });


var RateLimitDB = {};
var DBUpdated = true;
database.ref(EasterEggBasePath + "/rate-limit").on("value", (dat) => {
    RateLimitDB = dat.val();
    if (RateLimitDB == null) RateLimitDB = {};
});

const RateLimitUpdateInterval = parseInt(process.env.RateLimitUpdateInterval);
setInterval(() => {
    if (DBUpdated)
        database.ref(EasterEggBasePath + "/rate-limit").set(RateLimitDB)
        .catch((err) => {
            console.log(err);
        });
    DBUpdated = true;
}, RateLimitUpdateInterval);
process.once("SIGTERM", () => {
    if (DBUpdated)
        database.ref(EasterEggBasePath + "/rate-limit").set(RateLimitDB)
        .then(()=>{
            EventEmitter.emit("StartShutdown");
        })
        .catch((err) => {
            console.log(err);
        });
    DBUpdated = true;
});

const dbTimeOut = parseInt(process.env.dbTimeOut);


//Methods
/**
 * @param {string} uid
 * @returns {Promise<?{
 *              uid: string, 
 *              score: number, 
 *              solved: boolean[]
 *          }>
 * }
 */
function GetUserData(uid) {
    return new Promise((resolve, reject) => {
        var done = false;
        database.ref(EasterEggBasePath + "/users/" + uid).once("value", (dat) => {
            if (!done) {
                done = true;
                resolve(dat.val());
            }
        });
        setTimeout(() => {
            if (!done) {
                done = true;
                reject("Error: DATABASE CON DENIED");
            }
        }, dbTimeOut);
    });
}

/**
 * @param {string} clue
 * @returns {Promise<?{
 *              index: number,
 *              message: string,
 *              image: ?string,
 *              RelatedTo: ?string
 *          }>
 * }
 */
function GetClueData(clue) {
    return new Promise((resolve, reject) => {
        var done = false;
        database.ref(EasterEggBasePath + "/clues/" + clue).once("value", (dat) => {
            if (!done) {
                done = true;
                resolve(dat.val());
            }
        });
        setTimeout(() => {
            if (!done) {
                done = true;
                reject("Error: DATABASE CON DENIED");
            }
        }, dbTimeOut);
    });
}

/**
 * 
 * @param {!{
 *          uid: string, 
 *          score: number, 
 *          solved: boolean[]
 * }} UserData
 * @returns {Promise<void>}
 */
function UpdateUser(UserData) {
    return new Promise((resolve, reject) => {
        var done = false;
        database.ref(EasterEggBasePath + "/users/" + UserData.uid).set(UserData)
            .then(() => {
                done = true;
                resolve();
            })
            .catch((err) => {
                done = true;
                reject(err);
            });
        setTimeout(() => {
            if (!done) {
                reject("Error: DATABASE CON DENIED");
            }
        }, dbTimeOut);
    });
}

/**
 * 
 * @param {string} ip 
 * @param {boolean} reverse 
 * @returns {string}
 */
function ReplaceInvalidChar(ip, reverse = false) {
    //  ".", "#", "$", "[", or "]"
    if (!reverse) {
        return String(ip)
            .replaceAll(".", ",")
            .replaceAll("#", "@")
            .replaceAll("$", "%")
            .replaceAll("[", "^")
            .replaceAll("]", "&");
    }
    else {
        return String(ip)
            .replaceAll(",", ".")
            .replaceAll("@", "#")
            .replaceAll("%", "$")
            .replaceAll("^", "[")
            .replaceAll("&", "]");
    }
}

/**
 * 
 * @param {string} ip 
 * @returns {?{
     *      uids: string[],
     *      start: number,
     *      ReqsLeft: number,
     *      WarningsLeft: number,
     *      offences: number,
     *      timedout: boolean
     * }}
 */
function GetBanStatus(ip) {
    ip = ReplaceInvalidChar(ip);
    return RateLimitDB[ip];
}

/**
 * 
 * @param {string} ip 
 * @param {{
     *      uids: string[],
     *      start: number,
     *      ReqsLeft: number,
     *      WarningsLeft: number,
     *      offences: number,
     *      timedout: boolean
     * }} BanStatus
 */
function UpdateBanStatus(ip, BanStatus) {
    ip = ReplaceInvalidChar(ip);
    RateLimitDB[ip] = BanStatus;
    DBUpdated = false;
}

module.exports = {
    GetUserData,
    GetClueData,
    UpdateUser,
    GetBanStatus,
    UpdateBanStatus,
    EventEmitter
};


// /**
//  * @type {{uid:string, score:number, solved:boolean[]}}
//  */
// let tempuid = {
//     uid: "nzhtsux",
//     score: 0,
//     solved: [false]
// };
// database.ref(EasterEggBasePath + "/users/" + tempuid.uid).set(tempuid);


// /**
//  * @type {?{index:number,message:string,image:?string,RelatedTo:?string}}
//  */
// let tempclue = {
//     index:0,
//     message:"Never gonna give you up",
//     image:"../assets/nerver.jpg",
//     RelatedTo : null
// };
// database.ref(EasterEggBasePath + "/clues/" + "test-clue").set(tempclue);


// /**
//  * @type {?{index:number,message:string,image:?string,RelatedTo:?string}}
//  */
// let tempcluerel = {
//     index: 1,
//     message: "din khaw",
//     image: "../assets/egg symbol.png",
//     RelatedTo: "test-clue"
// };
// database.ref(EasterEggBasePath + "/clues/" + "test-clue-related").set(tempcluerel);

