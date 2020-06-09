import { getData, setData } from "../../../utils/firebase";
import { getTodayDateString } from "../../../utils/venmo";

export default async function(req, res) {
    const accessCode = req.query.code;
    const body = req.body;

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

        switch(req.method) {
            case "GET": {
                // Return whether app has been initialized + settings
                let settings = data.settings;
                if(settings === undefined) {
                    settings = {
                        initialized: false,
                    };
                }
                else {
                    settings.initialized = true;
                }

                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(settings));

                break;
            }
            case "POST": {
                console.log(body);

                let newSettings = {};

                // Initialize or update the app according to input parameters
                if(body.identifier !== undefined) {
                    // This value should only be set if it is currently undefined
                    if(data.settings?.identifier !== undefined) {
                        throw "Identifier has already been set, it cannot be changed";
                    }
                    else if(body.identifier.length !== 4 || body.identifier.toUpperCase().search(/([A-Z0-9]){4}/g) < 0) {
                        throw "Invalid identifier";
                    }
                    else {
                        newSettings.identifier = body.identifier.toUpperCase();
                    }                    
                }
                else if(data.settings === undefined) {
                    throw "Identifier must be present to initialize the app";
                }
                else {
                    // Keep the current value
                    newSettings.identifier = data.settings.identifier;
                }

                if(body.costPerTicket !== undefined) {
                    if(isNaN(parseFloat(body.costPerTicket)) || parseFloat(body.costPerTicket).toFixed(2) <= 0) {
                        throw "Invalid cost per ticket";
                    }
                    else {
                        newSettings.costPerTicket = parseFloat(body.costPerTicket).toFixed(2);
                    }
                }
                else if(data.settings === undefined) {
                    throw "Cost per ticket must be present to initialize the app";
                }
                else {
                    // Keep the current value
                    newSettings.costPerTicket = data.settings.costPerTicket;
                }

                if(body.venmoHandle !== undefined) {
                    newSettings.venmoHandle = body.venmoHandle.toLowerCase();
                }
                else if(data.settings === undefined) {
                    throw "Venmo handle must be present to initialize the app";
                }
                else {
                    // Keep the current value
                    newSettings.venmoHandle = data.settings.venmoHandle;
                }

                if(data.lastDate === undefined) {
                    // Set today's date as the last date
                    console.log(getTodayDateString());
                    await setData("venmo/tokens/" + userId + "/lastDate", getTodayDateString());
                }

                // Save and return new data
                await setData("venmo/tokens/" + userId + "/settings", newSettings);
                newSettings.initialized = true;

                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(newSettings));

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
            initialized: false,
            error: error,
        }));
    }
}
