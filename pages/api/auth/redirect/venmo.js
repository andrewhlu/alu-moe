import { callbackAuth } from "../../../../utils/oauth";
import { fetch } from "../../../../utils/fetch";
import { getData, setData } from "../../../../utils/firebase";
import { randomString } from "../../../../utils/venmo";

export default async function(req, res) {
    let result;

    try {
        result = await callbackAuth("venmo", req);

        const headers = {
            "Authorization": "Bearer " + result.access_token,
            "Accept": "application/json",
            "Content-Type": "application/json",
        };
    
        const options = {
            method: "GET",
            headers: headers,
        };
    
        const response = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", options);
        const userId = response.id;

        let userToken;
        if(result.refresh_token) {
            // The result has a refresh token, indicating that this is the first time they have logged in to the app
            userToken = result;
            await setData("venmo/tokens/" + userId + "/token", result);
        }
        else {
            // The result does not have a refresh token, indicating that the user has logged in before
            userToken = await getData("venmo/tokens/" + userId + "/token");
            console.log(userToken);
            if(userToken === null) {
                // Something went wrong
                throw "User does not exist and refresh token is not present";
            }
        }

        let newCode = randomString(8, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
        console.log("Generated new code: " + newCode);
        await setData("venmo/codes/" + newCode, userId);

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(newCode));
    }
    catch (error) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(error));
    }
}
