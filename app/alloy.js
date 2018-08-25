// The contents of this file will be executed before any of
// your view controllers are ever executed, including the index.
// You have access to all functionality on the `Alloy` namespace.
//
// This is a great place to do any initialization for your app
// or create any global variables/functions that you'd like to
// make available throughout your app. You can easily make things
// accessible globally by attaching them to the `Alloy.Globals`
// object. For example:
//
// Alloy.Globals.someGlobalFunction = function(){};


Alloy.Globals.measurement = require('/measurement');

Alloy.Globals.isiPhoneX = (Ti.Platform.osname === 'iphone' && Ti.Platform.displayCaps.platformWidth === 375 && Ti.Platform.displayCaps.platformHeight === 812 && Ti.Platform.displayCaps.logicalDensityFactor === 3);

// loading popover
Alloy.Globals.loading = Alloy.createWidget("nl.fokkezb.loading");

// filesys settings...
var filesys = Titanium.Filesystem.applicationDataDirectory;

//console.log('filesys path',filesys);

if(OS_IOS) {
  // disabling backups of filesystem on IOS
  var fileDir = Titanium.Filesystem.getFile(filesys);
  if(fileDir) {
  fileDir.remoteBackup = false;
  fileDir = null;
  }
}


Alloy.Globals.filesys = filesys;

var AvImageview = require("av.imageview");
Alloy.Globals.CONTENT_MODE_FIT = AvImageview.CONTENT_MODE_ASPECT_FIT;
Alloy.Globals.CONTENT_MODE_FILL = AvImageview.CONTENT_MODE_ASPECT_FILL;

var extrapad = 0;

if(Alloy.Globals.isiPhoneX) {
  extrapad = 70;
}

var DP_platformWidth = (Ti.Platform.displayCaps.platformWidth);
var DP_platformHeight = (Ti.Platform.displayCaps.platformHeight);

if(OS_ANDROID) {
  DP_platformWidth = Alloy.Globals.measurement.pxToDP(Ti.Platform.displayCaps.platformWidth);
  DP_platformHeight = Alloy.Globals.measurement.pxToDP(Ti.Platform.displayCaps.platformHeight);
}

var widthratio = (DP_platformWidth / 414);
var container_branding_top = 30 + extrapad;
/* SIZES */
Alloy.Globals.dimensions = {
  container_branding_top: container_branding_top,
  container_username_top: container_branding_top + 25,
  container_welcome_top: (DP_platformHeight / 2) - (DP_platformHeight * 0.05),
  DP_platformWidth: DP_platformWidth,
  DP_platformHeight: DP_platformHeight,
  overlay_container_height: DP_platformHeight - (container_branding_top + 100),
  overlay_container_top: container_branding_top + 100,
  qrsize: DP_platformWidth - 120,
  avatar_top_right: -((300 / 375) * DP_platformWidth * 0.25),
  avatar_width_height: (300 / 375) * DP_platformWidth,
  overlay_barcode_top_height: (DP_platformHeight - (DP_platformWidth - 60)) /2,
  overlay_barcode_middle_height: (DP_platformWidth - 60),
};


Alloy.Globals.colors = {
  steemlightblue: "#4BA2F2",
  steemdarkblue: "#1A5099",
  themeblue: "#9013FE"
};

Alloy.Globals.config = {
  apiurl : 'https://api.steemit.com',
	expiretime: 30 * 1000, // default transaction expiretime
  cmc_steem: "https://api.coinmarketcap.com/v2/ticker/1230/?convert=BTC",
  cmc_sbd: "https://api.coinmarketcap.com/v2/ticker/1312/?convert=BTC",
  teamid: "M2FNGBQ5GU",
  walletfilename: "wallet.json",
}
