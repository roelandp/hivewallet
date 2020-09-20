
// include the helper functions here.
var helpers = require('/functions');


// zxcvbn password strength library https://github.com/dropbox/zxcvbn
var zxcvbn = require('/zxcvbn');

var dsteem = require('/hive-tx-min');

var storekit;
var inappbilling;
var topost = {};

var environment = 'production';
var store = 'google';
var uuid = Ti.Utils.sha1(Ti.App.Properties.getString('uuid'));

// var to hold the current session receiptdata return from appstore. If we have failures in registerring the account, we can revert and re-use this sessionreceiptdata to resubmit a request.
var sessionreceiptdata;
var retrypurchase = false;

var canmakepayments = false;
var inappbillingproduct;

if(Ti.App.deployType != environment) {
  environment = "sandbox";
}

if (OS_IOS) {
    store = 'apple';
}

if (OS_IOS) {
  storekit = require('ti.storekit');
  verifyingReceipts = false;
  storekit.bundleVersion = "2.0.1"; // eg. "1.0.0"
  //storekit.receiptVerificationSandbox = Ti.App.deployType !== 'production';
  storekit.bundleIdentifier = Ti.App.id; // eg. "com.appc.storekit"
  storekit.autoFinishTransactions = true;

  function transactionstateListener(evt) {

    switch (evt.state) {
        case storekit.TRANSACTION_STATE_FAILED:
            if (evt.cancelled) {
                Ti.API.warn('Purchase cancelled');
            } else {
                Ti.API.error('ERROR: Buying failed! ' + evt.message);
            }
            evt.transaction && evt.transaction.finish();
            break;
        case storekit.TRANSACTION_STATE_PURCHASED:

            // Receive the receipt
            finalisePurchase(evt.receipt);
            evt.transaction && evt.transaction.finish();

            break;
        case storekit.TRANSACTION_STATE_PURCHASING:
            break;
    		case storekit.TRANSACTION_STATE_DEFERRED:
    		    break;
        case storekit.TRANSACTION_STATE_RESTORED:
            // The complete list of restored products is sent with the `restoredCompletedTransactions` event
            // Downloads that exist in a RESTORED state should not necessarily be downloaded immediately. Leave it up to the user.
            finalisePurchase(evt.receipt);
            evt.transaction && evt.transaction.finish();
            break;
    }
  }

  storekit.addEventListener('transactionState', transactionstateListener);

  storekit.addTransactionObserver();

} else {
  // android inappbilling settings (v3 iab)
  var android_public_key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAh39jScz+CnKRu6I1v2gbvwaQnjdn/PwWKms1lrNnFg+RrPLcCmSgu4aMOKZVDIa7vrjK1SCM/sIebm43lWPTdEoEAWXsKZUPOBjk9tDiMF80gw0uhv0t+O7iG81NmIRZNvuXeUDFuvGaHt5EgL8wcGwhSjQIaTzgmoOBSKoZf7pSQKP5IFCYMlltQdDdjfJOTNxe4rcrYG5F0ckVwrA1/a4hBLyCkZ3uAGG89KnxVq+mXDEhsgLqs4eGInmMDGp0xi1V8DcTcI9d3RK2/CCMmAaJM9/KnEhHnXpXaJlfI/CROo8amK53VCTFwA7a/G0OEOi0r7ghW2ran2Dn/8SgBQIDAQAB";
  inappbilling = require('ti.inappbilling');

  function setupcompleteListener(e) {
      if (e.success) {
          canmakepayments = true;
      } else {
          canmakepayments = false;
          alert(L('your_device_is_unfortunately_not_supported'));
      }
  }

  function queryinventorycompleteListener(e) {
      var inventory = e.inventory;
      var purchaseIds = [Alloy.Globals.config.iapaccountcreationcredit];
      var purchase, details;
      if (e.success) {
          for (var i = 0, j = purchaseIds.length; i < j; i++) {

              // Check for purchase
              if (inventory.hasPurchase(purchaseIds[i])) {
                  purchase = inventory.getPurchase(purchaseIds[i]);
                  // Print details for each purchase

                  // Queue 'iapaccountcreationcredit' up to be consumed if it is owned
                  if (purchase.productId === Alloy.Globals.config.iapaccountcreationcredit &&
                      purchase.purchaseState === inappbilling.PURCHASE_STATE_PURCHASED) {
                      inappbillingproduct = purchase;
                      inappbilling.consume({
                        purchases: [purchase]
                      });
                  }
              }
          }
      }
  }

  function purchasecompleteListener(e) {
      if (e.success && e.purchase) {

          // instantly consuming that purchase ....
          inappbillingproduct = e.purchase;
          inappbilling.consume({
            purchases: [e.purchase]
          });



      } else {
        if(e.responseCode === inappbilling.RESULT_ITEM_ALREADY_OWNED) {
          // this item is owned but apparently not yet consumed...
          // lets try to consume it now, by calling queryInventory so we get a list of IAPs bought and we can loop them in the response listener
          inappbilling.queryInventory();
        }
      }
  }

  function consumecompleteListener(e) {
      if (e.success) {
        finalisePurchase(e.purchase);
      }
  }

  inappbilling.addEventListener('setupcomplete', setupcompleteListener);
  inappbilling.addEventListener('purchasecomplete', purchasecompleteListener);
  inappbilling.addEventListener('consumecomplete', consumecompleteListener);
  inappbilling.addEventListener('queryinventorycomplete', queryinventorycompleteListener);


  function responseString(responseCode) {
      switch (responseCode) {
          case inappbilling.RESULT_OK:
              return 'OK';
          case inappbilling.RESULT_USER_CANCELED:
              return 'USER CANCELED';
          case inappbilling.RESULT_BILLING_UNAVAILABLE:
              return 'BILLING UNAVAILABLE';
          case inappbilling.RESULT_ITEM_UNAVAILABLE:
              return 'ITEM UNAVAILABLE';
          case inappbilling.RESULT_DEVELOPER_ERROR:
              return 'DEVELOPER ERROR';
          case inappbilling.RESULT_ERROR:
              return 'RESULT ERROR';
          case inappbilling.RESULT_ITEM_ALREADY_OWNED:
              return 'RESULT ITEM ALREADY OWNED';
          case inappbilling.RESULT_ITEM_NOT_OWNED:
              return 'RESULT ITEM NOT OWNED';

          case inappbilling.IAB_RESULT_REMOTE_EXCEPTION:
              return 'IAB RESULT REMOTE EXCEPTION';
          case inappbilling.IAB_RESULT_BAD_RESPONSE:
              return 'IAB RESULT BAD RESPONSE';
          case inappbilling.IAB_RESULT_VERIFICATION_FAILED:
              return 'IAB RESULT VERIFICATION FAILED';
          case inappbilling.IAB_RESULT_SEND_INTENT_FAILED:
              return 'IAB RESULT SEND INTENT FAILED';
          case inappbilling.IAB_RESULT_UNKNOWN_PURCHASE_RESPONSE:
              return 'IAB RESULT UNKNOWN PURCHASE RESPONSE';
          case inappbilling.IAB_RESULT_MISSING_TOKEN:
              return 'IAB RESULT MISSING TOKEN';
          case inappbilling.IAB_RESULT_UNKNOWN_ERROR:
              return 'IAB RESULT UNKNOWN ERROR';
          case inappbilling.IAB_RESULT_SUBSCRIPTIONS_NOT_AVAILABLE:
              return 'IAB RESULT SUBSCRIPTIONS NOT AVAILABLE';
          case inappbilling.IAB_RESULT_INVALID_CONSUMPTION:
              return 'IAB RESULT INVALID CONSUMPTION';
      }
      return '';
  }

  function purchaseStateString(state) {
      switch (state) {
          case inappbilling.PURCHASE_STATE_PURCHASED:
              return 'PURCHASE STATE PURCHASED';
          case inappbilling.PURCHASE_STATE_CANCELED:
              return 'PURCHASE STATE CANCELED';
          case inappbilling.PURCHASE_STATE_REFUNDED:
              return 'PURCHASE STATE REFUNDED';
      }
      return '';
  }

  function purchaseTypeString(state) {
      switch (state) {
          case inappbilling.ITEM_TYPE_INAPP:
              return 'ITEM TYPE INAPP';
          case inappbilling.ITEM_TYPE_SUBSCRIPTION:
              return 'ITEM TYPE SUBSCRIPTION';
      }
      return '';
  }

  function purchaseProperties(p) {
    var str = 'type: ' + purchaseTypeString(p.type) +
        '\norderId: ' + p.orderId +
        '\npackageName: ' + p.packageName +
        '\nproductId: ' + p.productId +
        '\npurchaseTime: ' + new Date(p.purchaseTime) +
        '\npurchaseState: ' + purchaseStateString(p.purchaseState) +
        '\ndeveloperPayload: ' + p.developerPayload +
        '\ntoken: ' + p.token;

    return str;
  }

  // initialise setup for iab
  try {
    inappbilling.startSetup({
      publicKey: android_public_key,
    });
  } catch(e) {

  }

}

function finalisePurchase(receiptdata) {

  Alloy.Globals.loading.show(String.format(L('registering_s_stay_tuned'), $.textfield_createaccount_username.value.trim()), false);

  sessionreceiptdata = receiptdata;

  topost = {
    "uuid": uuid,
    "receipt": receiptdata,
    "environment": environment,
    "store": store,
    "keys": generateKeys($.textfield_createaccount_username.value.trim(), $.textfield_createaccount_password.value),
    "accountname": $.textfield_createaccount_username.value.trim()
  };

  helpers.xhrcall(
    Alloy.Globals.config.registeraccounturl,
    "POST",
    function(progress){

    },
    function(apireturn){
      Alloy.Globals.loading.hide();

      var jsonapireturn = JSON.parse(apireturn);

      if(jsonapireturn) {
        if (jsonapireturn.hasOwnProperty('data')) {
          // should be succesfull
          // TODO: should display result window... maybe add account to monitor?
          //alert('Account Registered succesfully, be sure to store your password safely now, and use it to add the account to your wallet, you can now close this window');
          finalisePurchaseView();
          //


        } else {
          // check what kind of error code. if not
          if(jsonapireturn.hasOwnProperty('error')) {
              handleApiError(jsonapireturn['error']);
          }
        }
      } else {

        var apierr = {'code': '000', 'message': 'Can\'t parse API return into object'};
        handleApiError(apierr);
      }


    },
    function(error) {
      Alloy.Globals.loading.hide();
      handleApiError(error);
      // should do offer to try again...
    },
    topost,
    75000
  );
}

function handleApiError(error) {

  var title = L('error');
  var description = L('please_try_again');

  if(error.hasOwnProperty('code') ) {
      title = String.format(L('oops_error_s'), (""+error['code']));
  }

  if(error.hasOwnProperty('message')) {
      description = error['message'];
  }

  if(error.hasOwnProperty('error')) {
      description = error['error'];
  }

  // create an alert dialog with the error options.
  var dialog = Ti.UI.createAlertDialog({
    destructive: 1,
    buttonNames: [L('try_again'), L('cancel')],
    message: description,
    title: title
  });

  dialog.addEventListener('click', function(e) {

    if (e.index === 1) {

      // double confirm to user that s/he wants to erase current session and quit account registration (albeit having an active purchase going on)
      var dialog2 = Ti.UI.createAlertDialog({
        destructive: 0,
        buttonNames: [L('ok_im_sure'), L('no_lets_continue')],
        message: L('this_will_irrevocably_stop_your_current_registration'),
        title: L('are_you_sure'),
      });

      dialog2.addEventListener('click', function(f) {

        if (f.index === 1) {
          retrypurchase = true;
          updateRegistrationValidity();
          return false;
        } else {
          closeWin();
        }

      });

      dialog2.show();

    } else {

      //retry to finalise purchase with sessionreceiptdata;

      // set the "retry button to true" then change some data and submit again.
      retrypurchase = true;
      updateRegistrationValidity();
      return false;
    }

  });


  dialog.show();


}

function requestandPurchaseAccount() {

  if(OS_IOS) {
    storekit.requestProducts([Alloy.Globals.config.iapaccountcreationcredit], function(evt) {

       if (!evt.success) {

       } else if (evt.invalid) {

       } else {

         if(evt.products.length > 0) {

           storekit.purchase({
             product: evt.products[0],
             //applicationUsername: uuid
             // applicationUsername is a opaque identifier for the user’s account on your system.
             // Used by Apple to detect irregular activity. Should hash the username before setting.
           });
         }

       }
   });
 } else {
   // android purchase
   inappbilling.purchase({
     productId: Alloy.Globals.config.iapaccountcreationcredit,
     type: inappbilling.ITEM_TYPE_INAPP,
       developerPayload: uuid+':'+$.textfield_createaccount_username.value.trim()
   });
 }
}
//
var validatetimeout = null;

// switches for validity of username and password.
var valid_username = false;
var valid_password = false;
var valid_passwordconfirm = false;

function validateUsername(e) {

  valid_username = false;
  clearTimeout(validatetimeout);

  var desired_username = e.value.trim();

  var usernamevalidation = helpers.validate_account_name(desired_username);
  if(desired_username.length > 0){


      if(usernamevalidation) {
        $.username_result.text = usernamevalidation;
        valid_username = false;
        updateRegistrationValidity();
      } else {
        $.username_result.text = L('checking_availability');
        validatetimeout = setTimeout(function () {
          helpers.steemAPIcall(
    					"get_accounts", [
    						[desired_username]
    					],
    					function(success) {
    						if (success.result.length == 0) {
                  $.username_result.text = String.format(L("account_s_is_available"), desired_username);
                  valid_username = true;
                  updateRegistrationValidity();
    						} else {
    							// consider checking for reputation here...
                  $.username_result.text = String.format(L("account_s_is_already_taken_pick_a_different_name_please"), desired_username);
                  valid_username = false;
                  updateRegistrationValidity();
    						}

    					},
    					function(error) {
    						valid_username = false;
                updateRegistrationValidity();
    					}
    				);
        }, 500);
      }

  } else {
    $.username_result.text = '';
    valid_username = false;
    updateRegistrationValidity();
  }
}
//
function returnUsername(e) {
  $.textfield_createaccount_username.blur();
  validateUsername(e);
}

function togglePasswordMask() {
	if ($.textfield_createaccount_password.passwordMask) {
		$.textfield_createaccount_password.passwordMask = false;
		$.togglepasswordmask.title = '🤫';
	} else {
		$.textfield_createaccount_password.passwordMask = true;
		$.togglepasswordmask.title = '🤪';
	}
}





// account password creation
var pwdgrades = [
	L("pw_strength_0"),
	L("pw_strength_1"),
	L("pw_strength_2"),
	L("pw_strength_3"),
	L("pw_strength_4"),
];

function calcPassphraseStrength(e) {
  valid_password = false;
	var pwdstrength = zxcvbn(e.value);

	$.password_strength_result.text = (String.format(L("password_strength_result"), pwdgrades[pwdstrength['score']], pwdstrength['crack_times_display']['offline_slow_hashing_1e4_per_second']));

	if (pwdstrength['score'] >= 3) {
		//$.create_wallet_button.setEnabled(true);
    valid_password = true;
	} else {
		//$.create_wallet_button.setEnabled(false);
    valid_password = false;
	}

	if (e.value.length == "") {
		$.password_strength_result.text = ("");
    valid_password = false;
	}
  confirmPassphrase();
  updateRegistrationValidity();
	pwdstrength = null;
	e = null
}

function updateRegistrationValidity() {

  // check if valid username
  if(valid_username) {
      $.create_account_next1.enabled = true;
      $.create_account_next1.opacity = 1;
  } else {
      $.create_account_next1.enabled = false;
      $.create_account_next1.opacity = 0.2;
  }

  // check if valid password
  if(valid_password) {
      $.create_account_next2.enabled = true;
      $.create_account_next2.opacity = 1;
  } else {
      $.create_account_next2.enabled = false;
      $.create_account_next2.opacity = 0.2;
  }

  // check if valid password confirm
  if(valid_passwordconfirm) {
    $.create_account_next3.enabled = true;
    $.create_account_next3.opacity = 1;
  } else {
    $.create_account_next3.enabled = false;
    $.create_account_next3.opacity = 0.2;
  }


  // if all is valid enable scrolling for adjusting for example the username or other data
  if(valid_username && valid_password && valid_passwordconfirm) {
    //generateKeys($.textfield_createaccount_username.value.trim(), $.textfield_createaccount_password.value);
    $.create_account_scrollableview.scrollingEnabled = true;
  } else {
    $.create_account_scrollableview.scrollingEnabled = false;
  }


}

function generateKeys(account, password) {
  var roles = ['owner','active','posting','memo'];

  var keys = {};
  for(var i = 0; i < roles.length; i++) {

    var pkey = dsteem.PrivateKey.fromLogin(account, password, roles[i]).createPublic().toString();
    keys[roles[i]] = pkey;
  }

  return(keys);
}

function formatPurchaseKeyField(account, password){

  var printfield = String.format(L('all_keys_for_your_account_s_store_safely'), account)+"\n\n";

  printfield += L('master_password')+":\n";
  printfield += password + "\n\n";

  var roles = ['owner','active','posting','memo'];


  for(var i = 0; i < roles.length; i++) {
    printfield += (roles[i] + " key").toUpperCase()+"\n- - - - - - - -\n";
    var pkey = dsteem.PrivateKey.fromLogin(account, password, roles[i]);

    printfield += "public: "+pkey.createPublic().toString() + "\n";
    printfield += "private: "+pkey.toString() + "\n\n";

  }

  return printfield;
}

function returnPassword(e) {

  $.textfield_createaccount_password.blur();
  calcPassphraseStrength(e);

  var pwdstrength = zxcvbn(e.value);

  if (pwdstrength['score'] < 3) {
    alert(String.format(L("password_strength_result"), pwdgrades[pwdstrength['score']], pwdstrength['crack_times_display']['offline_slow_hashing_1e4_per_second']));
	}

  pwdstrength = null;
	e = null;

}

function confirmPassphrase() {
  // onchange password confirm field

  if($.textfield_createaccount_password2.value == $.textfield_createaccount_password.value) {
    valid_passwordconfirm = true;
    $.password_strength_result2.text = L("passphrases_match");
  } else {
    valid_passwordconfirm = false;
    $.password_strength_result2.text = L("passphrases_do_not_match");
  }
  updateRegistrationValidity();
}


function returnPasswordConfirm() {
  $.textfield_createaccount_password2.blur();
  confirmPassphrase();
}

function togglePasswordMask2() {
  if ($.textfield_createaccount_password2.passwordMask) {
    $.textfield_createaccount_password2.passwordMask = false;
    $.togglepasswordmask2.title = '🤫';
  } else {
    $.textfield_createaccount_password2.passwordMask = true;
    $.togglepasswordmask2.title = '🤪';
  }
}


function slideToView(view){
  $.create_account_scrollableview.scrollToView(view);
}

function makePwd(){

  textfield = $.textfield_createaccount_password;

  textfield.value = (helpers.generateBase58Password(40));
  calcPassphraseStrength({value: textfield.value});
}

function step2() {
  $.textfield_createaccount_username.blur();
  slideToView(1);
  setTimeout(function() {makePwd($.textfield_createaccount_password);},1000);
}

function step3() {
  $.textfield_createaccount_password.blur();
  slideToView(2);
}

function step4() {
  $.textfield_createaccount_password2.blur();

  // execute order here.
  if(Titanium.Network.online) {
    //
    if(!canmakepayments) {
      alert(L('your_device_is_unfortunately_not_supported'));
    } else {
      $.create_account_scrollableview.scrollingEnabled = false;
      $.create_account_next3.enabled = false;
      $.create_account_next3.opacity = 0.2;
      if(!retrypurchase) {
        requestandPurchaseAccount();
      } else {
        finalisePurchase(sessionreceiptdata);
      }
    }

  }
}


// $.create_account.transform = Titanium.UI.create2DMatrix().scale(0);
//
// $.create_account.anchorPoint = {x:0.5, y:1};
//
// var a = Ti.UI.createAnimation({
//     transform : Ti.UI.create2DMatrix().scale(1),
//     duration : 300,
//     anchorPoint: {x:0.5, y:1}
// });
//
// var b = Ti.UI.createAnimation({
//     transform : Ti.UI.create2DMatrix().scale(0),
//     duration : 150,
//     anchorPoint: {x:0.5, y:1}
// });
//
// b.addEventListener('complete', function() {
//     $.create_account.close();
// });

function animateOpen() {
  //$.create_account.animate(a);
  if(OS_IOS) {
    canmakepayments = storekit.canMakePayments;
    if(!canmakepayments) {
      alert(L('your_device_is_unfortunately_not_supported'));
    }
  } else {
    // android check for 'canmakepayments' is concluded in inappbilling.setupcomplete eventlistener.
  }
  //requestandPurchaseAccount();
}

function closeWin(){
  // $.create_account.animate(b);
  helpers = null;
  fns = null;
  zxcvbn = null;
  dsteem = null;

  sessionreceiptdata = null;

  $.purchasekeysarea.removeEventListener('focus', focusTextArea);

  if (OS_IOS) {

    try {
      storekit.removeEventListener('transactionState', transactionstateListener);
      storekit.removeTransactionObserver();
      storekit = null;
    } catch(err) {
      console.log(err);
    }
  } else {
    inappbilling.removeEventListener('setupcomplete', setupcompleteListener);
    inappbilling.removeEventListener('purchasecomplete', purchasecompleteListener);
    inappbilling.removeEventListener('consumecomplete', consumecompleteListener);
    inappbilling.removeEventListener('queryinventorycomplete', queryinventorycompleteListener);
    //inappbilling = null;
    inappbillingproduct = null;
  }

  topost = null;

  $.create_account.close();


}

// 'finalise purchase'

function finalisePurchaseView() {
  $.create_account_scrollableview.height = 0;
  $.purchasesuccess.text = String.format(L('congrats_you_succesfully_purchased_s'), $.textfield_createaccount_username.value.trim());
  $.purchasekeysarea.value = formatPurchaseKeyField($.textfield_createaccount_username.value.trim(), $.textfield_createaccount_password.value);
  $.purchasekeysarea.setSelection(0,0);
  $.purchasekeysarea.blur();

  setTimeout(function(){
    $.purchasekeysarea.addEventListener('focus', focusTextArea);
    $.purchaseresults.height = Ti.UI.SIZE;

  },500);
}

function focusTextArea(e) {
    $.purchasekeysarea.setSelection(0,$.purchasekeysarea.value.length);
}
