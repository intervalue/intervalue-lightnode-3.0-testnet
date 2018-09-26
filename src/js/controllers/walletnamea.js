'use strict';

angular.module('copayApp.controllers').controller('walletnameaController',
    function($rootScope, $scope, $timeout, profileService, go, gettext, $state, $stateParams, storageService,lodash,$log) {

        var self = this;
        self.walletId = $stateParams.walletid;
        self.name = $stateParams.name;
        self.image = $stateParams.image;
        self.addr = $stateParams.addr;
        self.ammount = $stateParams.ammount;
        self.mnemonic = $stateParams.mnemonic;
        self.mnemonicEncrypted = $stateParams.mnemonicEncrypted;
        self.gobackup = function (image, name, addr, ammount, walletid, mnemonic, mnemonicEncrypted) {
            $state.go('backup', { image:image, name: name, addr: addr, ammount: ammount, walletid: walletid, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted});
        };
        self.goChangeWalletpassWord = function ( walletId, addr, name, image, ammount) {
            alert(walletId);
            $state.go('changeWalletPassWord', {  walletId: walletId, addr: addr, name: name, image: image, ammount:ammount});
        };

        /**
         * 修改对应钱包名称
         * @param walletId
         */
        self.changeWalletName = function (walletId) {
            var form = $scope.changeName;
            var newWalletName = form.name.$modelValue;
            storageService.getProfile(function (err, profile) {
                if (err) {
                    $rootScope.$emit('Local/DeviceError', err);
                    return;
                }
                if (!profile) {
                    breadcrumbs.add('no profile');
                    return cb(new Error('NOPROFILE: No profile'));
                } else {
                    var profile = profile;
                    for(let item in profile.credentials){
                        if(profile.credentials[item].walletId == walletId){
                            profile.credentials[item].walletName = newWalletName;
                            break;
                        }
                    }
                    storageService.storeProfile(profile, function (err) {
                        if(err)
                        $rootScope.$emit('Local/ShowErrorAlert', +walletId+":    "+err);
                    });

                }
            });
            profileService.loadAndBindProfile(function () {
                profileService.setAndStoreFocus(walletId,function () {
                    
                })
            });
        }
    });
