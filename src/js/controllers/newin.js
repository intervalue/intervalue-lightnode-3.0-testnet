'use strict';

angular.module('copayApp.controllers').controller('newsinController', function($scope, $rootScope, go, $state, $stateParams) {

    var self = this;
    self.id = $stateParams.id;
    self.newsin = '';
    console.log(self.id)
    let news = require("intervaluecore/newsServers");
    self.newsInfoData = function () {
        news.getNewsInfo(self.id,function (res) {
            res = JSON.parse(res);
            if(res.code == 0) {
                console.log(res.article);
                self.newsin = res.article;
            }else
                console.error("error~!");
        })
    }
    self.newsInfoData();
});
