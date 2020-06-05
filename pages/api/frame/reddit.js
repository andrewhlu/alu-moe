import { fetch } from "../../../utils/fetch";

async function getSubredditImage(subreddit) {
    if(subreddit.substring(0, 2) !== "r/") {
        subreddit = "r/" + subreddit;
    }

    const response = await fetch("https://www.reddit.com/" + subreddit + "/random.json?sort=top&t=week&limit=1");

    if(response !== "" && response[0].data.children[0].data.url) {
        let url = response[0].data.children[0].data.url;
        let title = response[0].data.children[0].data.title;
        let author = response[0].data.children[0].data.author;

        // URL must be from "i.redd.it" domain in order for us to get direct image URL
        if(url.includes("i.redd.it")) {
            return {
                success: true, 
                url: url,
                title: title,
                author: author
            }
        }
        else {
            return getSubredditImage(subreddit);
        }
    }
    else {
        return {
            success: false, 
            error: "The request to Reddit failed!"
        };
    }
}

export default async function (req, res) {
    if(req.query.subreddit && req.query.subreddit !== "") {
        let result = await getSubredditImage(req.query.subreddit);

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
    else {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(
            JSON.stringify({
                success: false,
                error: "No subreddit was provided"
            })
        );
    }
}