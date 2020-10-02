import { fetchText } from "../../../utils/fetch";

import Cors from 'cors'
import initMiddleware from '../../../lib/init-middleware'

// Initialize the cors middleware
const cors = initMiddleware(
    // You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
    Cors({
        // Only allow requests with GET, POST and OPTIONS
        methods: ['GET', 'POST', 'OPTIONS'],
    })
)

async function getPhotoBlockImage() {
    const response = await fetchText("https://gauchospace.ucsb.edu/courses/login/index.php");

    let url = response.substr(response.indexOf("https://gauchospace.ucsb.edu/courses/blocks/photo/image.php"));
    url = url.substring(0, url.indexOf("&amp;thumb=1")).replace(/&amp;/g, "&");

    let desc = response.substr(response.indexOf("<div class=\"image-desc\">") + 24);
    desc = desc.substring(0, desc.indexOf("</div>")).replace(/\n\s+/g, "").replace(":", ": ");

    return {
        success: true,
        url: url,
        description: desc
    };
}

export default async function (req, res) {
    // Run cors
    await cors(req, res)

    let result = await getPhotoBlockImage();

    if(result.success) {
        res.statusCode = 200;
    }
    else {
        res.statusCode = 500;
    }

    res.setHeader("Content-Type", "application/json");
    res.end(
        JSON.stringify(result)
    );
}