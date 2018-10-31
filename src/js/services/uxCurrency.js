'use strict';
angular.module('copayApp.services')
    .factory('uxCurrency', function languageService($log, lodash , amMoment, configService) {
        var root = {};

        root.availableCurrency = [{
            name: '美元',
            isoCode: 'en',
            enname: 'USD'
        }, {
            name: '人民币',
            isoCode: 'zh_CN',
            enname: 'CNY',
            useIdeograms: true,
        }];

        root.currentCurrency = null;

        root._detect = function() {
            // Auto-detect browser language
            var userLang, androidLang;

            if (navigator && navigator.userAgent && (androidLang = navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
                userLang = androidLang[1];
            } else {
                // works for iOS and Android 4.x
                userLang = navigator.userCurrency || navigator.language;
            }
            userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';

            for (var i=0; i<root.availableCurrency.length; i++){
                var isoCode = root.availableCurrency[i].isoCode;
                if (userLang === isoCode.substr(0, 2))
                    return isoCode;
            }

            return 'en';
        };

        root._set = function(lang) {
            $log.debug('Setting default currency: ' + lang);
            amMoment.changeLocale(lang);
            root.currentCurrency = lang;
        };

        root.getCurrentCurrency = function() {
            return root.currentCurrency;
        };

        root.getCurrentCurrencyName = function() {
            return root.getName(root.currentCurrency);
        };

        root.getCurrentCurrencyEnName = function() {
            return root.getEnName(root.currentCurrency);
        };

        root.getCurrentCurrencyInfo = function() {
            return lodash.find(root.availableCurrency, {
                'isoCode': root.currentCurrency
            });
        };

        root.getCurrencys = function() {
            return root.availableCurrency;
        };

        root.init = function() {
            root._set(root._detect());
        };

        root.update = function() {
            var userLang = configService.getSync().wallet.settings.defaultCurrency;

            if (!userLang) {
                userLang = root._detect();
            }

            root._set(userLang);
            return userLang;
        };

        root.getName = function(lang) {
            return lodash.result(lodash.find(root.availableCurrency, {
                'isoCode': lang
            }), 'name');
        };

        root.getEnName = function(lang) {
            return lodash.result(lodash.find(root.availableCurrency, {
                'isoCode': lang
            }), 'enname');
        };

        return root;
    });
