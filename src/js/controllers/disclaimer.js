'use strict';

angular.module('copayApp.controllers').controller('disclaimerController',
  function ($scope, $timeout, storageService, applicationService, gettextCatalog, isCordova, uxLanguage, go, $rootScope) {

    if (!isCordova && process.platform === 'win32' && navigator.userAgent.indexOf('Windows NT 5.1') >= 0)
      $rootScope.$emit('Local/ShowAlert', "Windows XP is not supported", 'fi-alert', function () {
        process.exit();
      });

    this.wallet_type = 'light';

    function setWalletType() {
      var bLight = (self.wallet_type === 'light');

      var fs = require('fs' + '');
      var desktopApp = require('intervaluecore/desktop_app.js');
      var appDataDir = desktopApp.getAppDataDir();
      var userConfFile = appDataDir + '/conf.json';
      fs.writeFile(userConfFile, JSON.stringify({ bLight: bLight }, null, '\t'), 'utf8', function (err) {
        if (err)
          throw Error('failed to write conf.json: ' + err);
        go.walletHome();
      });
    };

    $scope.agree = function () {
      if (isCordova) {
        window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
      }
      $scope.loading = true;
      $timeout(function () {
        storageService.setDisclaimerFlag(function (err) {
          $timeout(function () {
            if (isCordova)
              window.plugins.spinnerDialog.hide();
            // why reload the page?
            //applicationService.restart();
            setWalletType();
          }, 1000);
        });
      }, 100);
    };

    $scope.init = function () {
      storageService.getDisclaimerFlag(function (err, val) {
        $scope.lang = uxLanguage.currentLanguage;
        $scope.agreed = val;
        $timeout(function () {
          $scope.$digest();
        }, 1);
      });
    };
  });
