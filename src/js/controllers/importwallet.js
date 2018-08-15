'use strict';

angular.module('copayApp.controllers').controller('importwalletController',
    function ($scope) {
        var self = this;
        self.importtab1 = false;
        self.importtab2 = true;
        self.showimporttabone = function(){
            self.importtab1 = true;
            self.importtab2 = false;
        }
        self.showimporttabtwo = function(){
            self.importtab1 = false;
            self.importtab2 = true;
        }

    });
