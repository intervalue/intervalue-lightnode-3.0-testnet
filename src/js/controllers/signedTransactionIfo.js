'use strict';
var db = require('intervaluecore/db');
var shadowWallet = require('intervaluecore/shadowWallet');
angular.module('copayApp.controllers').controller('signedTransactionIfoControllers',
    function($scope, $rootScope, $timeout,go,profileService) {
        var self = this;
        var mnemonic ;

        /**
         * 冷钱包完成授权签名
         */
        self.signedTransaction = function () {
            var form = $scope.signedTransactionIfo;
            var obj = JSON.parse(form.$$element[0][0].value);
            var wc = profileService.walletClients;
            alert(obj.from[0].address);
            alert(JSON.stringify(wc));
            db.query('select extended_pubkey  from extended_pubkeys as a  left join my_addresses as b on a.wallet=b.wallet where b.address=?',[obj.from[0].address],function (rows) {
                if(rows.length > 0){
                    for(var index in wc){
                        if(rows[0].extended_pubkey == wc[index].credentials.xPubKey){
                            mnemonic = wc[index].credentials.mnemonic;
                            break;
                        }
                    }
                }else {
                    alert("rows.lenght-=====-=-=-==11112-");
                }
                alert("rows.lenght-=====-=-=-22222==-");
                alert(mnemonic);
                shadowWallet.signTradingUnit(obj,mnemonic,function (objrequest) {
                    alert('冷钱包进行签名22222');
                    if(typeof objrequest == "object"){
                        alert(JSON.stringify(objrequest));
                        $rootScope.$emit('Local/signedTransactionIfo', objrequest);
                    }else {
                        alert('error')
                    }
                });
            });
        };


        self.hotSendPayment = function () {
            var form = $scope.signedTransactionIfo;
            var obj = JSON.parse(form.$$element[0][0].value);
            var fc = profileService.focusedClient;
            fc.sendMultiPayment(form, function(err, unit, mnemonics) {
                // if multisig, it might take very long before the callback is called
                //indexScope.setOngoingProcess(gettext('sending'), false);
                breadcrumbs.add('done payment in ' + asset + ', err=' + err);
                delete self.current_payment_key;
                resetAddressValidation();
                profileService.bKeepUnlocked = false;
                if (err) {
                    if (typeof err === 'object') {
                        err = JSON.stringify(err);
                        eventBus.emit('nonfatal_error', "error object from sendMultiPayment: " + err, new Error());
                    }
                    else if (err.match(/device address/))
                        err = "This is a private asset, please send it only by clicking links from chat";
                    else if (err.match(/no funded/))
                        err = "Not enough spendable funds, make sure all your funds are confirmed";
                    else if (err.match(/authentifier verification failed/))
                        err = "Check that smart contract conditions are satisfied and signatures are correct";
                    else if (err.match(/precommit/))
                        err = err.replace('precommit callback failed: ', '');
                    return self.setSendError(err);
                }
                var binding = self.binding;
                self.resetForm();
                $rootScope.$emit("NewOutgoingTx");
                if (original_address){
                    var db = require('intervaluecore/db.js');
                    db.query("INSERT INTO original_addresses (unit, address, original_address) VALUES(?,?,?)",
                        [unit, to_address, original_address]);
                }
                if (recipient_device_address) { // show payment in chat window
                    eventBus.emit('sent_payment', recipient_device_address, amount || 'all', asset, !!binding);
                    if (binding && binding.reverseAmount) { // create a request for reverse payment
                        if (!my_address)
                            throw Error('my address not known');
                        var paymentRequestCode = 'intervalue:' + my_address + '?amount=' + binding.reverseAmount + '&asset=' + encodeURIComponent(binding.reverseAsset);
                        var paymentRequestText = '[reverse payment](' + paymentRequestCode + ')';
                        device.sendMessageToDevice(recipient_device_address, 'text', paymentRequestText);
                        var body = correspondentListService.formatOutgoingMessage(paymentRequestText);
                        correspondentListService.addMessageEvent(false, recipient_device_address, body);
                        device.readCorrespondent(recipient_device_address, function(correspondent) {
                            if (correspondent.my_record_pref && correspondent.peer_record_pref) chatStorage.store(correspondent.device_address, body, 0, 'html');
                        });

                        // issue next address to avoid reusing the reverse payment address
                        if (!fc.isSingleAddress) walletDefinedByKeys.issueNextAddress(fc.credentials.walletId, 0, function() {});
                    }
                }
                else if (Object.keys(mnemonics).length) {
                    var mnemonic = mnemonics[to_address];
                    if (opts.send_all && asset === "base")
                        amount = assetInfo.stable;

                    self.openShareTextcoinModal(isEmail ? address.slice("textcoin:".length) : null, mnemonic, amount, asset, false, filePath);
                    $rootScope.$emit('Local/SetTab', 'history');
                }
                else // redirect to history
                    $rootScope.$emit('Local/SetTab', 'history');
            });
        }


    });
