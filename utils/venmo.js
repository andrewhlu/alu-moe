import config from "./config";
import { getData, setData } from "./firebase";
import { google } from "googleapis";
import absoluteUrl from 'next-absolute-url';

//Generate random string function
export function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

// Return today's date formatted as (m)m/(d)d/yyyy
export function getTodayDateString() {
    let date = new Date();
    return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
}

export async function getNewEmails(req, userId) {
    // Check if this user ID exists in the database
    const data = await getData("venmo/tokens/" + userId);

    if(data === null) {
        throw "User does not exist";
    }

    // Check if the app is initialized
    if(data.settings === undefined) {
        throw "Application has not been initialized";
    }

    // Set up Google OAuth client
    const { protocol, host } = absoluteUrl(req, 'localhost:3000');
    const oAuth2Client = new google.auth.OAuth2(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, protocol + "//" + host + "/api/auth/redirect/venmo");
    oAuth2Client.setCredentials(data.token);
    oAuth2Client.on('tokens', async (tokens) => {
        // If a new access token is generated, store it in the database
        if(tokens.access_token) {
            await setData("venmo/tokens/" + userId + "/token/access_token", tokens.access_token);
        }
    });

    // Search Gmail for new transactions
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    gmail.users.messages.list({
        userId: 'me',
        q: "from:venmo.com subject:\"paid you $\" after:" + data.lastDate,
    }, async (err, res) => {
        if(err) {
            throw err;
        }

        // Update lastDate
        await setData("venmo/tokens/" + userId + "/lastDate", getTodayDateString());

        // If there are messages, process them
        if(res.data.resultSizeEstimate > 0) {
            // Get all messages
            const messages = res.data.messages;

            // Update lastId
            await setData("venmo/tokens/" + userId + "/lastId", messages[0].id);

            // Process each message
            for(let i = 0; i < messages.length; i++) {
                let message = messages[i];

                // Check if this message has already been read
                if(message.id === data.lastId) {
                    // We have read all new messages, break
                    break;
                }

                // Get the message
                gmail.users.messages.get({
                    id: message.id,
                    userId: 'me',
                }, async (err, res) => {
                    if(err) {
                        throw err;
                    }

                    // Create new email object
                    let newEmailObject = {};

                    // Find the transaction code that was used
                    const regex = new RegExp(data.settings.identifier + " *[0-9]{6}", "g");
                    let transactionCode = res.data.snippet.match(regex);
                    newEmailObject.code = transactionCode === null ? "" : parseInt(transactionCode[0].substring(transactionCode[0].length - 6));

                    // Find the name and the amount of the Venmo transaction
                    let headers = res.data.payload.headers;
                    for(let j = 0; j < headers.length; j++) {
                        if(headers[j].name === "Subject") {
                            newEmailObject.name = headers[j].value.substring(0, headers[j].value.indexOf(" paid you $"));
                            newEmailObject.amount = parseFloat(headers[j].value.substring(headers[j].value.indexOf("$") + 1));
                            break;
                        }
                    }

                    console.log(newEmailObject);

                    // Add new email object to database
                    let emailId = res.data.id;
                    await setData("venmo/tokens/" + userId + "/emails/" + emailId, newEmailObject);
                });
            }
        }
    });
}
