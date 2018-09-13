'use strict';

angular.module('copayApp.controllers').controller('walletnameaController',
    function($rootScope, $scope, $timeout, profileService, go, gettext, $state, $stateParams, storageService,lodash,$log) {

        var self = this;
        self.walletid = $stateParams.walletid;
        self.name = $stateParams.name;
        self.addr = $stateParams.addr;
        self.ammount = $stateParams.ammount;
        self.mnemonic = $stateParams.mnemonic;
        self.mnemonicEncrypted = $stateParams.mnemonicEncrypted;
        self.gobackup = function (name, addr, ammount, walletid, mnemonic, mnemonicEncrypted) {
            $state.go('backup', { name: name, addr: addr, ammount: ammount, walletid: walletid, mnemonic: mnemonic, mnemonicEncrypted: mnemonicEncrypted});
        };


        var _deleteWallet = function() {
            var fc = profileService.focusedClient;
            var name = fc.credentials.walletName;
            var walletName = (fc.alias || '') + ' [' + name + ']';

            profileService.deleteWallet({}, function(err) {
                if (err) {
                    self.error = err.message || err;
                } else {
                    notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('The wallet "{{walletName}}" was deleted', {
                        walletName: walletName
                    }));
                }
            });
        };

        self.deleteWallet = function() {
            if (profileService.profile.credentials.length === 1 || profileService.getWallets().length === 1)
                return $rootScope.$emit('Local/ShowErrorAlert', "Can't delete the last remaining wallet");
            if (isCordova) {
                navigator.notification.confirm(
                    delete_msg,
                    function(buttonIndex) {
                        if (buttonIndex == 1) {
                            _deleteWallet();
                        }
                    },
                    confirm_msg, [accept_msg, cancel_msg]
                );
            } else {
                _modalDeleteWallet();
            }
        };
    });
