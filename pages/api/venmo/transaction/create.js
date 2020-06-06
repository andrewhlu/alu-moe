import { getData, setData } from "../../../../utils/firebase";
import { randomString } from "../../../../utils/venmo";

export default async function(req, res) {
    const accessCode = req.query.code;

    try {
        if(accessCode === undefined || accessCode === "") {
            throw "No access code was provided";
        }

        // Resolve access code into a user ID
        const userId = await getData("venmo/codes/" + accessCode);

        if(userId === null) {
            throw "Invalid access code";
        }

        // Check if this user ID exists in the database
        const data = await getData("venmo/tokens/" + userId);

        if(data === null) {
            throw "User does not exist";
        }

        // Check if the app is initialized
        if(data.settings === undefined) {
            throw "Application has not been initialized";
        }

        switch(req.method) {
            case "POST": {
                // Create a new transaction code to be used
                let created = false;
                let code;

                while(!created) {
                    // Generate a random code
                    code = randomString(6, "0123456789");
                    let data = await getData("venmo/tokens/" + userId + "/transactions/" + code);
                    if(data === null) {
                        // Transaction code is not being used
                        created = true;
                        await setData("venmo/tokens/" + userId + "/transactions/" + code, {
                            completed: false,
                            tickets: 0,
                            amount: 0,
                        });
                    }
                }

                // Return code and identifier to app
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({
                    success: true,
                    code: code,
                    identifier: data.settings.identifier,
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
