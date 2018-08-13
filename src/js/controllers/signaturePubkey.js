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
    self.generatePubkey = function (address) {
        self.generateVerificationQRCode = shadowWallet.getVerificationQRCode(address);
    }

        /**
         * 生成授权签名
         * @param verificationQRCode
         */
    self.generateVerification = function(verificationQRCode){
        self.generateSignatureCode = shadowWallet.getSignatureCode(verificationQRCode);
    }


        /**
         * 生成授权签名详情
         * @param signatureCode
         */
    self.generateSignatureDetl = function(signatureCode){
        self.generateSignatureDetlCode = shadowWallet.getSignatureDetlCode(signatureCode);
    }

    });
