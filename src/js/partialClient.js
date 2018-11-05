var BLACKBYTES_ASSET = require('intervaluecore/constants').BLACKBYTES_ASSET;
var balances = require('intervaluecore/balances');
var utils = require('../../angular-bitcore-wallet-client/bitcore-wallet-client/lib/common/utils');
var fileSystem = require('./fileStorage');
var completeClientLoaded = false;

window.onerror = function (message) {
	console.error(new Error('Error partialClient: ' + message));
	getFromId('splash').style.display = 'block';
	wallet.loadCompleteClient(true);
};

window.handleOpenURL = function(url) {
	setTimeout(function(){
		console.log("saving open url "+url);
		window.open_url = url;
	},0);
}

function initWallet() {
	var root = {};
	root.profile = null;
	root.focusedClient = null;
	root.walletClients = {};
	root.config = null;

	var decryptOnMobile = function(text, cb) {
		var json;
		try {
			json = JSON.parse(text);
		} catch (e) {
		}

		if (!json) return cb('Could not access storage');

		if (!json.iter || !json.ct) {
			return cb(null, text);
		}
		return cb(null, text);
	};

	function createObjProfile(profile) {
		profile = JSON.parse(profile);
		var Profile = {};
		Profile.version = '1.0.0';
		Profile.createdOn = profile.createdOn;
		Profile.credentials = profile.credentials;

		if (Profile.credentials[0] && typeof Profile.credentials[0] !== 'object')
			throw ("credentials should be an object");

		if (!profile.xPrivKey && !profile.xPrivKeyEncrypted)
			//throw Error("no xPrivKey, even encrypted");
        {
            profile.xPrivKey = null;
            profile.xPrivKeyEncrypted = null;
        }
		if (!profile.tempDeviceKey)
			throw Error("no tempDeviceKey");
		Profile.xPrivKey = profile.xPrivKey;
		Profile.mnemonic = profile.mnemonic;
		Profile.xPrivKeyEncrypted = profile.xPrivKeyEncrypted;
		Profile.mnemonicEncrypted = profile.mnemonicEncrypted;
		Profile.tempDeviceKey = profile.tempDeviceKey;
		Profile.prevTempDeviceKey = profile.prevTempDeviceKey; // optional
		Profile.my_device_address = profile.my_device_address;
        Profile.device_pubkey =  profile.device_pubkey;
        Profile.device_xprivKey = profile.device_xprivKey;
		return Profile;
	}

	function setWalletClients(credentials) {
		if (root.walletClients[credentials.walletId] && root.walletClients[credentials.walletId].started)
			return;

		var client = {credentials: credentials};

		client.credentials.xPrivKey = root.profile.xPrivKey;
		client.credentials.mnemonic = root.profile.mnemonic;
		client.credentials.xPrivKeyEncrypted = root.profile.xPrivKeyEncrypted;
		client.credentials.mnemonicEncrypted = root.profile.mnemonicEncrypted;

		root.walletClients[credentials.walletId] = client;
		root.walletClients[credentials.walletId].started = true;
	}

	function readStorage(cb) {
		fileSystem.get('agreeDisclaimer', function(err, agreeDisclaimer) {
			fileSystem.get('profile', function(err, profile) {
				fileSystem.get('focusedWalletId', function(err, focusedWalletId) {
					fileSystem.get('config', function(err, config) {
						window.config = config;
						cb(agreeDisclaimer, profile, focusedWalletId, config ? JSON.parse(config) : config);
					});
				});
			});
		});
	}

	function setWalletNameAndColor(walletName) {
		if(completeClientLoaded) return;
		document.getElementsByClassName('page')[1].style.display = 'block';
	}


	function setWalletsInMenu() {
		if(completeClientLoaded) return;
		var selectedWalletId = root.focusedClient.credentials.walletId;
		var colors = root.config.colorFor;
		var html = '';
		for (var key in root.walletClients) {
			var credentials = root.walletClients[key].credentials;
			var walletId = credentials.walletId;
		}
	}

	function loadCompleteClient(showClient) {
		self._bIntervalueCoreLoaded = false; //"fix" : Looks like you are loading multiple copies of intervalue core, which is not supported. Running 'npm dedupe' might help.
		var body = document.body;
		var page = document.createElement('div');

		body.appendChild(page);
		var angularJs = document.createElement('script');
		angularJs.src = 'angular.js';
		angularJs.onload = function() {
			var intervalueJS = document.createElement('script');
			intervalueJS.src = 'intervalue.js';
			body.appendChild(intervalueJS);
			intervalueJS.onload = function() {
				if(showClient) showCompleteClient();
			}
		};

		body.appendChild(angularJs);
	}

	function showCompleteClient() {
		getFromId('splash').style.display = 'none';
		var pages = document.getElementsByClassName('page');
		if (pages.length === 2) {
			document.getElementsByClassName('page')[1].remove();
			document.getElementsByClassName('page')[0].style.display = 'block';
			completeClientLoaded = true;
		}
	}

	function initFocusedWallet(cb) {
		setWalletNameAndColor(root.focusedClient.credentials.walletName);
		balances.readBalance(root.focusedClient.credentials.walletId, function(assocBalances) {
			if (!assocBalances[BLACKBYTES_ASSET])
				assocBalances[BLACKBYTES_ASSET] = {is_private: 1, stable: 0, pending: 0};
			balances.readSharedBalance(root.focusedClient.credentials.walletId, function(assocSharedBalances) {
				for (var asset in assocSharedBalances)
					if (!assocBalances[asset])
						assocBalances[asset] = {stable: 0, pending: 0};
				cb();
			});
		})
	}

	function loadProfile() {
		readStorage(function(agreeDisclaimer, profile, focusedWalletId, config) {
			if (!agreeDisclaimer || !profile) {
				getFromId('splash').style.display = 'block';
				loadCompleteClient(true);
				return;
			}
			root.config = config;
			decryptOnMobile(profile, function(err, profile) {
				if(err){
					getFromId('splash').style.display = 'block';
					loadCompleteClient(true);
					return;
				}
				root.profile = createObjProfile(profile);
				//If password is set hide wallet display, show splash instead
				if(root.profile.xPrivKeyEncrypted)
				{
					getFromId('splash').style.display = 'block';
				}
				root.profile.credentials.forEach(function(credentials) {
					setWalletClients(credentials);
				});
				if (focusedWalletId)
					root.focusedClient = root.walletClients[focusedWalletId];
				else
					root.focusedClient = [];

				if (root.focusedClient.length === 0)
					root.focusedClient = root.walletClients[Object.keys(root.walletClients)[0]];
				initFocusedWallet(function() {
					console.log('partial client load end');
					setWalletsInMenu();
					loadCompleteClient();
				});
			});
		});
	}

	function selectWallet(walletId) {
		if(completeClientLoaded) return;
		var divFocusedClient = getFromId('w' + root.focusedClient.credentials.walletId);
		divFocusedClient.className = divFocusedClient.className.replace('selected').trim();
		getFromId('w' + walletId).className += 'selected';
		root.focusedClient = root.walletClients[walletId];
		fileSystem.set('focusedWalletId', walletId, function() {});
		initFocusedWallet(function() {});
	}
	
	function formatAmount(bytes, asset) {
		var setting = root.config.wallet.settings;
		var name = asset;
		var unitCode;
		if(asset === 'base'){
			name = setting.unitName;
			unitCode = setting.unitCode;
		}else if(asset === BLACKBYTES_ASSET){
			name = setting.bbUnitName;
			unitCode = setting.bbUnitCode;
		}else {
			unitCode = 'one';
		}
		return utils.formatAmount(bytes, unitCode) + ' ' + name;
	}

	root.showCompleteClient = showCompleteClient;
	root.loadProfile = loadProfile;
	root.selectWallet = selectWallet;
	root.loadCompleteClient = loadCompleteClient;
	root.clientCompleteLoaded = function(){return completeClientLoaded;};
	return root;
}

window.wallet = new initWallet();

document.addEventListener("deviceready", function() {
	wallet.loadProfile();
});



//other
function getFromId(id) {
	return document.getElementById(id);
}