'use strict';

angular.module('copayApp.controllers').controller('newsinController', function($scope, $rootScope, $timeout, go, $state, $stateParams) {

    var self = this;
    self.id = $stateParams.id;
    self.newstitle = '';
    self.newscontent = '';
    console.log(self.id)
    let news = require("intervaluecore/newsServers");
    self.newsInfoData = function () {
        news.getNewsInfo(self.id,function (res) {
            res = JSON.parse(res);
            if(res.code == 0) {
                console.log(res.article);
                self.newstitle = res.article.title;
                self.newscontent = res.article.content;
                $timeout(function(){
                    $scope.$apply();
                });
            }else
                console.error("error~!");
        })
    }
    self.newsInfoData();
});
