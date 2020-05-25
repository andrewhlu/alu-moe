import { startAuth } from "../../../../utils/oauth";

export default async function(req, res) {
    return startAuth("sonos", res);
}
