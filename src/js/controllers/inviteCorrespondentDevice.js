'use strict';

var eventBus = require('intervaluecore/event_bus.js');

angular.module('copayApp.controllers').controller('inviteCorrespondentDeviceController',
    function($scope, $timeout, profileService, go, isCordova, correspondentListService, gettextCatalog, nodeWebkit) {

        var self = this;



        var conf = require('intervaluecore/conf.js');
        $scope.protocol = conf.program;
        $scope.isCordova = isCordova;
        var indexScope = $scope.index;
        var fc = profileService.focusedClient;
        $scope.color = fc.backgroundColor;


        $scope.$on('qrcode:error', function(event, error){
            console.log(error);
        });

        // $scope.copyCode = function() {
        //     if (isCordova) {
        //         window.cordova.plugins.clipboard.copy($scope.code);
        //         window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
        //     }else if (nodeWebkit.isDefined()) {
        //         nodeWebkit.writeToClipboard($scope.code);
        //         indexScope.layershow = true;
        //         indexScope.layershowmsg = gettextCatalog.getString('Successful copy');
        //         setTimeout(function () {
        //             indexScope.layershow = false;
        //         },1000)
        //     }
        //};

        $scope.onTextClick = function ($event) {
            console.log("onTextClick");
            $event.target.select();
        };

        $scope.error = null;


        $scope.cancelAddCorrespondent = function() {
            go.path('correspondentDevices');
        };

        $scope.shareinviteAddress = function () {
            var chatdevicecode = document.getElementById('chatdevicecode').innerText;
            if (isCordova) {
                if (isMobile.Android() || isMobile.Windows())
                    window.ignoreMobilePause = true;
                window.plugins.socialsharing.share(chatdevicecode, null, null, null);
            }
        };

    });
