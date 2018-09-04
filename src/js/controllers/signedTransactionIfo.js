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
            db.query('select extended_pubkey  from extended_pubkeys as a  left join my_addresses as b on a.wallet=b.wallet where b.address=?',[obj.from[0].address],function (rows) {
                if(rows.length > 0){
                    for(var index in wc){
                        if(rows[0].extended_pubkey == wc[index].credentials.xPubKey){
                            mnemonic = wc[index].credentials.mnemonic;
                            break;
                        }
                    }
                }else {
                    console.log("error not find address ");
                    return self.setSendError("error not find address");
                }
                shadowWallet.signTradingUnit(obj,mnemonic,function (objrequest) {
                    if(typeof objrequest == "object"){
                        $rootScope.$emit('Local/signedTransactionIfo', objrequest);
                    }else {
                        console.log("error: "+objrequest);
                        return self.setSendError(objrequest);
                    }
                });
            });
        };

        this.setSendError = function(err) {
            console.log(this.error);
            $timeout(function() {
                $scope.$digest();
            }, 1);
        };

    });
