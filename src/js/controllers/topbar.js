'use strict';

angular.module('copayApp.controllers').controller('topbarController', function($scope, $rootScope, go, $state, $stateParams) {
    var indexScope = $scope.index;
    this.newsreset = function(){
        indexScope.shownewsloading = false;
        indexScope.showquicksloading = false;
        indexScope.showcoinloading = false;
        indexScope.newslist = '';
        indexScope.coinlist = '';
        indexScope.coininvelist = '';
        indexScope.quicklist = [];
        indexScope.quicklistshow = '';
        indexScope.newslists = [];
        indexScope.quicklists = {};
        indexScope.coinlists = [];
        indexScope.newsanimate = 1;
        indexScope.quickanimate = 1;
        indexScope.coinanimate = 1;
        indexScope.newspage = 1;
        indexScope.quickpage = 1;
        indexScope.coinpage = 1;
        indexScope.shownonews = false;
        indexScope.shownoquick = false;
        indexScope.shownocoin = false;
        indexScope.shownewstab = '';
    }
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
        this.newsreset();
        go.walletHome();
    };

    this.goWallet = function() {
        this.newsreset();
        go.wallet();
    };

    this.goArticle = function() {
        go.news();
    };

    this.goToWaname = function() {
        this.newsreset();
        $state.go('walletnamea',{ name: $stateParams.name, addr: $stateParams.addr, ammount: $stateParams.ammount, walletId: $stateParams.walletId, image: $stateParams.image, mnemonic: $stateParams.mnemonic, mnemonicEncrypted: $stateParams.mnemonicEncrypted});
    };
    this.passgoToWaname = function() {
        this.newsreset();
        $state.go('walletnamea',{ name: $stateParams.name, addr: $stateParams.addr, ammount: $stateParams.ammount, walletId: $stateParams.walletId, image: $stateParams.image, mnemonic: $stateParams.mnemonic, mnemonicEncrypted: $stateParams.mnemonicEncrypted});
    };
});
