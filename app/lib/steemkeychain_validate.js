// commit https://github.com/MattyIce/steem-keychain/commit/e5fb63a4a66dd3c5ad1159f86cd5b5c1c38d13f2

function validate(req) {
    return req != null && req != undefined && req.type != undefined && req.type != null &&
        ((req.type == "decode" && isFilled(req.username) && isFilled(req.message) && req.message[0] == "#" && isFilledKey(req.method)) ||
            (req.type == "signBuffer" && isFilled(req.username) && isFilled(req.message) && isFilledKey(req.method)) ||
            (req.type == "vote" && isFilled(req.username) && isFilledWeight(req.weight) && isFilled(req.permlink) && isFilled(req.author)) ||
            (req.type == "post" && isFilled(req.username) && isFilled(req.body) &&
                ( (isFilled(req.title) && isFilledOrEmpty(req.permlink) && !isFilled(req.parent_username) && !isFilled(req.parent_perm) && isFilled(req.json_metadata)) ||
                  (!isFilled(req.title) && isFilledOrEmpty(req.permlink) && isFilled(req.parent_username) && isFilled(req.parent_perm) && isFilledOrEmpty(req.json_metadata))
                ) && isCustomOptions(req)) ||
            (req.type == "custom" && isFilled(req.username) && isFilled(req.json) && isFilled(req.id)) ||
            (req.type == "addAccountAuthority" && isFilled(req.authorizedUsername) && isFilled(req.role) && isFilled(req.weight)) ||
            (req.type == "removeAccountAuthority" && isFilled(req.authorizedUsername) && isFilled(req.role)) ||
            (req.type == "broadcast" && isFilled(req.operations) && isFilled(req.method)) ||
            (req.type == "signedCall" && isFilled(req.method) && isFilled(req.params) && isFilled(req.typeWif)) ||
            (req.type == "witnessVote" && isFilled(req.username) && isFilled(req.witness) && isBoolean(req.vote)) ||
            (req.type == "delegation" && isFilled(req.username) && isFilled(req.delegatee) && isFilledAmtSP(req) && isFilledDelegationMethod(req.unit)) ||
            (req.type == "transfer" && isFilledAmt(req.amount) && isFilled(req.to) && isFilledCurrency(req.currency) && hasTransferInfo(req)) ||
            (req.type == "sendToken" && isFilledAmt(req.amount) && isFilled(req.to) && isFilled(req.currency))||
            (req.type == "powerUp" && isFilled(req.username)&& isFilledAmt(req.steem) && isFilled(req.recipient))||
            (req.type == "powerDown" && isFilled(req.username)&& (isFilledAmt(req.steem_power)||req.steem_power=="0.000"))
        );
}

// Functions used to check the incoming data

function hasTransferInfo(req) {
    if (req.enforce)
        return isFilled(req.username);
    else if (isFilled(req.memo) && req.memo[0] == "#")
        return isFilled(req.username);
    else
        return true;
}

function isFilled(obj) {
    return obj != undefined && obj != null && obj != "";
}

function isBoolean(obj) {
    return typeof obj == typeof true;
}

function isFilledOrEmpty(obj) {
    return (obj != undefined && obj != null) || obj == "";
}

function isFilledDelegationMethod(obj) {
    return obj == "VESTS" || obj == "SP";
}

function isFilledJSON(obj) {
    try {
        return isFilled(obj) && JSON.parse(obj).hasOwnProperty("requiredAuths") && JSON.parse(obj).hasOwnProperty("requiredPostingAuths") && JSON.parse(obj).hasOwnProperty("id") && JSON.parse(obj).hasOwnProperty("json");
    } catch (e) {
        return false;
    }
}

function isFilledAmt(obj) {
    return isFilled(obj) && !isNaN(obj) && obj > 0 && countDecimals(obj) == 3;
}

function isFilledAmtSP(obj) {
    return isFilled(obj.amount) && !isNaN(obj.amount) && ((countDecimals(obj.amount) == 3 && obj.unit == "SP") || (countDecimals(obj.amount) == 6 && obj.unit == "VESTS"));
}

function isFilledWeight(obj) {
    return isFilled(obj) && !isNaN(obj) && obj >= -10000 && obj <= 10000 && countDecimals(obj) == 0;
}

function isFilledCurrency(obj) {
    return isFilled(obj) && (obj == "STEEM" || obj == "SBD");
}

function isFilledKey(obj) {
    return isFilled(obj) && (obj == "Memo" || obj == "Active" || obj == "Posting");
}

function isCustomOptions(obj) {
    if (obj.comment_options == "")
        return true;
    var comment_options = JSON.parse(obj.comment_options);
    if (comment_options.author != obj.username || comment_options.permlink != obj.permlink)
        return false;
    return comment_options.hasOwnProperty("max_accepted_payout") &&
        comment_options.hasOwnProperty("percent_steem_dollars") &&
        comment_options.hasOwnProperty("allow_votes") &&
        comment_options.hasOwnProperty("allow_curation_rewards") &&
        comment_options.hasOwnProperty("extensions");
}

function countDecimals(nb) {
    return nb.toString().split(".")[1] == undefined ? 0 : (nb.toString().split(".")[1].length || 0);
}

module.exports = validate;
