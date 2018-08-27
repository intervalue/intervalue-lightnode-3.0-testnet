'use strict';

angular.module('copayApp.controllers').controller('walletnameaController',
    function($rootScope, $scope, $timeout, profileService, go, gettext, $stateParams, isCordova) {

        var self = this;
        self.walletid = $stateParams.walletid;
        self.name = $stateParams.name;
        self.addr = $stateParams.addr;
        self.ammount = $stateParams.ammount;
        self.mnemonic = $stateParams.codezhu;
        self.mnemonicEncrypted = $stateParams.mnemonicEncrypted;
        console.log("111111111111111111111111111")
        console.log(self.mnemonic);
        console.log(self.mnemonicEncrypted);
        var fc = profileService.focusedClient;
    });
