'use strict';

angular.module('copayApp.controllers').controller('topbarController', function($scope, $rootScope, go, $state, $stateParams) {
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

    this.goArticle = function() {
        go.news();
    };

    this.goToWaname = function() {
        $state.go('walletnamea',{ name: $stateParams.name, addr: $stateParams.addr, ammount: $stateParams.ammount, walletId: $stateParams.walletId, image: $stateParams.image, mnemonic: $stateParams.mnemonic, mnemonicEncrypted: $stateParams.mnemonicEncrypted});
    };
    this.passgoToWaname = function() {
        $state.go('walletnamea',{ name: $stateParams.name, addr: $stateParams.addr, ammount: $stateParams.ammount, walletId: $stateParams.walletId, image: $stateParams.image, mnemonic: $stateParams.mnemonic, mnemonicEncrypted: $stateParams.mnemonicEncrypted});
    };
});
