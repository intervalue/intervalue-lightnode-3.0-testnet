'use strict';
var db = require('intervaluecore/db');
var shadowWallet = require('intervaluecore/shadowWallet');
angular.module('copayApp.controllers').controller('signaturePubkeyControllers',
    function($scope, $rootScope, $timeout,go) {
    var self = this;

        /**
         * 根据当前地址生成对应pubkey二维码
         * @param address
         */
    self.takePubkey = function (address) {
        self.verificationQRCode = shadowWallet.getVerificationQRCode(address);
    }

    });
