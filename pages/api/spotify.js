import { fetch } from "../../utils/fetch";

export default async function(req, res) {
    const authCode = "access_code";

    const headers = {
        "Authorization": "Bearer " + authCode,
        "Accept": "application/json",
        "Content-Type": "application/json",
    };

    const body = {
        context_uri: "spotify:album:6pZj4nvx6lV3ulIK3BSjvs", 
        offset: {
            position: 3,
        },
    };

    const options = {
        method: "PUT",
        body: JSON.stringify(body),
        headers: headers,
    };

    const response = await fetch("https://api.spotify.com/v1/me/player/play", options);

    const output = {status: "Success"};

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(output));
}
