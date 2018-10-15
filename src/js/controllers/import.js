'use strict';


angular.module('copayApp.controllers').controller('importController',
    function ($rootScope, $scope, $timeout, storageService, notification, profileService, bwcService, $log, $stateParams) {
        var self = this;
        self.addwalleterr = false;
        self.importcode = '';
        self.addwipass = '';
        self.addwiname = '';
        self.addwirpass = '';
        self.walletId = $stateParams.walletId;
        self.name = $stateParams.name;
        //import wallet
        self.importw = function(){
            if (self.creatingProfile)
                return console.log('already creating profile');
            self.creatingProfile = true;

            $timeout(function () {
                profileService.createWallet({  network: 'livenet', cosigners: [],n:1,m:1,name: self.addwiname, password: self.addwipass, mnemonic: self.importcode }, function (err,walletId) {
                    if(err){
                        self.creatingProfile = false;
                        $log.warn(err);
                        self.error = err;
                        $timeout(function () {
                            $scope.$apply();
                        });
                    }else{
                        $rootScope.adddataw = profileService.profile.credentials;
                    }
                       $rootScope.$emit('Local/WalletImported', walletId);
                });
            }, 100);
        }
    });