'use strict';
var db = require('intervaluecore/db');
var shadowWallet = require('intervaluecore/shadowWallet');
angular.module('copayApp.controllers').controller('signedTransactionIfoControllers',
    function($scope, $rootScope, $timeout,go,profileService) {
        var self = this;
        var xPrivKey ;

        /**
         * 冷钱包完成授权签名
         */
        self.signedTransaction = function () {
            var form = $scope.signedTransactionIfo;
            var obj = JSON.parse(form.$$element[0][0].value);
            var wc = profileService.walletClients;
            db.query('select extended_pubkey  from extended_pubkeys as a  left join my_addresses as b on a.wallet=b.wallet where b.address=?',[obj.from[0].address],function (rows) {
                if(rows.length > 0){
                    for(var index in wc){
                        if(rows[0].extended_pubkey == wc[index].credentials.xPubKey){
                            if(!wc[index].credentials.mnemonic){
                                if(wc[index].credentials.walletId != profileService.focusedClient.walletId){
                                    profileService.setAndStoreFocus(rows[0].wallet, function() {
                                    });
                                }
                                profileService.insistUnlockFC(null, function (err){
                                    if (err) return;
                                    xPrivKey = profileService.focusedClient.credentials.xPrivKey;
                                    shadowWallet.signTradingUnit(obj,xPrivKey,function (objrequest) {
                                        if(typeof objrequest == "object"){
                                            $rootScope.$emit('Local/signedTransactionIfo', objrequest);
                                        }else {
                                            console.log("error: "+objrequest);
                                            return self.setSendError(objrequest);
                                        }
                                    });
                                });
                                break;
                            }else {
                                xPrivKey = wc[index].credentials.xPrivKey;
                                shadowWallet.signTradingUnit(obj,xPrivKey,function (objrequest) {
                                    if(typeof objrequest == "object"){
                                        $rootScope.$emit('Local/signedTransactionIfo', objrequest);
                                    }else {
                                        console.log("error: "+objrequest);
                                        return self.setSendError(objrequest);
                                    }
                                });
                                break;
                            }
                        }
                    }
                }else {
                    console.log("error not find address ");
                    return self.setSendError("error not find address");
                }

            });
        };

        this.setSendError = function(err) {
            console.log(this.error);
            $timeout(function() {
                $scope.$digest();
            }, 1);
        };

        /**
         * 冷钱包授权签名后，执行交易
         */
        self.sendPaymentHot = function () {
            var form = $scope.signedTransactionIfo;
            var opts = JSON.parse(form.$$element[0][0].value);
            var wallet = require('intervaluecore/wallet');
            wallet.sendMultiPayment(opts,function (cb) {
                if(typeof cb =="object"){
                    $rootScope.$emit('Local/SetTab', 'wallet');
                }else {
                    console.log("error: "+cb);
                    return self.setSendError(cb);
                }
            });
        }

    });
