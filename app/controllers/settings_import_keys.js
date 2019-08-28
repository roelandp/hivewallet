
var helpers_eventdispatcher = require('/helpers_eventdispatcher');
var wallet_helpers = require('/wallet_helpers');
// starting off with some includers and initialization

// dsteem - https://github.com/steemit/dsteem

var dsteem = require('/dsteem');

// AES encryption for wallet encryption. https://github.com/benbahrenburg/Ti.SlowAES
var SlowAES = require('/SlowAES/Ti.SlowAES');

// zxcvbn password strength library https://github.com/dropbox/zxcvbn
var zxcvbn = require('/zxcvbn');

// identity module for integration with biometry: https://github.com/appcelerator-modules/titanium-identity/
var TiIdentity = require('ti.identity');

var helpers = require('/functions');
//var helpers = new fns();

$.textfield_which_account.value = ($.args.ipk_account || "");
$.textfield_masterpassword.value = ($.args.ipk_masterpassword || "");
$.textfield_key_posting.value = ($.args.ipk_posting || "");
$.textfield_key_active.value = ($.args.ipk_active || "");
$.textfield_key_memo.value = ($.args.ipk_memo || "");

// unset all args after getting those vals.
$.args = null;

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



if (Ti.App.Properties.getBool('usesIdentity')) {
	if(!Alloy.Globals.tidentity_initialized) {
		wallet_helpers.initTiIdentity();
	}
}


function resetAllFields() {

  keystostore = null;
  $.textfield_masterpassword.value = "";
  $.textfield_key_posting.value = "";
  $.textfield_key_active.value = "";
  $.textfield_key_memo.value = "";

  $.textfield_which_account.value = "";
  $.textfield_addwalletpassword.value = "";

  // empty clipboard to protect user.
  Ti.UI.Clipboard.clearText();
  $.scrollviewcontainer.scrollTo(0,0);

  rolesadded = [];
  blockchainaccountdata = false;

}
function closeWin(){
  $.settings_import_keys.close();
  resetAllFields();
}

var blockchainaccountdata = false;
var rolesadded = [];
function selectAccount(){
  // should lookup account if exists.
  $.textfield_which_account.blur();

  if($.textfield_which_account.value.length == 0) {
    alert(String.format(L('s_field_cant_be_empty'), L('overlay_body_input_account')));
    $.textfield_which_account.focus();
    return false;
  }
  helpers.steemAPIcall(
		"get_accounts", [
			[$.textfield_which_account.value]
		],
		function(result) {
      if (result.result.length > 0) {
        blockchainaccountdata = result.result[0];
        $.import_keys_add_key_method_masterpassword.text = (String.format(L("import_keys_add_key_method_masterpassword"), $.textfield_which_account.value.trim().toLowerCase()));
        $.import_keys_add_key_method_manual.text = (String.format(L("import_keys_add_key_method_manual"), $.textfield_which_account.value.trim().toLowerCase()));
        $.scrollview.currentPage = 1;
        $.scrollviewcontainer.scrollTo(0,0);

        helpers_eventdispatcher.trigger('addaccount',{'account': $.textfield_which_account.value.trim().toLowerCase()});

      } else {
        $.textfield_which_account.focus();
        alert(String.format(L('alert_account_not_found'), $.textfield_which_account.value));
      }
    },
		function(err) {
			alert(err);
		}
  );
}

function step_0() {
  $.scrollview.currentPage = 0;
  $.scrollviewcontainer.scrollTo(0,0);
}

function step_next() {
  // move through slides.
  $.scrollviewcontainer.scrollTo(0,0);
}

function step_previous() {
  $.textfield_masterpassword.blur();
  $.textfield_key_posting.blur();
  $.textfield_key_active.blur();
  $.textfield_key_memo.blur();

  $.scrollview.currentPage = 1;
  $.scrollviewcontainer.scrollTo(0,0);
}

function step_add_mp() {
  // move to add key via masterpassword
  $.scrollview.currentPage = 2;
  $.scrollviewcontainer.scrollTo(0,0);
}

function step_add_man() {
  // move to add key via manual import
  $.scrollview.currentPage = 3;
  $.scrollviewcontainer.scrollTo(0,0);
}

function makeAccountKeyObjectFromLogin(account,password) {

  var account = account.trim().toLowerCase();

  var roles = ['posting', 'active', 'memo'];

  var keypairs = {};
  for(var i = 0; i < roles.length; i++) {
    var pkey = dsteem.PrivateKey.fromLogin(account, password, roles[i]);
    keypairs[roles[i]] = {
      'public': pkey.createPublic().toString(),
      'private': pkey.toString()
    };
  }

  rolesadded = roles;

  var objtoreturn = {'account': account, 'keys': keypairs};
  return objtoreturn;
}

function validateKeyForAccount(pubkey, role){
  //console.log(blockchainaccountdata[role]['key_auths']);
  var toreturn = false;

  if(role != 'memo') {

    for(var i =0; i < blockchainaccountdata[role]['key_auths'].length; i++){
      if(blockchainaccountdata[role]['key_auths'][i][0] == pubkey) {
        // console.log('found key!');
        // console.log(role);
        // console.log(pubkey);
        // console.log(blockchainaccountdata[role]['key_auths'][i][0]);

        toreturn = true;
        break;
      }
    }

    return toreturn;

  } else {
    // memo key is special 'memo_key' value
    if(blockchainaccountdata['memo_key'] == pubkey) {
      return true;
    } else {
      return false;
    }
  }
  // can never hit here?
  return false;
}

var keystostore;

function returnMP() {
  // added masterpassword ---
  // check if not empty.
  $.textfield_masterpassword.blur();
  // should nullify immediately after storing in walletfile!
  keystostore = makeAccountKeyObjectFromLogin($.textfield_which_account.value.trim().toLowerCase(),$.textfield_masterpassword.value.trim());

  if(!validateKeyForAccount(keystostore['keys']['active']['public'], 'active')) {
    alert(String.format(L("s_key_mismatch"),"Active"));
    return false;
  }

  if(!validateKeyForAccount(keystostore['keys']['posting']['public'], 'posting')) {
    alert(String.format(L("s_key_mismatch"),"Posting"));
    return false;
  };

  if(!validateKeyForAccount(keystostore['keys']['memo']['public'], 'memo')) {
    alert(String.format(L("s_key_mismatch"),"Memo"));
    return false;
  };
  // now should continue... either add to wallet, .... or create new wallet.

  storeInWallet();

}

function returnMAN() {
  // on return manual import done.
  var account = $.textfield_which_account.value.trim().toLowerCase();
  keystostore = {'account': account, 'keys': {}};

  if($.textfield_key_posting.value.length == 0 && $.textfield_key_active.value.length == 0 && $.textfield_key_memo.value.length == 0) {
    alert(L("please_add_one_key"));
    return false;
  }

  if($.textfield_key_posting.value.length > 0){

		try {
    	var publickey = dsteem.PrivateKey.fromString($.textfield_key_posting.value.trim()).createPublic().toString();
		} catch(err) {
			alert(err.message);
		}

    if(!validateKeyForAccount(publickey, 'posting')) {
      alert(String.format(L("s_key_mismatch"),"Posting"));
      return false;
    } else {
      keystostore['keys']['posting'] = {'private': $.textfield_key_posting.value.trim(), 'public': publickey};
      rolesadded.push('posting');
    }
  }

  if($.textfield_key_active.value.length > 0){

		try {
	    var publickey = dsteem.PrivateKey.fromString($.textfield_key_active.value.trim()).createPublic().toString();
		} catch(err) {
			alert(err.message);
		}

    if(!validateKeyForAccount(publickey, 'active')) {
      alert(String.format(L("s_key_mismatch"),"Active"));
      return false;
    } else {
      keystostore['keys']['active'] = {'private': $.textfield_key_active.value.trim(), 'public': publickey};
      rolesadded.push('active');
    }
  }

  if($.textfield_key_memo.value.length > 0){

		try {
	    var publickey = dsteem.PrivateKey.fromString($.textfield_key_memo.value.trim()).createPublic().toString();
		} catch(err) {
			alert(err.message);
		}

    if(!validateKeyForAccount(publickey, 'memo')) {
      alert(String.format(L("s_key_mismatch"),"Memo"));
      return false;
    } else {
      keystostore['keys']['memo'] = {'private': $.textfield_key_memo.value.trim(), 'public': publickey};
      rolesadded.push('memo');
    }
  }

  $.textfield_key_posting.blur();
  $.textfield_key_active.blur();
  $.textfield_key_memo.blur();

  // try to store in wallet
  storeInWallet();
}

function togglePasswordMask1() {
	if ($.textfield_masterpassword.passwordMask) {
		$.textfield_masterpassword.passwordMask = false;
		$.togglepasswordmask1.title = '🤫';
	} else {
		$.textfield_masterpassword.passwordMask = true;
		$.togglepasswordmask1.title = '🤪';
	}
}



function togglePasswordMask2() {
	if ($.textfield_addwalletpassword.passwordMask) {
		$.textfield_addwalletpassword.passwordMask = false;
		$.togglepasswordmask2.title = '🤫';
	} else {
		$.textfield_addwalletpassword.passwordMask = true;
		$.togglepasswordmask2.title = '🤪';
	}
}



function returnKey1(){
  // onreturn key1 (posting)
  $.textfield_key_posting.blur();
}

function returnKey2(){
  // onreturn key2 (active)
  $.textfield_key_active.blur();
}

function returnKey3(){
  // onreturn key3 (memo)
  $.textfield_key_memo.blur();
}

function scanKey1() {
  // qr code scan key1
  Barcode.addEventListener('success', function _sucfunc(e) {
		Barcode.removeEventListener('success', _sucfunc);
		$.textfield_key_posting.value = (e.result);
		$.textfield_key_posting.blur();
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

function scanKey2() {
  // qr code scan key2
  Barcode.addEventListener('success', function _sucfunc(e) {
		Barcode.removeEventListener('success', _sucfunc);
		$.textfield_key_active.value = (e.result);
		$.textfield_key_active.blur();
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

function scanKey3() {
  // qr code scan key3
  Barcode.addEventListener('success', function _sucfunc(e) {
		Barcode.removeEventListener('success', _sucfunc);
		$.textfield_key_memo.value = (e.result);
		$.textfield_key_memo.blur();
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


function storeInWallet() {
  if(wallet_helpers.checkIfWalletExists()) {
    // wallet file already exists...
    // should now unlock wallet
    wallet_helpers.unlockWallet(function(passphrase) {

      var decryptedwallet = wallet_helpers.decryptWallet(passphrase);

      try {
        var parsedkeys = JSON.parse(decryptedwallet);
        //console.log(parsedkeys);
        if ('keys' in parsedkeys) {

          var v2keys = parsedkeys['keys'];

          if(!Titanium.App.Properties.hasProperty('walletversion')) {
            // wallet exists but is not yet converted to v2.
            // let's do that right away... v1 consisted of only "active_keys", so we will loop through accounts and convert those to new data format.

            console.log("allright, should convert v1 to v2");
            console.log("v1");
            // console.log(parsedkeys['keys']);
            v2keys = wallet_helpers.convertWalletv1v2(parsedkeys['keys']);

            //console.log("v1 after conversion");

            //console.log(v2keys);

            wallet_helpers.encryptWallet(v2keys, passphrase);
            Ti.App.Properties.setInt('walletversion', 2);
          }

          // check if user in "keys" wallet-keystore-Object
          // if so, loop through local keystore roles and add / update into wallet keystore.
          // then
          var accountinwallet = false;
          for(var i =0; i < v2keys.length; i++) {
            if(v2keys[i]['account'] == keystostore['account']) {
              // this user is already in the wallet file... let's update any role given.

              // console.log("ok found account in wallet");
              // console.log(keystostore["account"]);

              accountinwallet = true;
              for(var localkey in keystostore["keys"]){
                // console.log(localkey);
                // console.log(keystostore["keys"][localkey]);
                v2keys[i]['keys'][localkey] = keystostore["keys"][localkey];
              }
            }
          }

          if(!accountinwallet){
            // we can simply push the keystostore-object into the v2keys.
            v2keys.push(keystostore);
          }

          wallet_helpers.encryptWallet(v2keys, passphrase);

          // console.log("v2keys endresult");
          // console.log(v2keys);

          keystostore = null;
          decryptedwallet, passphrase, parsedkeys, v2keys = null;

        }
      } catch (e) {
        decryptedwallet = null;
        //alert(e.message);
        alert(String.format(L('wrong_passphrase'), e.message));
      }


      // done reset all fields

      keystostore = null;
      passphrase, parsedkeys, decryptedwallet, v2keys = null;


      // go to complete page...

      //

      for(var i = 0; i < rolesadded.length; i++) {
        console.log('updating userobject, adding privatekey_'+rolesadded[i]);
        helpers.updateUserObject($.textfield_which_account.value.trim().toLowerCase(), 'privatekey_'+rolesadded[i], true);
      }


      $.scrollview.currentPage = 5;
      $.scrollviewcontainer.scrollTo(0,0);
      resetAllFields();

    },
		false, // skipidentity (biometry)
		function(e){
			// error (cancel) from unlockWallet dialog
			alert(e);
		});

  } else {
    // no wallet exist, ask user to create wallet.
    $.scrollview.currentPage = 4;
    $.scrollviewcontainer.scrollTo(0,0);
  }
}
function returnWalletPassword(e) {

	var pwdstrength = zxcvbn(e.value);
	$.textfield_addwalletpassword.blur();
	if (pwdstrength['score'] >= 3) {
		$.create_wallet_button.enabled = (true);
		createWallet();
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
    Ti.App.Properties.setInt('walletversion', 2);

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
						//hideOverlayCreateWallet();

            storeInWallet();
            // setTimeout(showOverlaySend, 400);

					});

					Alloy.Globals.keychainItem.save(passphrase);
					passphrase = null;
				});


			});


			pwdstrength = null;

		} else {
      // no identity

			passphrase = null;
			pwdstrength = null;

      storeInWallet();
		}

	} else {

		passphrase = null;
		// password is not strong enough.
		alert(String.format(L("password_strength_result"), pwdgrades[pwdstrength['score']], pwdstrength['crack_times_display']['offline_slow_hashing_1e4_per_second']));

		pwdstrength = null;

	}


}


// fill explain wallet text

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
