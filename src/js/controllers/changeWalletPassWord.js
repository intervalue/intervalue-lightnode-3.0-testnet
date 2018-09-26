'use strict';

angular.module('copayApp.controllers').controller('changeWalletPassWordController',
    function($rootScope, $scope, $timeout, profileService, go, gettext, $state, $stateParams, storageService,lodash,$log) {

        var self = this;
        self.walletId = $stateParams.walletId;
    });
