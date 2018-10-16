'use strict';


angular.module('copayApp.controllers').controller('importController',
    function ($rootScope, $scope, $timeout, storageService, notification, profileService, bwcService, $log, $stateParams, gettext, gettextCatalog,lodash,go) {
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

            storageService.getProfile(function (err, profile) {
                console.log(profile.credentials.length);
                let fc = profile.credentials;
                let opts = {};
                opts.mnemonic = self.importcode;
                let mnemonic = self.importcode;
                let flag = require("bitcore-mnemonic").isValid(mnemonic.toString());
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
                    if(fc.length > 1){
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
                                        $rootScope.$emit('Local/ShowAlertdirs', gettextCatalog.getString(" wallets recovered, please restart the application to finish."), 'fi-check', function () {
                                            if (navigator && navigator.app) // android.ios
                                                navigator.app.exitApp();
                                            else if (process.exit) // nwjs
                                                process.exit();
                                        });
                                    }
                                });

                            },1000);
                        });
                    } else {
                        let wc = profileService.focusedClient;
                        let Mnemonic = require('bitcore-mnemonic');
                        let mn = new Mnemonic(self.importcode);
                        wc.credentials.xPrivKey = mn.toHDPrivateKey("").xprivkey;
                        wc.credentials.mnemonic = self.importcode;
                        for(let item in profile.credentials) profile.credentials[item].walletName = self.addwiname;
                        profileService.disablePrivateKeyEncryptionFC(function(err) {
                            $rootScope.$emit('Local/NewEncryptionSetting');
                            if (err) {
                                $log.error(err);
                            }
                            profileService.setPrivateKeyEncryptionFC(self.addwipass, function() {
                                storageService.storeProfile(profile, function (err) {
                                    if (err)
                                        $rootScope.$emit('Local/ShowErrorAlert', +walletId + ":    " + err);
                                    profileService.bindProfileOld(profile, function () {

                                    });
                                });
                                go.walletHome();
                                $rootScope.$emit('Local/NewEncryptionSetting');
                                $rootScope.$emit('Local/ShowErrorAlert', "Password reset complete");
                            });
                        });
                    }

                });
            });


        }

        $rootScope.$on('Local/ShowAlertdirs', function (event, msg, msg_icon, cb) {
            $scope.index.showPopup(msg, msg_icon, cb);
        });
    });