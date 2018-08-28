'use strict';

angular.module('copayApp.controllers').controller('walletnameaController',
    function($rootScope, $scope, $timeout, profileService, go, gettext, $state, $stateParams, isCordova) {

        var self = this;
        self.walletid = $stateParams.walletid;
        self.name = $stateParams.name;
        self.addr = $stateParams.addr;
        self.ammount = $stateParams.ammount;
        self.mnemonic = $stateParams.mnemonic;
        self.mnemonicEncrypted = $stateParams.mnemonicEncrypted;
        self.gobackup = function (name, addr, ammount, walletid, mnemonic, mnemonicEncrypted) {
            $state.go('backup', { name: name, addr: addr, ammount: ammount, walletid: walletid, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted});
        };
        var fc = profileService.focusedClient;
    });
