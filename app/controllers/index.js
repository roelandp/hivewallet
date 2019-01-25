// starting off with some includers and initialization

// dsteem - https://github.com/steemit/dsteem

if (!Titanium.App.Properties.hasProperty('apiurl')) {
	Titanium.App.Properties.setString('apiurl',Alloy.Globals.config.apiurl);
} else {
	Alloy.Globals.config.apiurl = Titanium.App.Properties.getString('apiurl');
}

var dsteem = require('/dsteem');
var dsteemclient = new dsteem.Client(Alloy.Globals.config.apiurl);

// making the dsteemclient global.
Alloy.Globals.dsteemclient = dsteemclient;

// Node buffer implementation, used for head-block prefix calcs. https://github.com/feross/buffer
var buffer = require('/buffer');

// https://github.com/siciarek/javascript-qrcode
var qrcodelib = require('/qrcode');

// for time manipulations:  https://github.com/moment/moment
var moment = require('/moment');

// AES encryption for wallet encryption. https://github.com/benbahrenburg/Ti.SlowAES
var SlowAES = require('/SlowAES/Ti.SlowAES');

// zxcvbn password strength library https://github.com/dropbox/zxcvbn
var zxcvbn = require('/zxcvbn');

// identity module for integration with biometry: https://github.com/appcelerator-modules/titanium-identity/
var TiIdentity = require('ti.identity');

// badactors list from: https://github.com/steemit/condenser/blob/master/src/app/utils/BadActorList.js
var badactors = require('/badactors');

// detecting crossplatform resume / pause of app https://github.com/dieskim/Appcelerator.Hyperloop.appPauseResume
var appPauseResume = require('/appPauseResume');

var fns = require('/functions');
var helpers = new fns();

// qr code scanner from: https://github.com/appcelerator-modules/ti.barcode
var Barcode = require('ti.barcode');

Barcode.allowRotation = false;
Barcode.displayedMessage = ' ';
Barcode.allowMenu = false;
Barcode.allowInstructions = false;
Barcode.useLED = false;

var barcodeoverlay = Ti.UI.createView({
	backgroundColor: 'transparent',
	top: 0,
	right: 0,
	bottom: 0,
	left: 0
});

var barcodeoverlaybg1 = Ti.UI.createView({
	top: 0,
	left: 0,
	width: Alloy.Globals.dimensions.DP_platformWidth,
	height: Alloy.Globals.dimensions.overlay_barcode_top_height,
	backgroundColor: "#494841",
	opacity: 0.5
});

var barcodeoverlaybg2 = Ti.UI.createView({
	bottom: 0,
	left: 0,
	width: Alloy.Globals.dimensions.DP_platformWidth,
	height: Alloy.Globals.dimensions.overlay_barcode_top_height,
	backgroundColor: "#494841",
	opacity: 0.5
});

var barcodeoverlaybg3 = Ti.UI.createView({
	top: Alloy.Globals.dimensions.overlay_barcode_top_height,
	left: 0,
	width: 30,
	height: Alloy.Globals.dimensions.overlay_barcode_middle_height,
	backgroundColor: "#494841",
	opacity: 0.5
});

var barcodeoverlaybg4 = Ti.UI.createView({
	top: Alloy.Globals.dimensions.overlay_barcode_top_height,
	right: 0,
	width: 30,
	height: Alloy.Globals.dimensions.overlay_barcode_middle_height,
	backgroundColor: "#494841",
	opacity: 0.5
});

barcodeoverlay.add(barcodeoverlaybg1);
barcodeoverlay.add(barcodeoverlaybg2);
barcodeoverlay.add(barcodeoverlaybg3);
barcodeoverlay.add(barcodeoverlaybg4);

var bcontainer_branding = Ti.UI.createView({
	layout: 'horizontal',
	height: Ti.UI.SIZE,
	left: 20,
	right: 20,
	top: Alloy.Globals.dimensions.container_branding_top,

});

var bcontainer_branding_icon = Ti.UI.createLabel({
	font: {

		fontFamily: "icomoon",
		fontSize: 25,
	},
	right: 5,
	top: 3,
	color: 'white',
	opacity: 0.45,
	text: 's',

});

var bcontainer_branding_title = Ti.UI.createLabel({
	font: {
		fontWeight: "semibold",
		fontSize: 25,
	},
	color: 'white',
	opacity: 0.3,
	text: 'steemwallet'
});

bcontainer_branding.add(bcontainer_branding_icon);
bcontainer_branding.add(bcontainer_branding_title);

barcodeoverlay.add(bcontainer_branding);

var barcodeCancel = Ti.UI.createButton({
	title: '✕',
	font: {
		fontFamily: "icomoon",
		fontSize: 40,
	},
	color: "white",
	selectedColor: "white",
	backgroundColor: 'transparent',
	selectedBackgroundColor: 'transparent',
	backgroundSelectedColor: 'transparent',
	borderWidth: 0,

	borderColor: 'transparent',
	borderRadius: 0,
	borderWidth: 0,

	width: 60,
	height: 60,
	bottom: 30,
	right: 30,
	opacity: 0.7,
});

barcodeCancel.addEventListener('click', function() {
	Barcode.cancel();
});

var barcodeLed = Ti.UI.createButton({
	title: '🔦',
	font: {
		fontFamily: "icomoon",
		fontSize: 40,
	},
	color: "white",
	selectedColor: "white",
	backgroundColor: 'transparent',
	selectedBackgroundColor: 'transparent',
	backgroundSelectedColor: 'transparent',
	borderWidth: 0,

	borderColor: 'transparent',
	borderRadius: 0,
	borderWidth: 0,

	width: 60,
	height: 60,
	bottom: 30,
	left: 30,
	opacity: 0.3,
});

barcodeLed.addEventListener('click', function() {
	//toggle barcode led.
	Barcode.useLED = !Barcode.useLED;

	if (Barcode.useLED) {
		barcodeLed.setOpacity(1);
	} else {
		barcodeLed.setOpacity(0.3);
	}
});

barcodeoverlay.add(barcodeCancel);
barcodeoverlay.add(barcodeLed);

// global keychainitem
var keychainItem;

var newuser = false;

var platformGUID = Ti.Platform.getId();
//console.log('getId()', platformGUID);

if (!platformGUID) {
	platformGUID = Ti.Platform.getModel() + '' + Date.now() + '' + helpers.randomString(20);
	//console.log('model+date', platformGUID);
}

if (!platformGUID) {
	platformGUID = Date.now() + '' + helpers.randomString(20);
	//console.log('model+date', platformGUID);
}

platformGUID = platformGUID + '' + Date.now() + '' + helpers.randomString(20);

if (!Titanium.App.Properties.hasProperty('accounts')) {
	//no accounts are currently saved for this user.
	newuser = true;

	Ti.App.Properties.setObject('accounts', []);

	Ti.App.Properties.setString('currentaccount', '');
	Ti.App.Properties.setString('price_steem_usd', "0");
	Ti.App.Properties.setString('price_sbd_usd', "0");
	Ti.App.Properties.setBool('usesIdentity', false);
	Ti.App.Properties.setBool('walletSetup', false);
	Ti.App.Properties.setString('uuid', platformGUID);
	Ti.App.Properties.setInt('lastPricesCheck', 0);
}

if(!Titanium.App.Properties.hasProperty('currency')) {
	Ti.App.Properties.setString('currency',Alloy.Globals.config.defaultcurrency);
}

var slowaesopts = {
	iv: (Ti.Utils.sha1(Ti.App.Properties.getString('uuid'))).substring(7, 23)
};

var slowaes = new SlowAES(slowaesopts);

var cameraPermission = function(callback) {
	if (OS_ANDROID) {
		if (Ti.Media.hasCameraPermissions()) {
			if (callback) {
				callback(true);
			}
		} else {
			Ti.Media.requestCameraPermissions(function(e) {
				if (e.success) {
					if (callback) {
						callback(true);
					}
				} else {
					if (callback) {
						callback(false);
					}
					alert('No camera permission');
				}
			});
		}
	}

	if (OS_IOS) {
		if (callback) {
			callback(true);
		}
	}
};


function initTiIdentity(cb) {
	// create keychain object on launch if it has been setup before.
	if (TiIdentity.isSupported() && TiIdentity.deviceCanAuthenticate()) {
		if (OS_IOS) {
			keychainItem = TiIdentity.createKeychainItem({
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

			if (cb) {
				cb();
			}
		} else if (OS_ANDROID) {

			keychainItem = TiIdentity.createKeychainItem({
				identifier: 'walletpassphrase'
			});

			if (cb) {
				cb();
			}

		}



	}

}

if (Ti.App.Properties.getBool('usesIdentity')) {
	initTiIdentity();
}

var backgroundOverlayAnimation = Titanium.UI.createAnimation();

// update-able callback function for generic alertdialog $.alertdialog which is bei
var alertdialogcallback = function() {
	return true;
}

var alertdialogcancelcallback = function() {
	return false;
}

function alertDialogCb(e) {

	//console.log(e);
	if (OS_ANDROID && (e.cancel || (e.source.cancel == e.index))) {
		// we are on android and experienced a cancel click.
		//return false;
		alertdialogcancelcallback();
	} else if (OS_IOS && (e.cancel == e.index)) {
		// we are on ios and experienced a cancel click.
		//return false;
		alertdialogcancelcallback();
	} else {
		alertdialogcallback();
	}
}


function showOverlayBG(cb) {
	if ($.background_overlay.getOpacity() == 0.5) {
		// background_overlay is already showing, don't bother showing it.
		if (cb) {
			cb();
		}

	} else {

		$.background_overlay.setTop(0);
		backgroundOverlayAnimation = {
			opacity: 0.5,
			duration: 150,
		};
		$.background_overlay.animate(backgroundOverlayAnimation, function() {
			$.background_overlay.setOpacity(0.5);
			$.background_overlay.setTop(0);
			if (cb) {
				cb();
			}
		});
	}

}

function hideOverlayBG(cb) {
	//console.log()
	if ($.background_overlay.getOpacity() == 0) {
		// background_overlay is already hiding, don't bother hiding it.
		if (cb) {
			cb();
		}

	} else {

		backgroundOverlayAnimation = {
			opacity: 0,
			duration: 150,
		};

		$.background_overlay.animate(backgroundOverlayAnimation, function() {
			$.background_overlay.setTop(Alloy.Globals.dimensions.DP_platformHeight);
			$.background_overlay.setOpacity(0);
			if (cb) {
				cb();
			}
		});
	}
}

var overlayAnimation = Titanium.UI.createAnimation();

function showOverlay(overlay) {

	// console.log('called show overlay', overlay);
	// console.log('getTop', overlay.getTop());
	// console.log('alloy globals getheight', Alloy.Globals.dimensions.DP_platformHeight);

	if (overlay.getTop() == Alloy.Globals.dimensions.DP_platformHeight) {
		// overlay is currently out of viewport, lets show it.
		overlayAnimation = {
			top: Alloy.Globals.dimensions.overlay_container_top,
			duration: 150,
		};

		//console.log('should call animation showOverlayBG');
		showOverlayBG(function() {
			overlay.animate(overlayAnimation, function() {
				overlay.top = Alloy.Globals.dimensions.overlay_container_top;
			});
		});

	} else {
		//console.log('apparently overlay is in viewport, why should we show it?');
		// overlay is in viewport, why should we bother showing it?
	}
}

function hideOverlay(overlay) {
	if (overlay.getTop() == Alloy.Globals.dimensions.overlay_container_top) {
		// overlay is currently in viewport, lets hide it.
		overlayAnimation = {
			top: Alloy.Globals.dimensions.DP_platformHeight,
			duration: 150,
		}

		overlay.animate(overlayAnimation, function() {
			overlay.top = Alloy.Globals.dimensions.DP_platformHeight;
			hideOverlayBG(false);
		});

	} else {
		// overlay is in viewport, why should we bother showing it?
	}
}

// all overlay functions had to be named as the index.xml view doesnt accept parameters in the function calls.
function hideOverlayAddAccount() {
	$.textfield_addaccount.blur();
	hideOverlay($.overlay_addaccount);
}

function showOverlayAddAccount() {
	$.overlay_body_addaccount_scrollview.scrollTo(0, 0);
	showOverlay($.overlay_addaccount);
}

function hideOverlayPickAccount() {
	hideOverlay($.overlay_pickaccount);
}

function hidePickshowAddAccount() {
	hideOverlayPickAccount();
	setTimeout(showOverlayAddAccount, 400);
}


function showOverlayReceive() {
	// prepopulate qr code

	$.overlay_body_receive_scrollview.scrollTo(0, 0);

	$.qrview.removeAllChildren();

	var currentaccount = Ti.App.Properties.getString('currentaccount');
	showOverlay($.overlay_receive);

	setTimeout(function() {
		var qrcode = new qrcodelib(currentaccount);
		var code = qrcode.getData(); // matrix of '0's' and '1's'

		var R = Alloy.Globals.dimensions.qrsize / qrcode.getSize(); // calculating of raster

		for (var r = 0; r < code.length; r++) {
			var top = r * R;
			var darkarr = ['black', Alloy.Globals.theme.steemdarkblue, Alloy.Globals.theme.steemlightblue];
			for (var c = 0; c < code[r].length; c += 1) {

				var left = c * R;
				var classname = Alloy.Globals.theme.backgroundColor;

				if (code[r][c] === 1) {
					/*1% more size to cover the border of rect. */
					classname = darkarr[(Math.floor((Math.random() * 2) + 1))];

					//classname = "black";

				}

				$.qrview.add(Ti.UI.createView({
					width: R,
					height: R,
					left: left,
					top: top,
					backgroundColor: classname
				}));


				$.qrcurrentaccount.setText(currentaccount);

			}
		}

		// empty vars.
		qrcode = null;
		code = null;

	}, 500);



}

function hideOverlayReceive() {
	hideOverlay($.overlay_receive);
}


function showOverlaySend() {

	// check if wallet setup
	if (!Ti.App.Properties.getBool('walletSetup')) {
		showOverlayCreateWallet();
	} else {

		scanUserObjectForKey(Ti.App.Properties.getString('currentaccount'),
			function() {
				showOverlay($.overlay_send);
				$.overlay_body_send_scrollview.scrollTo(0, 0);
			},
			function() {
				//alert('Private key for current account not found in your wallet. Let\'s add it now');
				showOverlayImportPrivatekey();
			}
		);

	}


}

function showOverlayImportPrivatekey() {
	$.overlay_body_importprivatekey_description.setText(String.format(L('overlay_body_importprivatekey_description'), Ti.App.Properties.getString('currentaccount')));
	$.overlay_body_importkey_scrollview.scrollTo(0, 0);
	showOverlay($.overlay_importkey);
}

function hideOverlayImportPrivatekey() {
	$.textfield_importprivatekey.blur();
	hideOverlay($.overlay_importkey);
}

function passwordorkey(key) {
	// basic validation...
	//console.log('passwordordkey called');

	if (key.length == 51 && key.startsWith("5")) {
		//console.log('seems like a private key to me');
		return key;

	} else {
		// get current account and try as password.
		//console.log('seems like a Password to me');
		return dsteem.PrivateKey.fromLogin(Ti.App.Properties.getString('currentaccount'), key, 'active').toString();

	}
}

function returnPrivatekey() {
	//

	$.textfield_importprivatekey.blur();
	if ($.textfield_importprivatekey.getValue().length == 0) {
		alert(L('please_type_paste_or_scan_a_privkey'));
		return false;
	}
	var privkey = passwordorkey($.textfield_importprivatekey.getValue());

	//alert(key);
	var publickey = dsteem.PrivateKey.fromString(privkey).createPublic().toString();

	//console.log('dsteem', publickey.toString());


	helpers.steemAPIcall(
		"get_key_references", [
			[publickey]
		],
		function(result) {
			//console.log('public key lookup results');
			//console.log(result);

			if (result.result[0].length > 0) {

				// @TODO should unlock wallet here. with the callback thingie.

				unlockWallet(function(passphrase) {


					for (var i = 0; i < result.result[0].length; i++) {
						//alert(result.result[0][i] +' hier geindegid vannacht');

						var currentaccounts = Ti.App.Properties.getObject('accounts');

						// consider updating current accounts when picking.

						// populate list table.
						for (var j = 0; j < currentaccounts.length; j++) {

							if (currentaccounts[j].name == result.result[0][i]) {
								// if matches.... add privkey to wallet in following format:


								// {
								// 	account: currentaccounts[j].name,
								// 	key: privkey
								// }
								var keys = decryptWallet(passphrase);

								//console.log('keys in wallet', keys);
								// loop through keys and see if we already had a key by that account

								try {
									var parsedkeys = JSON.parse(keys);
									//console.log(parsedkeys);
									if ('keys' in parsedkeys) {
										for (var k = 0; k < parsedkeys['keys'].length; k++) {
											if (parsedkeys['keys'][k]['account'] == result.result[0][i]) {

												// console.log('found key for '+parsedkeys['keys'][k]['account']);
												// console.log('now removing via splice');

												parsedkeys['keys'].splice(k, 1);


											}
										}
									}
								} catch (e) {

									$.textfield_importprivatekey.setValue('');
									Ti.UI.Clipboard.clearText();
									keys, privkey, passphrase = null;
									alert(e.message + "\n\nincorrect passphrase?");
									return false;

								}

								parsedkeys['keys'].push({
									account: result.result[0][i],
									key: privkey
								});


								// encryptwallet again with new key added.
								encryptWallet(parsedkeys['keys'], passphrase);

								// unset vars, textfield and emptying clipboard of device.
								$.textfield_importprivatekey.setValue('');
								keys, privkey, passphrase, parsedkeys, publickey = null;
								Ti.UI.Clipboard.clearText();

								// also update user object to reflect that
								helpers.updateUserObject(currentaccounts[j].name, 'privatekey', true);

								setTimeout(showOverlaySend, 400);
							}

							// close import.... start showing send overlay.
							hideOverlayImportPrivatekey();

						}
					}

					// unset passphrase
					passphrase = null;
				});


			} else {
				alert(L('no_account_found_for_given_key'));
				privkey, publickey = null;
				$.textfield_importprivatekey.setValue('');
				Ti.UI.Clipboard.clearText();

			}
		},
		function(err) {
			alert(err);
		});

}

function scanPrivateKey() {
	Barcode.addEventListener('success', function _sucfunc(e) {
		Barcode.removeEventListener('success', _sucfunc);
		//Ti.API.info('Success called with barcode: ' + e.result);
		$.textfield_importprivatekey.setValue(e.result);
		$.textfield_importprivatekey.blur();
	});

	cameraPermission(function(re) {
		Barcode.capture({
			animate: true,
			overlay: barcodeoverlay,
			showCancel: false,
			showRectangle: false,
			keepOpen: false
			//
			// acceptedFormats: [
			// 	 Barcode.FORMAT_QR_CODE
			// ]
		});
	});
}

function unlockWallet(cb, skipidentity) {
	// this function just manages the unlock procedure. The actually unencryption takes place in decryptWallet

	var passphrase;

	var skipidentitylogin = false;

	if (arguments.length == 2) {
		//method to force skip touch/face id and present unlock input box.
		skipidentitylogin = skipidentity;
	}

	if (TiIdentity.isSupported() && TiIdentity.deviceCanAuthenticate() && Ti.App.Properties.getBool('usesIdentity') && !skipidentitylogin) {
		// get item from keychain.

		keychainItem.addEventListener('read', function _ukw(e) {
			keychainItem.removeEventListener('read', _ukw);

			if (!e.success) {
				console.log(e);
				//Ti.API.error('Error reading from the keychain: ' + e.error);
				//alert(e.error);
				//Ti.App.Properties.setBool('usesIdentity',false);
				// force to unlock without identity.
				return unlockWallet(cb, true);
			}

			passphrase = e.value;

			//console.log('reading keychain', passphrase);

			if (cb) {
				cb(passphrase);
			}

		});


		if (OS_IOS) {
			// IOS reauths automatically whenever you want to read keychain items, due to the TiIdentity initialisation settings.
			keychainItem.read();
		} else if (OS_ANDROID) {
			//console.log('Should authenticate here for ANDROID');

			TiIdentity.authenticate({
				reason: L('authenticate_to_retrieve_passphrase_from_keychain'),
				callback: function(e) {
					try {
						$.alertdialog.hide();
					} catch (err) {

					}

					if (!e.success) {

						console.log('Message: ' + e.error);
						return unlockWallet(cb, true);

					} else {
						// succesfull unlock, now we can read the keychainiTem for android
						keychainItem.read();
					}
				}
			});


			$.alertdialog.applyProperties({
				title: L('authenticate_with_fingerprint'),
				message: L('authenticate_to_retrieve_passphrase_from_keychain'),
				destructive: 0,
				cancel: 1,
				buttonNames: [L('OK'), L('cancel')]
			});

			alertdialogcallback = function() {
				return true;
			}

			alertdialogcancelcallback = function() {
				return unlockWallet(cb, true);
			}

			$.alertdialog.show();

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
					$.button_send.setEnabled(true);
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
					fontWeight: 'normal'
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
					cb(dialoginputandroid.getValue());
				} else {
					$.button_send.setEnabled(true);
				}
				dialoginputandroid.setValue('');
				dialoginputandroid = null;
				e = null;

			});
			dialog.show();
			//alert('should still make this custom textfield input alert dialog for android');
		}

	}

}

function scanUserObjectForKey(accounttofind, cbok, cberr) {
	var currentaccounts = Ti.App.Properties.getObject('accounts');

	for (var j = 0; j < currentaccounts.length; j++) {

		if (currentaccounts[j].name == accounttofind) {
			// account found update value where key = key.

			if (currentaccounts[j].privatekey) {
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
}


function scanWalletForKey(accounttofind, cbok, cberr) {

	unlockWallet(
		function(e) {
			//alert(e);
			var keys = decryptWallet(e);
			if (keys) {


				try {
					var parsedkeys = JSON.parse(keys);
					//console.log(parsedkeys);
					if ('keys' in parsedkeys) {
						for (var i = 0; i < parsedkeys['keys'].length; i++) {
							if (parsedkeys['keys'][i]['account'] == accounttofind) {
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
				}
				keys = null;
			}
		});

}

var pwdgrades = [
	L("pw_strength_0"),
	L("pw_strength_1"),
	L("pw_strength_2"),
	L("pw_strength_3"),
	L("pw_strength_4"),
];

function calcPassphraseStrength(e) {

	var pwdstrength = zxcvbn(e.value);
	//console.log(pwdstrength);

	$.password_strength_result.setText(String.format(L("password_strength_result"), pwdgrades[pwdstrength['score']], pwdstrength['crack_times_display']['offline_slow_hashing_1e4_per_second']));

	if (pwdstrength['score'] >= 3) {
		$.create_wallet_button.setEnabled(true);
	} else {
		$.create_wallet_button.setEnabled(false);
	}

	if (e.value.length == "") {
		$.password_strength_result.setText("");
	}

	pwdstrength = null;
	e = null
}


function returnPassword(e) {
	var pwdstrength = zxcvbn(e.value);
	$.textfield_addwalletpassword.blur();
	if (pwdstrength['score'] >= 3) {
		$.create_wallet_button.setEnabled(true);
	} else {
		$.create_wallet_button.setEnabled(false);
		alert(String.format(L("password_strength_result"), pwdgrades[pwdstrength['score']], pwdstrength['crack_times_display']['offline_slow_hashing_1e4_per_second']));
	}

	pwdstrength = null;
	e = null;

}

function decryptWallet(passphrase) {
	var encryptkey = Ti.Utils.sha256(Ti.App.Properties.getString('uuid') + '' + passphrase + '' + (passphrase.length * passphrase.length));

	var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, Alloy.Globals.config.walletfilename);

	if (f.exists() === false) {
		// you don't need to do this, but you could...
		alert(L('wallet_file_not_exist'));

		showOverlay($.overlay_createwallet);
		f = null;
		passphrase = null;
		return false;

	}

	var decryptedwallet = JSON.parse(f.read());
	var encryptedkeys = (decryptedwallet['ciphertext']);

	var decryptedValue = slowaes.decrypt(encryptedkeys, encryptkey);

	encryptedkeys, decryptedwallet, f, passphrase, encryptkey = null;
	return decryptedValue;

}


function encryptWallet(keys, passphrase) {

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

	// unset all vars
	Ti.App.Properties.setBool('walletSetup', true);

	encryptkey = null;
	encryptedValue = null;
	wallettext = null;
	keys = null;
	passphrase = null;
	f = null;

	return true;

}

function createWallet() {

	$.create_wallet_button.setEnabled(false);
	var passphrase = $.textfield_addwalletpassword.getValue();

	var pwdstrength = zxcvbn(passphrase);

	if (pwdstrength['score'] >= 3) {

		// create empty wallet
		$.password_strength_result.setText("");

		// initiate wallet with empty key array.
		encryptWallet([], passphrase);

		if ($.enable_identity_switch.getValue()) {
			initTiIdentity(function() {

				keychainItem.fetchExistence(function(e) {
					//alert('Exists? ' + );

					if (e.exists) {
						keychainItem.reset();
					}

					keychainItem.addEventListener('save', function _savekci(e) {
						keychainItem.removeEventListener('save', _savekci);
						// Notify the user that the operation succeeded or failed
						if (!e.success) {
							console.log(e);
							Ti.API.error('Error saving to the keychain: ' + e.error);
							alert(e.error);
							Ti.App.Properties.setBool('usesIdentity', false);
							return false;
						}

						Ti.App.Properties.setBool('usesIdentity', true);
						hideOverlayCreateWallet();
						setTimeout(showOverlaySend, 400);

					});

					keychainItem.save(passphrase);
					passphrase = null;
				});


			});


			pwdstrength = null;

		} else {

			hideOverlayCreateWallet();
			setTimeout(showOverlaySend, 400);
			passphrase = null;
			pwdstrength = null;
		}

	} else {

		passphrase = null;
		// password is not strong enough.
		alert(String.format(L("password_strength_result"), pwdgrades[pwdstrength['score']], pwdstrength['crack_times_display']['offline_slow_hashing_1e4_per_second']));

		pwdstrength = null;

	}


}

function showOverlayCreateWallet() {

	// test for hasIdentity (Biometry / Touch ID / Face ID)
	var explaintext = L('create_wallet_explain');

	if (TiIdentity.isSupported() && TiIdentity.deviceCanAuthenticate()) {
		var authPhrase = 'Touch ID';

		if (OS_IOS) {
			// define between face & touch id ...
			if (TiIdentity.biometryType == TiIdentity.BIOMETRY_TYPE_FACE_ID) {
				authPhrase = 'Face ID';
			} else if (TiIdentity.biometryType == TiIdentity.BIOMETRY_TYPE_TOUCH_ID) {
				authPhrase = 'Touch ID';
			} else {
				authPhrase = '(None available)'
			}
		}

		explaintext += '\n\n';
		explaintext += String.format(L('optionally_store_in_device_keychain'), authPhrase);
		$.enable_identity_label.setText(String.format(L('enable_identity_label'), authPhrase));
		$.enable_identity_holder.setHeight(70);
	}

	$.overlay_body_addwallet_description.setText(explaintext);

	showOverlay($.overlay_createwallet);
	$.overlay_body_createwallet_scrollview.scrollTo(0, 0);
}

function hideOverlayCreateWallet() {
	$.textfield_addwalletpassword.blur();
	hideOverlay($.overlay_createwallet);
}

function hideOverlaySend() {

	$.textfield_send_to.blur();
	$.textfield_send_amount.blur();
	$.textfield_send_memo.blur();

	hideOverlay($.overlay_send);
}


function togglePasswordMask() {
	if ($.textfield_addwalletpassword.getPasswordMask()) {
		$.textfield_addwalletpassword.setPasswordMask(false);
		$.togglepasswordmask.setTitle('🤫');
	} else {
		$.textfield_addwalletpassword.setPasswordMask(true);
		$.togglepasswordmask.setTitle('🤪');
	}
}

function blinkSettings() {
	$.container_top_settings.animate({opacity: 0.8, duration: 150}, function() {
			$.username_edit_blink.opacity = 0.8;
			var internaltimeout = setTimeout(function(){
				$.container_top_settings.animate({opacity: 0.001, duration: 500});
				$.username_edit_blink.animate({opacity: 0.001, duration: 500});
				internaltimeout = null;
			}, 1250);
	});
}

function updateFiat() {

	var currency = Ti.App.Properties.getString('currency').toLowerCase();
	var currency_symbol = currency;

	if(Alloy.Globals.currencies[currency]) {
		currency_symbol = Alloy.Globals.currencies[currency];
	}
	if (Ti.App.Properties.getString('currentaccount') != '') {
		currentaccount = Ti.App.Properties.getString('currentaccount');
		var currentaccountdata = helpers.getUserObject(currentaccount);
		if(currentaccountdata) {
			if(currentaccountdata.hasOwnProperty('balance')) {
				console.log(currentaccountdata);
				$.account_amount_sbd_fiat.setText(currency_symbol + ' ' + helpers.formatToLocale((parseFloat(currentaccountdata.sbd_balance) * parseFloat(Ti.App.Properties.getString('price_sbd_usd'))), 2));
				$.account_amount_steem_fiat.setText(currency_symbol + ' ' + helpers.formatToLocale((parseFloat(currentaccountdata.balance) * parseFloat(Ti.App.Properties.getString('price_steem_usd'))), 2));

				$.account_amount_sbd_fiat.setWidth( Ti.UI.FILL);
				$.account_amount_steem_fiat.setWidth( Ti.UI.FILL);

				console.log((parseFloat(currentaccountdata.sbd_balance) * parseFloat(Ti.App.Properties.getString('price_sbd_usd'))));
				console.log((parseFloat(currentaccountdata.balance) * parseFloat(Ti.App.Properties.getString('price_steem_usd'))));
			}
		}
	}
}

function onBlurSendInputField(e) {

	switch (e.source.id) {
		case 'textfield_send_to':
			// check for bad actors.
			var tosend = $.textfield_send_to.getValue().trim();

			if (tosend.length > 0) {
				var regex = /[^0-9a-zA-Z.-]/g;

				tosend = tosend.replace(regex, '').toLowerCase();
				$.textfield_send_to.setValue(tosend);

				if (badactors.indexOf(tosend) > -1) {
					alert(String.format(L("account_s_on_bad_actors_list_cant_send"), tosend));
					$.textfield_send_to.setValue('');
				}

				helpers.steemAPIcall(
					"get_accounts", [
						[tosend]
					],
					function(success) {
						//console.log(success);
						if (success.result.length == 0) {
							alert(String.format(L('alert_account_not_found'), tosend));
						} else {
							// consider checking for reputation here...
						}

					},
					function(error) {
						console.log(error);
					}
				);
			}
			//

			break;

		case 'textfield_send_amount':

			var amount = $.textfield_send_amount.getValue();

			amount = amount.replace(",", ".");

			if (amount.length == 0 || isNaN(amount)) {
				amount = "0.001";
			}



			amount = parseFloat(amount.replace(/[^\d.-]/g, '')).toFixed(3);

			$.textfield_send_amount.setValue(amount);

			break;

		case 'textfield_send_memo':

			var memotxt = $.textfield_send_memo.getValue().trim();
			var memoarr = memotxt.split(" ");
			for (var i = 0; i < memoarr.length; i++) {
				if (memoarr[i].length == 51 && memoarr[i].startsWith("5")) {
					alert(L('seems_like_you_are_sending_a_private_key'));
					$.textfield_send_memo.setValue('');
				} else {
					//console.log(memoarr[i].length);
					//console.log(memoarr[i].startsWith("5"));
				}
			}


			break;
	}
}


function returnSendInputfield(e) {

	switch (e.source.id) {
		case 'textfield_send_to':
			// check for bad actors.

			$.textfield_send_amount.focus();
			break;

		case 'textfield_send_amount':


			$.textfield_send_memo.focus();
			break;

		case 'textfield_send_memo':


			$.textfield_send_memo.blur();
			break;
			//onBlurSendInputField(e);
	}

}

function sendConfirm() {


	var tosend = $.textfield_send_to.getValue().trim();
	var amount = $.textfield_send_amount.getValue().trim();
	var memo = $.textfield_send_memo.getValue().trim();
	var sbdorsteem = $.token_steem_or_sbd.getText();

	if (tosend.length > 0) {
		var regex = /[^0-9a-zA-Z.-]/g;

		tosend = tosend.replace(regex, '').toLowerCase();

		if (badactors.indexOf(tosend) > -1) {
			alert(String.format(L("account_s_on_bad_actors_list_cant_send"), tosend));
			$.textfield_send_to.setValue('');
			return false;
		}
	} else {
		alert(String.format(L('s_field_cant_be_empty'), L('overlay_body_send_to')));
		return false;
	}

	if (amount.length > 0) {
		amount = amount.replace(",", ".");

		amount = parseFloat(amount.replace(/[^\d.-]/g, '')).toFixed(3);
	} else {
		alert(String.format(L('s_field_cant_be_empty'), L('overlay_body_send_amount')));
		return false;
	}

	if (memo.length == 0) {
		memo = "";
	}


	$.alertdialog.applyProperties({
		title: String.format(L('confirm_transaction'), Ti.App.Properties.getString('currentaccount').toUpperCase()),
		message: String.format(L('confirm_transation_details_to_s'), tosend.toUpperCase(), amount, sbdorsteem, memo),
		destructive: 0,
		cancel: 1,
		buttonNames: [L('send'), L('cancel')]
	});

	alertdialogcallback = function() {
		$.button_send.setEnabled(false);
		broadcastSend(Ti.App.Properties.getString('currentaccount'), tosend, amount, sbdorsteem, memo);
	}

	alertdialogcancelcallback = function() {
		$.button_send.setEnabled(true);
		return false;
	}

	$.alertdialog.show();


}

function resetSendWindow() {
	//reset send shizzle.
	$.textfield_send_to.setValue("");
	$.textfield_send_amount.setValue("");
	$.textfield_send_memo.setValue("");
	$.token_steem_or_sbd.setText('steem');
	$.button_send.setEnabled(true);
}


function broadcastSend(from, tosend, amount, sbdorsteem, memo) {

	scanWalletForKey(from, function(key) {
		//key['key'] has the wif.

		Alloy.Globals.loading.show(L('broadcasting'), false);

		helpers.steemAPIcall(
			"get_dynamic_global_properties", [],
			function(response) {
				//console.log('get_dynamic_global_properties', result);

				var head_block_number = response.result.head_block_number;
				var head_block_id = response.result.head_block_id;
				var refblock_prefix = new buffer.Buffer(head_block_id, 'hex').readUInt32LE(4);

				var op = {
					ref_block_num: head_block_number, //reference head block number required by tapos (transaction as proof of stake)
					ref_block_prefix: refblock_prefix, //reference buffer of block id as prefix
					expiration: new Date(Date.now() + Alloy.Globals.config.expiretime).toISOString().slice(0, -5), //set expiration time for transaction (+1 min)

					operations: [
						['transfer', {
							from: from,
							to: tosend,
							amount: amount + ' ' + sbdorsteem.toUpperCase(),
							memo: memo
						}]
					],
					extensions: [], //extensions for this transaction
				};



				var dsteemkey = dsteem.PrivateKey.fromString(key['key']);
				//console.log(key);
				var stx = Alloy.Globals.dsteemclient.broadcast.sign(op, dsteemkey);

				key, dsteemkey, op = null;

				helpers.steemAPIcall(
					"broadcast_transaction_synchronous", [stx],
					function(transactionresponse) {
						// expects []

						Alloy.Globals.loading.hide();

						//console.log(transactionresponse);

						var answerfromchain = transactionresponse.result;



						if ((Array.isArray(answerfromchain.result) && answerfromchain.length == 0) || (Object.keys(answerfromchain).length === 0 && answerfromchain.constructor === Object)) {
							// success!
							resetSendWindow();
							hideOverlaySend();

						} else {

							if ('block_num' in answerfromchain) {

								alert(String.format(L('transaction_included_in_block_s'), answerfromchain['block_num'] + ""));
								resetSendWindow();
								hideOverlaySend();

							} else {
								$.button_send.setEnabled(true);
								// hideOverlaySend();
							}

						}

						var timeout1 = setTimeout(function() {
							updateAccount(from);
							timeout1 = null;
						}, 4000);
						//setTimeout(updateAccount(from),60000);

					},
					function(err2) {
						Alloy.Globals.loading.hide();
						$.button_send.setEnabled(true);
						alert(err2.message);
					});

			},
			function(err) {
				$.button_send.setEnabled(true);
				Alloy.Globals.loading.hide();
				alert(err);
				key = null;

			});


	}, function(err) {
		//error.
		$.button_send.setEnabled(true);
		Alloy.Globals.loading.hide();
		alert(err);
	});
}

function scanAccountQR(e) {

	Barcode.addEventListener('success', function _sucfunc(e) {
		Barcode.removeEventListener('success', _sucfunc);
		//Ti.API.info('Success called with barcode: ' + e.result);
		$.textfield_send_to.setValue(e.result);
		$.textfield_send_to.blur();
	});

	cameraPermission(function(re) {
		Barcode.capture({
			animate: true,
			overlay: barcodeoverlay,
			showCancel: false,
			showRectangle: false,
			keepOpen: false
		});
	});
}

function toggleSteemSBD() {
	if ($.token_steem_or_sbd.getText() == 'steem') {
		$.token_steem_or_sbd.setText('sbd');
		$.overlay_send_header_title.setText(String.format(L('send_s'), 'sbd'));
	} else {
		$.token_steem_or_sbd.setText('steem');
		$.overlay_send_header_title.setText(String.format(L('send_s'), 'steem'));
	}
}

function scanMemoQR(e) {

	Barcode.addEventListener('success', function _sucfunc(e) {
		Barcode.removeEventListener('success', _sucfunc);
		//Ti.API.info('Success called with barcode: ' + e.result);
		$.textfield_send_memo.setValue(e.result);
		$.textfield_send_memo.blur();
	});

	cameraPermission(function(re) {
		Barcode.capture({
			animate: true,
			overlay: barcodeoverlay,
			showCancel: false,
			showRectangle: false,
			keepOpen: false
		});
	});
}

function checkPrices() {

	if (Date.now() - Ti.App.Properties.getInt('lastPricesCheck') > (30 * 60 * 1 * 1000)) {
		console.log('now checking prices');
		var currency = Ti.App.Properties.getString('currency').toLowerCase();
		helpers.xhrcall(
			"https://api.coingecko.com/api/v3/simple/price?ids=steem,steem-dollars&vs_currencies="+currency,
			"GET",
			false,
			function(resje) {
				var res = JSON.parse(resje.toLowerCase());
				console.log(res);
				Ti.App.Properties.setString('price_steem_usd', res['steem'][currency.toLowerCase()]);
				Ti.App.Properties.setString('price_sbd_usd', res['steem-dollars'][currency.toLowerCase()]);

				updateFiat();

				Ti.App.Properties.setInt('lastPricesCheck', Date.now());
			},
			false);

	}
}

function fillAccountsList() {
	var currentaccounts = Ti.App.Properties.getObject('accounts');

	// consider updating current accounts when picking.

	// populate list table.
	var listdata = [];
	for (var i = 0; i < currentaccounts.length; i++) {

		//var row = Ti.UI.createTableViewRow({"title": shd.get('title')});
		listdata.push({
			template: 'accountli',
			labeltitle: {
				text: currentaccounts[i].name,
			},
			delbut: {
				accountname: currentaccounts[i].name,
			},
			labelbalance: {
				text: helpers.formatToLocale(parseFloat(currentaccounts[i].balance), 3) + ' STEEM | ' + helpers.formatToLocale(parseFloat(currentaccounts[i].sbd_balance), 3) + ' SBD'
				//text: currentaccounts[i].steem + ' | ' + currentaccounts[i].sbd
			},
			accountdata: currentaccounts[i],
		});
	}

	$.overlay_pickaccount_listview.sections[0].setItems(listdata);
	//$.overlay_pickaccount_listview.scrollToItem(0);

}

function showOverlayPickAccount() {

	var currentaccounts = Ti.App.Properties.getObject('accounts');
	// check if we already have more than 0 accounts.
	if (currentaccounts.length > 0) {
		fillAccountsList();

		showOverlay($.overlay_pickaccount);
	} else {
		showOverlayAddAccount();
	}

}

function removeAccount(e) {
	// loop through accounts remove them.

	//console.log('removeAccounts(e) called with e = '+e);

	var currentaccounts = Ti.App.Properties.getObject('accounts');
	//console.log('remove account currenacctounts list', currentaccounts);

	// flip for potential alert
	var alreadyhadaccount = false;

	for (var i = 0; i < currentaccounts.length; i++) {
		// loop through currentaccounts, break if found.
		if (currentaccounts[i]['name'] == e) {
			//found account to delete, remove it now.

			currentaccounts.splice(i, 1);


			break;
		}
	}

	//console.log('remove account currentaccounts after splice');

	Ti.App.Properties.setObject('accounts', currentaccounts);

	var currentaccount = Ti.App.Properties.getString('currentaccount');

	if (currentaccount == e) {

		// check if currentaccount happens to be this account, if so pick next available account as new account.
		if (currentaccounts.length > 0) {

			currentaccount = currentaccounts[0]['name'];

		} else {

			currentaccount = '';
			hideOverlayPickAccount();
		}

		//console.log('current account L1493',currentaccount);

		Ti.App.Properties.setString('currentaccount', currentaccount);



		// if none avail.... unset currentaccount.
	}

	setCurrentAccount();
	fillAccountsList();

	alert(String.format(L('removed_s'), e));
}

function refreshTransactions() {
	updateAccount(Ti.App.Properties.getString('currentaccount'));
}

function delAccount(e) {
	var item = $.overlay_pickaccount_listview.sections[0].getItemAt(e.itemIndex);
	//console.log('delaccount item', item.accountdata);

	$.alertdialog.applyProperties({
		title: String.format(L('remove_s'), item.accountdata.name),
		message: String.format(L('remove_account_s'), item.accountdata.name),
		destructive: 0,
		cancel: 1,
		buttonNames: [L('yes'), L('cancel')]
	});

	alertdialogcallback = function() {
		// console.log('hit del account');
		// console.log('removing '+item.accountdata.name);
		removeAccount(item.accountdata.name);
	}

	alertdialogcancelcallback = function() {
		return false;
	}

	$.alertdialog.show();

}

function handlePickAccountClick(e) {
	//console.log(e);
	if (e.source.bindId != 'delbut') {
		var newaccount = $.overlay_pickaccount_listview.sections[0].getItemAt(e.itemIndex).accountdata.name;
		if (Ti.App.Properties.getString('currentaccount') != newaccount) {

			$.listview_transactions.sections[0].setItems([{
				template: 'txlinocontent',
				txli_nocontent_label: {
					text: String.format(L('loading_s'), e)
				}
			}]);

			Ti.App.Properties.setString('currentaccount', newaccount);
			updateAccount(newaccount);
			setCurrentAccount();



		}
		hideOverlayPickAccount();
	}
}


function getTx(e) {
	//console.log(e);
	var item = $.listview_transactions.sections[0].getItemAt(e.itemIndex);

	if (item.hasOwnProperty('operation')) {
		alert("Block " + item.operation.block + "\n" + moment.utc(item.operation.timestamp).local().format("lll") + "\n- - - - - - -\n\nfrom: " + item.operation.op[1].from + "\nto: " + item.operation.op[1].to + "\namount: " + item.operation.op[1].amount + "\n\n" + item.operation.op[1].memo);
	} else {
		updateAccount(Ti.App.Properties.getString('currentaccount'));
		alert(L('explain_no_tx_in_listview'));
	}


}

function getImgFromJsonMetaData(json_metadata) {
	try {
		var metadata = JSON.parse(json_metadata);
		if ('profile' in metadata) {
			if ('profile_image' in metadata['profile']) {
				if (metadata['profile']['profile_image'] != "" && metadata['profile']['profile_image'].toLowerCase().startsWith("http")) {
					return metadata['profile']['profile_image'];
				}
			}
		}
	} catch (e) {
		return "";
	}
	return "";
}

function updateAccount(e) {
	// get latest account balance


	if ($.listview_transactions.sections[0].getItems().length == 1) {
		if ($.listview_transactions.sections[0].getItemAt(0).template == "txlinocontent") {
			$.listview_transactions.sections[0].setItems([{
				template: 'txlinocontent',
				txli_nocontent_label: {
					text: String.format(L('loading_s'), e)
				}
			}]);
		}
	}

	var currentaccounts = Ti.App.Properties.getObject('accounts');
	var accountslist = [];
	if (currentaccounts.length > 0) {
		for (var i = 0; i < currentaccounts.length; i++) {
			// loop through currentaccounts, break if found.
			accountslist.push(currentaccounts[i]['name']);
		}
	}
	helpers.steemAPIcall(
		"get_accounts", [
			accountslist
		],
		function(success) {
			//console.log(success);

			if(success.result.length > 0) {
				for(var j = 0; j < success.result.length; j++) {

					var foundname = success.result[j].name.toLowerCase();

					var accounthasprivatekeyinwallet = false;

					var currentaccounts = Ti.App.Properties.getObject('accounts');

					if (currentaccounts.length > 0) {
						// we already have accounts, lets see if the account we are trying to add is already here
						for (var i = 0; i < currentaccounts.length; i++) {
							// loop through currentaccounts, break if found.
							if (currentaccounts[i]['name'] == foundname) {
								//already found account. pop it (we re-add / update it below)
								accounthasprivatekeyinwallet = currentaccounts[i]['privatekey'];
								currentaccounts.splice(i, 1);

								alreadyhadaccount = true;
								break;
							}
						}
					}

					success.result[j]['privatekey'] = accounthasprivatekeyinwallet;
					success.result[j]['image'] = getImgFromJsonMetaData(success.result[j]['json_metadata']);

					currentaccounts.push(helpers.formatUserBalanceObject(success.result[j]));

					Ti.App.Properties.setObject('accounts', currentaccounts);
				}
			}

			setCurrentAccount();

		},
		function(error) {
			console.log(error);
		}
	);

	// get recent account tx's

	// should update this to loop through a couple of api calls depending on how many where responded. fetch the id of the last found TX and then use that on the place of -1.

	var startoffset = -1;
	var limit = 500;
	var maxresults = 30;
	var maxloops = 3;
	var currentloop = 0;
	var listdata = [];

	function getAccountHistory(startoffset, currentloop, limit, maxresults, maxloops) {

		helpers.steemAPIcall(
			"get_account_history", [e, startoffset, limit],
			function(result) {
				//console.log('ACCOUNT HISTORY SUCCESSSSSS');
				//console.log(result);

				result['result'].reverse();

				for (var i = 0; i < result['result'].length; i++) {
					// looping through recent results.
					//console.log(result['result'][i][0]);
					startoffset = result['result'][i][0] - 1;
					//console.log('block ', result['result'][i][1]['block']);

					if (result['result'][i][1]['op'][0] == "transfer") {
						// we are dealing with a transfer operation here.

						var transferobject = result['result'][i][1]['op'][1];

						var incoming = false;
						var receiveorsend = '↑';
						var receiveorsendclass = 'txli_red';
						var plusminus = "-";

						var counterparty = transferobject['to'];

						if (transferobject['to'] == e) {
							incoming = true;
							receiveorsend = '↓';
							counterparty = transferobject['from'];
							receiveorsendclass = 'txli_green';
							plusminus = "+";
						}

						listdata.push({
							template: receiveorsendclass,
							txli_label_inout: {
								text: receiveorsend,

							},
							txli_label_counterparty: {
								text: counterparty,
							},
							txli_label_amount: {
								text: plusminus + '' + helpers.formatToLocale(parseFloat(transferobject['amount']), 3)
								//text: currentaccounts[i].steem + ' | ' + currentaccounts[i].sbd
							},
							txli_label_currency: {
								text: transferobject['amount'].split(" ")[1]
							},
							txli_label_date: {
								text: moment.utc(result['result'][i][1]['timestamp']).fromNow()
							},
							operation: result['result'][i][1],
						});


					}

				}

				if (result['result'].length < limit || currentloop >= maxloops || listdata.length >= maxresults) {
					// we have garnered enough results or have loaded enough on the api for being reasonable, or we have exhausted the api.
					if (listdata.length == 0) {

						listdata.push({
							template: 'txlinocontent',
							txli_nocontent_label: {
								text: String.format(L('no_recent_transactions_found'), e)
							}
						});
						//$.listview_transactions.setCanScroll(false);
					} else {
						$.listview_transactions.setCanScroll(true);
					}
					$.listview_transactions.sections[0].setItems(listdata);
				} else {
					currentloop++;
					// should change startoffset here...
					//console.log('going for loop ', currentloop);
					getAccountHistory(startoffset, currentloop, limit, maxresults, maxloops);

				}
				//$.listview_transactions.scrollToItem(0);

				$.refreshList.endRefreshing();
			},
			function(error) {
				console.log(error);
			}
		);

	} // end of internal getAccountHistory function;


	getAccountHistory(startoffset, currentloop, limit, maxresults, maxloops);


}



function handleAddAccount(e) {

	$.textfield_addaccount.blur();

	if ($.textfield_addaccount.value.length > 0) {
		helpers.steemAPIcall(
			"get_accounts", [
				[$.textfield_addaccount.value]
			],
			function(success) {
				//console.log(success);
				if (success.result.length == 0) {
					alert(String.format(L('alert_account_not_found'), $.textfield_addaccount.value));
					$.textfield_addaccount.setValue('');
				} else {
					var foundname = success.result[0].name.toLowerCase();
					//console.log('name', foundname);

					var currentaccounts = Ti.App.Properties.getObject('accounts');
					//console.log('currenacctount', currentaccounts);
					//console.log(typeof currentaccounts);

					// flip for potential alert
					var alreadyhadaccount = false;

					var accounthasprivatekeyinwallet = false;

					if (currentaccounts.length > 0) {
						// we already have accounts, lets see if the account we are trying to add is already here
						for (var i = 0; i < currentaccounts.length; i++) {
							// loop through currentaccounts, break if found.
							if (currentaccounts[i]['name'] == foundname) {

								accounthasprivatekeyinwallet = currentaccounts[i]['privatekey'];
								//already found account. pop it (we re-add / update it below)
								currentaccounts.splice(i, 1);

								alreadyhadaccount = true;
								break;
							}
						}
					}

					success.result[0]['privatekey'] = accounthasprivatekeyinwallet;
					success.result[0]['image'] = getImgFromJsonMetaData(success.result[0]['json_metadata']);

					currentaccounts.push(helpers.formatUserBalanceObject(success.result[0]));

					$.textfield_addaccount.setValue('');



					Ti.App.Properties.setObject('accounts', currentaccounts);
					Ti.App.Properties.setString('currentaccount', foundname);

					setCurrentAccount();
					updateAccount(foundname);

					$.textfield_addaccount.blur();
					hideOverlayAddAccount();

					if (alreadyhadaccount) {

						alert(String.format(L('alert_account_already_added'), foundname));

					}

				}

			},
			function(error) {
				console.log(error);
			}
		);
	} else {
		alert(L('alert_add_account_name'));
	}
}

function setCurrentAccount() {
	// calling
	var currentaccount = Ti.App.Properties.getString('currentaccount');
	if (currentaccount == '') {
		$.username_title.text = L('hi_there');
		// show welcome message here....

		$.container_welcome.setTop(Alloy.Globals.dimensions.overlay_container_top);
		$.container_transactions.setTop(Alloy.Globals.dimensions.DP_platformHeight);
		$.avatar.hide();

	} else {

		$.container_welcome.setTop(Alloy.Globals.dimensions.DP_platformHeight);
		$.container_transactions.setTop(Alloy.Globals.dimensions.overlay_container_top);

		if ($.username_title.getText() != currentaccount) {
			$.username_title.text = currentaccount;
		}

		var currentaccountdata = helpers.getUserObject(currentaccount);

		var image2show = "https://steemitimages.com/u/" + currentaccount + "/avatar";
		if (currentaccountdata.image != "") {
			image2show = "https://steemitimages.com/800x800/" + currentaccountdata.image;
		}

		if ($.avatar.getImage() != image2show) {
			$.avatar.setImage(image2show);
		}
		$.avatar.show();

		$.account_amount_steem.setText(helpers.formatToLocale(parseFloat(currentaccountdata['balance']), 3) + ' STEEM');
		$.account_amount_sbd.setText(helpers.formatToLocale(parseFloat(currentaccountdata['sbd_balance']), 3) + ' SBD');
		updateFiat();

		// $.account_amount_sbd_fiat.setText('$ ' + (helpers.formatToLocale((parseFloat(currentaccountdata['sbd_balance']) * parseFloat(Ti.App.Properties.getString('price_sbd_usd'))), 2)));
		//
		// $.account_amount_steem_fiat.setText('$ ' + (helpers.formatToLocale((parseFloat(currentaccountdata['balance']) * parseFloat(Ti.App.Properties.getString('price_steem_usd'))), 2)));

		//account_amount_steem
	}
}

function settingsWindow() {
	//alert('should launch settings');
	var win_index_settings = Alloy.createController('index_settings').getView();
	win_index_settings.open();


}

// loads initial user prior to opening wallet.
setCurrentAccount();
var currentaccount = Ti.App.Properties.getString('currentaccount');
if (currentaccount != '') {
	updateAccount(currentaccount);
}

// checkCMCprices
// Ti.App.Properties.setString('currency', 'eth');

checkPrices();

Alloy.Globals.indexJScheckPrices = checkPrices;

// run appPauseResume and add resume and pause callbacks
appPauseResume({
	pause: function() {

		// Ti.API.info("appPauseResume - pause");

	},
	resume: function() {

		//Ti.API.info("appPauseResume - resume");
		checkPrices();
		updateAccount(Ti.App.Properties.getString('currentaccount'));
	},
	setIntervalTime: 10000, // used for android monitoring.
});

function createAccount(){
	Alloy.createController('create_account').getView().open();
}

$.author_description.addEventListener('link', function(e){
		Ti.Platform.openURL(e.url);
});

// launch the app.
$.index.open();
blinkSettings();
