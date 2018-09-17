'use strict';

angular.module('copayApp.controllers').controller('importwalletController',
    function ($scope,$rootScope) {
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
        /**
         * 获取importwallet form表单
         */
        self.generateAddressQRCode = function () {
            var form = $scope.addressForm;
            console.log(form);
            //var address = form.$$element[0][0].value;
            var address = form.address.$modelValue;
            console.log(address);
            if(address && address.length == 32){
                $rootScope.$emit('Local/ShadowAddressForm',address);
            } else {
                return $rootScope.$emit('Local/ShowErrorAlert', "The address: "+address+" is illegal");
            }

        }

    });
