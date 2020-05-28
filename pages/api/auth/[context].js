import { startAuth } from "../../../utils/oauth";

export default async function(req, res) {
    const { context } = req.query;
    return startAuth(context, req, res);
}
