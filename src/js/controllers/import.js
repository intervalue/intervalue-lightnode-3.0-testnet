'use strict';


angular.module('copayApp.controllers').controller('importController',
    function ($rootScope, $scope, $timeout, storageService, notification, profileService, bwcService, $log) {
        var self = this;
        self.addwalleterr = false;
        self.importcode = '';
        self.addwipass = '';
        self.addwiname = '';
        self.addwirpass = '';

        //import wallet
        self.importw = function(){
            if (self.creatingProfile)
                return console.log('already creating profile');
            self.creatingProfile = true;

            $timeout(function () {
                profileService.create({ walletName: self.addwiname, password: self.addwipass, mnemonic: self.importcode }, function (err) {
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
                });
            }, 100);
        }
    });