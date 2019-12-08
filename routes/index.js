var express = require('express');
var router = express.Router();
const helper = require("../helper");
const steem = require("steem");

const coinbase = require('coinbase-commerce-node');
const config = require("../config");
const CoinbaseClient = coinbase.Client;

CoinbaseClient.init(config.coinbase.apiKey);

router.get("/widget.html", async (req, res) => {
    let query = config.widget.defaults;

    res.render("widget", {query, type: undefined});
});

router.post('/checkout/crypto/create/:id', (async (req, res) => {

    var Charge = coinbase.resources.Charge;
    Charge.retrieve(req.params.id, async (error, response) => {

        try {
            let payment = response.payments[0];
            if (payment.value.local.amount === config.widget.price.amount) {
                if (payment.status === "CONFIRMED") {
                    steem.api.getAccounts([response.metadata.username], async (err, accounts) => {
                        if (accounts.length > 0) {
                            return res.json({
                                paid: true,
                                confirmed: payment.block.confirmations,
                                created: false,
                                error: 'account_exist'
                            });
                        } else {
                            let data = await helper.createAccount(response.metadata.username, response.metadata);
                            if (config.widget.delegation.sp > 0) {
                                helper.doInitialDelegation(response.metadata.username, config.widget.delegation.sp, null, null);
                            }
                            console.log("---------- ACCOUNT / CHARGE / PAYMENT");
                            res.json({
                                paid: true,
                                confirmed: payment.block.confirmations,
                                created: true
                            });
                        }
                    })
                } else {
                    return res.json({
                        paid: true,
                        confirmed: payment.block.confirmations,
                        created: false
                    })
                }
            } else {
                return res.json({
                    paid: false,
                    confirmed: 0,
                    created: false,
                    error: "invalid_amount"
                })
            }

        } catch (e) {
            console.log(">> CRYPTO CHECKOUT ERROR:");
            console.log(e);
            res.status(500).json({
                status: "error",
                message: "Internal Server Error"
            })
        }
    })

}))

router.get('/checkout/crypto/verify/:id', async (req, res) => {
    var Charge = coinbase.resources.Charge;
    Charge.retrieve(req.params.id, function (error, response) {
        console.log(response)
        if (response.payments.length === 0) {
            return res.json({
                paid: false,
                confirmed: 0,
                created: false,
                error: null,
                currency: null
            })
        }


        let payment = response.payments[0];
        if (payment.value.local.amount === config.widget.price.amount) {
            if (payment.status === "CONFIRMED") {
                steem.api.getAccounts([response.metadata.username], async (err, accounts) => {
                    if (accounts.length > 0) {
                        return res.json({
                            paid: true,
                            confirmed: payment.block.confirmations,
                            created: false,
                            error: 'account_exist'
                        });
                    } else {
                        res.json({
                            paid: true,
                            confirmed: payment.block.confirmations,
                            created: false
                        });
                    }
                })
            } else {
                return res.json({
                    paid: true,
                    confirmed: payment.block.confirmations,
                    created: false
                })
            }
        } else {
            return res.json({
                paid: false,
                confirmed: 0,
                created: false,
                error: "invalid_amount"
            })
        }

    });
});

router.post('/checkout/crypto/request', async (req, res) => {
    let {username = undefined, keys = undefined} = req.body;
    var Charge = coinbase.resources.Charge;

    keys.username = username;

    let chargeData = {
        'name': 'Steem Account',
        'description': username,
        'local_price': config.widget.price,
        'metadata': keys,
        'pricing_type': 'fixed_price'

    };
    Charge.create(chargeData, function (error, response) {
        console.log(error);
        console.log(response);
        res.json(response)
    });
});

router.get('*', (req, res) => {
    res.redirect("/widget.html")
});


module.exports = router;
