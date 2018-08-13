'use strict';
var db = require('intervaluecore/db');
angular.module('copayApp.controllers').controller('takePubkeyControllers',
    function($scope, $rootScope, $timeout,go) {
        var self = this;
        var pubkey;

     var findPubkey = function (address) {
         $scope.pubkey = xPubkey(address);
         go.generationPubkey();
     }

     self.findPubkey = findPubkey;
     //根据地址查询对应的pubkey
     function  xPubkey (address){
            db.query('SELECT extended_pubkey FROM extended_pubkeys LEFT  JOIN  my_addresses on extended_pubkeys.wallet=my_addresses.wallet where my_addresses.address=?',[address],function (rows) {
                if(rows.length == 1){
                    pubkey = rows[0].extended_pubkey;
                }
            });
            return pubkey;
        }

    });
