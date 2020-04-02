// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var wallet_helpers = require('/wallet_helpers');

var args = $.args;

function objsize(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)){ size++; }
    }
    return size;
}

function closeWin(){
  $.settings_keep_unlocked.close();
}

function animateOpen() {
  if(OS_IOS) {
    $.topspacer.height = $.settings_keep_unlocked.safeAreaPadding.top;
    //Alloy.Globals.topspacer = $.settings_do_not_prompt.safeAreaPadding.top;
  }

}

function changeLock() {
    console.log($.keep_unlocked_switch.value);
    if($.keep_unlocked_switch.value){
      // try to login & unlock.
      Titanium.App.Properties.setBool('keepunlocked',true);

      wallet_helpers.unlockWallet(
    		function(pass) {
    			//alert(e);

    			var keys = wallet_helpers.decryptWallet(pass);

    			if (keys) {

    				try {
    					var parsedkeys = JSON.parse(keys);
    					//console.log(pass);
    					if ('keys' in parsedkeys) {
                Titanium.App.Properties.setBool('keepunlocked',true);
                Alloy.Globals.coaster = {keepunlocked: true, key:pass, lastunlock: (Math.round(new Date().getTime()))};
              }

              pass = keys = parsedkeys = null;

            }catch(errr) {
              Titanium.App.Properties.setBool('keepunlocked',false);
              Alloy.Globals.coaster = {keepunlocked: false, key:'', lastunlock: 0};
              $.keep_unlocked_switch.value = false;
              alert(String.format(L('wrong_passphrase'),errr));
            }
          }
        });

    } else {
      // destroy any coaster keep unlock data.
      Titanium.App.Properties.setBool('keepunlocked',false);
      Alloy.Globals.coaster = {keepunlocked: false, key:'', lastunlock: 0};
    }
}

$.keep_unlocked_switch.value = Titanium.App.Properties.getBool('keepunlocked');
