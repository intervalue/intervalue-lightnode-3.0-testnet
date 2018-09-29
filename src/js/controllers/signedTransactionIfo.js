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
            var obj = JSON.parse(form.transactioninfo.$modelValue);

            //var obj = JSON.parse(form.$$element[0][0].value);
            var wc = profileService.walletClients;
            db.query('select extended_pubkey,a.wallet   from extended_pubkeys as a  left join my_addresses as b on a.wallet=b.wallet where b.address=?',[obj.fromAddress],function (rows) {
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
                                            return $rootScope.$emit('Local/ShowErrorAlert', objrequest);
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
                                        return $rootScope.$emit('Local/ShowErrorAlert', objrequest);
                                    }
                                });
                                break;
                            }
                        }
                    }
                }else {
                    console.log("error not find address ");
                    return $rootScope.$emit('Local/ShowErrorAlert', "error not find address : "+obj.fromAddress);
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
            var opts = JSON.parse(form.txStIfo.$modelValue);
            var wallet = require('intervaluecore/wallet');
            wallet.sendMultiPayment(opts,function (cb) {
                if(typeof cb =="object"){
                    $rootScope.$emit('Local/paymentDone');
                }else {
                    console.log("error: "+cb);
                    return $rootScope.$emit('Local/ShowErrorAlert', "sendPaymentHot :"+cb);
                }
            });
        }
    });
