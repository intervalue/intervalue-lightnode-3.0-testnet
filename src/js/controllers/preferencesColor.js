'use strict';

angular.module('copayApp.controllers').controller('preferencesColorController',
  function($scope, configService, profileService, go) {
    var config = configService.getSync();
    this.colorOpts = configService.colorOpts;
    this.imageOpts = configService.imageOpts;

    var fc = profileService.focusedClient;
    var walletId = fc.credentials.walletId;

    config.colorFor = config.colorFor || {};
    config.imageFor = config.imageFor || {};
    this.color = config.colorFor[walletId] || '#4A90E2';
    this.image = config.imageFor[walletId] || './img/rimg/1.png';

    this.save = function(color,image) {
      var self = this;
      var opts = {
        colorFor: {},
        imageFor: {}
      };
      opts.colorFor[walletId] = color;
      opts.imageFor[walletId] = image;

      configService.set(opts, function(err) {
        if (err) {
          $scope.$emit('Local/DeviceError', err);
          return;
        }
        self.color = color;
        self.image = image;
        $scope.$emit('Local/ColorUpdated');
      });

    };
  });
