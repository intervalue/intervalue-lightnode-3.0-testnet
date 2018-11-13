'use strict';

angular.module('copayApp.controllers').controller('editCorrespondentDeviceController',
  function($scope, $rootScope, $timeout, configService, profileService, isCordova, go, correspondentListService, $modal, animationService,addressService) {
	
	var self = this;
	
	var fc = profileService.focusedClient;
	$scope.backgroundColor = fc.backgroundColor;
	var correspondent = correspondentListService.currentCorrespondent;
	$scope.correspondent = correspondent;
	$scope.name = correspondent.name;
	$scope.hub = correspondent.hub;
    $scope.showselectwt = false;
    $scope.showconfirm = false;
    self.address = '';
    self.stables = '';
    self.walletName = fc.credentials.walletName;
    self.image = fc.image;

    $timeout(function () {
        var wallet = require('intervaluecore/wallet.js');
        wallet.readAddressByWallet(fc.credentials.walletId,function (res) {
            self.address = res;
            var tenexp = /^([A-Z0-9]{10})(.*)([A-Z0-9]{10})$/g;
            self.tenaddress = res.replace(tenexp, '$1...$3');
            let walletInfo = $scope.index.walletInfo;
            for(let item in walletInfo){
                if(walletInfo[item].wallet == fc.credentials.walletId) self.stables = walletInfo[item].stables;
                break;
            }
            $scope.$apply();
        });


    });


	$scope.save = function() {
		$scope.error = null;
		correspondent.name = $scope.name;
		correspondent.hub = $scope.hub;
		var device = require('intervaluecore/device.js');

		device.updateCorrespondentProps(correspondent, function(){
			go.path('correspondentDevices.correspondentDevice');
		});
	};

	$scope.purge_chat = function() {
      var ModalInstanceCtrl = function($scope, $modalInstance, $sce, gettext) {
        $scope.title = $sce.trustAsHtml('Delete the whole chat history with ' + correspondent.name + '?');

        $scope.ok = function() {
          $modalInstance.close(true);
          go.path('correspondentDevices.correspondentDevice');

        };
        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          go.path('correspondentDevices.correspondentDevice.editCorrespondentDevice');
        };
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/confirmation.html',
        windowClass: animationService.modalAnimated.slideUp,
        controller: ModalInstanceCtrl
      });

      modalInstance.result.finally(function() {
        var m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass(animationService.modalAnimated.slideOutDown);
      });

      modalInstance.result.then(function(ok) {
        if (ok) {
          	var chatStorage = require('intervaluecore/chat_storage.js');
			chatStorage.purge(correspondent.device_address);
			correspondentListService.messageEventsByCorrespondent[correspondent.device_address] = [];
        }
        
      });
	}

	function setError(error){
		$scope.error = error;
	}
  $scope.deletechat = function(){
      var chatStorage = require('intervaluecore/chat_storage.js');
      chatStorage.purge(correspondent.device_address);
      correspondentListService.messageEventsByCorrespondent[correspondent.device_address] = [];
      go.path('correspondentDevices.correspondentDevice');
  }

      self.insertMyAddress = function(walletId,stables,walletName,image){
          addressService.getAddressToChat(walletId, function(result) {
              self.address = result;
              var tenexp = /^([A-Z0-9]{10})(.*)([A-Z0-9]{10})$/g;
              self.tenaddress = result.replace(tenexp, '$1...$3');
              self.stables = stables;
              self.walletName = walletName;
              self.image = image;
              $timeout(function () {
                  $scope.showselectwt = false;
                  $scope.$apply();
              })
          });

      }

	
});
