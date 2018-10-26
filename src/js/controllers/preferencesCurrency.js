'use strict';

angular.module('copayApp.controllers').controller('preferencesCurrencyController',
    function($scope, $log, $timeout, configService, go, uxCurrency) {

    var self = this;
    self.get = function (upyn) {
        //inve 行情
        news.getInveData2(function (res) {
            if (!!res && res != null) {
                self.coininvelist = res;
            }
        });
    }
        this.availableCurrenry = uxCurrency.getCurrencys();

        this.save = function(newCurrency) {
            var opts = {
                wallet: {
                    settings: {
                        defaultCurrency: newCurrency
                    }
                }
            };

            configService.set(opts, function(err) {
                if (err) $log.warn(err);
                $scope.$emit('Local/CurrencySettingUpdated');

                $timeout(function() {
                    go.preferencesGlobal();
                }, 100);
            });
        };
    });
