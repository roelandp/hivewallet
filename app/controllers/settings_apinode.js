$.settings_apinode.transform = Titanium.UI.create2DMatrix().scale(0);
//$.settings_apinode.left = Alloy.Globals.dimensions.DP_platformWidth;
$.settings_apinode.anchorPoint = {x:0.5, y:1};
function closeWin(){
  $.settings_apinode.animate(b);
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
    $.settings_apinode.close();
});

function animateOpen() {
    $.settings_apinode.animate(a);
}

function addNode() {
  toggleNodeView();
}

function toggleNodeView(){
  
}
