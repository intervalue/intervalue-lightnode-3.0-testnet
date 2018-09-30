'use strict';

angular.module('copayApp.controllers').controller('createShadowWalletController',
    function ($scope, $rootScope, $location, $timeout, $log, lodash, go, profileService,gettextCatalog, configService, isCordova, gettext, isMobile, derivationPathHelper, correspondentListService) {

        var self = this;


        this.create = function (form) {
            var form = $scope.addShadowWallet;
            var obj;
            if(form.$$element[0][0].value){
                 obj = JSON.parse(form.$$element[0][0].value);
            }else {
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('Hot wallet verification failed'));
                return;
            }

            //var obj = {"sign":"XM7cvzIHofkCXd8VI+QjvYpDVdP2f0J+1vsYagCsPTp5EBa3VMeTwSkY+tdEpnK7gvzhFTPKyPhVEiHd4gWOMw==","xpub":"xpub6CF6k3emCLMuaaQE5MPrKUrZSAp1ZFPp44fYpsehhMQ5U1xCn8YmWS5ignuQP4XvCnXVSnajzp9G8poxf7muTekLcRatDJvzZQJGWudhUPk","addr":"KL3M65WEDDZ7VHBB2TT7PSDNBOK4TWAG","pubkey":"Au0+pcbtyca6hqmezn7oVGXhUIkTYHwpAWpwp1CLfa7p"};
            var opts = {
                m: 1,
                n: 1,
                name: "SD-热钱包(新)",
                xPubKey: obj.xpub,
                account: 0,
                network: 'livenet',
                cosigners: []
            };
            // var coldDeviceAddr = obj_from_coldWallet.addr;
            var hotDeviceAddr;
            if(profileService.profile){
                hotDeviceAddr  = profileService.profile.my_device_address

            }else {
                hotDeviceAddr ="0"+obj.addr;
            }
            $timeout(function () {
                profileService.createHotWallet(opts, hotDeviceAddr, function (err, walletId) {
                    if (err) {
                        $log.warn(err);
                        self.error = err;
                        $timeout(function () {
                            $rootScope.$apply();
                        });
                        return;
                    }
                    if (opts.externalSource) {
                        if (opts.n == 1) {
                            $rootScope.$emit('Local/WalletImported', walletId);
                        }
                    }
                });

            }, 100);
        };


    });
