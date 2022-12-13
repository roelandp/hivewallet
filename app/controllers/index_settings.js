function animateOpen() {
  if(OS_IOS) {
    $.topspacer.height = $.index_settings.safeAreaPadding.top;
	   Alloy.Globals.topspacer = $.index_settings.safeAreaPadding.top;
  }
}

Alloy.Globals.updateSettingsPreviewText = function(obj,newtext){
  $.getView(obj).text = (newtext);
}

Alloy.Globals.updateSettingsPreviewText("settings_preview_currency", Ti.App.Properties.getString('currency'));
Alloy.Globals.updateSettingsPreviewText("settings_preview_node", Ti.App.Properties.getString('apiurl').split("://")[1].split(":")[0]);
Alloy.Globals.updateSettingsPreviewText("settings_preview_theme", Ti.App.Properties.getString('app:theme'));

function doSetting(e){
  console.log(e.rowData.item);

  switch(e.rowData.item) {

    case "apinode":
      var win = Alloy.createController('settings_apinode').getView();
      Alloy.Globals.tabGroup.activeTab.open(win);
    break;

    case "currency":
      var win = Alloy.createController('settings_currency').getView();
      Alloy.Globals.tabGroup.activeTab.open(win);
    break;

    case "theme":
      var win = Alloy.createController('settings_theme').getView();
      Alloy.Globals.tabGroup.activeTab.open(win);
    break;

    case "createaccount":
      if (OS_IOS) {
        var win = Alloy.createController('create_account').getView();
        Alloy.Globals.tabGroup.activeTab.open(win);
      } else {
          Ti.Platform.openURL("https://signup.hive.io/");
      }
    break;

    case "importkey":
      var win = Alloy.createController('settings_import_keys').getView();
      Alloy.Globals.tabGroup.activeTab.open(win);
    break;

    case "donotprompt":
      var win = Alloy.createController('/settings_do_not_prompt').getView();
      Alloy.Globals.tabGroup.activeTab.open(win);
    break;

    case "keepunlocked":
      var win = Alloy.createController('/settings_keep_unlocked').getView();
      Alloy.Globals.tabGroup.activeTab.open(win);
    break;

    case "buysteem":
      Ti.Platform.openURL("https://blocktrades.us/?output_coin_type=hive&receive_address="+Ti.App.Properties.getString('currentaccount')+"&memo=&affiliate_id=81ddfd62-03df-4efa-b6a7-65f84802248e");
    break;

    case "salvage": 


    var dialog = Ti.UI.createAlertDialog({
      title: "Unlock export feature?",
      message: 'Ask contractor R. for unlock code - via Jess!',
      style: Ti.UI.iOS.AlertDialogStyle.SECURE_TEXT_INPUT,
      buttonNames: [L('unlock'), L('cancel')],
      cancel: 1,
    });
    dialog.addEventListener('click', function _lis(e) {
      dialog.removeEventListener('click', _lis);

      if (e.index == 0) {
        
        if(e.text == "WeShouldHaveBetterKeyManagement123") {
          // execute export 

          // special salvage for exporting keys. 
          var wallet_helpers = require('/wallet_helpers');

          if (Ti.App.Properties.getBool('usesIdentity')) {
            if(!Alloy.Globals.tidentity_initialized) {
              wallet_helpers.initTiIdentity();
            }
          }

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
                    //Ti.UI.Clipboard.clearText();
                    //Ti.UI.Clipboard.setText(keys);
                    //console.log("should have set keys in clipboard now");
                    
                    // var emailDialog = Ti.UI.createEmailDialog()
                    // emailDialog.subject = "Find the keys below, copy paste into some secure storage or secure chat!";
                    // emailDialog.toRecipients = ['dontemailthis@to.anyone'];
                    // emailDialog.messageBody = '<b>Please find all keys below. This is json encoded, but UNENCRYPTED!</b><h2>Dont email this to anyone!</h2><br />'+keys;
                    // emailDialog.open();

                    // var keysdialog = Ti.UI.createAlertDialog({
                    //   title: 'Keys:',
                    //   value: keys,
                    //   style: Ti.UI.iOS.AlertDialogStyle.PLAIN_TEXT_INPUT,
                    //   buttonNames: ['OK']
                    // });

                    // keysdialog.addEventListener('click', function(e) {
                    //   alert('done, did you copy the keys?');
                    // });

                    // keysdialog.show();

                    var win_keys = Ti.UI.createWindow({
                      backgroundColor: 'white'
                    });
                    
                    var textField_keys = Ti.UI.createTextField({
                      backgroundColor: '#fafafa',
                      color: 'black',
                      top: 10,
                      left: 10,
                      right: 10, 
                      bottom: 10,
                      value: keys
                    });
                    
                    win_keys.add(textField_keys);
                    win_keys.open();


                  }

                  
                  pass = keys = parsedkeys = null;

                }catch(errr) {
                  Titanium.App.Properties.setBool('keepunlocked',false);
                  Alloy.Globals.coaster = {keepunlocked: false, key:'', lastunlock: 0};
                  alert(String.format(L('wrong_passphrase'),errr));
                }
              }
            });

        } else {
          alert('You entered the wrong unlock code. Ask R via Jess for the code.');
        }
      } else {
        //$.button_send.enabled = (true);
        alert("You cancelled the unlocking feature.\n\n This app update is specifically build for the private key salvage feature.\n\nUse the regular (fully working) app by going back to the appstore and installing that version again.")
      }
      e = null;

    });
    dialog.show();


      

    break;

    case "reset":
      var dialog = Ti.UI.createAlertDialog({
        cancel: 1,
        destructive: 0,
        buttonNames: [L('OK'), L('cancel')],
        message: L('wipes_app_needs_restart'),
        title: L('are_you_sure')
      });

      dialog.addEventListener('click', function(e) {
        if (e.index === 1) {

        } else {
          // unset any settings / accounts
          Ti.App.Properties.removeAllProperties();

          // check if wallet.json exists and wipe

          var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, Alloy.Globals.config.walletfilename);

        	if (f.exists()) {
            f.deleteFile();
            f = null;
          } else {
            f = null;
          }

          alert('App resetted, please restart HiveWallet!');
          closeWin();
        }

      });
      dialog.show();
    break;

  }
}

console.log("INDEX_SETTINGS HAS BEEN OPENED!");
