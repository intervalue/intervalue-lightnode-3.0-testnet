'use strict';

angular.module('copayApp.controllers').controller('topbarController', function($scope, $rootScope, go) {

    this.onQrCodeScanned = function(data) {
        go.handleUri(data);
        //$rootScope.$emit('dataScanned', data);
    };

    this.onQrCodeScannedAddr = function(data) {
        go.handleUriAddr(data);

    };

    this.openSendScreen = function() {
        go.send();
    };

    this.onBeforeScan = function() {
    };

    this.goHome = function() {
        go.walletHome();
    };

    this.goWallet = function() {
        go.wallet();
    };

});
