import config from "../../../utils/config";
const vision = require('@google-cloud/vision');

const serviceAccount = JSON.parse(config.FIREBASE_SERVICE_ACCT);

export default async function(req, res) {
    const client = new vision.ImageAnnotatorClient({
        credentials: serviceAccount
    });

    const url = req.query.url;
    const [result] = await client.labelDetection(url);
    const labels = result.labelAnnotations;

    let output = [];
    labels.forEach(label => output.push(label.description));

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(output));
}
