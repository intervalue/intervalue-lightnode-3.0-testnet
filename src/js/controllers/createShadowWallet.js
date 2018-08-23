'use strict';

angular.module('copayApp.controllers').controller('createShadowWalletController',
    function ($scope, $rootScope, $location, $timeout, $log, lodash, go, shadowProfileService, configService, isCordova, gettext, isMobile, derivationPathHelper, correspondentListService) {

        var self = this;
        var defaults = configService.getDefaults();
        this.isWindowsPhoneApp = isMobile.Windows() && isCordova;
        $scope.account = 1;

        var defaults = configService.getDefaults();
        $scope.derivationPath = derivationPathHelper.default;

        // ng-repeat defined number of times instead of repeating over array?
        this.getNumber = function (num) {
            return new Array(num);
        }

        var updateRCSelect = function (n) {
            $scope.totalCosigners = n;
            self.RCValues = lodash.range(1, n + 1);
            if ($scope.requiredCosigners > n || !$scope.requiredCosigners)
                $scope.requiredCosigners = parseInt(n / 2 + 1);
        };

        var updateSeedSourceSelect = function (n) {
            self.seedOptions = [{
                id: 'new',
                label: gettext('New Random Seed')
            }, {
                id: 'set',
                label: gettext('Specify Seed...')
            }];
            $scope.seedSource = self.seedOptions[0];
        };

        this.TCValues = lodash.range(2, defaults.limits.totalCosigners + 1);
        $scope.totalCosigners = defaults.wallet.totalCosigners;
        this.cosigners = [];//Array($scope.totalCosigners);
        for (var i = 0; i < $scope.totalCosigners - 1; i++)
            this.cosigners.push({});
        correspondentListService.list(function (err, ab) {
            self.candidate_cosigners = ab;
            $timeout(function () {
                $scope.$digest();
            });
        });
        

        this.setTotalCosigners = function (tc) {
            var oldLen = self.cosigners.length;
            var newLen = tc - 1;
            if (newLen > oldLen)
                for (var i = oldLen; i < newLen; i++)
                    self.cosigners.push({});
            else if (newLen < oldLen)
                self.cosigners.length = newLen;

            updateRCSelect(tc);
            updateSeedSourceSelect(tc);
            self.seedSourceId = $scope.seedSource.id;
        };

        this.setMultisig = function () {
            this.setTotalCosigners(3);
            $scope.requiredCosigners = 2;
        };

        this.onCorrespondentSelected = function (device_address) {
            console.log(device_address);
            if (device_address === "new")
                go.path('correspondentDevices.addCorrespondentDevice');
        };


        this.setSeedSource = function (src) {
            self.seedSourceId = $scope.seedSource.id;

            $timeout(function () {
                $rootScope.$apply();
            });
        };

        function setError(error) {
            self.error = gettext(error);
        }

        this.create = function (form) {
            if (form && form.$invalid) {
                this.error = gettext('Please enter the required fields');
                return;
            }
            if (self.cosigners.length !== $scope.totalCosigners - 1)
                return setError("invalid number of cosigners");

            var opts = {
                m: 1,
                n: 1,
                name: '热钱包',
                networkName: 'livenet',
                cosigners: [],
                isSingleAddress: typeof $scope.isSingleAddress == 'undefined' ? defaults.wallet.singleAddress : $scope.isSingleAddress
            };
            if ($scope.totalCosigners > 1) {
                opts.cosigners = lodash.uniq(self.cosigners.map(function (cosigner) { return cosigner.device_address; }));
                if (opts.cosigners.length !== $scope.totalCosigners - 1)
                    return setError("Please select different co-signers");
                for (var i = 0; i < opts.cosigners.length; i++)
                    if (!opts.cosigners[i] || opts.cosigners[i].length !== 33)
                        return setError("Please fill all co-signers");
            }

            self._create(opts);
        };


        this._create = function (opts) {
            self.loading = true;
            $timeout(function () {
                shadowProfileService.createWallet(opts, function (err, walletId) {
                    self.loading = false;
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

                    if (opts.isSingleAddress) {
                        shadowProfileService.setSingleAddressFlag(true);
                    }
                });
            }, 100);
        }

        this.formFocus = function (what) {
            if (!this.isWindowsPhoneApp)
                return;

            if (what && what == 'my-name') {
                this.hideWalletName = true;
                this.hideTabs = true;
            } else if (what && what == 'wallet-name') {
                this.hideTabs = true;
            } else {
                this.hideWalletName = false;
                this.hideTabs = false;
            }
            $timeout(function () {
                $rootScope.$digest();
            }, 1);
        };

        $scope.$on("$destroy", function () {
            $rootScope.hideWalletNavigation = false;
        });

        updateSeedSourceSelect(1);
        self.setSeedSource('new');
    });
