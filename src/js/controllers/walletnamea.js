'use strict';

angular.module('copayApp.controllers').controller('walletnameaController',
    function($rootScope, $scope, $timeout, profileService, go, gettext, gettextCatalog, $state, $stateParams, isCordova, notification, storageService,lodash,$log) {

        var self = this;
        self.showconfirm = false;
        var delete_msg = gettextCatalog.getString('Are you sure you want to delete this wallet?');
        var accept_msg = gettextCatalog.getString('Accept');
        var cancel_msg = gettextCatalog.getString('Cancel');
        var confirm_msg = gettextCatalog.getString('Confirm');
        self.walletId = $stateParams.walletId;
        self.name = $stateParams.name;
        self.image = $stateParams.image;
        self.addr = $stateParams.addr;
        self.ammount = $stateParams.ammount;
        self.mnemonic = $stateParams.mnemonic;
        self.mnemonicEncrypted = $stateParams.mnemonicEncrypted;
        self.gobackup = function (image, name, addr, ammount, walletId, mnemonic, mnemonicEncrypted) {
            $state.go('backup', { image:image, name: name, addr: addr, ammount: ammount, walletId: walletId, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted});
        };
        self.goChangeWalletpassWord = function ( walletId, addr, name, image, ammount) {
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
                        profileService.loadAndBindProfile(function () {
                            profileService.setAndStoreFocus(walletId,function () {

                            })
                        });
                    });
                }
            });
        }

        //开始删除钱包
        self.deleteWallet = function(walletId,name) {
            if (profileService.profile.credentials.length === 1 || profileService.getWallets().length === 1)
                return $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString("Can't delete the last remaining wallet"));
            if (isCordova) {
                navigator.notification.confirm(
                    delete_msg,
                    function(buttonIndex) {
                        if (buttonIndex == 1) {
                            self.truedeleteWallet(walletId,name);
                        }
                    },
                    confirm_msg, [accept_msg, cancel_msg]
                );
            } else {
                self.showconfirm = true;
            }
        };

        self.truedeleteWallet = function(walletId,name) {
            var fc = profileService.focusedClient;
            var walletName = (fc.alias || '') + ' [' + name + ']';
            var self = this;

            profileService.deleteWallet(walletId,name, function(err) {
                if (err) {
                    self.error = err.message || err;
                } else {
                    notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('The wallet "{{walletName}}" was deleted', {
                        walletName: walletName
                    }));
                }
            });
        };
    });
