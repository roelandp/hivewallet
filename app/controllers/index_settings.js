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
      var win = Alloy.createController('create_account').getView();
      Alloy.Globals.tabGroup.activeTab.open(win);
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
