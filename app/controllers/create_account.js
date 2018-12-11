$.create_account.transform = Titanium.UI.create2DMatrix().scale(0);

$.create_account.anchorPoint = {x:0.5, y:1};

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
    $.create_account.close();
});

function animateOpen() {
  $.create_account.animate(a);
}

function closeWin(){
  $.create_account.animate(b);
}
