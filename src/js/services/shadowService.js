'use strict';

var constants = require('intervaluecore/constants.js');
var eventBus = require('intervaluecore/event_bus.js');
var ValidationUtils = require('intervaluecore/validation_utils.js');
var objectHash = require('intervaluecore/object_hash.js');

angular.module('copayApp.services').factory('shadowService', function($state, $rootScope, $sce, $compile, configService, storageService, profileService, go, lodash, $stickyState, $deepStateRedirect, $timeout, gettext, pushNotificationsService) {


    $rootScope.$on('Local/ShadowInvitation', function (signatureCode) {
        console.log('Local/ShadowInvitation', signatureCode);
        root.signInvitation(signatureCode, function () {
        });
    });

    root.signInvitation = function (signatureCode, cb) {
        return ;
    }
});