'use strict';

angular.module('copayApp.controllers').controller('changeWalletPassWordController',
    function($rootScope, $scope, $timeout, profileService, go, gettext, $state, $stateParams, storageService,lodash,$log) {

        var self = this;
        self.walletId = $stateParams.walletId;
        self.addr = $stateParams.addr;
        self.name = $stateParams.name;
        self.image = $stateParams.image;
        self.ammount = $stateParams.ammount;
    });
