// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;
var helpers_eventdispatcher = require('/helpers_eventdispatcher');
var wallet_helpers = require('/wallet_helpers');

console.log('launcherurl');
console.log( $.args.launcherurl);
var openerurl = ($.args.launcherurl || false);
// starting off with some includers and initialization

// dsteem - https://github.com/steemit/dsteem

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
//var SlowAES = require('/SlowAES/Ti.SlowAES');

// zxcvbn password strength library https://github.com/dropbox/zxcvbn
var zxcvbn = require('/zxcvbn');

// identity module for integration with biometry: https://github.com/appcelerator-modules/titanium-identity/
var TiIdentity = require('ti.identity');

// badactors list from: https://github.com/steemit/condenser/blob/master/src/app/utils/BadActorList.js
var badactors = require('/badactors');

// detecting crossplatform resume / pause of app https://github.com/dieskim/Appcelerator.Hyperloop.appPauseResume
var appPauseResume = require('/appPauseResume');

var XCallbackURL = require('/xcallbackurl');

var helpers = require('/functions');
//var helpers = new fns();

var steemmemo = require('/steemmemo');

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
		barcodeLed.opacity = (1);
	} else {
		barcodeLed.opacity = (0.3);
	}
});

barcodeoverlay.add(barcodeCancel);
barcodeoverlay.add(barcodeLed);

// global keychainitem
var keychainItem;

// var slowaesopts = {
// 	iv: (Ti.Utils.sha1(Ti.App.Properties.getString('uuid'))).substring(7, 23)
// };
//
// var slowaes = new SlowAES(slowaesopts);

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



if (Ti.App.Properties.getBool('usesIdentity')) {
	if(!Alloy.Globals.tidentity_initialized) {
		wallet_helpers.initTiIdentity();
	}
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
	if ($.background_overlay.opacity == 0.5) {
		// background_overlay is already showing, don't bother showing it.
		if (cb) {
			cb();
		}

	} else {

		$.background_overlay.top = (0);
		backgroundOverlayAnimation = {
			opacity: 0.5,
			duration: 150,
		};
		$.background_overlay.animate(backgroundOverlayAnimation, function() {
			$.background_overlay.opacity = (0.5);
			$.background_overlay.top = (0);
			if (cb) {
				cb();
			}
		});
	}

}

function hideOverlayBG(cb) {
	//console.log()
	if ($.background_overlay.opacity == 0) {
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
			$.background_overlay.top = (Alloy.Globals.dimensions.DP_platformHeight);
			$.background_overlay.opacity = (0);
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

	if (overlay.top == Alloy.Globals.dimensions.DP_platformHeight) {
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
	if (overlay.top == Alloy.Globals.dimensions.overlay_container_top) {
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


				$.qrcurrentaccount.text = (currentaccount);

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

// switch for checking if memo_encrypted_check happened.
var memo_encrypted_check = false;

function showOverlaySend() {

	// resetting switch
	memo_encrypted_check = false;

	// check if wallet setup
	if (!Ti.App.Properties.getBool('walletSetup')) {
		//showOverlayCreateWallet();
		// creating wallet via new wallet file.
		var win = Alloy.createController('settings_import_keys', {ipk_account: Ti.App.Properties.getString('currentaccount')}).getView();
		Alloy.Globals.tabGroup.activeTab.open(win);
	} else {

		wallet_helpers.scanUserObjectForKey(Ti.App.Properties.getString('currentaccount'),'active',
			function() {
				showOverlay($.overlay_send);
				$.overlay_body_send_scrollview.scrollTo(0, 0);
			},
			function() {
				//alert('Private key for current account not found in your wallet. Let\'s add it now');
				//showOverlayImportPrivatekey();

				// user might not yet have converted to wallet v2
				if(Ti.App.Properties.getBool('walletSetup') && !Titanium.App.Properties.hasProperty('walletversion')) {
					// this user has already setup a wallet, however the wallet is not yet converted as "walletversion" property is not yet set....

					$.alertdialog.applyProperties({
						title: "Update Wallet mandatory",
						message: "With the introduction of the Dapp Browser (supporting multiple key-types per account), the encrypted wallet file needs to undergo a onetime (local) update.\n\nPlease unlock your wallet.",
						destructive: 0,
						cancel: 1,
						buttonNames: [L('unlock'), L('cancel')]
					});

					alertdialogcallback = function() {
						wallet_helpers.scanWalletForKey(
							Ti.App.Properties.getString('currentaccount'),
							function(key) {
								key = null;
								alert('Conversion done! Thank you.');
								showOverlaySend();
							},
							function(err){
								alert(err);
							},
							'active');
					}

					alertdialogcancelcallback = function() {
						alert("You should not hit cancel :P");
						return false;
					}

					$.alertdialog.show();



				} else {
					var win = Alloy.createController('settings_import_keys',{ipk_account: Ti.App.Properties.getString('currentaccount')}).getView();
					Alloy.Globals.tabGroup.activeTab.open(win);
				}

			}
		);

	}


}

function showOverlayImportPrivatekey() {
	$.overlay_body_importprivatekey_description.text = (String.format(L('overlay_body_importprivatekey_description'), Ti.App.Properties.getString('currentaccount')));
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
	if ($.textfield_importprivatekey.value.length == 0) {
		alert(L('please_type_paste_or_scan_a_privkey'));
		return false;
	}
	var privkey = passwordorkey($.textfield_importprivatekey.value);

	//alert(key);
	var publickey = dsteem.PrivateKey.fromString(privkey).createPublic().toString();

	console.log('pubkey to lookup', publickey);

	// pickup this account to compare public key to given public key for account --- Ti.App.Properties.getString('currentaccount')

	// "get_accounts", [
	// 	[$.textfield_addaccount.value]
	// ]
	helpers.steemAPIcall(
		"get_accounts", [
			[Ti.App.Properties.getString('currentaccount')]
		],
		function(result) {

			if (result.result.length > 0) {

				var pubkeyfound = false;

				// loop through active (!) key auths
				for(var i = 0; i < result.result[0]['active']['key_auths'].length; i++) {
					var key_auth = result.result[0]['active']['key_auths'][i][0];

					if(key_auth == publickey){
						pubkeyfound = true;
						break;
					}
				}

				if(pubkeyfound) {

					wallet_helpers.unlockWallet(function(passphrase) {


						//for (var i = 0; i < result.result[0].length; i++) {
							//alert(result.result[0][i] +' hier geindegid vannacht');

							var currentaccounts = Ti.App.Properties.getObject('accounts');

							// consider updating current accounts when picking.

							// populate list table.
							for (var j = 0; j < currentaccounts.length; j++) {

								if (currentaccounts[j].name == Ti.App.Properties.getString('currentaccount')) {
									// if matches.... add privkey to wallet in following format:


									// {
									// 	account: currentaccounts[j].name,
									// 	key: privkey
									// }
									var keys = wallet_helpers.decryptWallet(passphrase);

									//console.log('keys in wallet', keys);
									// loop through keys and see if we already had a key by that account

									try {
										var parsedkeys = JSON.parse(keys);
										//console.log(parsedkeys);
										if ('keys' in parsedkeys) {
											for (var k = 0; k < parsedkeys['keys'].length; k++) {
												if (parsedkeys['keys'][k]['account'] == Ti.App.Properties.getString('currentaccount')) {

													// console.log('found key for '+parsedkeys['keys'][k]['account']);
													// console.log('now removing via splice');

													parsedkeys['keys'].splice(k, 1);


												}
											}
										}
									} catch (e) {

										$.textfield_importprivatekey.value = ('');
										Ti.UI.Clipboard.clearText();
										keys, privkey, passphrase = null;
										alert(e.message + "\n\nincorrect passphrase?");
										return false;

									}

									parsedkeys['keys'].push({
										account: Ti.App.Properties.getString('currentaccount'),
										key: privkey
									});


									// encryptwallet again with new key added.
									wallet_helpers.encryptWallet(parsedkeys['keys'], passphrase);

									// unset vars, textfield and emptying clipboard of device.
									$.textfield_importprivatekey.value = ('');
									keys, privkey, passphrase, parsedkeys, publickey = null;
									Ti.UI.Clipboard.clearText();

									// also update user object to reflect that
									helpers.updateUserObject(currentaccounts[j].name, 'privatekey', true);

									setTimeout(showOverlaySend, 400);
								}

								// close import.... start showing send overlay.
								hideOverlayImportPrivatekey();

							}
						//}

						// unset passphrase
						passphrase = null;
					},
				false, // skip biometry identity,
				function(err){
					// cancel on unlockwallet hit
					$.button_send.enabled;
					alert(err);
				});

				} else {
					// pubkeyfound === false
					alert(L('no_account_found_for_given_key'));
					privkey, publickey = null;
					$.textfield_importprivatekey.value = ('');
					Ti.UI.Clipboard.clearText();

				}

			} else {
				// account lookup result is not found.
				alert(L('no_account_found_for_given_key'));
				privkey, publickey = null;
				$.textfield_importprivatekey.value = ('');
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
		$.textfield_importprivatekey.value = (e.result);
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

Alloy.Globals.scanWalletForKey = wallet_helpers.scanWalletForKey;

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

	$.password_strength_result.text = (String.format(L("password_strength_result"), pwdgrades[pwdstrength['score']], pwdstrength['crack_times_display']['offline_slow_hashing_1e4_per_second']));

	if (pwdstrength['score'] >= 3) {
		$.create_wallet_button.enabled = (true);
	} else {
		$.create_wallet_button.enabled = (false);
	}

	if (e.value.length == "") {
		$.password_strength_result.text = "";
	}

	pwdstrength = null;
	e = null
}


function returnPassword(e) {
	var pwdstrength = zxcvbn(e.value);
	$.textfield_addwalletpassword.blur();
	if (pwdstrength['score'] >= 3) {
		$.create_wallet_button.enabled = (true);
	} else {
		$.create_wallet_button.enabled = (false);
		alert(String.format(L("password_strength_result"), pwdgrades[pwdstrength['score']], pwdstrength['crack_times_display']['offline_slow_hashing_1e4_per_second']));
	}

	pwdstrength = null;
	e = null;

}

function createWallet() {

	$.create_wallet_button.enabled = (false);
	var passphrase = $.textfield_addwalletpassword.getValue();

	var pwdstrength = zxcvbn(passphrase);

	if (pwdstrength['score'] >= 3) {

		// create empty wallet
		$.password_strength_result.text = "";

		// initiate wallet with empty key array.
		wallet_helpers.encryptWallet([], passphrase);

		if ($.enable_identity_switch.getValue()) {
			wallet_helpers.initTiIdentity(function() {

				Alloy.Globals.keychainItem.fetchExistence(function(e) {
					//alert('Exists? ' + );

					if (e.exists) {
						Alloy.Globals.keychainItem.reset();
					}

					Alloy.Globals.keychainItem.addEventListener('save', function _savekci(e) {
						Alloy.Globals.keychainItem.removeEventListener('save', _savekci);
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

					Alloy.Globals.keychainItem.save(passphrase);
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
		$.enable_identity_label.text = (String.format(L('enable_identity_label'), authPhrase));
		$.enable_identity_holder.height = (70);
	}

	$.overlay_body_addwallet_description.text = (explaintext);

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
	if ($.textfield_addwalletpassword.passwordMask) {
		$.textfield_addwalletpassword.passwordMask = (false);
		$.togglepasswordmask.title = ('🤫');
	} else {
		$.textfield_addwalletpassword.passwordMask = (true);
		$.togglepasswordmask.title = ('🤪');
	}
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
				//console.log(currentaccountdata);
				$.account_amount_sbd_fiat.text = (currency_symbol + ' ' + helpers.formatToLocale((parseFloat(currentaccountdata.sbd_balance) * parseFloat(Ti.App.Properties.getString('price_sbd_usd'))), 2));
				$.account_amount_steem_fiat.text = (currency_symbol + ' ' + helpers.formatToLocale((parseFloat(currentaccountdata.balance) * parseFloat(Ti.App.Properties.getString('price_steem_usd'))), 2));

				$.account_amount_sbd_fiat.width = ( Ti.UI.FILL);
				$.account_amount_steem_fiat.width = ( Ti.UI.FILL);

				//console.log((parseFloat(currentaccountdata.sbd_balance) * parseFloat(Ti.App.Properties.getString('price_sbd_usd'))));
				//console.log((parseFloat(currentaccountdata.balance) * parseFloat(Ti.App.Properties.getString('price_steem_usd'))));
			}
		}
	}
}

function onBlurSendInputField(e) {

	switch (e.source.id) {
		case 'textfield_send_to':
			// check for bad actors.
			var tosend = $.textfield_send_to.value.trim();

			if (tosend.length > 0) {
				var regex = /[^0-9a-zA-Z.-]/g;

				tosend = tosend.replace(regex, '').toLowerCase();
				$.textfield_send_to.value = (tosend);

				if (badactors.indexOf(tosend) > -1) {
					alert(String.format(L("account_s_on_bad_actors_list_cant_send"), tosend));
					$.textfield_send_to.value = ('');
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

			var amount = $.textfield_send_amount.value;

			amount = amount.replace(",", ".");

			if (amount.length == 0 || isNaN(amount)) {
				amount = "0.001";
			}



			amount = parseFloat(amount.replace(/[^\d.-]/g, '')).toFixed(3);

			$.textfield_send_amount.value = (amount);

			break;

		case 'textfield_send_memo':

			var memotxt = $.textfield_send_memo.value.trim();
			var memoarr = memotxt.split(" ");
			for (var i = 0; i < memoarr.length; i++) {
				if (memoarr[i].length == 51 && memoarr[i].startsWith("5")) {
					alert(L('seems_like_you_are_sending_a_private_key'));
					$.textfield_send_memo.value = ('');
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


	var tosend = $.textfield_send_to.value.trim();
	var amount = $.textfield_send_amount.value.trim();
	var memo = $.textfield_send_memo.value.trim();
	var sbdorsteem = $.token_steem_or_sbd.text;

	if (tosend.length > 0) {
		var regex = /[^0-9a-zA-Z.-]/g;

		tosend = tosend.replace(regex, '').toLowerCase();

		if (badactors.indexOf(tosend) > -1) {
			alert(String.format(L("account_s_on_bad_actors_list_cant_send"), tosend));
			$.textfield_send_to.value = ('');
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
		$.button_send.enabled = (false);
		broadcastSend(Ti.App.Properties.getString('currentaccount'), tosend, amount, sbdorsteem, memo);
	}

	alertdialogcancelcallback = function() {
		$.button_send.enabled = (true);
		return false;
	}

	$.alertdialog.show();


}

function resetSendWindow() {
	//reset send shizzle.
	$.textfield_send_to.value = "";
	$.textfield_send_amount.value = "";
	$.textfield_send_memo.value = "";
	$.token_steem_or_sbd.text = 'steem';
	$.button_send.enabled = true;
	memo_encrypted_check = false;
}


function broadcastSend(from, tosend, amount, sbdorsteem, memo) {

	wallet_helpers.scanWalletForKey(from, function(key) {
		//key['key'] has the wif.

		Alloy.Globals.loading.show(L('broadcasting'), false);

		function finalSend() {
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



				var dsteemkey = dsteem.PrivateKey.fromString(key['keys']['active']['private']);
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

								console.log(answerfromchain);

								alert(String.format(L('transaction_included_in_block_s'), answerfromchain['block_num'] + ""));
								resetSendWindow();
								hideOverlaySend();

							} else {
								$.button_send.enabled = (true);
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
						$.button_send.enabled = (true);
						alert(err2.message);
					});

			},
			function(err) {
				$.button_send.enabled = (true);
				Alloy.Globals.loading.hide();
				alert(err);
				key = null;

			});

		}

		if(memo[0] === "#") {
			// should encrypt memo here.
			helpers.steemAPIcall(
				"get_accounts", [
					[tosend]
				],
				function(success) {
					console.log(success.result[0].memo_key);

					memo = steemmemo.encode(key['keys']['active']['private'], success.result[0].memo_key, memo);
					finalSend();

				},
				function(error) {
					console.log(error);
					finalSend();
				}
			);

		} else {
			//
			finalSend();
		}

	}, function(err) {
		//error.
		$.button_send.enabled = (true);
		Alloy.Globals.loading.hide();
		alert(err);
	});
}

function scanAccountQR(e) {

	Barcode.addEventListener('success', function _sucfunc(e) {
		Barcode.removeEventListener('success', _sucfunc);
		//Ti.API.info('Success called with barcode: ' + e.result);
		if( (e.result).startsWith("steem://") || (e.result).startsWith("steemwallet://") || (e.result).startsWith("https://steemwallet.app://") ) {
			handleURL(e.result);
		} else {
			$.textfield_send_to.value = (e.result);
			$.textfield_send_to.blur();
		}
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
	if ($.token_steem_or_sbd.text == 'steem') {
		$.token_steem_or_sbd.text = 'sbd';
		$.overlay_send_header_title.text = String.format(L('send_s'), 'sbd');
	} else {
		$.token_steem_or_sbd.text = 'steem';
		$.overlay_send_header_title.text = String.format(L('send_s'), 'steem');
	}
}

function scanMemoQR(e) {

	Barcode.addEventListener('success', function _sucfunc(e) {
		Barcode.removeEventListener('success', _sucfunc);
		//Ti.API.info('Success called with barcode: ' + e.result);
		if( (e.result).startsWith("steem://") || (e.result).startsWith("steemwallet://") || (e.result).startsWith("https://steemwallet.app://") ) {
			handleURL(e.result);
		} else {
			$.textfield_send_memo.value = (e.result);
			$.textfield_send_memo.blur();
		}
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

	$.overlay_pickaccount_listview.sections[0].items = (listdata);
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

			$.listview_transactions.sections[0].items = ([{
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

function updateAccount(e) {
	// get latest account balance


	if ($.listview_transactions.sections[0].getItems().length == 1) {
		if ($.listview_transactions.sections[0].getItemAt(0).template == "txlinocontent") {
			$.listview_transactions.sections[0].items = ([{
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

					var accounthasprivatekeyinwallet_posting = false;
					var accounthasprivatekeyinwallet_active = false;
					var accounthasprivatekeyinwallet_memo = false;

					var currentaccounts = Ti.App.Properties.getObject('accounts');

					if (currentaccounts.length > 0) {
						// we already have accounts, lets see if the account we are trying to add is already here
						for (var i = 0; i < currentaccounts.length; i++) {
							// loop through currentaccounts, break if found.
							if (currentaccounts[i]['name'] == foundname) {
								//already found account. pop it (we re-add / update it below)
								//accounthasprivatekeyinwallet = currentaccounts[i]['privatekey'];
								accounthasprivatekeyinwallet_posting = currentaccounts[i]['privatekey_posting'];
								accounthasprivatekeyinwallet_active = currentaccounts[i]['privatekey_active'];
								accounthasprivatekeyinwallet_memo = currentaccounts[i]['privatekey_memo'];

								currentaccounts.splice(i, 1);

								alreadyhadaccount = true;
								break;
							}
						}
					}

					//success.result[j]['privatekey'] = accounthasprivatekeyinwallet;
					success.result[j]['privatekey_posting'] = accounthasprivatekeyinwallet_posting;
					success.result[j]['privatekey_active'] = accounthasprivatekeyinwallet_active;
					success.result[j]['privatekey_memo'] = accounthasprivatekeyinwallet_memo;

					success.result[j]['image'] = helpers.getImgFromJsonMetaData(success.result[j]['json_metadata']);

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
						$.listview_transactions.canScroll = (true);
					}
					$.listview_transactions.sections[0].items = (listdata);
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
					$.textfield_addaccount.value = ('');
				} else {
					var foundname = success.result[0].name.toLowerCase();
					//console.log('name', foundname);

					var currentaccounts = Ti.App.Properties.getObject('accounts');
					//console.log('currenacctount', currentaccounts);
					//console.log(typeof currentaccounts);

					// flip for potential alert
					var alreadyhadaccount = false;

					//var accounthasprivatekeyinwallet = false;
					var accounthasprivatekeyinwallet_posting = false;
					var accounthasprivatekeyinwallet_active = false;
					var accounthasprivatekeyinwallet_memo = false;

					if (currentaccounts.length > 0) {
						// we already have accounts, lets see if the account we are trying to add is already here
						for (var i = 0; i < currentaccounts.length; i++) {
							// loop through currentaccounts, break if found.
							if (currentaccounts[i]['name'] == foundname) {

								//accounthasprivatekeyinwallet = currentaccounts[i]['privatekey'];
								accounthasprivatekeyinwallet_posting = currentaccounts[i]['privatekey_posting'];
								accounthasprivatekeyinwallet_active = currentaccounts[i]['privatekey_active'];
								accounthasprivatekeyinwallet_memo = currentaccounts[i]['privatekey_memo'];

								//already found account. pop it (we re-add / update it below)
								currentaccounts.splice(i, 1);

								alreadyhadaccount = true;
								break;
							}
						}
					}

					success.result[0]['privatekey'] = accounthasprivatekeyinwallet;
					success.result[0]['privatekey_posting'] = accounthasprivatekeyinwallet_posting;
					success.result[0]['privatekey_active'] = accounthasprivatekeyinwallet_active;
					success.result[0]['privatekey_memo'] = accounthasprivatekeyinwallet_memo;

					success.result[0]['image'] = helpers.getImgFromJsonMetaData(success.result[0]['json_metadata']);

					currentaccounts.push(helpers.formatUserBalanceObject(success.result[0]));

					$.textfield_addaccount.value = ('');



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

		//$.container_welcome.top = (Alloy.Globals.dimensions.overlay_container_top);
		$.container_transactions.top = (Alloy.Globals.dimensions.DP_platformHeight);
		$.avatar.hide();

	} else {

		//$.container_welcome.top = (Alloy.Globals.dimensions.DP_platformHeight);
		$.container_transactions.top = (Alloy.Globals.dimensions.overlay_container_top);

		if ($.username_title.text != currentaccount) {
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

		$.account_amount_steem.text = (helpers.formatToLocale(parseFloat(currentaccountdata['balance']), 3) + ' STEEM');
		$.account_amount_sbd.text = (helpers.formatToLocale(parseFloat(currentaccountdata['sbd_balance']), 3) + ' SBD');
		updateFiat();

		// $.account_amount_sbd_fiat.text = ('$ ' + (helpers.formatToLocale((parseFloat(currentaccountdata['sbd_balance']) * parseFloat(Ti.App.Properties.getString('price_sbd_usd'))), 2)));
		//
		// $.account_amount_steem_fiat.text = ('$ ' + (helpers.formatToLocale((parseFloat(currentaccountdata['balance']) * parseFloat(Ti.App.Properties.getString('price_steem_usd'))), 2)));

		//account_amount_steem
	}
}

function closeWin() {
	$.wallet.close();
}
function settingsWindow() {
	//alert('should launch settings');
	var win_index_settings = Alloy.createController('index_settings').getView();
	win_index_settings.open();
}

var win_transaction = false;
function transactionWindow(url) {
	//alert('should launch settings');
	if(win_transaction) {
			win_transaction.close();
			win_transaction = false;
	}

	win_transaction = Alloy.createController('transactionsigner', {url: url}).getView();
	win_transaction.open();
}
function transactionWindowClose(url) {
	win_transaction.close();
	win_transaction = false;
}
Alloy.Globals.indexJStransactionWindowClose = transactionWindowClose;

// loads initial user prior to opening wallet.
setCurrentAccount();
var currentaccount = Ti.App.Properties.getString('currentaccount');
if (currentaccount != '') {
	updateAccount(currentaccount);
}

// checkCMCprices
// Ti.App.Properties.setString('currency', 'eth');

helpers.checkPrices(updateFiat);

// run appPauseResume and add resume and pause callbacks
appPauseResume({
	pause: function() {

		// Ti.API.info("appPauseResume - pause");

	},
	resume: function() {

		//Ti.API.info("appPauseResume - resume");
		helpers.checkPrices(updateFiat);
		updateAccount(Ti.App.Properties.getString('currentaccount'));
	},
	setIntervalTime: 10000, // used for android monitoring.
});

function createAccount(){
	Alloy.createController('create_account').getView().open();
}

function handleURL(url) {
	if(url) {
			//console.log('HandleURL called', url);

			// app also accepts steemwallet:// so needs to modify to steem:// here.
			if(url.startsWith('steemwallet://')) {
				url = url.replace('steemwallet://','steem://');
			}

			if(url.startsWith('https://steemwallet.app')) {
				url = url.replace('https://steemwallet.app','steem://');
			}

			if(url.startsWith('steem:///')) {
				url = url.replace('steem:///','steem://');
			}

			// check if app starts with transfer alias. Then we can prepopulate with transferwindow.

			var urlx = XCallbackURL.parse(url)['parsedURI'];
			//console.log(urlx);

      if (urlx.protocol !== 'steem') {
          throw new Error("Invalid protocol, expected 'steem:' got '" + url.protocol + "'");
      }

			if(url.length > ('steem://').length) {

				if ((urlx.host == 'sign' && urlx.path.split('/').slice(1)[0] == 'transfer') || urlx.host == 'transfer') {

						resetSendWindow();

						var transfer_to, transfer_amount, transfer_memo = null;
						var transfer_currency = 'steem';

						console.log(urlx.host);
						console.log(urlx.path.split('/'));

						var txarr;

						if(urlx.host == 'transfer') {
							txarr = urlx.path.split('/').slice(1);
						} else {
							txarr = urlx.path.split('/').slice(2);
						}

						console.log('txarr', txarr);

						if(txarr[0]) {
							$.textfield_send_to.value = txarr[0];
						}

						if(txarr[1]) {
							var amount = decodeURIComponent(txarr[1]).split(" ");
							if(amount[0]){
								$.textfield_send_amount.value = amount[0];
							}

							if(amount[1]) {
									var allowed = ['steem','sbd'];
									if(allowed.includes(amount[1].toLowerCase())) {
										$.token_steem_or_sbd.text = amount[1].toLowerCase();
										$.overlay_send_header_title.text = String.format(L('send_s'), amount[1].toLowerCase());

									}
							}
						}

						if(txarr[2]) {
							$.textfield_send_memo.value = decodeURIComponent(txarr[2]);
						}

						showOverlaySend();

	      } else {
						// for now launch Transaction window... might need to update to enhance steem-uri spec and such

						transactionWindow(url);

				}


			}
	}


}

if(openerurl) {
	$.wallet.addEventListener('open', function _wopen(e) {
		$.wallet.removeEventListener('open', _wopen);
		setTimeout(function() {handleURL(openerurl);}, 150);
	});
	// if this view is opened with args.launchUrl, should call the handleUrl here.

}
