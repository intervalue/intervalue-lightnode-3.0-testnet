'use strict';

angular.module('copayApp.controllers').controller('preferencesCurrencyController',
    function($rootScope, $scope, $log, $timeout, configService, go, uxCurrency, uxLanguage) {
        let news = require("intervaluecore/newsServers");
        var indexScope = $scope.index;
        this.availableCurrenry = uxCurrency.getCurrencys();
        this.currentLanguageName = uxLanguage.getCurrentLanguageName();
        this.currentCurrencyName = uxCurrency.getCurrentCurrencyName();
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
            news.getInveData2(function (res) {
                if (!!res && res != null) {
                    indexScope.invedollar = res.page.list.INVE.price;
                    indexScope.invermb = res.page.list.INVE.cnyPrice;
                    $timeout(function(){
                        $rootScope.$apply();
                    })
                }
            });
        };
    });
