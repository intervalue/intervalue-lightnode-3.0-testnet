'use strict';

var constants = require('intervaluecore/constants.js');
var eventBus = require('intervaluecore/event_bus.js');
var ValidationUtils = require('intervaluecore/validation_utils.js');
var objectHash = require('intervaluecore/object_hash.js');

angular.module('copayApp.services').factory('shadowService', function($state, $rootScope, $sce, $compile, configService, storageService, profileService, go, lodash, $stickyState, $deepStateRedirect, $timeout, gettext, pushNotificationsService) {


    $rootScope.$on('Local/ShadowInvitation', function (SignatureDetlCode) {
        console.log('Local/ShadowInvitation', SignatureDetlCode);
        root.signInvitation(SignatureDetlCode, function () {
        });
    });

    $rootScope.$on('Local/ShadowSignInvitation', function (signatureCode) {
        console.log('Local/ShadowSignInvitation', signatureCode);
        root.signInvitation(signatureCode, function () {
        });
    });

    $rootScope.$on('Local/generateShadowWallet', function (signatureCode) {
        console.log('Local/generateShadowWallet', signatureCode);
        root.signInvitation(signatureCode, function () {
        });
    });

    root.signInvitation = function (objRequest, cb) {
        go.path('shadowDevice.shadowDevice');
    }
});