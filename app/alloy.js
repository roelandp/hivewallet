Alloy.Globals.measurement = require('/measurement');
Alloy.Globals.currencies = require('/currencies');
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
  //Ti.App.forceSplashAsSnapshot = true;
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
var DP_platformHeight = (Ti.Platform.displayCaps.platformHeight); // - 48; // removing 50 for tab height.

if(OS_ANDROID) {
  DP_platformWidth = Alloy.Globals.measurement.pxToDP(Ti.Platform.displayCaps.platformWidth);
  DP_platformHeight = Alloy.Globals.measurement.pxToDP(Ti.Platform.displayCaps.platformHeight); // - 48; // removing 48 for tabgroup height
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
  overlay_container_height_tab: DP_platformHeight - (container_branding_top + 100) - 49,
  overlay_container_top: container_branding_top + 100,
  qrsize: DP_platformWidth - 120,
  avatar_top_right: -((300 / 375) * DP_platformWidth * 0.25),
  avatar_width_height: (300 / 375) * DP_platformWidth,
  overlay_barcode_top_height: (DP_platformHeight - (DP_platformWidth - 60)) /2,
  overlay_barcode_middle_height: (DP_platformWidth - 60),
};

Alloy.Globals.homepage = "https://steemwallet.app/browser/index.html?theme="+Titanium.App.Properties.getString('app:theme');


Alloy.Globals.themes = {

    light: {

      name: "light",
      steemlightblue: "#4BA2F2",
      steemdarkblue: "#1A5099",
      themeblue: "#9013FE",

      backgroundColor: "#FFFFFF",
      selectedBackgroundColor: "#F2F2F2",
      backgroundColor_alpha100: "#FFFFFFFF",
      backgroundColor_alpha90: "#E6FFFFFF",
      backgroundColor_alpha70: "#B3FFFFFF",
      backgroundColor_alpha0: "#00FFFFFF",

      textColor: "#494841",

      transaction_red: "#f75535",
      transaction_green: "#00a45b",
    },

    dark: {

      name: "dark",
      steemlightblue: "#CCCCCC",
      steemdarkblue: "#DDDDDD",
      themeblue: "#FFFFFF",

      backgroundColor: "#494841",
      selectedBackgroundColor: "#333333",
      backgroundColor_alpha100: "#FF494841",
      backgroundColor_alpha90: "#E6494841",
      backgroundColor_alpha70: "#B3494841",
      backgroundColor_alpha0: "#00494841",

      textColor: "#BBBBBB",

      transaction_red: "#f75535",
      transaction_green: "#00a45b",
    },

    navyred: {

      name: "navyred",
      steemlightblue: "#FF6551",
      steemdarkblue: "#7F1002",
      themeblue: "#FF2105",

      backgroundColor: "#E4E5E6",
      selectedBackgroundColor: "#99CCCC",
      backgroundColor_alpha100: "#FFE4E5E6",
      backgroundColor_alpha90: "#E6E4E5E6",
      backgroundColor_alpha70: "#B3E4E5E6",
      backgroundColor_alpha0: "#00E4E5E6",

      textColor: "#004466",

      transaction_red: "#f75535",
      transaction_green: "#00a45b",
    },

    yungpink: {
      //
      name: "yungpink",
      steemlightblue: "#fecefc",
      steemdarkblue: "#fd64bb",
      themeblue: "#fd64bb",

      backgroundColor: "#ffff96",
      selectedBackgroundColor: "#f0b61e",
      backgroundColor_alpha100: "#FFffff96",
      backgroundColor_alpha90: "#E6ffff96",
      backgroundColor_alpha70: "#B3ffff96",
      backgroundColor_alpha0: "#00ffff96",

      textColor: "#7F3251",

      transaction_red: "#f75535",
      transaction_green: "#00a45b",
    }



}

// getter/setter helper methods
Alloy.Globals.getTheme = function() {
  if(Alloy.Globals.theme !== null) {
    return Alloy.Globals.theme.name;
  }
  return Ti.App.Properties.getString("app:theme", "");
};

Alloy.Globals.setTheme = function(name) {
  console.log('setting theme '+name);
  if(Alloy.Globals.themes.hasOwnProperty(name)) {
      Alloy.Globals.theme = Alloy.Globals.themes[name];
      Ti.App.Properties.setString("app:theme", name);
  }
};

// theme selector
if(!Titanium.App.Properties.hasProperty('app:theme')) {
	 Alloy.Globals.setTheme("light");
} else {
	 Alloy.Globals.setTheme(Titanium.App.Properties.getString('app:theme'));
}

Alloy.Globals.config = {
  apiurl : 'https://api.steemit.com',
	expiretime: 30 * 1000, // default transaction expiretime
  cmc_steem: "https://api.coinmarketcap.com/v2/ticker/1230/?convert=BTC",
  cmc_sbd: "https://api.coinmarketcap.com/v2/ticker/1312/?convert=BTC",
  teamid: "M2FNGBQ5GU",
  walletfilename: "wallet.json",
  defaultcurrency: "usd",
  iapaccountcreationcredit: "app.steemwallet.acc",
  registeraccounturl: "https://iap.steemwallet.app",
  userAgent: "SteemWallet.app "+Titanium.App.version+" ("+Titanium.Platform.osname+")"
}

var helpers = require('/functions');

var platformGUID = Ti.Platform.getId();
//console.log('getId()', platformGUID);

if (!platformGUID) {
	platformGUID = Ti.Platform.getModel() + '' + Date.now() + '' + helpers.randomString(20);
	//console.log('model+date', platformGUID);
}

if (!platformGUID) {
	platformGUID = Date.now() + '' + helpers.randomString(20);
	//console.log('model+date', platformGUID);
}

platformGUID = platformGUID + '' + Date.now() + '' + helpers.randomString(20);


if (!Titanium.App.Properties.hasProperty('apiurl')) {
	Titanium.App.Properties.setString('apiurl',Alloy.Globals.config.apiurl);
} else {
	Alloy.Globals.config.apiurl = Titanium.App.Properties.getString('apiurl');
}

if (!Titanium.App.Properties.hasProperty('donotpromptlist')) {
  Titanium.App.Properties.setObject('donotpromptlist', {});
}

if (!Titanium.App.Properties.hasProperty('accounts')) {
	//no accounts are currently saved for this user.
	newuser = true;

	Ti.App.Properties.setObject('accounts', []);

	Ti.App.Properties.setString('currentaccount', '');
	Ti.App.Properties.setString('price_steem_usd', "0");
	Ti.App.Properties.setString('price_sbd_usd', "0");
	Ti.App.Properties.setBool('usesIdentity', false);
	Ti.App.Properties.setBool('walletSetup', false);
	Ti.App.Properties.setString('uuid', platformGUID);
	Ti.App.Properties.setInt('lastPricesCheck', 0);
}

if(!Titanium.App.Properties.hasProperty('currency')) {
	Ti.App.Properties.setString('currency',Alloy.Globals.config.defaultcurrency);
}

Alloy.Globals.tidentity_initialized = false;

if(OS_ANDROID) {
  Alloy.Globals.topspacer = 0; // initially 0
}
