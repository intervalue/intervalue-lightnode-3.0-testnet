'use strict';

angular.module('copayApp.controllers').controller('addwalletController',
    function ($rootScope, $scope, $timeout, storageService, notification, profileService, bwcService, $log,gettext,go,gettextCatalog,isCordova) {
        var self = this;
        var successMsg = gettext('Backup words deleted');
        self.addwname = '';
        self.addwpass = '';
        self.addwrpass = '';
        self.addwipass = '';
        self.addwiname = '';
        self.importcode = '';
        self.importcode1 = '';
        self.importcode2 = '';
        self.addwirpass = '';
        self.chosenWords = [];
        self.showcodes = [];
        self.showrandamcodes = [];
        self.mnemonic = '';
        self.showcodeerr = false;
        self.addwalleterr = false;
        self.showconfirm = false;
        self.showtab = 'tabcold';
        var fc = profileService.focusedClient;
        var walletClient = bwcService.getClient();
        self.ducodes = walletClient.createRandomMnemonic().split(' ');
        //乱序
        self.shuffle = function (v) {
            for (var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
            return v;
        };
        // 定义提示框内容
        self.funReg = function () {
            var newlist = [];
            if (self.showrandamcodes.length > 3) {
                // 显示乱序提示框
                self.showrandamcodes = self.shuffle(JSON.parse(JSON.stringify(self.showrandamcodes)));
                // 显示乱序提示框  结束
                return false;
            } else {
                for (var i = 0; i <= 11; i++) {
                    var newStr = {
                        id: i,
                        str: self.ducodes[i],
                        chosen: false
                    };
                    newlist.push(newStr);
                }
                self.showcodes = JSON.parse(JSON.stringify(newlist));
                self.showrandamcodes = self.shuffle(JSON.parse(JSON.stringify(newlist)));
            }
            $timeout(function () {
                $scope.$digest();
            });
        };
        // 定义提示框内容  结束
        self.addwordf = function ($event) {
            self.showcodeerr = false;
            if ($event.srcElement.tagName == 'BUTTON') {
                self.showrandamcodes.forEach(function (item, index) {
                    if (item.id == $event.srcElement.id) {
                        self.showrandamcodes[index].chosen = true;
                        self.chosenWords.push({
                            id: item.id,
                            str: item.str
                        })
                    }
                });
            } else {
                return false;
            }
        }
        self.minuswordf = function ($event) {
            self.showcodeerr = false;
            if ($event.srcElement.tagName == 'SPAN') {
                self.showrandamcodes.forEach(function (item, index) {
                    if (item.id == $event.srcElement.id) {
                        self.showrandamcodes[index].chosen = false;
                    }
                });
                self.chosenWords.forEach(function (item, index) {
                    if (item.id == $event.srcElement.id) {
                        self.chosenWords.splice(index, 1);
                    };
                })
            } else {
                return false;
            }
        };
        $scope.$watch(function () {
            return JSON.stringify(self.chosenWords);
        }, function (newValue, oldValue) {
            if (self.chosenWords.length > 11) {
                var chostr = '';
                for (var i = 0; i < self.chosenWords.length; i++) {
                    chostr += self.chosenWords[i].str;
                }
                var showstr = '';
                for (var i = 0; i < self.showcodes.length; i++) {
                    showstr += self.showcodes[i].str;
                }
                if (chostr == showstr) {
                    for (var i = 0; i < self.showcodes.length; i++) {
                        self.mnemonic += ' ' + self.showcodes[i].str;
                    }
                    self.step = 'deletecode';
                } else {
                    self.showcodeerr = true;
                }
            }
        }, true)
        // 更改代码
        self.haschoosen = function (noWallet) {
            if (self.creatingProfile)
                return console.log('already creating profile');
            self.creatingProfile = true;
            //	saveDeviceName();

            $timeout(function () {
                profileService.create({ noWallet: noWallet }, function (err) {
                    if (err) {
                        self.creatingProfile = false;
                        $log.warn(err);
                        self.error = err;
                        $timeout(function () {
                            $scope.$apply();
                        });
                        /*$timeout(function() {
                            self.create(noWallet);
                        }, 3000);*/
                    }
                });
            }, 100);

        };
        // 删除口令 修改后
        self.addWallet = function (walletName, password, passphrase, mnemonic,del) {
            if(password !== passphrase){
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('*Inconsistent password'));
                return;
            }
            mnemonic = mnemonic.trim();
            if (self.creatingProfile)
                return console.log('already creating profile');
            self.creatingProfile = true;
            //	saveDeviceName();
            if (isCordova) {
                window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
            }
            $timeout(function () {
                profileService.createWallet({ name: walletName, password: passphrase, mnemonic: mnemonic,m:1,n:1,networkName:"livenet",cosigners:[],isSinglecreateress:true  }, function (err,walletId) {
                    if (isCordova)
                        window.plugins.spinnerDialog.hide();
                    if (err) {
                        self.creatingProfile = false;
                        $log.warn(err);
                        self.error = err;
                        $timeout(function () {
                            $scope.$apply();
                        });
                        /*$timeout(function() {
                            self.create(noWallet);
                        }, 3000);*/
                    }
                else if(del){
                        //$rootScope.$emit('Local/WalletImported', walletId);
                        var fc = profileService.focusedClient;
                        fc.clearMnemonic();
                        profileService.clearMnemonic(function() {
                            self.deleted = true;
                            notification.success(successMsg);
                            go.walletHome();
                            $rootScope.$emit('Local/WalletImported', walletId);
                        });
                    }else{
                        $rootScope.$emit('Local/WalletImported', walletId);
                    }
                });
            }, 100);
        };
        //import wallet
        self.importw = function(){
            if(self.addwipass !== self.addwirpass){
                $rootScope.$emit('Local/ShowErrorAlert', gettextCatalog.getString('*Inconsistent password'));
                return;
            }

            self.importcode1 = self.importcode.replace(/^\s+/, '').replace(/\s+$/, '');
            self.importcode2 = self.importcode1.replace(/\s+/g, ' ');
            if (isCordova) {
                window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Loading...'), true);
            }
            $timeout(function () {
                profileService.createWallet({ name: self.addwiname, password: self.addwipass, mnemonic: self.importcode2,m:1,n:1,networkName:"livenet",cosigners:[],isSinglecreateress:true }, function (err,walletId) {
                    if (isCordova)
                        window.plugins.spinnerDialog.hide();
                    if(err){
                        self.creatingProfile = false;
                        $log.warn(err);
                        self.error = err;
                        alert(err);
                        $timeout(function () {
                            $scope.$apply();
                        });
                    }
                    if (isCordova)
                        window.plugins.spinnerDialog.hide();
                     $rootScope.$emit('Local/WalletImported', walletId);
                });
            }, 100);
        }
    });