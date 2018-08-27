'use strict';

angular.module('copayApp.controllers').controller('walletnameaController',
    function($rootScope, $scope, $timeout, profileService, go, gettext, $stateParams, isCordova) {

        var self = this;
        self.show = false;
        self.walletid = $stateParams.walletid;
        self.name = $stateParams.name;
        self.addr = $stateParams.addr;
        self.ammount = $stateParams.ammount;
        self.mnemonic = $stateParams.mnemonic;
        self.mnemonicEncrypted = $stateParams.mnemonicEncrypted;
        console.log($stateParams);
        var fc = profileService.focusedClient;
    });
