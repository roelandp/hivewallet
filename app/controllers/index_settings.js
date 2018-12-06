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

    case "reset":

    break;


  }
}
