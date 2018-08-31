'use strict';
var db = require('intervaluecore/db');
var shadowWallet = require('intervaluecore/shadowWallet');
angular.module('copayApp.controllers').controller('signedTransactionIfoControllers',
    function($scope, $rootScope, $timeout,go,profileService) {
        var self = this;
        var mnemonic ;
        this.signedTransaction = function () {
            var form = $scope.signedTransactionIfo;
            var obj = JSON.parse(form.$$element[0][0].value);
            var wc = profileService.walletClients;
            db.query('select extended_pubkey  from extended_pubkeys as a  left join my_addresses as b on a.wallet=b.wallet where b.address=?',[obj.from.address],function (rows) {
                for(var index in wc){
                    if(rows[0].extended_pubkey == wc[index].credentials.xPubKey){
                        mnemonic = wc[index].credentials.mnemonic;
                        break;
                    }
                }
                shadowWallet.signTradingUnit(obj,mnemonic,function (objrequest) {
                    if(typeof objrequest == "object"){
                        $rootScope.$emit('Local/signedTransactionIfo', objrequest);
                    }else {
                        alert('error')
                    }
                });

            });
        }


    });
