'use strict';
var db = require('intervaluecore/db');
var shadowWallet = require('intervaluecore/shadowWallet');
angular.module('copayApp.controllers').controller('signaturePubkeyControllers',
    function($scope, $rootScope, $timeout,go,profileService) {
        var self = this;

        /**
         * 根据当前地址生成对应pubkey二维码
         * @param address
         */

        self.generatePubkey =  function (address) {
            shadowWallet.getVerificationQRCode(address,function(verificationQRCode) {
                if(verificationQRCode){
                    return verificationQRCode;
                }else{
                    alert('The address does not exist or there are multiple!!');
                }
            });
        }

        /**
         * 生成授权签名
         * @param verificationQRCode
         */
        self.generateVerification = function(verificationQRCode){
            alert(verificationQRCode);
            shadowWallet.getSignatureCode(verificationQRCode,function(signatureCode) {
                alert(signatureCode);
            });
        }


        /**
         * 生成授权签名详情
         * @param signatureCode
         */
        self.generateSignatureDetl = function(signatureCode){
            var wc = profileService.walletClients;
            shadowWallet.getSignatureDetlCode(signatureCode,wc.xPrivKey,function(signatureDetlCode){
                alert(signatureDetlCode);
            });
        }

    });
