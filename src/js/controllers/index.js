'use strict';

var async = require('async');
var constants = require('intervaluecore/constants.js');
var mutex = require('intervaluecore/mutex.js');
var eventBus = require('intervaluecore/event_bus.js');
var objectHash = require('intervaluecore/object_hash.js');
var ecdsaSig = require('intervaluecore/signature.js');
var breadcrumbs = require('intervaluecore/breadcrumbs.js');
var Bitcore = require('bitcore-lib');
var EventEmitter = require('events').EventEmitter;

angular.module('copayApp.controllers').controller('indexController', function ($rootScope, $scope, $log, $filter, $timeout, lodash, go, profileService, configService, isCordova, storageService, addressService, gettext, gettextCatalog, amMoment, nodeWebkit, addonManager, txFormatService, uxLanguage,uxCurrency, $state, isMobile, addressbookService, notification, animationService, $modal, bwcService, backButton, pushNotificationsService, aliasValidationService) {
    breadcrumbs.add('index.js');
    var self = this;
    self.BLACKBYTES_ASSET = constants.BLACKBYTES_ASSET;
    self.isCordova = isCordova;
    self.isSafari = isMobile.Safari();
    self.onGoingProcess = {};
    self.historyShowLimit = 10;
    self.updatingTxHistory = {};
    self.bSwipeSuspended = false;
    self.arrBalances = [];
    self.assetIndex = 0;
    self.$state = $state;
    self.usePushNotifications = isCordova && !isMobile.Windows();
    self.showshadow= false;
    self.showshadow100= false;
    self.verificationQRCode = '';
    self.signatureAddr = '';
    self.shadowstep = 'hot1';
    self.needsBackupa = false;
    self.backwallet = false;
    self.backhome = false;
    self.backwaname = false;
    self.changePD = false;
    self.shownewsloading = false;
    self.showquicksloading = false;
    self.showcoinloading = false;
    self.newslist = '';
    self.coinlist = '';
    self.coininvelist = '';
    self.quicklist = [];
    self.quicklistshow = '';
    self.newslists = [];
    self.quicklists = {};
    self.coinlists = [];
    self.newspage = 1;
    self.quickpage = 1;
    self.coinpage = 1;
    self.shownonews = false;
    self.shownoquick = false;
    self.shownocoin = false;
    self.shownewstab = '';
    self.quickscrolltop = 0;
    self.quickdatanow = '';
    self.currentfixDate = null;
    //self.showdollar = true;
    self.invedollar = 1;
    self.invermb = 1;
    self.from_stables = 0;
    self.online = true;
    self.layershow = false;
    self.progressing = false;
    self.layershowmsg = '';
    function updatePublicKeyRing(walletClient, onDone) {
        var walletDefinedByKeys = require('intervaluecore/wallet_defined_by_keys.js');
        walletDefinedByKeys.readCosigners(walletClient.credentials.walletId, function (arrCosigners) {
            var arrApprovedDevices = arrCosigners.
            filter(function (cosigner) { return cosigner.approval_date; }).
            map(function (cosigner) { return cosigner.device_address; });
            console.log("approved devices: " + arrApprovedDevices.join(", "));
            walletClient.credentials.addPublicKeyRing(arrApprovedDevices);

            // save it to profile
            var credentialsIndex = lodash.findIndex(profileService.profile.credentials, { walletId: walletClient.credentials.walletId });
            if (credentialsIndex < 0)
                throw Error("failed to find our credentials in profile");
            profileService.profile.credentials[credentialsIndex] = JSON.parse(walletClient.export());
            console.log("saving profile: " + JSON.stringify(profileService.profile));
            storageService.storeProfile(profileService.profile, function () {
                if (onDone)
                    onDone();
            });
        });
    }


    function sendBugReport(error_message, error_object) {
        var conf = require('intervaluecore/conf.js');
        var network = require('intervaluecore/network.js');
        var bug_sink_url = conf.WS_PROTOCOL + (conf.bug_sink_url || configService.getSync().hub);
        network.findOutboundPeerOrConnect(bug_sink_url, function (err, ws) {
            if (err)
                return;
            breadcrumbs.add('bugreport');
            var description = error_object.stack || JSON.stringify(error_object, null, '\t');
            if (error_object.bIgnore)
                description += "\n(ignored)";
            description += "\n\nBreadcrumbs:\n" + breadcrumbs.get().join("\n") + "\n\n";
            description += "UA: " + navigator.userAgent + "\n";
            description += "Language: " + (navigator.userLanguage || navigator.language) + "\n";
            description += "Program: " + conf.program + ' ' + conf.program_version + ' ' + (conf.bLight ? 'light' : 'full') + " #" + window.commitHash + "\n";

            network.sendJustsaying(ws, 'bugreport', { message: error_message, exception: description });
        });
    }

    self.sendBugReport = sendBugReport;

    // if (isCordova && constants.version === '1.0') {
    //     var db = require('intervaluecore/db.js');
    //     db.query("SELECT 1 FROM units WHERE version!=? LIMIT 1", [constants.version], function (rows) {
    //         if (rows.length > 0) {
    //             self.showErrorPopup("Looks like you have testnet data.  Please remove the app and reinstall.", function () {
    //                 if (navigator && navigator.app) // android
    //                     navigator.app.exitApp();
    //                 // ios doesn't exit
    //             });
    //         }
    //     });
    // }

    eventBus.on('nonfatal_error', function (error_message, error_object) {
        console.log('nonfatal error stack', error_object.stack);
        error_object.bIgnore = true;
        sendBugReport(error_message, error_object);
    });

    eventBus.on('uncaught_error', function (error_message, error_object) {
        if (error_message.indexOf('ECONNREFUSED') >= 0 || error_message.indexOf('host is unreachable') >= 0) {
            $rootScope.$emit('Local/ShowAlert', "Error connecting to TOR", 'fi-alert', function () {
                go.path('preferencesGlobal.preferencesTor');
            });
            return;
        }
        if (error_message.indexOf('ttl expired') >= 0 || error_message.indexOf('general SOCKS server failure') >= 0) // TOR error after wakeup from sleep
            return;
        console.log('stack', error_object.stack);
        sendBugReport(error_message, error_object);
        if (error_object && error_object.bIgnore)
            return;
        self.showErrorPopup(error_message, function () {
            var db = require('intervaluecore/db.js');
            db.close();
            if (self.isCordova && navigator && navigator.app) // android
                navigator.app.exitApp();
            else if (process.exit) // nwjs
                process.exit();
            // ios doesn't exit
        });
        if (isCordova) wallet.showCompleteClient();
    });

    function readLastDateString(cb) {
        var conf = require('intervaluecore/conf.js');
        if (conf.storage !== 'sqlite')
            return cb();
        var db = require('intervaluecore/db.js');
        db.query(
            "SELECT int_value FROM unit_authors JOIN data_feeds USING(unit) \n\
                  WHERE address=? AND feed_name='timestamp' \n\
                  ORDER BY unit_authors.rowid DESC LIMIT 1",
            [configService.TIMESTAMPER_ADDRESS],
            function (rows) {
                if (rows.length === 0)
                    return cb();
                var ts = rows[0].int_value;
                cb('at ' + $filter('date')(ts, 'short'));
            }
        );
    }

    function readSyncPercent(cb) {
        var db = require('intervaluecore/db.js');
        db.query("SELECT COUNT(1) AS count_left FROM catchup_chain_balls", function (rows) {
            var count_left = rows[0].count_left;
            if (count_left === 0)
                return cb("0%");
            if (catchup_balls_at_start === -1)
                catchup_balls_at_start = count_left;
            var percent = ((catchup_balls_at_start - count_left) / catchup_balls_at_start * 100).toFixed(3);
            cb(percent + '%');
        });
    }

    function readSyncProgress(cb) {
        readLastDateString(function (strProgress) {
            strProgress ? cb(strProgress) : readSyncPercent(cb);
        });
    }

    function setSyncProgress() {
        readSyncProgress(function (strProgress) {
            self.syncProgress = strProgress;
            $timeout(function () {
                $rootScope.$apply();
            });
        });
    }

    eventBus.on('rates_updated', function () {
        $timeout(function () {
            $rootScope.$apply();
        });
    });
    eventBus.on('started_db_upgrade', function () {
        $timeout(function () {
            if (self.bUpgradingDb === undefined)
                self.bUpgradingDb = true;
            $rootScope.$apply();
        }, 100);
    });
    eventBus.on('finished_db_upgrade', function () {
        $timeout(function () {
            self.bUpgradingDb = false;
            $rootScope.$apply();
        });
    });

    var catchup_balls_at_start = -1;

    eventBus.on("confirm_on_other_devices", function () {
        $rootScope.$emit('Local/ShowAlert', "Transaction created.\nPlease approve it on the other devices.", 'fi-key', function () {
            go.walletHome();
        });
    });

    eventBus.on("refused_to_sign", function (device_address) {
        var device = require('intervaluecore/device.js');
        //todo delete
        // device.readCorrespondent(device_address, function (correspondent) {
        //     notification.success(gettextCatalog.getString('Refused'), correspondent.name + " refused to sign the transaction");
        // });
    });


    eventBus.on("new_my_transactions", function () {
        breadcrumbs.add('new_my_transactions');
        self.updateAll();
        self.updateTxHistory(3);
    });

    eventBus.on("my_transactions_became_stable", function () {
        breadcrumbs.add('my_transactions_became_stable');
        //self.updateAll();
        self.updateTxHistory(3);
    });

    eventBus.on("maybe_new_transactions", function () {
        breadcrumbs.add('maybe_new_transactions');
        self.updateAll();
        self.updateTxHistory(3);
    });

    eventBus.on("wallet_approved", function (walletId, device_address) {
        console.log("wallet_approved " + walletId + " by " + device_address);
        var client = profileService.walletClients[walletId];
        if (!client) // already deleted (maybe declined by another device) or not present yet
            return;
        var walletName = client.credentials.walletName;
        updatePublicKeyRing(client);
        var device = require('intervaluecore/device.js');
        //todo delete
        // device.readCorrespondent(device_address, function (correspondent) {
        //     notification.success(gettextCatalog.getString('Success'), "Wallet " + walletName + " approved by " + correspondent.name);
        // });
    });

    eventBus.on("wallet_declined", function (walletId, device_address) {
        var client = profileService.walletClients[walletId];
        if (!client) // already deleted (maybe declined by another device)
            return;
        var walletName = client.credentials.walletName;
        var device = require('intervaluecore/device.js');
        //todo delete
        // device.readCorrespondent(device_address, function (correspondent) {
        //     notification.info(gettextCatalog.getString('Declined'), "Wallet " + walletName + " declined by " + (correspondent ? correspondent.name : 'peer'));
        // });
        profileService.deleteWallet({ client: client }, function (err) {
            if (err)
                console.log(err);
        });
    });

    eventBus.on("wallet_completed", function (walletId) {
        console.log("wallet_completed " + walletId);
        var client = profileService.walletClients[walletId];
        if (!client) // impossible
            return;
        var walletName = client.credentials.walletName;
        updatePublicKeyRing(client, function () {
            if (!client.isComplete())
                throw Error("not complete");
            notification.success(gettextCatalog.getString('Success'), "Wallet " + walletName + " is ready");
            $rootScope.$emit('Local/WalletCompleted');
        });
    });


    // in arrOtherCosigners, 'other' is relative to the initiator
    eventBus.on("create_new_wallet", function (walletId, arrWalletDefinitionTemplate, arrDeviceAddresses, walletName, arrOtherCosigners, isSingleAddress) {
        var device = require('intervaluecore/device.js');
        var walletDefinedByKeys = require('intervaluecore/wallet_defined_by_keys.js');
        device.readCorrespondentsByDeviceAddresses(arrDeviceAddresses, function (arrCorrespondentInfos) {
            // my own address is not included in arrCorrespondentInfos because I'm not my correspondent
            var arrNames = arrCorrespondentInfos.map(function (correspondent) { return correspondent.name; });
            var name_list = arrNames.join(", ");
            var question = gettextCatalog.getString('Create new wallet ' + walletName + ' together with ' + name_list + ' ?');
            requestApproval(question, {
                ifYes: function () {
                    console.log("===== YES CLICKED")
                    var createNewWallet = function () {
                        walletDefinedByKeys.readNextAccount(function (account) {
                            var walletClient = bwcService.getClient();
                            if (!profileService.focusedClient.credentials.xPrivKey)
                                throw Error("no profileService.focusedClient.credentials.xPrivKeyin createNewWallet");
                            walletClient.seedFromExtendedPrivateKey(profileService.focusedClient.credentials.xPrivKey, account);
                            //walletClient.seedFromMnemonic(profileService.profile.mnemonic, {account: account});
                            walletDefinedByKeys.approveWallet(
                                walletId, walletClient.credentials.xPubKey, account, arrWalletDefinitionTemplate, arrOtherCosigners,
                                function () {
                                    walletClient.credentials.walletId = walletId;
                                    walletClient.credentials.network = 'livenet';
                                    var n = arrDeviceAddresses.length;
                                    var m = arrWalletDefinitionTemplate[1].required || n;
                                    walletClient.credentials.addWalletInfo(walletName, m, n);
                                    updatePublicKeyRing(walletClient);
                                    profileService._addWalletClient(walletClient, {}, function () {
                                        if (isSingleAddress) {
                                            profileService.setSingleAddressFlag(true);
                                        }
                                        console.log("switched to newly approved wallet " + walletId);
                                    });
                                }
                            );
                        });
                    };
                    if (profileService.focusedClient.credentials.xPrivKey)
                        createNewWallet();
                    else
                        profileService.insistUnlockFC(null, createNewWallet);
                },
                ifNo: function () {
                    console.log("===== NO CLICKED")
                    walletDefinedByKeys.cancelWallet(walletId, arrDeviceAddresses, arrOtherCosigners);
                }
            });
        });
    });

    // units that were already approved or rejected by user.
    // if there are more than one addresses to sign from, we won't pop up confirmation dialog for each address, instead we'll use the already obtained approval
    var assocChoicesByUnit = {};

    //todo delete
    // objAddress is local wallet address, top_address is the address that requested the signature,
    // it may be different from objAddress if it is a shared address
    // eventBus.on("signing_request", function (objAddress, top_address, objUnit, assocPrivatePayloads, from_address, signing_path) {
    //
    //     function createAndSendSignature() {
    //         var coin = "0";
    //         var path = "m/44'/" + coin + "'/" + objAddress.account + "'/" + objAddress.is_change + "/" + objAddress.address_index;
    //         console.log("path " + path);
    //         // focused client might be different from the wallet this signature is for, but it doesn't matter as we have a single key for all wallets
    //         if (profileService.focusedClient.isPrivKeyEncrypted()) {
    //             console.log("priv key is encrypted, will be back after password request");
    //             return profileService.insistUnlockFC(null, function () {
    //                 createAndSendSignature();
    //             });
    //         }
    //         var xPrivKey = new Bitcore.HDPrivateKey.fromString(profileService.focusedClient.credentials.xPrivKey);
    //         var privateKey = xPrivKey.derive(path).privateKey;
    //         console.log("priv key:", privateKey);
    //         //var privKeyBuf = privateKey.toBuffer();
    //         var privKeyBuf = privateKey.bn.toBuffer({ size: 32 }); // https://github.com/bitpay/bitcore-lib/issues/47
    //         console.log("priv key buf:", privKeyBuf);
    //         var buf_to_sign = objectHash.getUnitHashToSign(objUnit);
    //         var signature = ecdsaSig.sign(buf_to_sign, privKeyBuf);
    //         //todo delete
    //         // bbWallet.sendSignature(from_address, buf_to_sign.toString("base64"), signature, signing_path, top_address);
    //         console.log("sent signature " + signature);
    //     }
    //
    //     function refuseSignature() {
    //         var buf_to_sign = objectHash.getUnitHashToSign(objUnit);
    //         /todo delete
    //         // bbWallet.sendSignature(from_address, buf_to_sign.toString("base64"), "[refused]", signing_path, top_address);
    //         console.log("refused signature");
    //     }
    //
    //     var bbWallet = require('intervaluecore/wallet.js');
    //     var walletDefinedByKeys = require('intervaluecore/wallet_defined_by_keys.js');
    //     var unit = objUnit.unit;
    //     var credentials = lodash.find(profileService.profile.credentials, { walletId: objAddress.wallet });
    //     mutex.lock(["signing_request-" + unit], function (unlock) {
    //
    //         // apply the previously obtained decision.
    //         // Unless the priv key is encrypted in which case the password request would have appeared from nowhere
    //         if (assocChoicesByUnit[unit] && !profileService.focusedClient.isPrivKeyEncrypted()) {
    //             if (assocChoicesByUnit[unit] === "approve")
    //                 createAndSendSignature();
    //             else if (assocChoicesByUnit[unit] === "refuse")
    //                 refuseSignature();
    //             return unlock();
    //         }
    //
    //         if (objUnit.signed_message) {
    //             var question = gettextCatalog.getString('Sign message "' + objUnit.signed_message + '" by address ' + objAddress.address + '?');
    //             requestApproval(question, {
    //                 ifYes: function () {
    //                     createAndSendSignature();
    //                     unlock();
    //                 },
    //                 ifNo: function () {
    //                     // do nothing
    //                     console.log("===== NO CLICKED");
    //                     refuseSignature();
    //                     unlock();
    //                 }
    //             });
    //             return;
    //         }
    //
    //         walletDefinedByKeys.readChangeAddresses(objAddress.wallet, function (arrChangeAddressInfos) {
    //             var arrAuthorAddresses = objUnit.authors.map(function (author) { return author.address; });
    //             var arrChangeAddresses = arrChangeAddressInfos.map(function (info) { return info.address; });
    //             arrChangeAddresses = arrChangeAddresses.concat(arrAuthorAddresses);
    //             arrChangeAddresses.push(top_address);
    //             var arrPaymentMessages = objUnit.messages.filter(function (objMessage) { return (objMessage.app === "payment"); });
    //             if (arrPaymentMessages.length === 0)
    //                 throw Error("no payment message found");
    //             var assocAmountByAssetAndAddress = {};
    //             // exclude outputs paying to my change addresses
    //             async.eachSeries(
    //                 arrPaymentMessages,
    //                 function (objMessage, cb) {
    //                     var payload = objMessage.payload;
    //                     if (!payload)
    //                         payload = assocPrivatePayloads[objMessage.payload_hash];
    //                     if (!payload)
    //                         throw Error("no inline payload and no private payload either, message=" + JSON.stringify(objMessage));
    //                     var asset = payload.asset || "base";
    //                     if (!payload.outputs)
    //                         throw Error("no outputs");
    //                     if (!assocAmountByAssetAndAddress[asset])
    //                         assocAmountByAssetAndAddress[asset] = {};
    //                     payload.outputs.forEach(function (output) {
    //                         if (arrChangeAddresses.indexOf(output.address) === -1) {
    //                             if (!assocAmountByAssetAndAddress[asset][output.address])
    //                                 assocAmountByAssetAndAddress[asset][output.address] = 0;
    //                             assocAmountByAssetAndAddress[asset][output.address] += output.amount;
    //                         }
    //                     });
    //                     cb();
    //                 },
    //                 function () {
    //                     var config = configService.getSync().wallet.settings;
    //
    //                     var arrDestinations = [];
    //                     for (var asset in assocAmountByAssetAndAddress) {
    //                         var formatted_asset = isCordova ? asset : ("<span class='small'>" + asset + '</span><br/>');
    //                         var currency = "of asset " + formatted_asset;
    //                         var assetInfo = profileService.assetMetadata[asset];
    //                         if (asset === 'base')
    //                             currency = config.unitName;
    //                         else if (asset === constants.BLACKBYTES_ASSET)
    //                             currency = config.bbUnitName;
    //                         else if (assetInfo && assetInfo.name)
    //                             currency = assetInfo.name;
    //                         for (var address in assocAmountByAssetAndAddress[asset]) {
    //                             var formatted_amount = profileService.formatAmount(assocAmountByAssetAndAddress[asset][address], asset);
    //                             arrDestinations.push(formatted_amount + " " + currency + " to " + address);
    //                         }
    //                     }
    //                     function getQuestion() {
    //                         if (arrDestinations.length === 0) {
    //                             var arrDataMessages = objUnit.messages.filter(function (objMessage) { return (objMessage.app === "profile" || objMessage.app === "attestation" || objMessage.app === "data" || objMessage.app === 'data_feed'); });
    //                             if (arrDataMessages.length > 0) {
    //                                 var message = arrDataMessages[0]; // can be only one
    //                                 var payload = message.payload;
    //                                 var obj = (message.app === 'attestation') ? payload.profile : payload;
    //                                 var arrPairs = [];
    //                                 for (var field in obj)
    //                                     arrPairs.push(field + ": " + obj[field]);
    //                                 var nl = isCordova ? "\n" : "<br>";
    //                                 var list = arrPairs.join(nl) + nl;
    //                                 if (message.app === 'profile' || message.app === 'data' || message.app === 'data_feed')
    //                                     return 'Sign ' + message.app.replace('_', ' ') + ' ' + nl + list + 'from wallet ' + credentials.walletName + '?';
    //                                 if (message.app === 'attestation')
    //                                     return 'Sign transaction attesting ' + payload.address + ' as ' + nl + list + 'from wallet ' + credentials.walletName + '?';
    //                             }
    //                         }
    //                         var dest = (arrDestinations.length > 0) ? arrDestinations.join(", ") : "to myself";
    //                         return 'Sign transaction spending ' + dest + ' from wallet ' + credentials.walletName + '?';
    //                     }
    //                     var question = getQuestion();
    //                     requestApproval(question, {
    //                         ifYes: function () {
    //                             createAndSendSignature();
    //                             assocChoicesByUnit[unit] = "approve";
    //                             unlock();
    //                         },
    //                         ifNo: function () {
    //                             // do nothing
    //                             console.log("===== NO CLICKED");
    //                             refuseSignature();
    //                             assocChoicesByUnit[unit] = "refuse";
    //                             unlock();
    //                         }
    //                     });
    //                 }
    //             ); // eachSeries
    //         });
    //     });
    // });


    var accept_msg = gettextCatalog.getString('Yes');
    var cancel_msg = gettextCatalog.getString('No');
    var confirm_msg = gettextCatalog.getString('Confirm');

    var _modalRequestApproval = function (question, callbacks) {
        var ModalInstanceCtrl = function ($scope, $modalInstance, $sce, gettext) {
            $scope.title = $sce.trustAsHtml(question);
            $scope.yes_icon = 'fi-check';
            $scope.yes_button_class = 'primary';
            $scope.cancel_button_class = 'warning';
            $scope.cancel_label = 'No';
            $scope.loading = false;

            $scope.ok = function () {
                $scope.loading = true;
                $modalInstance.close(accept_msg);
            };
            $scope.cancel = function () {
                $modalInstance.dismiss(cancel_msg);
            };
        };

        var modalInstance = $modal.open({
            templateUrl: 'views/modals/confirmation.html',
            windowClass: animationService.modalAnimated.slideUp,
            controller: ModalInstanceCtrl
        });

        modalInstance.result.finally(function () {
            var m = angular.element(document.getElementsByClassName('reveal-modal'));
            m.addClass(animationService.modalAnimated.slideOutDown);
        });

        modalInstance.result.then(callbacks.ifYes, callbacks.ifNo);
    };

    var requestApproval = function (question, callbacks) {
        if (isCordova) {
            navigator.notification.confirm(
                question,
                function (buttonIndex) {
                    if (buttonIndex == 1)
                        callbacks.ifYes();
                    else
                        callbacks.ifNo();
                },
                confirm_msg, [accept_msg, cancel_msg]
            );
        } else {
            _modalRequestApproval(question, callbacks);
        }
    };



    self.openSubwalletModal = function () {
        $rootScope.modalOpened = true;
        var fc = profileService.focusedClient;

        var ModalInstanceCtrl = function ($scope, $modalInstance) {
            $scope.color = fc.backgroundColor;
            $scope.indexCtl = self;
            var arrSharedWallets = [];
            $scope.mainWalletBalanceInfo = self.arrMainWalletBalances[self.assetIndex];
            $scope.asset = $scope.mainWalletBalanceInfo.asset;
            var asset = $scope.asset;
            var assetInfo = self.arrBalances[self.assetIndex];
            var assocSharedByAddress = assetInfo.assocSharedByAddress;
            for (var sa in assocSharedByAddress) {
                var objSharedWallet = {};
                objSharedWallet.shared_address = sa;
                objSharedWallet.total = assocSharedByAddress[sa];
                if (asset === 'base' || asset === constants.BLACKBYTES_ASSET || $scope.mainWalletBalanceInfo.name)
                    objSharedWallet.totalStr = profileService.formatAmountWithUnit(assocSharedByAddress[sa], asset);
                arrSharedWallets.push(objSharedWallet);
            }
            $scope.arrSharedWallets = arrSharedWallets;

            var walletDefinedByAddresses = require('intervaluecore/wallet_defined_by_addresses.js');
            async.eachSeries(
                arrSharedWallets,
                function (objSharedWallet, cb) {
                    walletDefinedByAddresses.readSharedAddressCosigners(objSharedWallet.shared_address, function (cosigners) {
                        objSharedWallet.shared_address_cosigners = cosigners.map(function (cosigner) { return cosigner.name; }).join(", ");
                        objSharedWallet.creation_ts = cosigners[0].creation_ts;
                        cb();
                    });
                },
                function () {
                    arrSharedWallets.sort(function (o1, o2) { return (o2.creation_ts - o1.creation_ts); });
                    $timeout(function () {
                        $scope.$apply();
                    });
                }
            );

            $scope.cancel = function () {
                breadcrumbs.add('openSubwalletModal cancel');
                $modalInstance.dismiss('cancel');
            };

            $scope.selectSubwallet = function (shared_address) {
                self.shared_address = shared_address;
                if (shared_address) {
                    walletDefinedByAddresses.determineIfHasMerkle(shared_address, function (bHasMerkle) {
                        self.bHasMerkle = bHasMerkle;
                        walletDefinedByAddresses.readSharedAddressCosigners(shared_address, function (cosigners) {
                            self.shared_address_cosigners = cosigners.map(function (cosigner) { return cosigner.name; }).join(", ");
                            $timeout(function () {
                                $rootScope.$apply();
                            });
                        });
                    });
                }
                else
                    self.bHasMerkle = false;
                self.updateAll();
                self.updateTxHistory(3);
                $modalInstance.close();
            };
        };

        var modalInstance = $modal.open({
            templateUrl: 'views/modals/select-subwallet.html',
            windowClass: animationService.modalAnimated.slideUp,
            controller: ModalInstanceCtrl,
        });

        var disableCloseModal = $rootScope.$on('closeModal', function () {
            breadcrumbs.add('openSubwalletModal on closeModal');
            modalInstance.dismiss('cancel');
        });

        modalInstance.result.finally(function () {
            $rootScope.modalOpened = false;
            disableCloseModal();
            var m = angular.element(document.getElementsByClassName('reveal-modal'));
            m.addClass(animationService.modalAnimated.slideOutDown);
        });

    };

    self.goHome = function () {
        go.walletHome();
    };

    // self.menu = [{
    //   'title': gettext('Home'),
    //   'icon': 'icon-home',
    //   'link': 'walletHome'
    // }, {
    //   'title': gettext('Receive'),
    //   'icon': 'icon-receive2',
    //   'link': 'receive'
    // }, {
    //   'title': gettext('Send'),
    //   'icon': 'icon-paperplane',
    //   'link': 'send'
    // }, {
    //   'title': gettext('History'),
    //   'icon': 'icon-history',
    //   'link': 'history'
    // }, {
    //     'title': gettext('Shadow'),
    //     'icon': 'icon-history',
    //     'link': 'Shadow'
    // }, {
    //   'title': gettext('Chat'),
    //   'icon': 'icon-bubble',
    //   'new_state': 'correspondentDevices',
    //   'link': 'chat'
    // }];
    self.menu = [{
        'title': gettext('Home'),
        'img': 'mmtabwalletHome',
        'imgid': 'walletHome',
        'link': 'walletHome'
    }, {
        'title': gettext('News'),
        'img': 'mmtabnews',
        'imgid': 'news',
        'link': 'news'
    },{
        'title': gettext('Transaction'),
        'img': 'mmtabsend',
        'imgid': 'send',
        'link': 'send'
    }, {
        'title': gettext('Chat'),
        'img': 'mmtabchat',
        'imgid': 'chat',
        'link': 'chat',
        'new_state': 'correspondentDevices',
    }, {
        'title': gettext('Wallet'),
        'img': 'mmtabwallet',
        'imgid': 'wallet',
        'link': 'wallet'
    }];
    self.addonViews = addonManager.addonViews();
    self.menu = self.menu.concat(addonManager.addonMenuItems());
    self.menuItemSize = self.menu.length > 5 ? 2 : 3;
    self.txTemplateUrl = addonManager.txTemplateUrl() || 'views/includes/transaction.html';

    self.tab = 'walletHome';


    /* self.setOngoingProcess = function (processName, isOn) {
       $log.debug('onGoingProcess', processName, isOn);
       self[processName] = isOn;
       self.onGoingProcess[processName] = isOn;

       var name;
       self.anyOnGoingProcess = lodash.any(self.onGoingProcess, function (isOn, processName) {
         if (isOn)
           name = name || processName;
         return isOn;
       });
       // The first one
       self.onGoingProcessName = name;
       $timeout(function () {
         $rootScope.$apply();
       });
     };*/

    self.setFocusedWallet = function (cb) {
        var fc = profileService.focusedClient;
        if (!fc) return;

        breadcrumbs.add('setFocusedWallet ' + fc.credentials.walletId);
        var device = require('intervaluecore/device.js');
        device.setWalletId(fc.credentials.walletId);
        // Clean status
        self.totalBalanceBytes = null;
        self.lockedBalanceBytes = null;
        self.availableBalanceBytes = null;
        self.pendingAmount = null;
        self.spendUnconfirmed = null;

        self.totalBalanceStr = null;
        self.availableBalanceStr = null;
        self.lockedBalanceStr = null;

        self.arrBalances = [];
        self.assetIndex = 0;
        self.shared_address = null;
        self.bHasMerkle = false;

        self.txHistory = [];
        self.completeHistory = [];
        self.txProgress = 0;
        self.historyShowShowAll = false;
        self.balanceByAddress = null;
        self.pendingTxProposalsCountForUs = null;
        self.setSpendUnconfirmed();

        $timeout(function () {
            //$rootScope.$apply();
            self.hasProfile = true;
            self.noFocusedWallet = false;
            self.onGoingProcess = {};

            // Credentials Shortcuts
            self.m = fc.credentials.m;
            self.n = fc.credentials.n;
            self.network = fc.credentials.network;
            self.requiresMultipleSignatures = fc.credentials.m > 1;
            //self.isShared = fc.credentials.n > 1;
            self.walletName = fc.credentials.walletName;
            self.walletId = fc.credentials.walletId;
            self.isComplete = fc.isComplete();
            self.canSign = fc.canSign();
            self.isPrivKeyExternal = fc.isPrivKeyExternal();
            self.isPrivKeyEncrypted = fc.isPrivKeyEncrypted();
            self.mnemonic = fc.credentials.mnemonic;
            self.externalSource = fc.getPrivKeyExternalSourceName();
            self.account = fc.credentials.account;

            self.txps = [];
            self.copayers = [];
            self.updateColor();
            self.updateAlias();
            self.updateSingleAddressFlag();
            self.setAddressbook();


            profileService.profile.mnemonic = fc.credentials.mnemonic;
            profileService.profile.mnemonicEncrypted = fc.credentials.mnemonicEncrypted;
            profileService.profile.xPrivKey = fc.credentials.xPrivKey;
            profileService.profile.xPrivKeyEncrypted = fc.credentials.xPrivKeyEncrypted;

            // storageService.storeProfile(profileService.profile, function () {
            console.log("reading cosigners");
            var walletDefinedByKeys = require('intervaluecore/wallet_defined_by_keys.js');
            walletDefinedByKeys.readCosigners(self.walletId, function (arrCosignerInfos) {
                self.copayers = arrCosignerInfos;
                $timeout(function () {
                    $rootScope.$digest();
                });
            });

            self.needsBackup = false;
            self.singleAddressWallet = false;
            self.openWallet();
            if (lodash.isFunction(cb)) {
                cb();
            }
            $timeout(function () {
                $rootScope.$apply();
            });
            /*if (fc.isPrivKeyExternal()) {
                self.needsBackup = false;
                self.openWallet();
            } else {
                storageService.getBackupFlag('all', function(err, val) {
                  self.needsBackup = self.network == 'testnet' ? false : !val;
                  self.openWallet();
                });
            }*/
            // });
        });
    };

    /**
     * 切换钱包标签，进入不同页面
     * @param tab
     * @param reset
     * @param tries
     * @param switchState
     * @returns {*}
     */
    self.setTab = function (tab, reset, tries, switchState) {
        // console.log("setTab", tab, reset, tries, switchState);
        tries = tries || 0;

        var changeTab = function (tab) {
            if (document.querySelector('.tab-in.tab-view')) {
                var el = angular.element(document.querySelector('.tab-in.tab-view'));
                el.removeClass('tab-in').addClass('tab-out');
                var old = angular.element(document.getElementById('menu-' + self.tab));
                if (old) {
                    old.className = '';
                }
            }

            if (document.getElementById(tab)) {
                if (tab == 'news') {
                    if(self.shownewstab == ''){
                        self.shownewstab = 'new1';
                    }
                }
                var el = angular.element(document.getElementById(tab));
                el.removeClass('tab-out').addClass('tab-in');
                var newe = angular.element(document.getElementById('menu-' + tab));
                if (newe) {
                    newe.className = 'active';
                }
            }

            /**
             * 根据点击标签内容切换对应标签图标样式
             */
            let menuu = self.menu;
            if((self.tab== tab &&!$rootScope.tab) ||$rootScope.tab != tab ){
                for(let item in menuu){
                    if(menuu[item].link == tab) {
                        let cc = menuu[item];
                        cc.img = 'active'+cc.img;
                        menuu.splice(item,1,cc);
                    }
                    if(menuu[item].link == $rootScope.tab) {
                        let cc = menuu[item];
                        cc.img = cc.img.substring(6);
                        menuu.splice(item,1,cc);
                    }
                }
            }

            $rootScope.tab = self.tab = tab;

            $rootScope.$emit('Local/TabChanged', tab);
        };

        // check if the whole menu item passed
        if (typeof tab == 'object') {
            if (!tab.new_state) backButton.clearHistory();
            if (tab.open) {
                if (tab.link) {
                    $rootScope.tab = self.tab = tab.link;
                }
                tab.open();
                return;
            } else if (tab.new_state) {
                changeTab(tab.link);
                go.path(tab.new_state);
                $rootScope.tab = self.tab = tab.link;
                return;
            } else {
                return self.setTab(tab.link, reset, tries, switchState);
            }
        }
        //console.log("current tab " + self.tab + ", requested to set tab " + tab + ", reset=" + reset);
        if (self.tab === tab && !reset)
            return;

        if (!document.getElementById('menu-' + tab) && ++tries < 5) {
            //console.log("will retry setTab later:", tab, reset, tries, switchState);
            return $timeout(function () {
                self.setTab(tab, reset, tries, switchState);
            }, (tries === 1) ? 10 : 300);
        }

        // if (!self.tab || !$state.is('walletHome'))
        //     $rootScope.tab = self.tab = 'walletHome';

        if (switchState && !$state.is('walletHome')) {
            go.path('walletHome', function () {
                changeTab(tab);
            });
            return;
        }

        changeTab(tab);
    };


    $rootScope.$on('Local/SetTabChat',function (event,tab){

        let menuu = self.menu;
        if((self.tab== tab &&!$rootScope.tab) ||$rootScope.tab != tab ){
            for(let item in menuu){
                if(menuu[item].link == tab) {
                    let cc = menuu[item];
                    cc.img = 'active'+cc.img;
                    menuu.splice(item,1,cc);
                }
                if(menuu[item].link == $rootScope.tab) {
                    let cc = menuu[item];
                    cc.img = cc.img.substring(6);
                    menuu.splice(item,1,cc);
                }
                console.log(item+': ',menuu);
            }

        }
        $rootScope.tab = self.tab = tab;
    });





    self.updateAll = function (opts) {
        opts = opts || {};

        var fc = profileService.focusedClient;
        if (!fc)
            return breadcrumbs.add('updateAll no fc');

        if (!fc.isComplete())
            return breadcrumbs.add('updateAll not complete yet');

        // reconnect if lost connection
        /*var device = require('intervaluecore/device.js');
        device.loginToHub();*/
        $timeout(function () {
            /* if (!opts.quiet)
               self.setOngoingProcess('updatingStatus', true);

             $log.debug('Updating Status:', fc.credentials.walletName);
             if (!opts.quiet)
               self.setOngoingProcess('updatingStatus', false);*/

            //todo 许切换成新的方法
            fc.getBalance(self.shared_address, function (err, assocBalances, assocSharedBalances) {
                if (err)
                    throw "impossible getBal";
                $log.debug('updateAll Wallet Balance:', assocBalances, assocSharedBalances);
                self.setBalance(assocBalances, assocSharedBalances);
                // Notify external addons or plugins
                $rootScope.$emit('Local/BalanceUpdated', assocBalances);
                if (!self.isPrivKeyEncrypted)
                    $rootScope.$emit('Local/BalanceUpdatedAndWalletUnlocked');
            });

            self.otherWallets = lodash.filter(profileService.getWallets(self.network), function (w) {
                return (w.id != self.walletId || self.shared_address);
            });


            //$rootScope.$apply();

            if (opts.triggerTxUpdate) {
                $timeout(function () {
                    breadcrumbs.add('triggerTxUpdate');
                    self.updateTxHistory(3);
                }, 1);
            }
        });
    };

    self.setSpendUnconfirmed = function () {
        self.spendUnconfirmed = configService.getSync().wallet.spendUnconfirmed;
    };


    self.updateBalance = function () {
        var fc = profileService.focusedClient;
        $timeout(function () {
            /*self.setOngoingProcess('updatingBalance', true);*/
            $log.debug('Updating Balance');
            //todo delete 需要切换成新的方法
            // fc.getBalance(self.shared_address, function (err, assocBalances, assocSharedBalances) {
            //     /*self.setOngoingProcess('updatingBalance', false);*/
            //     if (err)
            //         throw "impossible error from getBalance";
            //     $log.debug('updateBalance Wallet Balance:', assocBalances, assocSharedBalances);
            //     self.setBalance(assocBalances, assocSharedBalances);
            // });
        });
    };



    self.openWallet = function () {
        console.log("index.openWallet called");
        var fc = profileService.focusedClient;
        breadcrumbs.add('openWallet ' + fc.credentials.walletId);
        $timeout(function () {
            //$rootScope.$apply();
            /*self.setOngoingProcess('openingWallet', true);*/
            self.updateError = false;
            fc.openWallet(function onOpenedWallet(err, walletStatus) {
                /*self.setOngoingProcess('openingWallet', false);*/
                if (err)
                    throw "impossible error from openWallet";
                $log.debug('Wallet Opened');
                self.updateAll(lodash.isObject(walletStatus) ? {
                    walletStatus: walletStatus
                } : null);
                //$rootScope.$apply();
            });
        });
    };



    self.processNewTxs = function (txs) {
        var config = configService.getSync().wallet.settings;
        var now = Math.floor(Date.now() / 1000);
        var ret = [];

        lodash.each(txs, function (tx) {
            tx = txFormatService.processTx(tx);

            // no future transactions...
            if (tx.time > now)
                tx.time = now;
            ret.push(tx);
        });

        return ret;
    };

    self.updateAlias = function () {
        var config = configService.getSync();
        config.aliasFor = config.aliasFor || {};
        self.alias = config.aliasFor[self.walletId];
        var fc = profileService.focusedClient;
        fc.alias = self.alias;
    };

    /**
     * 设置钱包对应头像
     */
    setTimeout(function () {
        self.updateImage();
    });

    self.updateImage = function(){
        var config = configService.getSync();
        var fc = profileService.walletClients;
        config.colorFor = config.colorFor || {};
        config.imageFor = config.imageFor || {};
        for(let item in fc){
            if(!fc[item].image) fc[item].image = './img/rimg/1.png';
            for(let cf in config.imageFor){
                if(item == cf){
                    fc[item].image = config.imageFor[cf];
                    break;
                }
            }
        }
    }
    self.updateColor = function () {
        var config = configService.getSync();
        config.colorFor = config.colorFor || {};
        config.imageFor = config.imageFor || {};
        self.backgroundColor = config.colorFor[self.walletId] || '#4A90E2';
        self.image = config.imageFor[self.walletId] || './img/rimg/1.png';
        var fc = profileService.focusedClient;
        fc.backgroundColor = self.backgroundColor;
        fc.image = self.image;
    };

    self.updateSingleAddressFlag = function () {
        var config = configService.getSync();
        config.isSingleAddress = config.isSingleAddress || {};
        self.isSingleAddress = config.isSingleAddress[self.walletId];
        var fc = profileService.focusedClient;
        fc.isSingleAddress = self.isSingleAddress;
    };

    self.setBalance = function (assocBalances, assocSharedBalances) {
        if (!assocBalances) return;
        var config = configService.getSync().wallet.settings;

        // Selected unit
        self.unitValue = config.unitValue;
        self.unitName = config.unitName;
        self.bbUnitName = config.bbUnitName;

        self.arrBalances = [];
        for (var asset in assocBalances) {
            var balanceInfo = assocBalances[asset];
            balanceInfo.asset = asset;
            balanceInfo.total = balanceInfo.stable + balanceInfo.pending;
            if (assocSharedBalances[asset]) {
                balanceInfo.shared = 0;
                balanceInfo.assocSharedByAddress = {};
                for (var sa in assocSharedBalances[asset]) {
                    var total_on_shared_address = (assocSharedBalances[asset][sa].stable || 0) + (assocSharedBalances[asset][sa].pending || 0);
                    balanceInfo.shared += total_on_shared_address;
                    balanceInfo.assocSharedByAddress[sa] = total_on_shared_address;
                }
            }
            if (balanceInfo.name)
                profileService.assetMetadata[asset] = { decimals: balanceInfo.decimals, name: balanceInfo.name };
            if (asset === "base" || asset == self.BLACKBYTES_ASSET || balanceInfo.name) {
                balanceInfo.totalStr = profileService.formatAmountWithUnit(balanceInfo.total, asset);
                balanceInfo.totalStrWithoutUnit = profileService.formatAmount(balanceInfo.total, asset);
                balanceInfo.stableStr = profileService.formatAmountWithUnit(balanceInfo.stable, asset);
                balanceInfo.pendingStr = profileService.formatAmountWithUnitIfShort(balanceInfo.pending, asset);
                if (typeof balanceInfo.shared === 'number')
                    balanceInfo.sharedStr = profileService.formatAmountWithUnitIfShort(balanceInfo.shared, asset);
                if (!balanceInfo.name) {
                    if (!Math.log10) // android 4.4
                        Math.log10 = function (x) { return Math.log(x) * Math.LOG10E; };
                    if (asset === "base") {
                        balanceInfo.name = self.unitName;
                        balanceInfo.decimals = Math.round(Math.log10(config.unitValue));
                    }
                    else if (asset === self.BLACKBYTES_ASSET) {
                        balanceInfo.name = self.bbUnitName;
                        balanceInfo.decimals = Math.round(Math.log10(config.bbUnitValue));
                    }
                }
            }
            self.arrBalances.push(balanceInfo);
        }
        self.assetIndex = self.assetIndex || 0;
        if (!self.arrBalances[self.assetIndex]) // if no such index in the subwallet, reset to bytes
            self.assetIndex = 0;
        if (!self.shared_address)
            self.arrMainWalletBalances = self.arrBalances;
        if (isCordova) wallet.showCompleteClient();
        //console.log('========= setBalance done, balances: ' + JSON.stringify(self.arrBalances));
        breadcrumbs.add('setBalance done, balances: ' + JSON.stringify(self.arrBalances));

        /*
      // SAT
      if (self.spendUnconfirmed) {
        self.totalBalanceBytes = balance.totalAmount;
        self.lockedBalanceBytes = balance.lockedAmount || 0;
        self.availableBalanceBytes = balance.availableAmount || 0;
        self.pendingAmount = null;
      } else {
        self.totalBalanceBytes = balance.totalConfirmedAmount;
        self.lockedBalanceBytes = balance.lockedConfirmedAmount || 0;
        self.availableBalanceBytes = balance.availableConfirmedAmount || 0;
        self.pendingAmount = balance.totalAmount - balance.totalConfirmedAmount;
      }

      //STR
      self.totalBalanceStr = profileService.formatAmount(self.totalBalanceBytes) + ' ' + self.unitName;
      self.lockedBalanceStr = profileService.formatAmount(self.lockedBalanceBytes) + ' ' + self.unitName;
      self.availableBalanceStr = profileService.formatAmount(self.availableBalanceBytes) + ' ' + self.unitName;

      if (self.pendingAmount) {
        self.pendingAmountStr = profileService.formatAmount(self.pendingAmount) + ' ' + self.unitName;
      } else {
        self.pendingAmountStr = null;
      }
        */
        $timeout(function () {
            $rootScope.$apply();
        });
    };



    this.csvHistory = function () {

        function saveFile(name, data) {
            var chooser = document.querySelector(name);
            chooser.addEventListener("change", function (evt) {
                var fs = require('fs');
                fs.writeFile(this.value, data, function (err) {
                    if (err) {
                        $log.debug(err);
                    }
                });
            }, false);
            chooser.click();
        }

        function formatDate(date) {
            var dateObj = new Date(date);
            if (!dateObj) {
                $log.debug('Error formating a date');
                return 'DateError'
            }
            if (!dateObj.toJSON()) {
                return '';
            }

            return dateObj.toJSON();
        }

        function formatString(str) {
            if (!str) return '';

            if (str.indexOf('"') !== -1) {
                //replace all
                str = str.replace(new RegExp('"', 'g'), '\'');
            }

            //escaping commas
            str = '\"' + str + '\"';

            return str;
        }

        var step = 6;
        var unique = {};


        if (isCordova) {
            $log.info('CSV generation not available in mobile');
            return;
        }
        var isNode = nodeWebkit.isDefined();
        var fc = profileService.focusedClient;
        var c = fc.credentials;
        if (!fc.isComplete()) return;
        var self = this;
        var allTxs = [];

        $log.debug('Generating CSV from History');
        /*self.setOngoingProcess('generatingCSV', true);*/

        $timeout(function () {
            fc.getTxHistory(self.arrBalances[self.assetIndex].asset, self.shared_address, function (txs) {
                /* self.setOngoingProcess('generatingCSV', false);*/
                $log.debug('Wallet Transaction History:', txs);

                var data = txs;
                var filename = 'Intervalue-' + (self.alias || self.walletName) + '.csv';
                var csvContent = '';

                if (!isNode) csvContent = 'data:text/csv;charset=utf-8,';
                csvContent += 'Date,Destination,Note,Amount,Currency,Spot Value,Total Value,Tax Type,Category\n';

                var _amount, _note;
                var dataString;
                data.forEach(function (it, index) {
                    var amount = it.amount;

                    if (it.action == 'moved')
                        amount = 0;

                    _amount = (it.action == 'sent' ? '-' : '') + amount;
                    _note = formatString((it.message ? it.message : '') + ' unit: ' + it.unit);

                    if (it.action == 'moved')
                        _note += ' Moved:' + it.amount

                    dataString = formatDate(it.time * 1000) + ',' + formatString(it.addressTo) + ',' + _note + ',' + _amount + ',byte,,,,';
                    csvContent += dataString + "\n";

                });

                if (isNode) {
                    saveFile('#export_file', csvContent);
                } else {
                    var encodedUri = encodeURI(csvContent);
                    var link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", filename);
                    link.click();
                }
                $timeout(function () {
                    $rootScope.$apply();
                });
            });
        });
    };


    /**
     * 刷新钱包信息：余额，交易记录
     * @param client
     * @param cb
     */
    self.updateLocalTxHistory = function (client, cb) {
        var walletId = client.credentials.walletId;
        self.mnemonicEncrypted = client.credentials.mnemonicEncrypted;
        self.mnemonic = client.credentials.mnemonic;
        if(client.credentials.mnemonicEncrypted || client.credentials.mnemonic){
            self.needsBackupa = true;
        }else {
            self.needsBackupa = false;
        }
        // if (self.arrBalances.length === 0)
        //     return console.log('updateLocalTxHistory: no balances yet');
        // breadcrumbs.add('index: ' + self.assetIndex + '; balances: ' + JSON.stringify(self.arrBalances));
        // if (!client.isComplete())
        //     return console.log('fc incomplete yet');
        client.getTxHistory('base', walletId, function onGotTxHistory(txs) {
                $timeout(function () {
                    var newHistory = self.processNewTxs(txs);
                    $log.debug('Tx History synced. Total Txs: ' + newHistory.length);
                    if(newHistory.length == 0) self.txHistoryError = false;
                    //if (walletId == profileService.focusedClient.credentials.walletId) {
                    self.completeHistory = newHistory;
                    self.txHistory = newHistory.slice(0, self.historyShowLimit);
                    require('intervaluecore/light').findStable2(walletId,function (obj) {
                        self.ammountTatolNmuber = obj;
                        self.ammountTatol = profileService.formatAmount(obj,'bytes');
                        $timeout(function () {
                            $rootScope.$apply();
                        },1);
                    });
                    require('intervaluecore/wallet').getWalletsInfo(function (obj) {
                        if(!obj) {
                            self.updateTxHistory(3);
                            return;
                        }
                        self.updateImage();
                        let trans = [];
                        let fc = profileService.walletClients;
                        obj.forEach(function(tran){
                            for(var item in fc) {
                                if (tran.wallet == fc[item].credentials.walletId){
                                    var walletNameIfo = fc[item].credentials.walletName;
                                    var imageIfo = fc[item].image;
                                    var mnemonicEncryptedIfo = fc[item].credentials.mnemonicEncrypted;
                                    var mnemonic = fc[item].credentials.mnemonic;
                                    break;
                                }
                            }
                            trans.push({
                                address : tran.address,
                                wallet  : tran.wallet,
                                stables  : profileService.formatAmount(tran.stables,'bytes'),
                                walletName : walletNameIfo,
                                image : imageIfo,
                                mnemonicEncrypted: mnemonicEncryptedIfo,
                                mnemonic : mnemonic
                            });
                        });
                        self.walletInfo = trans;
                        let walletInfo = self.walletInfo;
                        for(let item in walletInfo){
                            if(walletInfo[item].wallet == profileService.focusedClient.credentials.walletId) {
                                self.stables = walletInfo[item].stables;
                                break;
                            }
                        }
                        $timeout(function () {
                            $rootScope.$apply();
                        },1);
                    });

                self.historyShowShowAll = newHistory.length >= self.historyShowLimit;
                //}
                return cb();
            });
        });

    };

    self.showAllHistory = function () {
        self.historyShowShowAll = false;
        self.historyRendering = true;
        $timeout(function () {
            if(!$rootScope.$$phase) $rootScope.$apply();
            $timeout(function () {
                self.historyRendering = false;
                self.txHistory = self.completeHistory;
            }, 100);
        }, 100);
    };


    self.updateHistory = function (retry) {
        //var device = require('intervaluecore/device.js');
        //device.loginToHub();
        var fc = profileService.focusedClient;
        var walletId = fc.credentials.walletId;
        $log.debug('starting Updating Transaction History');
        if (( self.updatingTxHistory[walletId]) ) {
            $log.debug('failed Updating Transaction History');
            if (retry) {
                setTimeout(function () {
                    $log.debug('restarting Updating Transaction History');
                    self.updateHistory(retry - 1);
                }, 3 * 1000);
            }
            return;
        }

        $log.debug('Updating Transaction History');
        self.txHistoryError = false;
        self.updatingTxHistory[walletId] = true;

        $timeout(function onUpdateHistoryTimeout() {
            self.updateLocalTxHistory(fc, function (err) {
                self.updatingTxHistory[walletId] = false;
                if (err)
                    self.txHistoryError = true;
                $timeout(function () {
                    if(!$rootScope.$$phase) $rootScope.$apply();
                });
            });
        });
    };

    self.updateTxHistory = lodash.debounce(function (retry) {
        self.updateHistory(retry);
    }, 1000);

    /**
     * 交易完成后跳转首页
     * @param obj
     */
    $rootScope.$on('Local/paymentDone', function(event){
        $rootScope.$emit('Local/SetTab', 'walletHome');
        self.updateTxHistory(3);
    });

    //  self.throttledUpdateHistory = lodash.throttle(function() {
    //    self.updateHistory();
    //  }, 5000);

    //    self.onMouseDown = function(){
    //        console.log('== mousedown');
    //        self.oldAssetIndex = self.assetIndex;
    //    };

    self.onClick = function () {
        console.log('== click');
        self.oldAssetIndex = self.assetIndex;
    };

    // for light clients only
    self.updateHistoryFromNetwork = lodash.throttle(function () {
        setTimeout(function () {
            if (self.assetIndex !== self.oldAssetIndex) // it was a swipe
                return console.log("== swipe");
            console.log('== updateHistoryFromNetwork');
            //todo delete
            // var lightWallet = require('intervaluecore/light_wallet.js');
            // lightWallet.refreshLightClientHistory();
        }, 500);
    }, 5000);

    self.showPopup = function (msg, msg_icon, cb) {
        $log.warn('Showing ' + msg_icon + ' popup:' + msg);
        self.showAlert = {
            msg: msg.toString(),
            msg_icon: msg_icon,
            close: function (err) {
                self.showAlert = null;
                if (cb) return cb(err);
            },
        };
        $timeout(function () {
            $rootScope.$apply();
        });
    };

    self.showErrorPopup = function (msg, cb) {
        $log.warn('Showing err popup:' + msg);
        self.showPopup(msg, 'fi-alert', cb);
    };

    /* self.recreate = function (cb) {
       var fc = profileService.focusedClient;
       self.setOngoingProcess('recreating', true);
       fc.recreateWallet(function (err) {
         self.setOngoingProcess('recreating', false);

         if (err)
           throw "impossible err from recreateWallet";

         profileService.setWalletClients();
         $timeout(function () {
           $rootScope.$emit('Local/WalletImported', self.walletId);
         }, 100);
       });
     };*/

    self.openMenu = function () {
        backButton.menuOpened = true;
        go.swipe(true);
    };

    self.closeMenu = function () {
        backButton.menuOpened = false;
        go.swipe();
    };

    self.swipeLeft = function () {
        if (!self.bSwipeSuspended)
            self.openMenu();
        else
            console.log('ignoring swipe');
    };

    self.suspendSwipe = function () {
        if (self.arrBalances.length <= 1)
            return;
        self.bSwipeSuspended = true;
        console.log('suspending swipe');
        $timeout(function () {
            self.bSwipeSuspended = false;
            console.log('resuming swipe');
        }, 100);
    };

    self.retryScan = function () {
        var self = this;
        self.startScan(self.walletId);
    }

    self.startScan = function (walletId) {
        $log.debug('Scanning wallet ' + walletId);
        var c = profileService.walletClients[walletId];
        if (!c.isComplete()) return;
        /*
      if (self.walletId == walletId)
        self.setOngoingProcess('scanning', true);

      c.startScan({
        includeCopayerBranches: true,
      }, function(err) {
        if (err && self.walletId == walletId) {
          self.setOngoingProcess('scanning', false);
          self.handleError(err);
          $rootScope.$apply();
        }
      });
        */
    };

    /**
     * 设置语言
     */
    self.setUxLanguage = function () {
        var userLang = uxLanguage.update();
        self.defaultLanguageIsoCode = userLang;
        self.defaultLanguageName = uxLanguage.getName(userLang);
    };

    /**
     * 设置资讯行情计价货币
     */
    self.setUxCurrency = function () {
        var userCoin = uxCurrency.update();
        self.defaultCurrencyIsoCode = userCoin;
        self.defaultCurrencyName = uxCurrency.getName(userCoin);
    };



    self.setAddressbook = function (ab) {
        if (ab) {
            self.addressbook = ab;
            return;
        }

        addressbookService.list(function (err, ab) {
            if (err) {
                $log.error('Error getting the addressbook');
                return;
            }
            self.addressbook = ab;
        });
    };


    function getNumberOfSelectedSigners() {
        var count = 1; // self
        self.copayers.forEach(function (copayer) {
            if (copayer.signs)
                count++;
        });
        return count;
    }

    self.isEnoughSignersSelected = function () {
        if (self.m === self.n)
            return true;
        return (getNumberOfSelectedSigners() >= self.m);
    };

    self.getWallets = function () {
        return profileService.getWallets('livenet');
    };

    self.getToAddressLabel = function (value) {
        var validationResult = aliasValidationService.validate(value);

        if (validationResult.isValid) {
            var aliasObj = aliasValidationService.getAliasObj(validationResult.attestorKey);
            return gettextCatalog.getString('To') + " " + gettextCatalog.getString(aliasObj.title);
        }

        return gettextCatalog.getString('To email');
    };
    self.getAddressValue = function (value) {
        var validationResult = aliasValidationService.validate(value);

        if (validationResult.isValid) {
            return validationResult.account;
        }

        return value;
    };
    $rootScope.$on('Local/ClearHistory', function (event) {
        $log.debug('The wallet transaction history has been deleted');
        self.txHistory = self.completeHistory = [];
        self.updateHistory();
    });

    $rootScope.$on('Local/AddressbookUpdated', function (event, ab) {
        self.setAddressbook(ab);
    });

    // UX event handlers
    $rootScope.$on('Local/ColorUpdated', function (event) {
        self.updateColor();
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    $rootScope.$on('Local/AliasUpdated', function (event) {
        self.updateAlias();
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    $rootScope.$on('Local/SingleAddressFlagUpdated', function (event) {
        self.updateSingleAddressFlag();
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    $rootScope.$on('Local/SpendUnconfirmedUpdated', function (event) {
        self.setSpendUnconfirmed();
        self.updateAll();
    });

    $rootScope.$on('Local/ProfileBound', function () {
    });

    $rootScope.$on('Local/NewFocusedWallet', function () {
        self.setUxLanguage();
        self.setUxCurrency();
    });

    $rootScope.$on('Local/LanguageSettingUpdated', function () {
        self.setUxLanguage();
    });

    $rootScope.$on('Local/CurrencySettingUpdated', function () {
        self.setUxCurrency();
    });


    $rootScope.$on('Local/UnitSettingUpdated', function (event) {
        breadcrumbs.add('UnitSettingUpdated');
        self.updateAll();
        self.updateTxHistory(3);
    });

    $rootScope.$on('Local/NeedFreshHistory', function (event) {
        breadcrumbs.add('NeedFreshHistory');
        self.updateTxHistory(3);
    });


    $rootScope.$on('Local/WalletCompleted', function (event) {
        self.setFocusedWallet();
        go.walletHome();
    });

    //  self.debouncedUpdate = lodash.throttle(function() {
    //    self.updateAll({
    //      quiet: true
    //    });
    //    self.updateTxHistory(3);
    //  }, 4000, {
    //    leading: false,
    //    trailing: true
    //  });

    $rootScope.$on('Local/Resume', function (event) {
        $log.debug('### Resume event');
        //todo delete
        // var lightWallet = require('intervaluecore/light_wallet.js');
        // lightWallet.refreshLightClientHistory();
        //self.debouncedUpdate();
    });

    $rootScope.$on('Local/BackupDone', function (event) {
        self.needsBackup = false;
        $log.debug('Backup done');
        storageService.setBackupFlag('all', function (err) {
            if (err)
                return $log.warn("setBackupFlag failed: " + JSON.stringify(err));
            $log.debug('Backup done stored');
        });
    });

    $rootScope.$on('Local/DeviceError', function (event, err) {
        self.showErrorPopup(err, function () {
            if (self.isCordova && navigator && navigator.app) {
                navigator.app.exitApp();
            }
        });
    });


    $rootScope.$on('Local/WalletImported', function (event, walletId) {
        self.needsBackup = false;
        storageService.setBackupFlag(walletId, function () {
            $log.debug('Backup done stored');
            addressService.expireAddress(walletId, function (err) {
                $timeout(function () {
                    self.txHistory = self.completeHistory = [];
                    self.startScan(walletId);
                }, 500);
                self.updateTxHistory(3);
            });
        });
    });

    $rootScope.$on('NewIncomingTx', function () {
        self.updateAll({
            walletStatus: null,
            untilItChanges: true,
            triggerTxUpdate: true,
        });
    });



    $rootScope.$on('NewOutgoingTx', function () {
        breadcrumbs.add('NewOutgoingTx');
        self.updateAll({
            walletStatus: null,
            untilItChanges: true,
            triggerTxUpdate: true,
        });
    });

    lodash.each(['NewTxProposal', 'TxProposalFinallyRejected', 'TxProposalRemoved', 'NewOutgoingTxByThirdParty',
        'Local/NewTxProposal', 'Local/TxProposalAction'
    ], function (eventName) {
        $rootScope.$on(eventName, function (event, untilItChanges) {
            self.updateAll({
                walletStatus: null,
                untilItChanges: untilItChanges,
                triggerTxUpdate: true,
            });
        });
    });

    $rootScope.$on('ScanFinished', function () {
        $log.debug('Scan Finished. Updating history');
        self.updateAll({
            walletStatus: null,
            triggerTxUpdate: true,
        });
    });


    $rootScope.$on('Local/NoWallets', function (event) {
        $timeout(function () {
            self.hasProfile = true;
            self.noFocusedWallet = true;
            self.isComplete = null;
            self.walletName = null;
            go.path('preferencesGlobal.import');
        });
    });

    $rootScope.$on('Local/NewFocusedWallet', function (event, cb) {
        console.log('on Local/NewFocusedWallet');
        self.setFocusedWallet(cb);
        //self.updateTxHistory(3);
        go.walletHome();
    });

    $rootScope.$on('Local/NewFocusedWalletToPayment', function (event, cb) {
        console.log('Local/NewFocusedWalletToPayment');
        self.setFocusedWallet(cb);
        //self.updateTxHistory(3);
        //go.walletHome();
    });

    $rootScope.$on('Local/SetTab', function (event, tab, reset, swtichToHome) {
        //console.log("SetTab " + tab + ", reset " + reset);
        self.setTab(tab, reset, null, swtichToHome);
    });

    $rootScope.$on('Local/RequestTouchid', function (event, cb) {
        window.plugins.touchid.verifyFingerprint(
            gettextCatalog.getString('Scan your fingerprint please'),
            function (msg) {
                // OK
                return cb();
            },
            function (msg) {
                // ERROR
                return cb(gettext('Invalid Touch ID'));
            }
        );
    });

    $rootScope.$on('Local/ShowAlert', function (event, msg, msg_icon, cb) {
        self.showPopup(msg, msg_icon, cb);
    });

    $rootScope.$on('Local/ShowErrorAlert', function (event, msg, cb) {
        self.showErrorPopup(msg, cb);
    });

    $rootScope.$on('Local/NeedsPassword', function (event, isSetup, error_message, cb) {
        self.askPassword = {
            isSetup: isSetup,
            error: error_message,
            callback: function (err, pass) {
                self.askPassword = null;
                return cb(err, pass);
            },
        };
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    lodash.each(['NewCopayer', 'CopayerUpdated'], function (eventName) {
        $rootScope.$on(eventName, function () {
            // Re try to open wallet (will triggers)
            self.setFocusedWallet();
        });
    });

    $rootScope.$on('Local/NewEncryptionSetting', function () {
        var fc = profileService.focusedClient;
        self.isPrivKeyEncrypted = fc.isPrivKeyEncrypted();
        $scope.index.changePD = false;
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    $rootScope.$on('Local/pushNotificationsReady', function () {
        self.usePushNotifications = true;
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    /**
     * 生成待授权二维码
     */
    $rootScope.$on('Local/ShadowAddress', function(event,address){
        self.signatureAddr = address;
    });

    /**
     * 生成授权签名二维码
     */
    $rootScope.$on('Local/ShadowAddressForm', function(event,address){
        var shadowWallet = require('intervaluecore/shadowWallet');
        shadowWallet.getSignatureCode(address,function(signatureCodeQRCode) {
            if(typeof signatureCodeQRCode == "object"){
                self.signatureCodeQRCode = JSON.stringify(signatureCodeQRCode);
                self.showshadow = true;
                self.shadowstep = 'hot2';
                console.log(signatureCodeQRCode);
            }else{
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString("The address: ")+gettextCatalog.getString(signatureCodeQRCode));
            }
            $timeout(function () {
                $rootScope.$apply();
            });
        });
    });

    /**
     * 冷钱包授权签名详情
     */
    $rootScope.$on('Local/ShadowSignInvitation', function(event,signatureDetlCode){
        self.signatureDetlCodeAddr = signatureDetlCode.addr;
        self.sinatureRandom = signatureDetlCode.random;
        self.signatureDetlCode = JSON.stringify(signatureDetlCode);
        self.showshadow = true;
        self.shadowstep = 'cold1';
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    /**
     * 热钱包扫描授权签名详情
     */
    $rootScope.$on('Local/generateShadowWallet', function(event,shadowWallet){
        self.signatureData = shadowWallet.sign;
        self.shadowWallet = JSON.stringify(shadowWallet);
        self.shadowstep = 'hot3';
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    /**
     * 热钱包生成未签名的交易二维码
     */
    $rootScope.$on('Local/unsignedTransactionIfo', function(event,unsignedTransactionIfo){
        self.unsignedTransactionIfo = JSON.stringify(unsignedTransactionIfo);
        self.showshadow = true;
        self.shadowstep = 'hsend1';
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    /**
     * 热钱包生成已签名的交易信息
     */
    $rootScope.$on('Local/signedTransactionIfoHot', function(event,signedTransactionIfo){
        self.signatureIfo = signedTransactionIfo.signature;
        self.signedTransactionIfo = JSON.stringify(signedTransactionIfo);
        self.showshadow = true;
        self.shadowstep = 'hsend2';
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    /**
     * 冷钱包扫码后，展示预览交易信息
     */
    $rootScope.$on('Local/showUnsignedTransactionIfo', function(event,showUnsignedTransactionIfo){
        self.showUnsignedTransactionIfoObj = showUnsignedTransactionIfo;
        self.showUnsignedTransactionInfo = JSON.stringify(showUnsignedTransactionIfo);
        self.ShowAmount = profileService.formatAmount(parseInt(showUnsignedTransactionIfo.amount),'bytes');
        self.showshadow = true;
        self.showshadow100 = true;
        self.shadowstep = 'csend1';
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    /**
     * 冷钱包点击授权签名后，生成对应二维码
     * @param obj
     */
    $rootScope.$on('Local/signedTransactionIfo', function(event,signedTransactionIfo){
        self.signedTransactionIfo = JSON.stringify(signedTransactionIfo);
        self.showshadow = true;
        self.shadowstep = 'csend2';
        $timeout(function () {
            $rootScope.$apply();
        });
    });
    let news = require("intervaluecore/newsServers");

    //24小时显示小时，超过24小时显示日期
    self.getTimeFromNow =  function(datestr){
        if(datestr){
            let aa = new Date(Date.parse(datestr.replace(/-/g,"/")))
            let now = new Date()
            let hour = (now.getTime() - aa.getTime())/(1000*60*60)
            let showtime = null
            if(hour < 0){
                return "1分钟前"
            }
            if(hour < 1 ){
                showtime = Math.floor(hour*60)
                return showtime+"分钟前"
            }else if(hour >= 1 && hour <=23){
                showtime = Math.floor(hour)
                return showtime+"小时前"
            }else{
                showtime = (datestr.split(" "))[0]
                return showtime
            }
        }
        return null
    };


    function timeChange (valueTime) {

        if (valueTime) {
            var newData = Date.parse(new Date());
            var diffTime = Math.abs(newData - valueTime);
            if (diffTime > 7 * 24 * 3600 * 1000) {
                var date = new Date(valueTime);
                var y = date.getFullYear();
                var m = date.getMonth() + 1;
                m = m < 10 ? ('0' + m) : m;
                var d = date.getDate();
                d = d < 10 ? ('0' + d) : d;
                var h = date.getHours();
                h = h < 10 ? ('0' + h) : h;
                var minute = date.getMinutes();
                var second = date.getSeconds();
                minute = minute < 10 ? ('1' + minute) : minute;
                second = second < 10 ? ('0' + second) : second;
                return m + '-' + d + ' ' + h + ':' + minute;

            } else if (diffTime < 7 * 24 * 3600 * 1000 && diffTime > 24 * 3600 * 1000) {
                // //注释("一周之内");

                // var time = newData - diffTime;
                var dayNum = Math.floor(diffTime / (24 * 60 * 60 * 1000));

                if (dayNum===1){
                    return '昨天'
                }
            } else {
                return '今天'
            }
        }
    }

    //获取快讯固定的时间
    self.getWeekNow =  function(datestr){
        if(datestr){
            //当前年月日
            var date = new Date();
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var day = date.getDate() < 10 ? '0'+ date.getDate() :  date.getDate();
            var comprared = year + '-' + month + '-' + day;
            var datestrtime = new Date(year+'-'+month+'-'+day).getTime();
            var cstrtime = new Date(datestr).getTime();
            //计算星期几
            let qdatearr = datestr.split('-');
            let qdatearr2 = new Date(qdatearr[0], parseInt(qdatearr[1] - 1), qdatearr[2]);
            let qweeknow = String(qdatearr2.getDay()).replace("0","日").replace("1","一").replace("2","二").replace("3","三").replace("4","四").replace("5","五").replace("6","六");
            let qdatenow = "星期" + qweeknow;
            if (datestr ==  comprared) {
                return '今天'+ ' ' +qdatearr[1] + '/' + qdatearr[2] + ' '+ qdatenow;
            }else if(parseInt(datestrtime) == parseInt(cstrtime) + 86400000){
                return '昨天'+ ' ' +qdatearr[1] + '/' + qdatearr[2] + ' '+ qdatenow;
            }else{
                return qdatearr[1] + '/' + qdatearr[2] + ' '+ qdatenow;
            }
        }
        return null
    };
    //获取快讯滚动的时间
    self.getDateNow =  function(datestr){
        if(datestr){
            let qdatearr = datestr.split('-');
            return qdatearr[0] + '-' + qdatearr[1] + '-' + qdatearr[2];
        }
        return null
    };


    //行情排序

    self.orderByValue = '';
    self.orderByPrice = '';
    self.orderByQuoteChange='';
    self.orderByList = [self.orderByQuoteChange,self.orderByPrice,self.orderByValue];

    //根据总市值排序
    self.orderbyShowValue = function(){
        if(self.orderByValue == '-values') self.orderByValue = 'values'; else self.orderByValue = '-values';
        self.orderByList = [self.orderByValue,self.orderByQuoteChange,self.orderByPrice];
    }

    //根据货币单价排序
    self.orderbyShowPrice = function(){
        if(self.orderByPrice == '-price') self.orderByPrice = 'price'; else self.orderByPrice = '-price';
        self.orderByList = [self.orderByPrice,self.orderByQuoteChange,self.orderByValue];

    }

    //根据24H涨幅排序
    self.orderbyShowGains = function(){
        if(self.orderByQuoteChange == '-quoteChange') self.orderByQuoteChange = 'quoteChange'; else self.orderByQuoteChange = '-quoteChange';
        self.orderByList = [self.orderByQuoteChange,self.orderByPrice,self.orderByValue];
    }


    //定时拉取信息
    setInterval(function() {
        if (navigator.onLine) {
            if(!self.online){
                self.newsData();
                self.quickData();
            }
            self.online = true;
            self.currencyData();
        } else {
            self.online = false;
        }
    }, 5 * 1000);

    self.newsData = function (upyn) {
        if(!self.online){
            if (navigator.onLine) {
                self.online = true;
            } else {
                self.online = false;
                self.loading = true;
                $timeout(function () {
                    self.loading = false;
                },1000);
                return;
            }
        }
        if(upyn == 'up'){
            self.loading = true;
            news.getNewsData(20,1,null,function(res) {
                if(!!res && res.code == 0) {
                    //给返回对象加字段
                    lodash.forEach(res.page.list, function(value, key){
                        value.greentime = self.getTimeFromNow(value.createTime);
                    })
                    angular.element(document.getElementById('newupheight')).css('display', 'none');
                    self.newslists = res.page.list;
                    self.newslist = res.page.list;
                    self.newspage = 2;
                    $timeout(function(){
                        $scope.$apply();
                    });

                    return;
                }else{
                    self.newslist = '';
                }

            });
            $timeout(function () {
                self.loading = false;
            },500);

        }else{
            self.loading = true;
            news.getNewsData(20,self.newspage,null,function(res) {
                if(!!res && res.code == 0) {
                    self.shownewsloading = false;
                    //给返回对象加字段
                    lodash.forEach(res.page.list, function(value, key){
                        value.greentime = self.getTimeFromNow(value.createTime);
                    })
                    if(JSON.stringify(self.newslists) == '[]'){
                        self.newslists = res.page.list;
                        self.newslist = res.page.list;
                        self.newspage += 1;
                        $timeout(function(){
                            $scope.$apply();
                        })
                    }else{
                        self.newslists = self.newslists.concat(res.page.list);
                        self.newslist = self.newslists;
                        if(self.newspage == res.page.totalPage){
                            self.shownonews = true;
                            self.shownewsloading = false;
                        }
                        self.newspage += 1;
                        $timeout(function(){
                            $scope.$apply();
                        });
                        return;
                    }
                }else
                    self.newslist = '';

            });
            self.loading = false;
        }
    };

    self.quickData = function (upyn) {
        if(!self.online){
            if (navigator.onLine) {
                self.online = true;
            } else {
                self.online = false;
                self.loading = true;
                $timeout(function () {
                    self.loading = false;
                },1000);
                return;
            }
        }
        if(upyn == 'up'){
            self.loading = true;
            news.getQuickData(20,1,null,null,function(res) {
                var list = [];
                if(!!res && res.code == 0) {
                    angular.element(document.getElementById('quickupheight')).css('display', 'none');
                    angular.element(document.getElementById('datenow')).css('display', 'block');
                    self.quicklists = {};
                    //给返回对象加字段
                    lodash.forEach(res.page.list, function(value, key){
                        value.grayweek = self.getWeekNow((value.createTime).substring(0,lodash.indexOf((value.createTime), ' ', 0)));
                        value.graydate = self.getDateNow((value.createTime).substring(0,lodash.indexOf((value.createTime), ' ', 0)));
                        value.greentime = self.getTimeFromNow(value.createTime);
                        value.greenhms = (value.createTime).slice((lodash.indexOf((value.createTime), ' ', 0)+1),-3);
                    })
                    list = res.page.list;
                    //转换返回对象的格式
                    for(var i = 0; i < list.length; i++) {
                        if(!self.quicklists[list[i].grayweek]) {
                            var arr = [];
                            arr.push(list[i]);
                            self.quicklists[list[i].grayweek] = arr;
                        }else {
                            self.quicklists[list[i].grayweek].push(list[i])
                        }
                    }
                    self.quicklistshow = res.page.list;
                    self.quicklist = self.quicklists;
                    self.quickpage = 2;
                    $timeout(function () {
                        self.quickdatanow = res.page.list[0].grayweek;
                        $scope.$apply();
                    });
                }else
                    cself.quicklistshow = '';
            });
            $timeout(function () {
                self.loading = false;
            },500);
        }else{
            self.loading = true;
            news.getQuickData(20,self.quickpage,null,null,function(res) {
                var list = [];
                if(!!res && res.code == 0) {
                    //给返回对象加字段
                    lodash.forEach(res.page.list, function(value, key){
                        value.grayweek = self.getWeekNow((value.createTime).substring(0,lodash.indexOf((value.createTime), ' ', 0)));
                        value.graydate = self.getDateNow((value.createTime).substring(0,lodash.indexOf((value.createTime), ' ', 0)));
                        value.greentime = self.getTimeFromNow(value.createTime);
                        value.greenhms = (value.createTime).slice((lodash.indexOf((value.createTime), ' ', 0)+1),-3);
                    })
                    list = res.page.list;
                    //转换返回对象的格式
                    for(var i = 0; i < list.length; i++) {
                        if(!self.quicklists[list[i].grayweek]) {
                            var arr = [];
                            arr.push(list[i]);
                            self.quicklists[list[i].grayweek] = arr;
                        }else {
                            self.quicklists[list[i].grayweek].push(list[i])
                        }
                    }
                    self.quicklistshow = res.page.list;
                    self.quicklist = self.quicklists;
                    if(self.quickpage == res.page.totalPage){
                        self.shownoquick = true;
                        self.showquicksloading = false;
                    }
                    self.quickpage += 1;
                    $timeout(function () {
                        if(self.quickpage == 2){
                            self.quickdatanow = res.page.list[0].grayweek;
                        }else{
                            return;
                        }
                        $scope.$apply();
                    });
                }else
                    self.quicklistshow = '';
            });
            self.loading = false;
        }
    };

    self.currencyData = function (upyn) {
        if(!self.online){
            if (navigator.onLine) {
                self.online = true;
            } else {
                self.online = false;
                self.loading = true;
                $timeout(function () {
                    self.loading = false;
                },1000);
                return;
            }
        }

        //inve 行情
        news.getInveData2(function (res) {
            if(!!res && res != null) {
                self.coininvelist = res.page.list;
            }
        });

        if(upyn == 'up'){
            self.loading = true;
            news.getCurrencyData(6,1,null,function(res) {
                if(!!res) {
                    angular.element(document.getElementById('coinupheight')).css('display', 'none');
                    self.coinlists = res.page.list;
                    self.coinlist = res.page.list;
                    self.coinpage = 2;
                    $timeout(function(){
                        $scope.$apply();
                    })
                    return;
                }else
                    self.coinlist = '';
            });
            $timeout(function () {
                self.loading = false;
            },500);
        }else{
            self.loading = true;
            news.getCurrencyData(6,self.coinpage,null,function(res) {
                if(!!res) {
                    self.showcoinloading = false;
                    if(JSON.stringify(self.coinlists) == '[]'){
                        self.coinlists = res.page.list;
                        self.coinlist = res.page.list;
                        self.coinpage += 1;
                        $timeout(function(){
                            $scope.$apply();
                        })
                    }else{
                        // self.coinlists = self.coinlists.concat(res.page.list);
                        self.coinlist = self.coinlists;
                        if(self.coinpage == res.page.totalPage){
                            self.shownonews = true;
                            self.showcoinloading = false;
                        }
                        self.coinpage += 1;
                        $timeout(function(){
                            $scope.$apply();
                        });
                        return;
                    }
                }else
                    self.coinlist = '';
            });
            self.loading = false;
        }

    };

    self.getexRate  = function(){
        news.getInveData2(function (res) {
            if (!!res && res != null) {
                self.invedollar = res.page.list.INVE.price;
                self.invermb = res.page.list.INVE.cnyPrice;
                $timeout(function(){
                    $scope.$apply();
                })
            }
        });
    }
    self.getexRate();

    self.quickequaltop = function(){
        var curtop = document.getElementById('removescroll2').scrollTop;
        var dateall = document.querySelectorAll('.news .letterlist .itemin .date');
        for(var i = 1; i < dateall.length; i++){
            if(self.currentfixDate){
                if(curtop >= dateall[i].offsetTop - 78  && curtop <= dateall[i].offsetTop + 78 ){
                    if(curtop < dateall[i].offsetTop){
                        self.currentfixDate = dateall[i-1]
                    }else{
                        self.currentfixDate = dateall[i]
                    }
                    self.quickdatanow = self.currentfixDate.innerText;
                }
            }else{
                self.currentfixDate = dateall[0];
            }

        }
    }

    //	加载更多
    self.loadmore = function(outlr, inlr, num){
        if(outlr == 'new1tab'){
            if(self.shownonews == true){
                self.shownewsloading = false;
                return;
            }else{
                self.shownewsloading = true;
                self.newsData();
            }
        }else if(outlr == 'new2tab'){
            if(self.shownoquick == true){
                self.showquicksloading = false;
                return;
            }else{
                self.showquicksloading = true;
                self.quickData();
            }
        }else if(outlr == 'new3tab'){
            if(self.shownocoin == true){
                self.showcoinloading = false;
                return;
            }else{
                self.showcoinloading = true;
                self.currencyData();
            }
        }
    }


    // 新闻内容
    self.openNewsinModal = function(id) {
        $rootScope.modalOpened = true;

        var ModalInstanceCtrl = function($scope, $modalInstance, $sce) {
            $scope.newsInfoData = function (useid = id) {
                if(!$scope.online){
                    if (navigator.onLine) {
                        $scope.online = true;
                    } else {
                        $scope.online = false;
                        $scope.loading = true;
                        $timeout(function () {
                            $scope.loading = false;
                        },1000);
                        return;
                    }
                }
                news.getNewsInfo(useid,function (res) {
                    if(!!res &&  res.code == 0) {
                        $scope.newstitle = $sce.trustAsHtml(res.article.title);
                        $scope.newscontent = $sce.trustAsHtml(res.article.content);

                        $timeout(function(){
                            $scope.$apply();
                        });
                    }else
                        console.error("error~!");
                })
            }
            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
                for(let item in self.newslist){
                    if(self.newslist[item].id == id) self.newslist[item].pageviews += 1;
                }

            };
        };

        var modalInstance = $modal.open({
            templateUrl: 'views/modals/newsin.html',
            controller: ModalInstanceCtrl,
        });

        var disableCloseModal = $rootScope.$on('closeModal', function() {
            modalInstance.dismiss('cancel');
        });

        modalInstance.result.finally(function() {
            $rootScope.modalOpened = false;
            disableCloseModal();
            var m = angular.element(document.getElementsByClassName('reveal-modal'));
            m.addClass(animationService.modalAnimated.slideOutDown);
        });

        modalInstance.result.then(function onDestModalDone(addr) {

        });
    };


    self.towalletname = function (image, name, addr, ammount, walletId, mnemonic, mnemonicEncrypted) {
        $state.go('walletnamea', { image: image, name: name, addr: addr, ammount: ammount, walletId: walletId, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted});
    };

    /**
     * 根据当前地址生成对应二维码
     * @param address
     */
    self.generatePubkey =  function (address) {
        self.verificationAddress = "inWallet:"+address;
        self.showshadow = true;
        self.shadowstep = 'hot1';
        $timeout(function () {
            $rootScope.$apply();
        });

    };
    //   self.generateAddressQRCode =  function () {
    //       var form = $scope.addressForm;
    //       alert(form);
    //       var address = form.address;
    //
    //     var shadowWallet = require('intervaluecore/shadowWallet');
    //     shadowWallet.getVerificationQRCode(address,function(verificationQRCode) {
    //         if(verificationQRCode){
    //             self.verificationQRCode = JSON.stringify(verificationQRCode);
    //             self.showshadow = true;
    //             $timeout(function () {
    //                 $rootScope.$apply();
    //             });
    //             console.log(verificationQRCode);
    //         }else{
    //             self.showshadow = false;
    //             alert('Please scan the cold wallet QR code or fill in the address first!!');
    //         }
    //     });
    // };

    // (function () {
    //     "drag dragover dragstart dragenter".split(" ").forEach(function (e) {
    //         window.addEventListener(e, function (e) {
    //             e.preventDefault();
    //             e.stopPropagation();
    //             e.dataTransfer.dropEffect = "copy";
    //         }, false);
    //     });
    //     document.addEventListener('drop', function (e) {
    //         e.preventDefault();
    //         e.stopPropagation();
    //         for (var i = 0; i < e.dataTransfer.files.length; ++i) {
    //             go.handleUri(e.dataTransfer.files[i].path);
    //         }
    //     }, false);
    // })();
    console.log(profileService.walletClients);

    if (navigator.onLine) {
        self.online = true;
    } else {
        self.online = false;
    }

});
