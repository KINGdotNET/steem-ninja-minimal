const config = {
    database: {
        host: "localhost",
        database: "steemninja"
    },
    widget: {
        defaults: {
            name: "Steem Ninja",
            image: "https://steemitimages.com/u/steem.ninja/avatar",
            title: "Steem Account Creation",
            voucher: "null",
            terms_of_service: "",
            privacy_policy:""
        },
        price: {
            amount: '5.00',
            currency: 'USD'
        },
        delegation: {
            sp: 0 //Do you want to delegate to people? If you chose more than 0 the software uses blocktrades to purchase delegation.
        }
    },
    coinbase: {
        apiKey: "" //Disable all currencies but ETH in Coinbase Commerce. Only ETH is integrated into Steem.Ninja
    },
    steem: {
        creator: "", //the account that creates the new accounts
        creatorActiveKey: "", //that accounts active key
        profile: { //pre fill the new accounts profile
            about: "",
            cover_image: (username) => {
                return "https://cdn.steem.ninja/default_cover.jpg"
            },
            profile_image: (username) => {
                return "https://robohash.org/" + username + ".png"
            }
        }
    }
};

module.exports = config;