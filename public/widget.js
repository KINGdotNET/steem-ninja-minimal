(() => {
        window.SteemNinja = window.SteemNinja || {};
        window.SteemNinja.params = window.SteemNinja.params || {};
        window.SteemNinja.origin = window.parent || null;
        window.SteemNinja.close = () => {
            if (window.SteemNinja.origin !== null && window.location !== window.parent.location) {
                window.SteemNinja.origin.postMessage("ninja.close", '*');
            } else {
                if (window.SteemNinja.params.referrer !== undefined) {
                    window.location.href = 'https://steemit.com/@' + window.SteemNinja.params.referrer
                } else {
                    window.location.href = 'https://steemit.com/@steem.ninja'
                }
            }
        };

        window.SteemNinja.params.voucherOnly = false;

        window.SteemNinja.origin.postMessage("ninja.loaded", '*');

        document.onkeydown = function (evt) {
            evt = evt || window.event;
            var isEscape = false;
            if ("key" in evt) {
                isEscape = (evt.key === "Escape" || evt.key === "Esc");
            } else {
                isEscape = (evt.keyCode === 27);
            }
            if (isEscape) {
                window.SteemNinja.close();
            }
        };

        window.SteemNinja.AccountUtils = {
            createCredentials: username => {
                let password = steem.formatter.createSuggestedPassword();
                let keys = steem.auth.getPrivateKeys(username, password, ["owner", "active", "posting", "memo"]);
                keys.name = username;
                keys.password = password;
                return keys;
            },
            createPasswordBackup: () => {
                const username = $('#username').val().trim().toLowerCase();
                let credentials = window.SteemNinja.AccountUtils.createCredentials(username);
                if (window.SteemNinja.credentials) {
                    credentials = window.SteemNinja.credentials;
                } else {
                    window.SteemNinja.credentials = credentials;
                }
                let data = [];

                data.push("Steem Account Name: " + credentials.name);
                data.push("Owner Key: " + credentials.owner);
                data.push("");
                data.push("Active Key: " + credentials.active);
                data.push("");
                data.push("Posting Key: " + credentials.posting);
                data.push("");
                data.push("Backup Password: " + credentials.password);
                data = data.join("\n");

                window.SteemNinja.credentialsBlob = data;

                return credentials;
            }
        };

        $('.step').first().css("display", "block");
        const modalContainer = $('#source-modal');
        const username = $('#username');
        modalContainer.on('hidden.bs.modal', function () {
            window.SteemNinja.close();
        });
        modalContainer.modal({
            backdrop: false
        });

        const usernameError = $('#username_error');
        const usernameSuccess = $('#username_success');
        const stepPassword = $('.step_backup');

        function validateAccountName(value) {
            let i, label, len, suffix;
            suffix = "Account name should ";
            if (!value) return suffix + "not be empty.";
            let length = value.length;
            if (length < 3) return suffix + "be longer.";
            if (length > 16) return suffix + "be shorter.";
            if (/\./.test(value)) suffix = "Each account segment should ";
            let ref = value.split(".");
            for (i = 0, len = ref.length; i < len; i++) {
                label = ref[i];
                if (!/^[a-z]/.test(label)) return suffix + "start with a letter.";
                if (!/^[a-z0-9-]*$/.test(label))
                    return suffix + "have only letters, digits, or dashes.";
                if (/--/.test(label)) return suffix + "have only one dash in a row.";
                if (!/[a-z0-9]$/.test(label))
                    return suffix + "end with a letter or digit.";
                if (!(label.length >= 3)) return suffix + "be longer";
            }
            return null;
        }

        window.SteemNinja.validateUsername = () => {
            let usernameVal = username.val().trim().toLowerCase();
            let validationResult = validateAccountName(usernameVal);
            if (validationResult === null) {
                steem.api.getAccountsAsync([usernameVal]).then(accounts => {
                    if (accounts.length === 0) {

                        usernameError.text("");
                        usernameSuccess.text("");
                        if (window.SteemNinja.params.voucherOnly === true) {
                            $('#delegationNotice').removeClass("d-none")
                            $('#delegationLink').attr("href","https://app.steemconnect.com/sign/delegate-vesting-shares?delegator=&delegatee="+usernameVal+"&vesting_shares=15%20SP")
                        }
                        window.SteemNinja.navigate('backup');
                        window.SteemNinja.backupPassword()
                    } else {
                        usernameError.text("Meh. This username is already taken.");
                        usernameSuccess.text("");
                    }
                }).catch(error => {
                    usernameSuccess.text("");
                    usernameError.text("Ops. We could not check the acount availability. Please try again later.")
                });
            } else {
                usernameError.text(validationResult);
            }
        };

        const backupCheckbox = $('#dl_check');

        window.SteemNinja.backupPassword = () => {
            window.SteemNinja.AccountUtils.createPasswordBackup();
            $('#credentials').text(window.SteemNinja.credentialsBlob);

            var text = $('#credentials').val(),
                matches = text.match(/\n/g),
                breaks = matches ? matches.length : 2;

            $('#credentials').attr('rows',breaks *2 + 2);
            $('#credential-modal').modal({backdrop: "static", keyboard: false});
        };

        $('#tos').on("change", () => {
           if ($('#tos').prop("checked") === false) {
               $('#curtain').removeClass("d-none")
           }  else {
               $('#curtain').addClass("d-none")
           }
        });
        backupCheckbox.on('change', () => {
            if (backupCheckbox.prop("checked") === false) {
                $('#credentials_footer').addClass("disabled").attr("disabled", "disabled");
            } else {
                $('#credentials_footer').removeClass("disabled").removeAttr("disabled");

            }
        });
        const dots = $('#dots');
        setInterval(() => {
            const text = dots.text();
            if (text.length >= 3) {
                dots.text("")
            } else {
                dots.text(".".repeat(text.length + 1))
            }
        }, 1000);

        function popupCenter(url, title, w, h, windowID) {
            // Fixes dual-screen position                         Most browsers      Firefox
            var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
            var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

            var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
            var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

            var left = ((width / 2) - (w / 2)) + dualScreenLeft;
            var top = ((height / 2) - (h / 2)) + dualScreenTop;
            var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
            window.SteemNinja.params[windowID] = newWindow;
            if (window.focus) {
                newWindow.focus();
            }

            return newWindow;
        }

        window.SteemNinja.awaitCryptoPaymentInterval = null;
        window.SteemNinja.awaitCryptoPayment = async () => {
            fetch('/checkout/crypto/verify/' + window.SteemNinja.params.coinbaseCode )
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {

                    if (data.paid === false && data.confirmed < 8 && data.created === false) {
                        $('#loading_text').text("Waiting for Payment")

                    }

                    if (data.paid === true && data.confirmed < 8 && data.created === false) {
                        $('#loading_text').text("Verifying payment: " + data.confirmed + "/8");
                    }
                    if (data.paid === true && data.confirmed >= 8 && data.created === false) {
                        $('#loading_text').text("Creating account");
                        clearInterval(window.SteemNinja.awaitCryptoPaymentInterval);
                        window.SteemNinja.params.coinbase.close();
                        $.ajax({
                            type: 'post',
                            url: '/checkout/crypto/create/' + SteemNinja.params.coinbaseCode,
                            success: (res) => {
                                if (res.created === true) {
                                    SteemNinja.navigate("finish")
                                } else {
                                    SteemNinja.navigate("failure")
                                }
                            }
                        })
                    }
                });
        };

        window.SteemNinja.cryptoCheckout = () => {
            let payload = {
                keys: {
                    owner: window.SteemNinja.credentials.ownerPubkey,
                    active: window.SteemNinja.credentials.activePubkey,
                    posting: window.SteemNinja.credentials.postingPubkey,
                    memo: window.SteemNinja.credentials.memoPubkey
                },
                username: window.SteemNinja.credentials.name,
            };
            $.ajax({
                type: 'post',
                contentType: "application/json",
                data: JSON.stringify(payload),
                url: '/checkout/crypto/request',
                success: (res) => {
                    console.log(res)
                    popupCenter(res.hosted_url, 'Steem.Ninja Checkout', 500, 600, "coinbase");
                    window.SteemNinja.params.coinbaseCode = res.code;
                    window.SteemNinja.awaitCryptoPaymentInterval = setInterval(window.SteemNinja.awaitCryptoPayment, 2500);
                    $('#loading_text').text("Waiting for Payment");
                    SteemNinja.navigate("loading")
                },
                error: () => {
                    SteemNinja.navigate("failure")
                    clearInterval(window.SteemNinja.awaitCryptoPaymentInterval);
                    window.SteemNinja.params.coinbase.close();
                }
            })
        };

        window.SteemNinja.navigate = (step) => {
            $('.step').css("display", "none");
            $('.step_' + step).css("display", "block");
        }
    }
)();