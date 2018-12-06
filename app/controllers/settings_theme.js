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
