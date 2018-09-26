'use strict';

angular.module('copayApp.controllers').controller('changeWalletPassWordController',
    function($rootScope, $scope, $timeout, profileService, go, gettext, $state, $stateParams, storageService,lodash,$log) {

        var self = this;
        self.walletId = $stateParams.walletId;
        self.addr = $stateParams.addr;
        self.name = $stateParams.name;
        self.image = $stateParams.image;
        self.ammount = $stateParams.ammount;

        self.changePassWord = function (walletId) {
            var form = $scope.changepassW;
            var newadpass = form.newadpass.$modelValue;
            var comadpass = form.comadpass.$modelValue;
            if(newadpass != comadpass) {
                    $rootScope.$emit('Local/ShowErrorAlert', "Two password entries are inconsistent");
                    return;
            }


                profileService.setAndStoreFocus(walletId, function() {
                    var fc = profileService.focusedClient;
                    if (!fc) return;
                    if (comadpass && !fc.hasPrivKeyEncrypted()) {
                        $rootScope.$emit('Local/NeedsPassword', true, null, function(err, comadpass) {
                            if (err || !comadpass) {
                                return;
                            }
                            profileService.setPrivateKeyEncryptionFC(comadpass, function() {
                                $rootScope.$emit('Local/NewEncryptionSetting');
                            });
                        });
                    } else {
                        if ( fc.hasPrivKeyEncrypted())  {
                            profileService.unlockFC(null, function(err){
                                if (err) {
                                    return;
                                }
                                profileService.disablePrivateKeyEncryptionFC(function(err) {
                                    $rootScope.$emit('Local/NewEncryptionSetting');
                                    if (err) {
                                        $log.error(err);
                                    }
                                    profileService.setPrivateKeyEncryptionFC(comadpass, function() {
                                        $rootScope.$emit('Local/NewEncryptionSetting');
                                        $rootScope.$emit('Local/ShowErrorAlert', "Password reset complete");
                                    });
                                });
                            });
                        }
                    }
                });

        }
    });
