'use strict';


angular.module('copayApp.controllers').controller('createController',
    function ($rootScope, $scope, $timeout, storageService, notification, profileService, bwcService, $log) {
        var self = this;
        self.addwname = '';
        self.addwpass = '';
        self.addwrpass = '';
        self.addwalleterr = false;
        self.passequal = function () {
            if (self.addwpass !== self.addwrpass) {
                self.addwalleterr = true;
                return false;
            } else {
                self.step = "showcode";
            }
        }
    });