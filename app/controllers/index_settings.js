$.index_settings.transform = Titanium.UI.create2DMatrix().scale(0);
//$.index_settings.left = Alloy.Globals.dimensions.DP_platformWidth;
$.index_settings.anchorPoint = {x:0.5, y:1};
function closeWin(){
  $.index_settings.animate(b);
}


var a = Ti.UI.createAnimation({
    transform : Ti.UI.create2DMatrix().scale(1),
    duration : 300,
    anchorPoint: {x:0.5, y:1}
});

var b = Ti.UI.createAnimation({
    transform : Ti.UI.create2DMatrix().scale(0),
    duration : 150,
    anchorPoint: {x:0.5, y:1}
});

b.addEventListener('complete', function() {
    $.index_settings.close();
});

function animateOpen() {
  $.index_settings.animate(a);
}

Alloy.Globals.updateSettingsPreviewText = function(obj,newtext){
  $.getView(obj).setText(newtext);
}

Alloy.Globals.updateSettingsPreviewText("settings_preview_currency", Ti.App.Properties.getString('currency'));
Alloy.Globals.updateSettingsPreviewText("settings_preview_node", Ti.App.Properties.getString('apiurl').split("://")[1].split(":")[0]);
Alloy.Globals.updateSettingsPreviewText("settings_preview_theme", Ti.App.Properties.getString('app:theme'));

function doSetting(e){
  console.log(e.rowData.item);

  switch(e.rowData.item) {

    case "apinode":
      var win = Alloy.createController('settings_apinode').getView();
      win.open();
    break;

    case "currency":
      var win = Alloy.createController('settings_currency').getView();
      win.open();
    break;

    case "theme":
      var win = Alloy.createController('settings_theme').getView();
      win.open();
    break;

    case "createaccount":
      var win = Alloy.createController('create_account').getView();
      win.open();
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

          alert('app_resetted_please_restart');
          closeWin();
        }

      });
      dialog.show();
    break;

  }
}
