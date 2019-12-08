let steem = require("steem");
const fetch = require("node-fetch");
const config = require("./config")

async function doDelegation(account, sp, reason, order) {

    let session = await (await fetch('https://blocktrades.us/api/v2/sessions', {method: 'POST'})).json();

    let priceData = await (await fetch('https://blocktrades.us/api/v2/estimate-input-amount?outputAmount=' + sp + '&inputCoinType=steem&outputCoinType=delegated_steem_power_90_days')).json()

    let data = {
        "inputCoinType": "steem",
        "outputCoinType": "delegated_steem_power_30_days",
        "outputAddress": account,
        "desiredOutputAmount": sp,
        "outputMemo": "Thanks for your purchase of Steem with Steem.Ninja - The easy way to buy Steem accounts with your credit card",
        "affiliateId": "55f86634-234e-49ec-bdc4-d18721d7501b",
        "refundAddress": config.steem.creator,
        "sessionToken": session.token
    };

    let trade = await (await fetch('https://blocktrades.us/api/v2/simple-api/initiate-trade', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })).json();


    return new Promise((resolve, reject) => {
        steem.broadcast.transfer(config.steem.creatorActiveKey, config.steem.creator, trade.inputAddress, priceData.inputAmount + " " + priceData.inputCoinType.toUpperCase(), trade.inputMemo, function (err, result) {
            if (reason !== null && reason !== undefined) {
                console.log("---------- " + reason);
            } else {
                console.log("---------- DELEGATE SP");
            }

            if (order !== null && order !== undefined) {
                order.delegationTX = result.id;
                order.save();
            }

            console.log({
                input: priceData,
                trade: trade,
                result: {
                    error: err,
                    result
                }
            });
            resolve({
                input: priceData,
                trade: trade,
                result: {
                    error: err,
                    result
                }
            })
        });
    })


}

function getNewCredentials2(username, publicKeys) {

    let owner = {
        weight_threshold: 1,
        account_auths: [],
        key_auths: [[publicKeys.owner, 1]]
    };
    let active = {
        weight_threshold: 1,
        account_auths: [],
        key_auths: [[publicKeys.active, 1]]
    };
    let posting = {
        weight_threshold: 1,
        account_auths: [],
        key_auths: [[publicKeys.posting, 1]]
    };

    return {username, keys: {owner, active, posting, memo: publicKeys.memo}}
}

async function createAccount(username, password) {

    let credentials = getNewCredentials2(username, password);

    if (!credentials.keys) {
        console.log(">> ", username, " >> no credentials:", JSON.stringify(credentials))
        return Promise.reject({error: "credential_error", credentials, username});
    }

    let exist = await accountExist(username);

    if (exist) {
        return Promise.reject({error: "username_exist", credentials, username});
    } else {
        return new Promise((resolve, reject) => {
            const accountData = {
                creator: config.steem.creator,
                new_account_name: username,
                owner: credentials.keys.owner,
                active: credentials.keys.active,
                posting: credentials.keys.posting,
                memo_key: credentials.keys.memo,
                json_metadata: JSON.stringify({
                    "profile": {
                        "about": config.steem.profile.about,
                        "cover_image": config.steem.profile.cover_image(username),
                        "profile_image":  config.steem.profile.profile_image(username)
                    }
                })
            };

            const tx = ['create_claimed_account', accountData];

            steem.broadcast.send({operations: [tx]}, {active: config.steem.creatorActiveKey}, (err, result) => {
                if (err) {
                    console.log(">> ACCOUNT CREATION ERROR:");
                    console.log(err)
                    reject(err.message)
                } else {
                    resolve(result);
                }
            })
        })
    }
}

async function accountExist(username) {
    return new Promise((resolve, reject) => {
        steem.api.getAccounts([username], (err, result) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(result.length !== 0);
            }
        })

    })
}


module.exports = {
    createAccount,
    doInitialDelegation: doDelegation,
}