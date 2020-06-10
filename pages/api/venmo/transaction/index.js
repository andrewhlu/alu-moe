import config from "../../../../utils/config";
import { getData, setData } from "../../../../utils/firebase";
import { getTodayDateString } from "../../../../utils/venmo";
import { google } from "googleapis";
import absoluteUrl from 'next-absolute-url';

async function getNewEmails(req, userId) {
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
                    let transactionCode = res.data.snippet.toUpperCase().match(regex);
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

async function getTransaction(userId, transactionCode) {
    const data = await getData("venmo/tokens/" + userId);

    let transaction = data.transactions[transactionCode];
    if(transaction === undefined) {
        throw "Invalid transaction code";
    }

    const emails = data.emails;
    if(emails !== undefined && !transaction.completed) {
        // There are unclaimed emails, search through them
        let ids = Object.keys(emails);

        if(transaction.emails === undefined) {
            transaction.emails = {};
        }

        ids.forEach(async (id) => {
            let email = emails[id];
            if(emails[id].code === parseInt(transactionCode)) {
                // This email belongs to this transaction, store it
                transaction.emails[id] = email;

                // Removve it from the main email object
                await setData("venmo/tokens/" + userId + "/emails/" + id, null);
            }
        });

        // Calculate new amount and number of tickets
        ids = Object.keys(transaction.emails);
        transaction.amount = 0;
        for(let i = 0; i < ids.length; i++) {
            transaction.amount += transaction.emails[ids[i]].amount;
        }
        
        // Quick fix to avoid number precision errors
        transaction.tickets = parseInt(Math.round(transaction.amount * 100 / data.settings.costPerTicket) / 100);

        // Update transaction in database
        await setData("venmo/tokens/" + userId + "/transactions/" + transactionCode, transaction);
    }

    return transaction;
}

export default async function(req, res) {
    const accessCode = req.query.code;
    const transactionCode = req.query.transaction;
    const body = req.body;

    try {
        if(accessCode === undefined || accessCode === "") {
            throw "No access code was provided";
        }

        if(transactionCode === undefined || transactionCode == "") {
            throw "No transaction code was provided";
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

                // Get new transaction object after parsing emails
                const transaction = await getTransaction(userId, transactionCode);

                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({
                    success: true,
                    transaction: transaction,
                }));

                break;
            }
            case "POST": {
                // Process all new emails in the database
                await getNewEmails(req, userId);

                // Get new transaction object after parsing emails
                const transaction = await getTransaction(userId, transactionCode);

                if(body.completed === true) {
                    if(transaction.completed) {
                        throw "Transaction already completed";
                    }
                    else {
                        await setData("venmo/tokens/" + userId + "/transactions/" + transactionCode + "/completed", true);
                        transaction.completed = true;
                    }
                }
                else {
                    throw "Invalid POST body";
                }

                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({
                    success: true,
                    transaction: transaction,
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
