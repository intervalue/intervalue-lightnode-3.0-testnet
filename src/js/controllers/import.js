'use strict';


angular.module('copayApp.controllers').controller('importController',
    function ($rootScope, $scope, $timeout, storageService, notification, profileService, bwcService, $log, $stateParams, gettext, gettextCatalog,lodash) {
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

        /**
         * 忘记钱包密码时，使用助记词重新导入钱包并设置密码
         * @param walletId
         * @param name
         */
        self.recoveryWallet = function(walletId,name){
            var opts = {};
            opts.mnemonic = self.importcode;
            var mnemonic = self.importcode;
            var flag = require("bitcore-mnemonic").isValid(mnemonic.toString());
            if(!flag){
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Could not create: Invalid wallet seed'));
                return ;

            }
            profileService._seedWallet(opts, function (err, walletClient) {
                if (err) return;
                var xPubKey = walletClient.credentials.xPubKey;
                // check if exists
                var w = lodash.find(profileService.profile.credentials, { 'xPubKey': xPubKey });
                if (!w){
                    $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Wallet not already in Intervalue'));
                    return ;
                }
                profileService.deleteWallet(walletId,name, function(err) {
                    if (err) {
                        self.error = err.message || err;
                    }
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
                                $timeout(function () {
                                    $rootScope.$emit('Local/ShowAlertdirs', gettextCatalog.getString(" wallets recovered, please restart the application to finish."), 'fi-check', function () {
                                        if (navigator && navigator.app) // android
                                            navigator.app.exitApp();
                                        else if (process.exit) // nwjs
                                            process.exit();
                                        $rootScope.$apply();
                                    });
                                });
                            }
                        });
                    },1000);
                });

            });
        }

        $rootScope.$on('Local/ShowAlertdirs', function (event, msg, msg_icon, cb) {
            $scope.index.showPopup(msg, msg_icon, cb);
        });
    });