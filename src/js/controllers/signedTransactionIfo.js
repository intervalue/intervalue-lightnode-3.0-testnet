'use strict';
var db = require('intervaluecore/db');
var shadowWallet = require('intervaluecore/shadowWallet');
angular.module('copayApp.controllers').controller('signedTransactionIfoControllers',
    function($scope, $rootScope, $timeout,go,profileService) {
        var self = this;
        var random ;

        this.signedTransaction = function () {
            var form = $scope.signedTransactionIfo;
            var obj = JSON.parse(form.$$element[0][0].value);
            shadowWallet.signTradingUnit(obj,function (requestObj) {
                if(typeof requestObj == "object"){
                    $rootScope.$emit('Local/signedTransactionIfo', requestObj);
                }else {
                    alert('error')
                }
            });

        }
    });
