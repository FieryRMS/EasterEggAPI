// @ts-check
const express = require("express");
const db = require("../libs/db");
const router = express.Router();


/**
 * @param  {String} s
 * @returns {Boolean}
 */
function ValidateTxt(s) {
    if (s.length > 200) return false;

    for (let i = 0; i < s.length; i++) {
        if (
            s[i] == '.' ||
            s[i] == '#' ||
            s[i] == '$' ||
            s[i] == '[' ||
            s[i] == ']' ||
            s[i] == '"' ||
            s[i] == "'"
        ) return false;
    }
    return true;
}


/**
 * @param  {express.Request} req
 * @param  {express.Response} res
 * @param  {express.NextFunction} next
 */
async function ParticipantMain(req, res, next) {

    //Variable inits
    let fail = false;
    let Inpt = {
        uid: String(req.body.uid),
        ans: String(req.body.ans)
    };

    /**
     * @type {{
     *      verdict: string, 
     *      message: string,
     *      image: string
     * }}
     */
    let response;


    //validations
    if (!ValidateTxt(Inpt.uid) || !ValidateTxt(Inpt.ans)) {
        response = {
            verdict: "Invalid",
            message: "Input is either too long or has invalid characters",
            image: null
        };
        res.status(400).json(response);
        return;
    }

    //Geting User Data from database and check if user exists
    /**
     * @type {?{
     *      uid: string, 
     *      score: number, 
     *      solved: boolean[]
     * }}
     */
    let UserData = (await db.GetUserData(Inpt.uid).catch((err) => {
        response = {
            verdict: "Failed",
            message: "We are sorry, but our servers are facings some issues! " + err,
            image: null
        };
        res.status(400).json(response);
        fail = true;
    }));
    if (fail) return;
    if (UserData == null) {
        response = {
            verdict: "Invalid",
            message: "The given userID does not exist",
            image: null
        };
        res.status(418).send(response);
        return;
    }

    //Getting clue data from database and check if user answer is correct
    /**
     * @type {?{
     *      index: number,
     *      message: string,
     *      image: ?string,
     *      RelatedTo: ?string
     * }}
     */
    let ClueData = (await db.GetClueData(Inpt.ans).catch((err) => {
        response = {
            verdict: "Failed",
            message: "We are sorry, but our servers are facings some issues! If this issue persists, please report this to pihacks@presidency.ac.bd " + err,
            image: null
        };
        res.status(400).json(response);
        fail = true;
    }));
    if (fail) return;
    //wrong answer
    if (ClueData == null) {
        response = {
            verdict: "Wrong",
            message: "Wrong answer, try again!",
            image: null
        };
        res.status(200).json(response);
        return;
    }

    //check if previous clue was solved
    if (ClueData.RelatedTo != null) {
        //Getting clue data from database and check if user answer is correct
        /**
         * @type {?{
         *      index: number,
         *      message: string,
         *      image: ?string,
         *      RelatedTo: ?string
         * }}
         */
        let RelatedClueData = (await db.GetClueData(ClueData.RelatedTo).catch((err) => {
            response = {
                verdict: "Failed",
                message: "We are sorry, but our servers are facings some issues! If this issue persists, please report this to pihacks@presidency.ac.bd " + err,
                image: null
            };
            res.status(400).json(response);
            fail = true;
        }));
        if (fail) return;
        //check if related clue is correct
        if (RelatedClueData == null) {
            let err = "Error: INVALID RELCLUE";
            response = {
                verdict: "Failed",
                message: "We are sorry, but our servers are facings some issues! Please report this to pihacks@presidency.ac.bd " + err,
                image: null
            };
            res.status(400).json(response);
            return;
        }

        //Related clue was not solved
        if (RelatedClueData.index >= UserData.solved.length ||
            !UserData.solved[RelatedClueData.index]) {
            response = {
                verdict: "Wrong",
                message: "Wrong answer, try again!",
                image: null
            };
            res.status(200).json(response);
            return;
        }
    }

    //mark current clue as solved
    for (let i = UserData.solved.length; i <= ClueData.index; i++)
        UserData.solved[i] = false;
    UserData.score += UserData.solved[ClueData.index] ? 0 : 1;
    UserData.solved[ClueData.index] = true;

    await db.UpdateUser(UserData).catch((err) => {
        response = {
            verdict: "Failed",
            message: "We are sorry, but our servers are facings some issues! If this issue persists, please report this to pihacks@presidency.ac.bd " + err,
            image: null
        };
        res.status(400).json(response);
        fail = true;
    });

    response = {
        verdict: "Accepted",
        message: ClueData.message,
        image: ClueData.image
    };
    res.status(200).json(response);
    return;
}

router.patch("/", ParticipantMain);

router.use("/", (req, res, next) => {
    res.status(200).send("NERRRRRDDDDD");
});

module.exports = router;