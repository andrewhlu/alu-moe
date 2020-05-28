import { callbackAuth } from "../../../../utils/oauth";

export default async function(req, res) {
    let result;
    
    try {
        result = await callbackAuth("venmo", req);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(result));
    }
    catch (error) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(error));
    }
}
