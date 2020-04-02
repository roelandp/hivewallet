// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;
var helpers_eventdispatcher = require('/helpers_eventdispatcher');
var XCallbackURL = require('/xcallbackurl');
Alloy.Globals.tabGroup = $.index;

// opener handler for steem:// uris

function handleURL(url) {
	if(url) {
			//console.log('HandleURL called', url);

			// app also accepts steemwallet:// so needs to modify to steem:// here.
			if(url.startsWith('hivewallet://')) {
				url = url.replace('hivewallet://','hive://');
			}

			if(url.startsWith('https://hivewallet.app')) {
				url = url.replace('https://hivewallet.app','hive://');
			}

			if(url.startsWith('hive:///')) {
				url = url.replace('hive:///','hive://');
			}

			// check if app starts with transfer alias. Then we can prepopulate with transferwindow.

			var urlx = XCallbackURL.parse(url)['parsedURI'];
			//console.log(urlx);

      if (urlx.protocol !== 'hive') {
          throw new Error("Invalid protocol, expected 'hive:' got '" + url.protocol + "'");
      }

			if(url.length > ('hive://').length) {

				if ((urlx.host == 'sign' && urlx.path.split('/').slice(1)[0] == 'transfer') || urlx.host == 'transfer') {

					// should open wallet with launchUrl: url param here.
					setTimeout(function(){
						Alloy.Globals.tabGroup.activeTab = 0;

						var win_wallet = Alloy.createController('wallet', {launcherurl: url}).getView();
						Alloy.Globals.tabGroup.activeTab.open(win_wallet);
						//win_wallet.open();
					}, 150);

	      } else {
						// for now launch Transaction window... might need to update to enhance steem-uri spec and such

						var win_transaction = false;
						function transactionWindow(url) {
							//alert('should launch settings');
							if(win_transaction) {
									win_transaction.close();
									win_transaction = false;
							}

							win_transaction = Alloy.createController('transactionsigner', {url: url}).getView();
							win_transaction.open();
						}

						function transactionWindowClose(url) {
							win_transaction.close();
							win_transaction = false;
						}
						Alloy.Globals.indexJStransactionWindowClose = transactionWindowClose;

				}


			}
	}


}

if (OS_IOS) {
	$.index.addEventListener('open', function (e) {
		console.log('app opener');
		console.log("app was opened");
		console.log(e);
    // Handle the URL in case it opened the app
    handleURL(Ti.App.getArguments().url);

    // Handle the URL in case it resumed the app
    Ti.App.addEventListener('resumed', function () {
			console.log("app resumed");
			console.log(Ti.App.getArguments());
        handleURL(Ti.App.getArguments().url);
    });
	});
} else if(OS_ANDROID) {
	var Deeply = require('ti.deeply');

	Deeply.setCallback(function(e) {
		handleURL(e.data);
	});
}

// opening the main controller views of the app.
$.index.open();
// setTimeout(function(){
// 	var win = Alloy.createController('settings_import_keys').getView();
// 	Alloy.Globals.tabGroup.activeTab.open(win);
// }, 1500);
