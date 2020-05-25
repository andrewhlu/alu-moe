import config from "./config";
import { fetch } from "./fetch";
import { getData, setData } from "./firebase";
import crypto from 'crypto';

const contexts = {
    sonos: {
        authUri: "https://api.sonos.com/login/v3/oauth",
        tokenUri: "https://api.sonos.com/login/v3/oauth/access",
        clientId: config.SONOS_CLIENT_ID,
        clientSecret: config.SONOS_CLIENT_SECRET,
        redirectUri: config.SONOS_REDIRECT_URI,
        scopes: "playback-control-all",
        tokenAuthHeader: true,
        uriEncodedBody: true,
    },
    venmo: {
        authUri: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUri: "https://oauth2.googleapis.com/token",
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        redirectUri: config.GOOGLE_REDIRECT_URI_VENMO,
        scopes: "https://www.googleapis.com/auth/gmail.readonly",
        additionalParams: {
            include_granted_scopes: true,
            access_type: "offline",
        },
    }
};

export async function startAuth(context, res) {
    if(!context) {
        res.statusCode = 400;
        res.end({ error: "No OAuth context was provided" });
        throw "No OAuth context was provided";
    }
    else if(!contexts[context]) {
        res.statusCode = 400;
        res.end({ error: "An invalid OAuth context was provided" });
        throw "An invalid OAuth context was provided";
    }

    let state = crypto.randomBytes(16).toString('base64').slice(0, 16).replace(/[/+]/g, "");
    setData("state/" + state, context);

    const urlParams = {
        response_type: "code",
        client_id: contexts[context].clientId,
        scope: contexts[context].scopes,
        redirect_uri: contexts[context].redirectUri,
        state: state,
    };

    Object.assign(urlParams, contexts[context].additionalParams);

    res.statusCode = 302;
    res.setHeader('Location', contexts[context].authUri + "?" + new URLSearchParams(urlParams).toString());
    res.end();
}

export async function callbackAuth(context, req) {
    if(!context) {
        throw "No OAuth context was provided";
    }
    else if(!contexts[context]) {
        throw "An invalid OAuth context was provided";
    }

    const { state, code, scope } = req.query;
    console.log(state + ", " + code + ", " + scope);

    let stateDb = await getData("state/" + state);

    if(stateDb != context) {
        throw "An invalid state was received";
    }

    setData("state/" + state, null);

    const body = {
        grant_type: "authorization_code",
        code: code,
        client_id: contexts[context].clientId,
        client_secret: contexts[context].clientSecret,
        redirect_uri: contexts[context].redirectUri,
    };

    const headers = {
        "Authorization": contexts[context].tokenAuthHeader ? "Basic " + Buffer.from(contexts[context].clientId + ":" + contexts[context].clientSecret).toString('base64') : null,
        "Content-Type": contexts[context].uriEncodedBody ? "application/x-www-form-urlencoded" : "application/json",
    };

    const options = {
        method: "POST",
        body: contexts[context].uriEncodedBody ? new URLSearchParams(body).toString() : JSON.stringify(body),
        headers: headers,
    };

    console.log(options)

    const response = await fetch(contexts[context].tokenUri, options);
    console.log(response);

    return response;
}
