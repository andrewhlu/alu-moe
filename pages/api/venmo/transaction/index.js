import { getData, setData } from "../../../../utils/firebase";
import { getTodayDateString, getNewEmails } from "../../../../utils/venmo";

export default async function(req, res) {
    const accessCode = req.query.code;
    const transactionCode = req.query.transaction;

    try {
        if(accessCode === undefined || accessCode === "") {
            throw "No access code was provided";
        }

        // Resolve access code into a user ID
        const userId = await getData("venmo/codes/" + accessCode);

        if(userId === null) {
            throw "Invalid access code";
        }

        switch(req.method) {
            case "GET": {
                // Process all new emails in the database
                await getNewEmails(req, userId);

                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({
                    success: true,
                })); 

                break;
            }
            default: {
                throw "Invalid request type";
            }
        }
    }
    catch (error) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
            success: false,
            error: error,
        }));
    }
}
