var curr_theme = Ti.App.Properties.getString('app:theme');

var listdata = [];


for (var theme in Alloy.Globals.themes) {
    var template = 'themeli';
    if(theme == curr_theme) {
      template = "themeliselected";
    }
    listdata.push({
      template: template,
      labeltitle: {
        text: theme,
      },

      theme: theme,
    });

}

$.theme_picker.sections[0].items = (listdata);

function selectTheme(e){
  var newtheme = $.theme_picker.sections[0].getItemAt(e.itemIndex).theme;
  if (Ti.App.Properties.getString('app:theme') != newtheme) {
    // update new theme

    var dialog = Ti.UI.createAlertDialog({
      cancel: 1,
      buttonNames: [L('OK'), L('cancel')],
      message: L('restart_app_for_theme_changes'),
      title: L('change_theme')
    });

    dialog.addEventListener('click', function(e) {
      if (e.index === 1) {

      } else {
        Alloy.Globals.setTheme(newtheme);
        Alloy.Globals.updateSettingsPreviewText("settings_preview_theme", newtheme);
        closeWin();
      }

    });
    dialog.show();
  }

  // alert
}

$.settings_theme.transform = Titanium.UI.create2DMatrix().scale(0);
//$.settings_theme.left = Alloy.Globals.dimensions.DP_platformWidth;
$.settings_theme.anchorPoint = {x:0.5, y:1};
function closeWin(){
  $.settings_theme.animate(b);
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
    $.settings_theme.close();
});

function animateOpen() {
    $.settings_theme.animate(a);
}
