'use strict';

angular.module('copayApp.controllers').controller('walletnameaController',
    function($rootScope, $scope, $timeout, profileService, go, gettext, $state, $stateParams, storageService,lodash,$log) {

        var self = this;
        self.walletid = $stateParams.walletid;
        self.name = $stateParams.name;
        self.image = $stateParams.image;
        self.addr = $stateParams.addr;
        self.ammount = $stateParams.ammount;
        self.mnemonic = $stateParams.mnemonic;
        self.mnemonicEncrypted = $stateParams.mnemonicEncrypted;
        self.gobackup = function (image, name, addr, ammount, walletid, mnemonic, mnemonicEncrypted) {
            $state.go('backup', { image:image, name: name, addr: addr, ammount: ammount, walletid: walletid, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted});
        };
        self.goChangeWalletpassWord = function ( walletid) {
            $state.go('changeWalletPassWord', {  walletId: walletid});
        };


    });
