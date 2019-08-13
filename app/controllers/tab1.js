// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;
var helpers_eventdispatcher = require('/helpers_eventdispatcher');

var helpers = require('/functions');
//var helpers = new fns();


$.tab1.addEventListener('postlayout', function(e){
	if(OS_IOS) {
		$.topspacer.height = $.tab1.safeAreaPadding.top;
		Alloy.Globals.topspacer = $.tab1.safeAreaPadding.top;
	}
});


var alertdialogcancelcallback = function() {
	return false;
}

function alertDialogCb(e) {

	//console.log(e);
	if (OS_ANDROID && (e.cancel || (e.source.cancel == e.index))) {
		// we are on android and experienced a cancel click.
		//return false;
		alertdialogcancelcallback();
	} else if (OS_IOS && (e.cancel == e.index)) {
		// we are on ios and experienced a cancel click.
		//return false;
		alertdialogcancelcallback();
	} else {
		alertdialogcallback();
	}
}

function setCurrentAccount() {

}

function delAccount(e) {
	var item = $.overlay_pickaccount_listview.sections[0].getItemAt(e.itemIndex);
	//console.log('delaccount item', item.accountdata);

	$.alertdialog.applyProperties({
		title: String.format(L('remove_s'), item.accountdata.name),
		message: String.format(L('remove_account_s'), item.accountdata.name),
		destructive: 0,
		cancel: 1,
		buttonNames: [L('yes'), L('cancel')]
	});

	alertdialogcallback = function() {
		// console.log('hit del account');
		// console.log('removing '+item.accountdata.name);
		removeAccount(item.accountdata.name);
	}

	alertdialogcancelcallback = function() {
		return false;
	}

	$.alertdialog.show();

}

function updateAccount(e) {
	// get latest account balance

	var currentaccounts = Ti.App.Properties.getObject('accounts');
	var accountslist = [];
	if (currentaccounts.length > 0) {
		for (var i = 0; i < currentaccounts.length; i++) {
			// loop through currentaccounts, break if found.
			accountslist.push(currentaccounts[i]['name']);
		}
	}
	helpers.steemAPIcall(
		"get_accounts", [
			accountslist
		],
		function(success) {
			//console.log(success);

			if(success.result.length > 0) {
				for(var j = 0; j < success.result.length; j++) {

					var foundname = success.result[j].name.toLowerCase();

					//var accounthasprivatekeyinwallet = false;
					var accounthasprivatekeyinwallet_posting = false;
					var accounthasprivatekeyinwallet_active = false;
					var accounthasprivatekeyinwallet_memo = false;

					var currentaccounts = Ti.App.Properties.getObject('accounts');

					if (currentaccounts.length > 0) {
						// we already have accounts, lets see if the account we are trying to add is already here
						for (var i = 0; i < currentaccounts.length; i++) {
							// loop through currentaccounts, break if found.
							if (currentaccounts[i]['name'] == foundname) {
								//already found account. pop it (we re-add / update it below)
								//accounthasprivatekeyinwallet = currentaccounts[i]['privatekey'];
								accounthasprivatekeyinwallet_posting = currentaccounts[i]['privatekey_posting'];
								accounthasprivatekeyinwallet_active = currentaccounts[i]['privatekey_active'];
								accounthasprivatekeyinwallet_memo = currentaccounts[i]['privatekey_memo'];


								currentaccounts.splice(i, 1);

								alreadyhadaccount = true;
								break;
							}
						}
					}

					//success.result[j]['privatekey'] = accounthasprivatekeyinwallet;
					success.result[j]['privatekey_posting'] = accounthasprivatekeyinwallet_posting;
					success.result[j]['privatekey_active'] = accounthasprivatekeyinwallet_active;
					success.result[j]['privatekey_memo'] = accounthasprivatekeyinwallet_memo;

					success.result[j]['image'] = helpers.getImgFromJsonMetaData(success.result[j]['json_metadata']);

					currentaccounts.push(helpers.formatUserBalanceObject(success.result[j]));

					Ti.App.Properties.setObject('accounts', currentaccounts);
				}
			}

			setCurrentAccount();

		},
		function(error) {
			console.log(error);
		}
	);
}


function handlePickAccountClick(e) {
	console.log(e);
	if (e.source.bindId != 'delbut') {
		try {
			var newaccount = $.overlay_pickaccount_listview.sections[0].getItemAt(e.itemIndex).accountdata.name;
	    Ti.App.Properties.setString('currentaccount', newaccount);
	    updateAccount(newaccount);
	    var win_wallet = Alloy.createController('wallet').getView();
	  	Alloy.Globals.tabGroup.activeTab.open(win_wallet);
		} catch(err) {
			console.log(err);
		}
	}

}

function removeAccount(e) {
	// loop through accounts remove them.

	//console.log('removeAccounts(e) called with e = '+e);

	var currentaccounts = Ti.App.Properties.getObject('accounts');
	//console.log('remove account currenacctounts list', currentaccounts);

	// flip for potential alert
	var alreadyhadaccount = false;

	for (var i = 0; i < currentaccounts.length; i++) {
		// loop through currentaccounts, break if found.
		if (currentaccounts[i]['name'] == e) {
			//found account to delete, remove it now.

			currentaccounts.splice(i, 1);


			break;
		}
	}

	//console.log('remove account currentaccounts after splice');

	Ti.App.Properties.setObject('accounts', currentaccounts);

	var currentaccount = Ti.App.Properties.getString('currentaccount');

	if (currentaccount == e) {

		// check if currentaccount happens to be this account, if so pick next available account as new account.
		if (currentaccounts.length > 0) {

			currentaccount = currentaccounts[0]['name'];

		} else {

			currentaccount = '';
			//hideOverlayPickAccount();
		}

		//console.log('current account L1493',currentaccount);

		Ti.App.Properties.setString('currentaccount', currentaccount);



		// if none avail.... unset currentaccount.
	}

	fillAccountsList();

	alert(String.format(L('removed_s'), e));
}

function handleAddAccountTF(e){
	$.textfield_addaccount.blur();
	handleAddAccount($.textfield_addaccount.value.trim().toLowerCase());
}


helpers_eventdispatcher.on('addaccount',function(e){
	//'account': $.textfield_which_account.value.trim()
	handleAddAccount(e.account);
});

function handleAddAccount(acct) {



	if (acct.length > 0) {
		helpers.steemAPIcall(
			"get_accounts", [
				[acct]
			],
			function(success) {
				//console.log(success);
				if (success.result.length == 0) {
					alert(String.format(L('alert_account_not_found'), acct));
					$.textfield_addaccount.value = ('');
				} else {
					var foundname = success.result[0].name.toLowerCase();
					//console.log('name', foundname);

					var currentaccounts = Ti.App.Properties.getObject('accounts');
					//console.log('currenacctount', currentaccounts);
					//console.log(typeof currentaccounts);

					// flip for potential alert
					var alreadyhadaccount = false;

					var accounthasprivatekeyinwallet_posting = false;
					var accounthasprivatekeyinwallet_active = false;
					var accounthasprivatekeyinwallet_memo = false;

					if (currentaccounts.length > 0) {
						// we already have accounts, lets see if the account we are trying to add is already here
						for (var i = 0; i < currentaccounts.length; i++) {
							// loop through currentaccounts, break if found.
							if (currentaccounts[i]['name'] == foundname) {

								//accounthasprivatekeyinwallet = currentaccounts[i]['privatekey'];

								accounthasprivatekeyinwallet_posting = currentaccounts[i]['privatekey_posting'];
								accounthasprivatekeyinwallet_active = currentaccounts[i]['privatekey_active'];
								accounthasprivatekeyinwallet_memo = currentaccounts[i]['privatekey_memo'];

								//already found account. pop it (we re-add / update it below)
								currentaccounts.splice(i, 1);

								alreadyhadaccount = true;
								break;
							}
						}
					}

					currentaccounts.push(helpers.formatUserBalanceObject(success.result[0]));

					$.textfield_addaccount.value = ('');



					Ti.App.Properties.setObject('accounts', currentaccounts);
					Ti.App.Properties.setString('currentaccount', foundname);

					setCurrentAccount();
					updateAccount(foundname);

					$.textfield_addaccount.blur();
					hideOverlayAddAccount();

					helpers_eventdispatcher.trigger('refreshaccountlist');

					// if (alreadyhadaccount) {
					//
					// 	alert(String.format(L('alert_account_already_added'), foundname));
					//
					// }

				}

			},
			function(error) {
				console.log(error);
			}
		);
	} else {
		//alert(L('alert_add_account_name'));
	}
}

// all overlay functions had to be named as the index.xml view doesnt accept parameters in the function calls.
function hideOverlayAddAccount() {
	$.textfield_addaccount.blur();
	hideOverlay($.overlay_addaccount);
}

function showOverlayAddAccount() {
	showOverlay($.overlay_addaccount);
}

function hideOverlayPickAccount() {
	hideOverlay($.overlay_pickaccount);
}

function hidePickshowAddAccount() {
	hideOverlayPickAccount();
	setTimeout(showOverlayAddAccount, 400);
}

function fillAccountsList() {


	var currentaccounts = Ti.App.Properties.getObject('accounts');

	console.log("fillAccountsList called");
	console.log(currentaccounts);
	console.log("currentaccounts.length = "+ currentaccounts.length);

	// consider updating current accounts when picking.

	// populate list table.
	var listdata = [];

	if(currentaccounts.length == 0) {
		// show welcome view, as we don't have any accounts added yet.
		listdata.push({
			template: 'welcome',
			but_create_account: {
				title: L('create_account') 
			},
			but_add_account: {
				title: L('add_account')
			},
			label_intro_text: {
				text: L('intro_text')
			}
		});
	} else {


		for (var i = 0; i < currentaccounts.length; i++) {

			//var row = Ti.UI.createTableViewRow({"title": shd.get('title')});
			listdata.push({
				template: 'accountli',
				labeltitle: {
					text: currentaccounts[i].name,
				},
				delbut: {
					accountname: currentaccounts[i].name,
				},
				labelbalance: {
					text: helpers.formatToLocale(parseFloat(currentaccounts[i].balance), 3) + ' STEEM | ' + helpers.formatToLocale(parseFloat(currentaccounts[i].sbd_balance), 3) + ' SBD'
					//text: currentaccounts[i].steem + ' | ' + currentaccounts[i].sbd
				},
				accountdata: currentaccounts[i],
			});
		}

	}

	$.overlay_pickaccount_listview.sections[0].items = (listdata);
	//$.overlay_pickaccount_listview.scrollToItem(0);

}

function createAccount() {
	var win_createaccount = Alloy.createController('/create_account').getView();
	Alloy.Globals.tabGroup.activeTab.open(win_createaccount);
}

var overlayAnimation = Titanium.UI.createAnimation();

function showOverlay(overlay) {

	console.log('called show overlay');
  console.log(overlay);
	console.log('getTop '+ overlay.getTop());
	console.log('alloy globals getheight '+ Alloy.Globals.dimensions.DP_platformHeight);

	if (overlay.top == Alloy.Globals.dimensions.DP_platformHeight) {
		// overlay is currently out of viewport, lets show it.
		overlayAnimation = {
			top: Alloy.Globals.dimensions.overlay_container_top,
			duration: 150,
		};

		console.log('should call animation showOverlayBG');

    overlay.animate(overlayAnimation, function() {
      overlay.top = Alloy.Globals.dimensions.overlay_container_top;
    });

	} else {
		console.log('apparently overlay is in viewport, why should we show it?');
		// overlay is in viewport, why should we bother showing it?
	}
}

function hideOverlay(overlay) {
	if (overlay.top == Alloy.Globals.dimensions.overlay_container_top) {
		// overlay is currently in viewport, lets hide it.
		overlayAnimation = {
			top: Alloy.Globals.dimensions.DP_platformHeight,
			duration: 150,
		}

    fillAccountsList();
    overlay.animate(overlayAnimation, function() {
			overlay.top = Alloy.Globals.dimensions.DP_platformHeight;
		});

	} else {
		// overlay is in viewport, why should we bother showing it?
	}
	fillAccountsList();
}


fillAccountsList();
