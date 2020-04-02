var keychainItem;

var TiIdentity = require('ti.identity');
var SlowAES = require('/SlowAES/Ti.SlowAES');
var slowaesopts = {
	iv: (Ti.Utils.sha1(Ti.App.Properties.getString('uuid'))).substring(7, 23)
};

var slowaes = new SlowAES(slowaesopts);
var dsteem = require('/dsteem');

var buffer = require('/buffer');

var helpers = require('/functions');

var wallet_helpers = {

  initTiIdentity: function(cb) {
  	// create keychain object on launch if it has been setup before.
  	if (TiIdentity.isSupported() && TiIdentity.deviceCanAuthenticate()) {
  		if (OS_IOS) {
  			Alloy.Globals.keychainItem = TiIdentity.createKeychainItem({
  				identifier: 'walletpassphrase',
  				accessGroup: Alloy.Globals.config.teamid + '.' + Ti.App.getId(),
  				accessibilityMode: TiIdentity.ACCESSIBLE_WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  				//Item data can only be accessed while the device is unlocked. This class is only available if a passcode is set on the device.
  				//This is recommended for items that only need to be accessible while the application is in the foreground.
  				//Items with this attribute will never migrate to a new device, so after a backup is restored to a new device, these items will be missing.
  				//No items can be stored in this class on devices without a passcode.
  				//Disabling the device passcode will cause all items in this class to be deleted.
  				accessControlMode: TiIdentity.ACCESS_CONTROL_TOUCH_ID_ANY,

  				options: {
  					// It's the value of kSecUseOperationPrompt
  					'u_OpPrompt': L('authenticate_to_retrieve_passphrase_from_keychain')
  				}
  			});

				Alloy.Globals.tidentity_initialized = true;

  			if (cb) {
  				cb();
  			}
  		} else if (OS_ANDROID) {

  			Alloy.Globals.keychainItem = TiIdentity.createKeychainItem({
  				identifier: 'walletpassphrase'
  			});

				Alloy.Globals.tidentity_initialized = true;

  			if (cb) {
  				cb();
  			}
  		}
  	}
  },
  unlockWallet: function(cb, skipidentity, cberr) {
  	// this function just manages the unlock procedure. The actually unencryption takes place in decryptWallet

		if(Alloy.Globals.coaster.keepunlocked && Alloy.Globals.coaster.key !== "" && (((Math.round(new Date().getTime())) - Alloy.Globals.coaster.lastunlock) < Alloy.Globals.config.maxunlocktime) ) {
			// if we have an Alloy.Globals.coaster.keepunlocked to true and key is not empty, we return that key. This is for session based unlock.
			console.log("trying to use global unlock!");
			if (cb) {
				cb(Alloy.Globals.coaster.key);
			}

		} else {

	  	var passphrase;

	  	var skipidentitylogin = false;

	  	skipidentitylogin = skipidentity;

	  	if (TiIdentity.isSupported() && TiIdentity.deviceCanAuthenticate() && Ti.App.Properties.getBool('usesIdentity') && !skipidentitylogin) {
	  		// get item from keychain.

	  		Alloy.Globals.keychainItem.addEventListener('read', function _ukw(e) {
	  			Alloy.Globals.keychainItem.removeEventListener('read', _ukw);

	  			if (!e.success) {
	  				console.log(e);
	  				//Ti.API.error('Error reading from the keychain: ' + e.error);
	  				//alert(e.error);
	  				//Ti.App.Properties.setBool('usesIdentity',false);
	  				// force to unlock without identity.
	  				return unlockWallet(cb, true, cberr);
	  			}

	  			passphrase = e.value;

	  			//console.log('reading keychain', passphrase);

	  			if (cb) {
	  				cb(passphrase);
	  			}

	  		});


	  		if (OS_IOS) {
	  			// IOS reauths automatically whenever you want to read keychain items, due to the TiIdentity initialisation settings.
	  			Alloy.Globals.keychainItem.read();
	  		} else if (OS_ANDROID) {
	  			//console.log('Should authenticate here for ANDROID');

					var alertDialog;

	  			TiIdentity.authenticate({
	  				reason: L('authenticate_to_retrieve_passphrase_from_keychain'),
	  				callback: function(e) {
	  					try {
	  						alertDialog.hide();
	  					} catch (err) {

	  					}

	  					if (!e.success) {

	  						console.log('Message: ' + e.error);
	  						return module.exports.unlockWallet(cb, true, cberr);

	  					} else {
	  						// succesfull unlock, now we can read the keychainiTem for android
	  						Alloy.Globals.keychainItem.read();
	  					}
	  				}
	  			});


					alertDialog = Ti.UI.createAlertDialog({
						title: L('authenticate_with_fingerprint'),
	  				message: L('authenticate_to_retrieve_passphrase_from_keychain'),
	  				destructive: 0,
	  				cancel: 1,
	  				buttonNames: [L('OK'), L('cancel')]
					});

	  			alertDialog.addEventListener('click', function _adcb(e){

						alertDialog.removeEventListener('click',_adcb);

						console.log("alertdialog index ===> was clicked"+e.index);
						console.log(e);

						if(e.index ==0) {
							// OK was hit.
							return true;
						} else {
							// cancel was hit
							return module.exports.unlockWallet(cb, true, cberr);
						}
					})

	  			alertDialog.show();

	  		}

	  	} else {

	  		// ask for passphrase from user .
	  		if (OS_IOS) {
	  			var dialog = Ti.UI.createAlertDialog({
	  				titleid: 'unlock_wallet',
	  				messageid: 'insert_your_passphrase',
	  				style: Ti.UI.iOS.AlertDialogStyle.SECURE_TEXT_INPUT,
	  				buttonNames: [L('unlock'), L('cancel')],
	  				cancel: 1,
	  			});
	  			dialog.addEventListener('click', function _lis(e) {
	  				dialog.removeEventListener('click', _lis);

	  				if (e.index == 0) {
	  					cb(e.text);
	  				} else {
	  					//$.button_send.enabled = (true);
							cberr(L('cancel'));
	  				}
	  				e = null;

	  			});
	  			dialog.show();
	  		} else if (OS_ANDROID) {

	  			var dialoginputContainer = Titanium.UI.createView({
	  				top: 0,
	  				left: 0,
	  				right: 0,
	  				height: Ti.UI.SIZE,
	  			});


	  			var dialoginputandroid = Titanium.UI.createTextField({
	  				id: 'inputfielddialog',
	  				height: 50,
	  				font: {
	  					fontSize: 20,
	  					fontWeight: "normal"
	  				},
	  				color: Alloy.Globals.theme.steemdarkblue,
	  				backgroundColor: 'transparent',
	  				passwordMask: true,
	  				padding: {
	  					left: 0,
	  					right: 0,
	  					top: 0,
	  					bottom: 0,
	  				},
	  				hinttextid: 'insert_your_passphrase',
	  				left: 20,
	  				right: 20,
	  			});

	  			dialoginputContainer.add(dialoginputandroid);

	  			var dialog = Ti.UI.createAlertDialog({
	  				//messageid: 'insert_your_passphrase',
	  				buttonNames: [L('unlock'), L('cancel')],
	  				titleid: 'unlock_wallet',
	  				androidView: dialoginputContainer
	  			});

	  			dialog.addEventListener('click', function _lis(e) {
	  				dialog.removeEventListener('click', _lis);

	  				if (e.index == 0) {
	  					cb(dialoginputandroid.value);
	  				} else {
	  					//$.button_send.enabled = (true);
							cberr(L('cancel'));
	  				}
	  				dialoginputandroid.value = ('');
	  				dialoginputandroid = null;
	  				e = null;

	  			});
	  			dialog.show();
	  			//alert('should still make this custom textfield input alert dialog for android');
	  		}

	  	}

		} // end of if/else user has Global unlock running.

  },
   scanUserObjectForKey: function(accounttofind, role, cbok, cberr) {
  	var currentaccounts = Ti.App.Properties.getObject('accounts');

		if(currentaccounts.length == 0) {
			if (cberr) {
				cberr();
			}
			return false;
		}

  	for (var j = 0; j < currentaccounts.length; j++) {

  		if (currentaccounts[j].name == accounttofind) {
  			// account found update value where key = key.

				console.log("FOUND ACCOUNT in scanUserObjectForKey ::: "+accounttofind);
				console.log(currentaccounts[j]);

  			if (currentaccounts[j]['privatekey_'+role]) {
  				if (cbok) {
  					cbok();
  				}
  			} else {
  				if (cberr) {
  					cberr();
  				}
  			}
  			break;
  		}

  	}

  },

  scanWalletForKey: function(accounttofind, cbok, cberr, role) {
		role = (typeof role !== 'undefined') ?  role : false;
  	module.exports.unlockWallet(
  		function(e) {
  			//alert(e);


  			var keys = module.exports.decryptWallet(e);

  			if (keys) {


  				try {
  					var parsedkeys = JSON.parse(keys);
  					//console.log(parsedkeys);
  					if ('keys' in parsedkeys) {

							// this indicates a succesfull unlock
							// if global unlocked is activated and lastunlock is longer than maxunlocktime ... add new lastunlock
							if(Alloy.Globals.coaster.keepunlocked && (((Math.round(new Date().getTime())) - Alloy.Globals.coaster.lastunlock) > Alloy.Globals.config.maxunlocktime)) {
								Alloy.Globals.coaster = {keepunlocked: true, key:e, lastunlock: (Math.round(new Date().getTime()))};
							}

							if(!Titanium.App.Properties.hasProperty('walletversion')) {
								// wallet exists but is not yet converted to v2.
								// let's do that right away... v1 consisted of only "active_keys", so we will loop through accounts and convert those to new data format.

								console.log("allright, should convert v1 to v2");
								console.log("v1");
								// console.log(parsedkeys['keys']);
								parsedkeys['keys'] = module.exports.convertWalletv1v2(parsedkeys['keys']);

								//console.log("v1 after conversion");

								//console.log(v2keys);

								module.exports.encryptWallet(parsedkeys['keys'], e);
								Ti.App.Properties.setInt('walletversion', 2);
							}

  						for (var i = 0; i < parsedkeys['keys'].length; i++) {
  							if (parsedkeys['keys'][i]['account'] == accounttofind) {
									if(role) {
										// if role isset
										if (parsedkeys['keys'][i]['keys'].hasOwnProperty(role.toLowerCase())) {

											cbok(parsedkeys['keys'][i]['keys'][role.toLowerCase()]);
											parsedkeys, keys = null;
											return true;
		  								break;

										} else {
											parsedkeys, keys = null;
				  						return cberr(String.format(L('no_s_key_found_for_s'), role.toLowerCase(), accounttofind));
											break;
										}
									}
  								cbok(parsedkeys['keys'][i]);
  								parsedkeys, keys = null;
  								return true;
  								break;

  							}
  						}

  						parsedkeys, keys = null;
  						return cberr(String.format(L('no_keys_found_for_s'), accounttofind));

  					}
  				} catch (e) {
  					keys = null;
  					//alert(e.message);
  					return cberr(String.format(L('wrong_passphrase'), e.message));

						// unsetting global unlock variables.
						Alloy.Globals.coaster['key'] = '';
						Alloy.Globals.coaster['lastunlock'] = 0;

  				}
  				keys = null;
  			}
			},
			false,
			function(err) {
				return cberr(err);
			});

  },
	signAndBroadcastOperation: function(account, keyrole, operations, cbok, cberr, extensions) {
		extensions = (typeof extensions !== 'undefined') ?  extensions : [];
		// an all in function to unlock wallet, lookup desired keyrole, account and create & sign the operation. and broadcast it!
		module.exports.scanWalletForKey(account,
			function keyfound(keypair) {
				// key was found. should use the keypair.private for signing.

				// now lets continue and get a recent headblock_id and such

				Alloy.Globals.loading.show(L('broadcasting'), false);

				helpers.steemAPIcall(
					"get_dynamic_global_properties", [],
					function(response) {
						console.log('get_dynamic_global_properties');
						console.log(response);

						var head_block_number = response.result.head_block_number;
						var head_block_id = response.result.head_block_id;
						var refblock_prefix = new buffer.Buffer(head_block_id, 'hex').readUInt32LE(4);

						var op = {
							ref_block_num: head_block_number, //reference head block number required by tapos (transaction as proof of stake)
							ref_block_prefix: refblock_prefix, //reference buffer of block id as prefix
							expiration: new Date(Date.now() + Alloy.Globals.config.expiretime).toISOString().slice(0, -5), //set expiration time for transaction (+1 min)

							operations: operations,
							extensions: extensions //extensions for this transaction
						};

						console.log("op is now below:");
						console.log(op);


						var dsteemkey = dsteem.PrivateKey.fromString(keypair['private']);
						//console.log(key);
						console.log("Does dsteemclient exist yet?");

						if(!Alloy.Globals.dsteemclient) {
							var dsteemclient = new dsteem.Client(Alloy.Globals.config.apiurl);
							Alloy.Globals.dsteemclient = dsteemclient;
						}

						var stx = Alloy.Globals.dsteemclient.broadcast.sign(op, dsteemkey);

						console.log("STX result?");
						console.log(stx);
						dsteemkey, op, keypair = null;

						helpers.steemAPIcall(
							"broadcast_transaction_synchronous", [stx],
							function(transactionresponse) {
								// expects []


								console.log(transactionresponse);

								var answerfromchain = transactionresponse.result;

								Alloy.Globals.loading.hide();

								if ((Array.isArray(answerfromchain.result) && answerfromchain.length == 0) || (Object.keys(answerfromchain).length === 0 && answerfromchain.constructor === Object)) {
									// success!
									cbok({success:true});

								} else {
									console.log(answerfromchain);
									cbok(answerfromchain);
								}

							},
							function(err2) {
								Alloy.Globals.loading.hide();
								cberr(err2);
							});

					},
					function(err3) {
						Alloy.Globals.loading.hide();
						cberr(err3);
						keypair = null;

					});

			},
			function keylookuperr(err1) {
				cberr(err1);
			},
			keyrole
		);
	},
  decryptWallet: function(passphrase) {
  	var encryptkey = Ti.Utils.sha256(Ti.App.Properties.getString('uuid') + '' + passphrase + '' + (passphrase.length * passphrase.length));

  	var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, Alloy.Globals.config.walletfilename);

  	if (f.exists() === false) {
  		// you don't need to do this, but you could...
  		alert(L('wallet_file_not_exist'));

  		//showOverlay($.overlay_createwallet);
  		f = null;
  		passphrase = null;

			// triggering to go to import_key settings.
			var win = Alloy.createController('settings_import_keys').getView();
			Alloy.Globals.tabGroup.activeTab.open(win);

  		return false;


  	}

  	var decryptedwallet = JSON.parse(f.read());
  	var encryptedkeys = (decryptedwallet['ciphertext']);

  	var decryptedValue = slowaes.decrypt(encryptedkeys, encryptkey);

  	encryptedkeys, decryptedwallet, f, passphrase, encryptkey = null;
  	return decryptedValue;

  },
  encryptWallet: function(keys, passphrase) {

  	var encryptkey = Ti.Utils.sha256(Ti.App.Properties.getString('uuid') + '' + passphrase + '' + (passphrase.length * passphrase.length));

  	var encryptedValue = slowaes.encrypt(
  		JSON.stringify({
  			keys: keys,
  			lastupdated: Date.now()
  		}),
  		encryptkey);

  	var wallettext = JSON.stringify({
  		'ciphertext': encryptedValue
  	});

  	var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, Alloy.Globals.config.walletfilename);
  	f.write(wallettext); // write to the file
		if(OS_IOS) {
			// don't publish file to icloud
			f.remoteBackup = false;
		}

  	// unset all vars
  	Ti.App.Properties.setBool('walletSetup', true);
		//Ti.App.Properties.setInt('walletversion', 2);

  	encryptkey = null;
  	encryptedValue = null;
  	wallettext = null;
  	keys = null;
  	passphrase = null;
  	f = null;

  	return true;

  },
	convertWalletv1v2 : function( v1keysformat) {
		//v1 keys format:
		// [ {account: ACCOUNTNAME, key: PRIV_ACTIVE_KEY}, etc]
		//v2 keys format:
		// [ { account: ACCOUNTNAME, keys: {ROLE: {public: PUB, private: PRIV_ROLE_KEY}}}, etc]
		var helpers = require('/functions');
		//var helpers = new fns();

		var v2keys = [];

		for(var i = 0; i < v1keysformat.length; i++) {
			var v1key = v1keysformat[i];
			v2keys.push({
				'account'	: v1key['account'],
				'keys': {
					'active': {
						'public': dsteem.PrivateKey.fromString(v1key['key']).createPublic().toString(),
						'private': v1key['key'],
					}
				}
			});

			helpers.updateUserObject(v1key['account'], 'privatekey_active', true);
			v1key = null;
		}
		v1keysformat = null;
		helpers = null;
		return v2keys;
		// return v1keysformat
	},
	checkIfWalletExists : function() {
		var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, Alloy.Globals.config.walletfilename);
  	if (f.exists() === false) {
			f = null;
			return false;
		}  else {
			f = null;
			return true;
		}
	}

}
module.exports = wallet_helpers;
