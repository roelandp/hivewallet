// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;
var helpers_eventdispatcher = require('/helpers_eventdispatcher');
var helpers = require('/functions');

var wallet_helpers = require('/wallet_helpers');

var dsteem = require('/hive-tx-min');
var buffer = require('/buffer');
var jsHash = require('/SlowAES/jsHash');

// steemecc needed for signBuffer
var steemecc = require('/steemecc');

//console.log("now including steemmemo");
//steemmemo needed for decoding/encoding memo's
var steemmemo = require('/steemmemo');

var steemkeychain_helpers = require('/steemkeychain_helpers');

// global holder for callback function for current steemkeychain call.
var sk_confirm_cb = false;
var sk_cancel_cb = false;

var current_query_object = {};

// tracking current origin for android injection purposes;
var android_current_origin;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

//var steemjs = require('/steemjs');

//var helpers = new fns();
Alloy.Globals.helpers = helpers;
var XCallbackURL = require('/xcallbackurl');

$.tab2.addEventListener('postlayout', function(e){

	if(OS_IOS) {
		$.topspacer.height = $.tab2.safeAreaPadding.top;
		Alloy.Globals.topspacer = $.tab2.safeAreaPadding.top;
		$.confirmDialog.height = $.dappview.toImage().height;
		$.confirm_dialog_bottom_spacer.height = $.tab2.safeAreaPadding.top;
	} else {
		$.confirmDialog.height = Alloy.Globals.measurement.pxToDP($.dappview.toImage().height);
	}

	console.log("confirmDialog.height = "+ $.confirmDialog.height);
	hideOverlay($.confirmDialog);
});

function selectFulltext() {
	$.browser_url.setSelection(0, $.browser_url.value.length);
}
var remotecallbackuri = "hivekey"+helpers.generateBase58Password(10).toLowerCase();

// see the unminified version of this code in /lib/steemkeychainreference/steem_keychain.js
var inlinecode_ios = 'var hive_keychain={current_id:1,requests:{},handshake_callback:null,requestHandshake:function(e){hive_keychain.handshake_callback=e,hive_keychain.dispatchCustomEvent("swHandshake","")},requestVerifyKey:function(e,t,s,n){var a={type:"decode",username:e,message:t,method:s};hive_keychain.dispatchCustomEvent("swRequest",a,n)},requestSignBuffer:function(e,t,s,n){var a={type:"signBuffer",username:e,message:t,method:s};hive_keychain.dispatchCustomEvent("swRequest",a,n)},requestAddAccountAuthority:function(e,t,s,n,a){var i={type:"addAccountAuthority",username:e,authorizedUsername:t,role:s,weight:n,method:"Active"};hive_keychain.dispatchCustomEvent("swRequest",i,a)},requestRemoveAccountAuthority:function(e,t,s,n){var a={type:"removeAccountAuthority",username:e,authorizedUsername:t,role:s,method:"Active"};hive_keychain.dispatchCustomEvent("swRequest",a,n)},requestBroadcast:function(e,t,s,n){var a={type:"broadcast",username:e,operations:t,method:s};hive_keychain.dispatchCustomEvent("swRequest",a,n)},requestSignedCall:function(e,t,s,n,a){var i={type:"signedCall",username:e,method:t,params:s,typeWif:n};hive_keychain.dispatchCustomEvent("swRequest",i,a)},requestPost:function(e,t,s,n,a,i,o,r,u){var c={type:"post",username:e,title:t,body:s,parent_permlink:n,parent_author:a,json_metadata:i,permlink:o,comment_options:r};hive_keychain.dispatchCustomEvent("swRequest",c,u)},requestVote:function(e,t,s,n,a){var i={type:"vote",username:e,permlink:t,author:s,weight:n};hive_keychain.dispatchCustomEvent("swRequest",i,a)},requestCustomJson:function(e,t,s,n,a,i){var o={type:"custom",username:e,id:t,method:s,json:n,display_msg:a};hive_keychain.dispatchCustomEvent("swRequest",o,i)},requestTransfer:function(e,t,s,n,a,i,o){var r={type:"transfer",username:e,to:t,amount:s,memo:n,enforce:o||!1,currency:a};hive_keychain.dispatchCustomEvent("swRequest",r,i)},requestSendToken:function(e,t,s,n,a,i){var o={type:"sendToken",username:e,to:t,amount:s,memo:n,currency:a};hive_keychain.dispatchCustomEvent("swRequest",o,i)},requestDelegation:function(e,t,s,n,a){var i={type:"delegation",username:e,delegatee:t,amount:s,unit:n};hive_keychain.dispatchCustomEvent("swRequest",i,a)},requestWitnessVote:function(e,t,s,n){var a={type:"witnessVote",username:e,witness:t,vote:s};hive_keychain.dispatchCustomEvent("swRequest",a,n)},requestPowerUp:function(e,t,s,n){var a={type:"powerUp",username:e,recipient:t,hive:s};hive_keychain.dispatchCustomEvent("swRequest",a,n)},requestPowerDown:function(e,t,s){var n={type:"powerDown",username:e,steem_power:t};hive_keychain.dispatchCustomEvent("swRequest",n,s)},requestCreateProposal:function(e,t,s,n,a,i,o,r,u){var c={type:"createProposal",username:e,receiver:t,subject:s,permlink:n,start:i,end:o,daily_pay:a,extensions:r};hive_keychain.dispatchCustomEvent("swRequest",c,u)},requestRemoveProposal:function(e,t,s,n){var a={type:"removeProposal",username:e,proposal_ids:t,extensions:s};hive_keychain.dispatchCustomEvent("swRequest",a,n)},requestUpdateProposalVote:function(e,t,s,n,a){var i={type:"updateProposalVote",username:e,proposal_ids:t,approve:s,extensions:n};hive_keychain.dispatchCustomEvent("swRequest",i,a)},dispatchCustomEvent:function(e,t,s){hive_keychain.requests[hive_keychain.current_id]=s;var n={name:e,data:t,detail:{request_id:hive_keychain.current_id}};hive_keychain.current_id++,document.location="'+remotecallbackuri+'://?params="+encodeURIComponent(JSON.stringify(n))},postMessage:function(e){console.log("received PostMessage"),console.log(e);var t=JSON.parse(decodeURIComponent(e));if(t.data.type&&"hive_keychain_response"==t.data.type){var s=t.data.response;console.log("response object = "),console.log(s),s&&s.request_id&&(console.log("will now try to execute hive_keychain.requests["+s.request_id+"]"),hive_keychain.requests[s.request_id]?(hive_keychain.requests[s.request_id](s),delete hive_keychain.requests[s.request_id]):console.log("no such request"))}else t.data.type&&"hive_keychain_handshake"==t.data.type&&hive_keychain.handshake_callback&&hive_keychain.handshake_callback()}};';

var inlinecode_android = 'var hive_keychain={current_id:1,requests:{},handshake_callback:null,requestHandshake:function(e){hive_keychain.handshake_callback=e,hive_keychain.dispatchCustomEvent("swHandshake","")},requestVerifyKey:function(e,t,s,n){var a={type:"decode",username:e,message:t,method:s};hive_keychain.dispatchCustomEvent("swRequest",a,n)},requestSignBuffer:function(e,t,s,n){var a={type:"signBuffer",username:e,message:t,method:s};hive_keychain.dispatchCustomEvent("swRequest",a,n)},requestAddAccountAuthority:function(e,t,s,n,a){var i={type:"addAccountAuthority",username:e,authorizedUsername:t,role:s,weight:n,method:"Active"};hive_keychain.dispatchCustomEvent("swRequest",i,a)},requestRemoveAccountAuthority:function(e,t,s,n){var a={type:"removeAccountAuthority",username:e,authorizedUsername:t,role:s,method:"Active"};hive_keychain.dispatchCustomEvent("swRequest",a,n)},requestBroadcast:function(e,t,s,n){var a={type:"broadcast",username:e,operations:t,method:s};hive_keychain.dispatchCustomEvent("swRequest",a,n)},requestSignedCall:function(e,t,s,n,a){var i={type:"signedCall",username:e,method:t,params:s,typeWif:n};hive_keychain.dispatchCustomEvent("swRequest",i,a)},requestPost:function(e,t,s,n,a,i,o,r,u){var c={type:"post",username:e,title:t,body:s,parent_permlink:n,parent_author:a,json_metadata:i,permlink:o,comment_options:r};hive_keychain.dispatchCustomEvent("swRequest",c,u)},requestVote:function(e,t,s,n,a){var i={type:"vote",username:e,permlink:t,author:s,weight:n};hive_keychain.dispatchCustomEvent("swRequest",i,a)},requestCustomJson:function(e,t,s,n,a,i){var o={type:"custom",username:e,id:t,method:s,json:n,display_msg:a};hive_keychain.dispatchCustomEvent("swRequest",o,i)},requestTransfer:function(e,t,s,n,a,i,o){var r={type:"transfer",username:e,to:t,amount:s,memo:n,enforce:o||!1,currency:a};hive_keychain.dispatchCustomEvent("swRequest",r,i)},requestSendToken:function(e,t,s,n,a,i){var o={type:"sendToken",username:e,to:t,amount:s,memo:n,currency:a};hive_keychain.dispatchCustomEvent("swRequest",o,i)},requestDelegation:function(e,t,s,n,a){var i={type:"delegation",username:e,delegatee:t,amount:s,unit:n};hive_keychain.dispatchCustomEvent("swRequest",i,a)},requestWitnessVote:function(e,t,s,n){var a={type:"witnessVote",username:e,witness:t,vote:s};hive_keychain.dispatchCustomEvent("swRequest",a,n)},requestPowerUp:function(e,t,s,n){var a={type:"powerUp",username:e,recipient:t,hive:s};hive_keychain.dispatchCustomEvent("swRequest",a,n)},requestPowerDown:function(e,t,s){var n={type:"powerDown",username:e,steem_power:t};hive_keychain.dispatchCustomEvent("swRequest",n,s)},requestCreateProposal:function(e,t,s,n,a,i,o,r,u){var c={type:"createProposal",username:e,receiver:t,subject:s,permlink:n,start:i,end:o,daily_pay:a,extensions:r};hive_keychain.dispatchCustomEvent("swRequest",c,u)},requestRemoveProposal:function(e,t,s,n){var a={type:"removeProposal",username:e,proposal_ids:t,extensions:s};hive_keychain.dispatchCustomEvent("swRequest",a,n)},requestUpdateProposalVote:function(e,t,s,n,a){var i={type:"updateProposalVote",username:e,proposal_ids:t,approve:s,extensions:n};hive_keychain.dispatchCustomEvent("swRequest",i,a)},dispatchCustomEvent:function(e,t,s){hive_keychain.requests[hive_keychain.current_id]=s;var n={name:e,data:t,detail:{request_id:hive_keychain.current_id}};hive_keychain.current_id++;var a=new XMLHttpRequest,i=window.location.origin;"/"!=i.slice(-1)&&(i+="/");var o=i+"?xrf='+remotecallbackuri+'&params="+encodeURIComponent(JSON.stringify(n));a.open("HEAD",o),a.send()},postMessage:function(e){console.log("received PostMessage"),console.log(e);var t=JSON.parse(decodeURIComponent(e));if(t.data.type&&"hive_keychain_response"==t.data.type){var s=t.data.response;console.log("response object = "),console.log(s),s&&s.request_id&&(console.log("will now try to execute hive_keychain.requests["+s.request_id+"]"),hive_keychain.requests[s.request_id]?(hive_keychain.requests[s.request_id](s),delete hive_keychain.requests[s.request_id]):console.log("no such request"))}else t.data.type&&"hive_keychain_handshake"==t.data.type&&hive_keychain.handshake_callback&&hive_keychain.handshake_callback()}};';

function postSteemKeyCommand(obj) {
	console.log('trying to post SteemKey Command');
	console.log(obj);
	// replying responses into the webview, we are using stringify here as everything is expected to be strings. This could be limitting if actual buffers are requested.
	if(OS_ANDROID) {
		$.dappview.url = 'javascript:window.hive_keychain.postMessage("'+encodeURIComponent(encodeURIComponent(JSON.stringify(obj)))+'");';
	} else {
		$.dappview.evalJS('window.hive_keychain.postMessage(\''+encodeURIComponent(JSON.stringify(obj))+'\');');
	}
}

var overlayAnimation = Titanium.UI.createAnimation();

function showOverlay(overlay) {

	if(OS_ANDROID) {
		Titanium.UI.Android.hideSoftKeyboard();
	}

	console.log(overlay);
	console.log(overlay.top);
	console.log(Alloy.Globals.dimensions.DP_platformHeight);

	if (overlay.top == Alloy.Globals.dimensions.DP_platformHeight) {
		// overlay is currently out of viewport, lets show it.
		console.log("should show overlay");
		overlayAnimation = {
			top: 0,
			duration: 150,
		};
		overlay.animate(overlayAnimation, function() {
			overlay.top = 0;
		});
	}
}

function hideOverlay(overlay) {
	if (overlay.top == 0) {
		// overlay is currently in viewport, lets hide it.
		overlayAnimation = {
			top: Alloy.Globals.dimensions.DP_platformHeight,
			duration: 150,
		}

		overlay.animate(overlayAnimation, function() {
			overlay.top = Alloy.Globals.dimensions.DP_platformHeight;
			overlay.opacity = 1;
		});
	}
}



function hideConfirmDialog() {
	// hide dialog

	// should fire "user_cancel" - response
	populateErrorResponse({message: "user_cancel", details: "Request was canceled by the user."})
	hideOverlay($.confirmDialog);
}

function pickAccount() {
	// check if "force" is not set to true.
	if(current_query_object['data'].hasOwnProperty('enforce')) {
		if(current_query_object['data']['enforce']) {
			alert(String.format(L('the_requesting_website_enforced_using_account_s'), current_query_object['hostname'], current_query_object['data']['username']));
			return false;

		}
	}

	showOverlayPickAccount();
}

function handlePickAccountClick(e) {
	//console.log(e);
	if (e.source.bindId != 'delbut') {
		var newaccount = $.overlay_pickaccount_listview.sections[0].getItemAt(e.itemIndex).accountdata.name;
		if (Ti.App.Properties.getString('currentaccount') != newaccount) {
			Ti.App.Properties.setString('currentaccount', newaccount);
		}
		current_query_object['data']['username'] = newaccount;
		$.textfield_account.text = current_query_object.data.username;
		$.do_not_prompt_label.text = String.format(L("do_not_prompt_again_for_s"), $.textfield_account.text, current_query_object['hostname']+":"+$.confirmDialogTitle.text);
		populateOperations();
		hideOverlayPickAccount();
	}
}

helpers_eventdispatcher.on('refreshaccountlist',function(e){
	fillAccountsList();
});

function fillAccountsList() {
	var currentaccounts = Ti.App.Properties.getObject('accounts');

	// consider updating current accounts when picking.

	// populate list table.
	var listdata = [];
	for (var i = 0; i < currentaccounts.length; i++) {

		//var row = Ti.UI.createTableViewRow({"title": shd.get('title')});
		listdata.push({
			template: 'accountli',
			labeltitle: {
				text: currentaccounts[i].name,
			},
			// delbut: {
			// 	accountname: currentaccounts[i].name,
			// },
			labelbalance: {
				text: helpers.formatToLocale(parseFloat(currentaccounts[i].balance), 3) + ' HIVE | ' + helpers.formatToLocale(parseFloat(currentaccounts[i].hbd_balance), 3) + ' HBD'
				//text: currentaccounts[i].steem + ' | ' + currentaccounts[i].sbd
			},
			accountdata: currentaccounts[i],
		});
	}

	$.overlay_pickaccount_listview.sections[0].items = (listdata);
	//$.overlay_pickaccount_listview.scrollToItem(0);

}

function showOverlayPickAccount() {

	var currentaccounts = Ti.App.Properties.getObject('accounts');
	// check if we already have more than 0 accounts.
	if (currentaccounts.length > 0) {
		fillAccountsList();

		showOverlay($.overlay_pickaccount);
	} else {
		addPrivateKey();
	}

}

function hideOverlayPickAccount() {
	hideOverlay($.overlay_pickaccount);
}

function addPrivateKey(){
	var win = Alloy.createController('settings_import_keys').getView();
	Alloy.Globals.tabGroup.activeTab.open(win);
}

function makeDialogParametersTxt(params){
	// parser to prettify confirmDialog parameter(s) field.
		var toreturn = "";

			if(params.type != "broadcast") {
				for(var key in params){
					if(key != "type" && key != "username" && key != "enforce" && key != "display_msg" && key != "display_name") {
						switch (key) {
							case "weight":
								if(params.type != "addAccountAuthority") {
									toreturn += key+":\n"+(params[key]/100).toLocaleString(undefined, { minimumFractionDigits: 2,maximumFractionDigits: 2  }) + "%\n\n";
								} else {
									toreturn += key+":\n"+(params[key])+ "\n\n";
								}
							break;

							case "method":
								toreturn += "key:\n"+(params[key])+"\n\n";
							break;

							case "json":
								toreturn += key+":\n"+JSON.stringify(JSON.parse(params[key]),null,3)+"\n\n";
							break;

							default:
								if (typeof params[key] === "string") {
									toreturn += key+":\n"+params[key].substring(0,150) + "\n\n";
								} else if(typeof params[key] === "object") {
									toreturn += key+":\n"+JSON.stringify(params[key],null,3)+ "\n\n";
								} else {
									toreturn += key+":\n"+(params[key])+ "\n\n";
								}
						}

					}

				}
		} else {
			toreturn = "operations:\n"+JSON.stringify((params.operations),null,3);
		}
		return toreturn+"\n\n\n\n";

}

function populateDialog() {
	$.dialogScrollview.scrollTo(0,0);
	$.do_not_prompt_switch.value = false;
	$.sign_broadcast.disabled = false;
	$.confirmDialogTitle.text = steemkeychain_helpers.returnDialogTitle(current_query_object['data']['type']).toLowerCase();
	$.confirmDialogParameters.text = makeDialogParametersTxt(current_query_object['data']);
	$.confirmDialogDescription.text = steemkeychain_helpers.returnDialogExplain(current_query_object['data']['type'], current_query_object['hostname'], current_query_object['data']['method']);

	if(current_query_object.data.hasOwnProperty('username')) {
		if(current_query_object.data.username && current_query_object.data.username.length > 3) {

			$.textfield_account.text = current_query_object.data.username;

			if(current_query_object['data']['username'] == "__signer") {
				current_query_object['data']['username'] = Ti.App.Properties.getString('currentaccount');
				$.textfield_account.text = Ti.App.Properties.getString('currentaccount');
			}
		} else {
			// prefill with default current account
			current_query_object['data']['username'] = Ti.App.Properties.getString('currentaccount');
			$.textfield_account.text = Ti.App.Properties.getString('currentaccount');
		}
	}
	if(current_query_object.data.hasOwnProperty('display_name')) {
		$.confirmDialogTitle.text = current_query_object['data']['display_name'];
	}

	$.do_not_prompt_label.text = String.format(L("do_not_prompt_again_for_s"), $.textfield_account.text, current_query_object['hostname']+":"+$.confirmDialogTitle.text);

	if(current_query_object.data.hasOwnProperty('display_msg')) {
		$.confirmDialogTitle.text = current_query_object['data']['display_msg'].toLowerCase();
	}

}

function doNotPromptToggle() {
	$.do_not_prompt_switch.value = !$.do_not_prompt_switch.value;
}

function populateOperations() {
	// populate the actual operation, based on the current_query_object,
	// should populate the operation parameters and also the correct: data.method (role);


	// also filling hostname here -
	current_query_object['hostname'] = $.dappview.evalJS('window.location.hostname');

	//
	current_query_object['data']['method'] = steemkeychain_helpers.getRequiredWifType(current_query_object['data']);

	//
	current_query_object['responsemessages'] = {
		"ok": "The transaction has been broadcasted successfully.",
		"error": "There was an error broadcasting this transaction, please try again."
	};

	if(current_query_object.data.hasOwnProperty('username')) {
		if(current_query_object.data.username && current_query_object.data.username.length > 3) {
			if(current_query_object['data']['username'] == "__signer") {
				current_query_object['data']['username'] = Ti.App.Properties.getString('currentaccount');
			}
		} else {
			current_query_object['data']['username'] = Ti.App.Properties.getString('currentaccount');
		}
	}


	switch(current_query_object['data']['type']) {

		case 'broadcast':
			//
			current_query_object['operations'] = current_query_object['data']['operations'];

		break;

		case 'custom':
			current_query_object['operations'] = [[
				"custom_json",
				{
					"required_auths": (current_query_object['data']['method'] == "active" ? [current_query_object['data']['username']] : []),
			    "required_posting_auths": (current_query_object['data']['method'] == "posting" ? [current_query_object['data']['username']] : []),
			    "id": current_query_object['data']['id'],
			    "json": current_query_object['data']['json']
				}
			]];
		break;

		case 'addAccountAuthority':

			// get account data
			// needs private key
			// fill new account object - with added authority username (we only allow posting auths ok?)
			// make operation
			if(current_query_object['data']['role'] == "posting") {

				var updated_user_object = {};
				// show loading screen
				Alloy.Globals.loading.show(L('loadingMessage'), false);

				helpers.steemAPIcall(
					"get_accounts", [
						[current_query_object['data']['username']]
					],
					function(success) {
						Alloy.Globals.loading.hide();
						if (success.result.length == 0) {
							alert(String.format(L('alert_account_not_found'), current_query_object['data']['username']));
							//$.textfield_addaccount.value = ('');
							current_query_object['operations'] = [[
							]];
							return false;
						} else {
							updated_user_object = success.result[0];

							// check if by accident the user has already given permission to the account
							var arrayindex = -1;
							var checkAuth = updated_user_object['posting']['account_auths'];

							for (var i = 0,len = checkAuth.length; i<len; i++) {
								if (checkAuth[i][0] == current_query_object['data']['authorizedUsername'].toLowerCase()) {
									 arrayindex = i;
									 alert(current_query_object['data']['authorizedUsername'] + "already has posting permission for " +current_query_object['data']['username']);
									 //break;
									 current_query_object['operations'] = [[
					 					]];
									 return false;
							 	}
						 	}

							// if here, create updated_user_object by adding new account auth to the array.
							updated_user_object['posting']['account_auths'].push([
							    current_query_object['data']['authorizedUsername'],
							    parseInt(current_query_object['data']['weight']),
							]);
							// should be alphabetically sorted.
							updated_user_object['posting']['account_auths'].sort();

							// now finally make the operation ...

							current_query_object['operations'] = [[
								"account_update",
								{
									"account": current_query_object['data']['username'],
							    "posting": updated_user_object.posting,
							    "memo_key": updated_user_object.memo_key,
							    "json_metadata": updated_user_object.json_metadata,
								}
							]];

						}


					},
					function(error) {
						Alloy.Globals.loading.hide();
						alert(error);
						current_query_object['operations'] = [[
						]];
						return false;
					}
				);
			} else {
				// we only allow adding / removing posting auths for security reasons.
				current_query_object['operations'] = [[
				]];
				return false;
			}

		break;

		case 'removeAccountAuthority':

			// get account data
			// needs private key
			// fill new account object - with removed authority user (we only allow removing posting auths ok?)
			// make operation

			if(current_query_object['data']['role'] == "posting") {

				var updated_user_object = {};
				// show loading screen
				Alloy.Globals.loading.show(L('loadingMessage'), false);

				helpers.steemAPIcall(
					"get_accounts", [
						[current_query_object['data']['username']]
					],
					function(success) {
						Alloy.Globals.loading.hide();
						if (success.result.length == 0) {

							alert(String.format(L('alert_account_not_found'), current_query_object['data']['username']));
							current_query_object['operations'] = [[
							]];
							//$.textfield_addaccount.value = ('');
							return false;
						} else {
							updated_user_object = success.result[0];

							// check if by accident the user has already given permission to the account
							var arrayindex = -1;
							var checkAuth = updated_user_object['posting']['account_auths'];

							var accountfoundinauths = false;
							for (var i = 0,len = checkAuth.length; i<len; i++) {
								if (checkAuth[i][0] == current_query_object['data']['authorizedUsername'].toLowerCase()) {
									 arrayindex = i;
									 accountfoundinauths = true;
									 break;

								}
							}

							if(!accountfoundinauths) {
								alert(current_query_object['data']['authorizedUsername'] + " does not have posting permission for " +current_query_object['data']['username']+ ", so can't remove anyhow :)");
								current_query_object['operations'] = [[
								 ]];
								return false;
							}

							// if here, create updated_user_object by removing account auth from the array.
							updated_user_object['posting']['account_auths'].splice(arrayindex, 1);

							// now finally make the operation ...

							current_query_object['operations'] = [[
								"account_update",
								{
									"account": current_query_object['data']['username'],
									"posting": updated_user_object.posting,
									"memo_key": updated_user_object.memo_key,
									"json_metadata": updated_user_object.json_metadata,
								}
							]];

						}

					},
					function(error) {
						Alloy.Globals.loading.hide();
						alert(error);
						current_query_object['operations'] = [[
						]];
						return false;
					}
				);
			} else {
				// we only allow adding / removing posting auths for security reasons.
				current_query_object['operations'] = [[
				]];
				return false;
			}

		break;

		case 'signedCall':
			current_query_object['operations'] = [[
			]];
		break;

		case 'post':
			current_query_object['operations'] = [[
				"comment",
				{
					parent_author: current_query_object['data']['parent_author'],
					parent_permlink: current_query_object['data']['parent_permlink'],
					author: current_query_object['data']['username'],
					permlink: current_query_object['data']['permlink'],
					title: current_query_object['data']['title'],
					body: current_query_object['data']['body'],
					json_metadata: JSON.stringify(current_query_object['data']['json_metadata'])
				}
			]];
		break;

		case 'vote':
			current_query_object['operations'] = [[
	       "vote",
	       {
	          voter: current_query_object['data']['username'],
	          author: current_query_object['data']['author'],
	          permlink: current_query_object['data']['permlink'],
	          weight: parseInt(current_query_object['data']['weight'])
	       }
	    ]];
		break;

		case 'transfer':

		// hack for remapping hive/hbd to steem/sbd (for_now)...
		var sbdorsteemmapped = {
			"hive": "steem",
			"hbd": "sbd",
		}

		console.log("TRANSFER DETECTED");

			current_query_object['operations'] = [[
				"transfer",
				{
					from: current_query_object['data']['username'],
					to: current_query_object['data']['to'].toLowerCase(),
					amount: current_query_object['data']['amount'].toLocaleString(undefined, { minimumFractionDigits: 3,maximumFractionDigits: 3  }) + ' ' + sbdorsteemmapped[(current_query_object['data']['currency']).toLowerCase()].toUpperCase(),
					memo: current_query_object['data']['memo'],
				}
			]];
		break;

		case 'delegation':

			var vests;
			if(current_query_object['data']['unit'] == "SP" || current_query_object['data']['unit'] == "HP") {
				// should calc vests here from global dynamic properties.
				// current_query_object['data']['amount'];
				Alloy.Globals.loading.show(L('loadingMessage'), false);
				helpers.steemAPIcall(
					"get_dynamic_global_properties", [],
					function(response) {
						console.log('get_dynamic_global_properties');
						console.log(response);
						Alloy.Globals.loading.hide();
						var totalSteem = parseFloat(response.result.total_vesting_fund_steem.split(' ')[0]);
            var totalVests = parseFloat(response.result.total_vesting_shares.split(' ')[0]);
            vests = parseFloat(current_query_object['data']['amount']) * totalVests / totalSteem;
            vests = vests.toFixed(6);
            vests = vests.toString() + ' VESTS';

						current_query_object['operations'] = [[
							"delegate_vesting_shares",
							{
								delegatee: current_query_object['data']['delegatee'],
								delegator: current_query_object['data']['username'],
								vesting_shares: vests,
							}
						]];

					},
					function(err) {
						Alloy.Globals.loading.hide();
					});

			} else {
				vests = current_query_object['data']['amount'] + " VESTS";

				current_query_object['operations'] = [[
					"delegate_vesting_shares",
					{
						delegatee: current_query_object['data']['delegatee'],
						delegator: current_query_object['data']['username'],
						vesting_shares: vests,
					}
				]];
			}


		break;

		case 'witnessVote':
			current_query_object['operations'] = [[
				"account_witness_vote", {
					account: current_query_object['data']['username'],
					approve: current_query_object['data']['vote'],
					witness: current_query_object['data']['witness']
				}
			]];
		break;

		case "sendToken":
			// ssc custom token send custom json
			var tokenjson  = {
        "contractName": "tokens",
        "contractAction": "transfer",
        "contractPayload": {
          "symbol": current_query_object['data']['currency'],
          "to": current_query_object['data']['to'],
          "quantity": parseFloat(current_query_object['data']['amount']),
          "memo": current_query_object['data']['memo'],
        }
    	};

			current_query_object['operations'] = [[
				"custom_json",
				{
					"required_auths": [current_query_object['data']['username']],
			    "required_posting_auths": [],
			    "id": "ssc-mainnet1",
			    "json": JSON.stringify(tokenjson)
				}
			]];
		break;

		case "powerUp":
			current_query_object['operations'] = [[
				"transfer_to_vesting",
				{
					from: current_query_object['data']['username'],
					to: current_query_object['data']['recipient'],
					amount: parseFloat(current_query_object['data']['hive']),
				}
			]];
		break;

		case "powerDown":

			Alloy.Globals.loading.show(L('loadingMessage'), false);
			helpers.steemAPIcall(
				"get_dynamic_global_properties", [],
				function(response) {
					console.log('get_dynamic_global_properties');
					console.log(response);
					Alloy.Globals.loading.hide();
					var totalSteem = parseFloat(response.result.total_vesting_fund_steem.split(' ')[0]);
					var totalVests = parseFloat(response.result.total_vesting_shares.split(' ')[0]);
					vests = parseFloat(current_query_object['data']['steem_power']) * totalVests / totalSteem;
					vests = vests.toFixed(6);
					vests = vests.toString() + ' VESTS';


					current_query_object['operations'] = [[
						"withdraw_vesting",
						{
							account: current_query_object['data']['username'],
							vesting_shares: vests
						}
					]];

				},
				function(err) {
					Alloy.Globals.loading.hide();
				});

		break;

		case "createClaimedAccount":
		return false;
		break;


	}

	return true;

}

function populateOkResponse(result) {
	//populate and post ok response for SteemKeychain client
	hideOverlay($.confirmDialog);
	postSteemKeyCommand(
		{
			data:
			{
					type: "hive_keychain_response",
					response: {
						data: current_query_object['data'],
						error: null,
						message: current_query_object['responsemessages']['ok'],
						request_id: current_query_object['detail']['request_id'],
						result: result,
						success: true
					}
			}
		}
	);
}

function populateErrorResponse(error) {
	//populate and post error response for SteemKeychain client
	postSteemKeyCommand(
		{
			data:
			{
					type: "hive_keychain_response",
					response: {
						data: current_query_object['data'],
						error: error.message,
						message: current_query_object['responsemessages']['error'],
						request_id: current_query_object['detail']['request_id'],
						result: error,
						success: false,
					}
			}
		}
	);

	if(error.hasOwnProperty('details')) {
		alert(error['details']);
	}
}

function addToDoNotPromptList(){
	var dnpl = Titanium.App.Properties.getObject('donotpromptlist');

	// check if account in donotpromptlist
	// if not, create account, create client, create empty array, add txtype to array.
	// if yes, check if client in account list
		// if not, create client, create empty array, add txtype to array.
	// if yes check if txtype in array
	// if not, add to array

	var user = current_query_object['data']['username'].toLowerCase();
	var client = current_query_object['hostname'].toLowerCase();
	var txtype = current_query_object['data']['type'].toLowerCase();

	if(!dnpl.hasOwnProperty(user)) {
		dnpl[user] = {};
	}

	if(!dnpl[user].hasOwnProperty(client)) {
		dnpl[user][client] = [];
	}

	if(dnpl[user][client].indexOf(txtype) < 0) {
		dnpl[user][client].push(txtype);
	}

	console.log(dnpl);

	Titanium.App.Properties.setObject('donotpromptlist',dnpl);

}

function unlockAndSign(){


	$.sign_broadcast.disabled = true;
	// called when user OK's dialog (or had given previously an OK for this action);

	// should unlock wallet here,
	// lookup correct key
	// inside callback should create the correct operation and sign with given key.
	// then sign and broadcast the operation

	// then callback the result to the client-dapp postSteemKeyCommand(); using: populateOkResponse or populateErrorResponse
	//populateOperations();
	if(current_query_object['data']['type'] == "signBuffer") {

		current_query_object['responsemessages'] = {
			"ok": "Message signed succesfully",
			"error": "Could not sign in"
		};

		// signbuffer gets a special "local" function as no chain broadcast is involved.
		wallet_helpers.scanWalletForKey(current_query_object['data']['username'],
			function keyfound(keypair) {
				var buf = (current_query_object['data']['message']);
				console.log("message to sign", buf);

				try {
					var o = JSON.parse(buf, function (k, v) {
						if (v !== null && _typeof(v) === 'object' && 'type' in v && v.type === 'Buffer' && 'data' in v && Array.isArray(v.data)) {
							return new buffer.Buffer(v.data);
						}

						return v;
					});

					if (buffer.isBuffer(o)) {
						buf = o;
					}
				} catch (e) {

				}

				var result = steemecc.Signature.signBuffer(buf,keypair['private']).toHex();
				//var signature = steemjsalt.ecc.Signature.signBuffer(buf,keypair['private']).toHex();

				console.log("signature result");
				console.log(result);
				populateOkResponse(result);

				// should return this signature...
			},
			function keylookuperr(err) {
				console.log("should handle error here");
				console.log(err);
				populateErrorResponse({message: "Error", details: err});
				$.sign_broadcast.disabled = false;
			},
			current_query_object['data']['method']
		);



	} else if (current_query_object['data']['type'] == "decode") {

		current_query_object['responsemessages'] = {
			"ok": "Memo decoded succesfully.",
			"error": "Could not verify key."
		};

		wallet_helpers.scanWalletForKey(current_query_object['data']['username'],
			function keyfound(keypair) {

				// var result = steemjsalt.memo.decode(keypair['private'], current_query_object['data']['message']);
				var result = steemmemo.decode(keypair['private'], current_query_object['data']['message']);
				populateOkResponse(result);

			},
			function keylookuperr(err) {
				console.log("should handle error here");
				console.log(err);
				populateErrorResponse({message: "Error", details: err});

			},
			current_query_object['data']['method']
		);

	} else if (current_query_object['data']['type'] == "encode") {

		wallet_helpers.scanWalletForKey(current_query_object['data']['username'],
			function keyfound(keypair) {
				//@TODO write encode here too.
				$.sign_broadcast.disabled = false;
			},
			function keylookuperr(err) {
				console.log("should handle error here");
				console.log(err);
				$.sign_broadcast.disabled = false;
			},
			current_query_object['data']['method']
		);

	} else {
		hideOverlay($.confirmDialog);

		// overwrite "amounts"
		// workaround: loop through each operation and check if has key "amount", if amount, find/replace HIVE/HBD for STEEM/SBD for now ___
		var ops_holder = [];

		for(var i = 0; i < current_query_object['operations'].length; i++) {
			var replaceoperation = current_query_object['operations'][i];
			if(replaceoperation[1].hasOwnProperty('amount')) {
				try {
					if(typeof replaceoperation[1]['amount'] === "string") {
						console.log("replacing, because its a string:---> " + replaceoperation[1]['amount']);
						replaceoperation[1]['amount'] = replaceoperation[1]['amount'].replace(" HBD"," SBD").replace(" HIVE"," STEEM").replace(" HP", " SP");
					}
				} catch(replacerr) {
					console.log(replacerr);
				}
			}
			ops_holder.push(replaceoperation);
		}

		current_query_object['operations'] = ops_holder;

		// end workaround;

		wallet_helpers.signAndBroadcastOperation(
			current_query_object['data']['username'],
			current_query_object['data']['method'],
			current_query_object['operations'],
			function ok(res){
				console.log("all seemed ok!");
				console.log("should populate steemkeychain response here");
				if($.do_not_prompt_switch.value) {
					//
					addToDoNotPromptList();
				}
				//console.log(res);
				$.sign_broadcast.disabled = false;
				populateOkResponse(res);
			},
			function error(err){
				console.log("somehow error with sign & broadcast operation call... meh... ");
				console.log(err);
				$.sign_broadcast.disabled = false;
				var errorobject = {message: "Error"};
				if(err.hasOwnProperty('message')) {
					errorobject['details'] = err.message;
				}
				populateErrorResponse(errorobject);
			}
		);
	}


}

function preCheckHandleSwRequest(queryobject) {

	var requesteduser = Ti.App.Properties.getString('currentaccount');

	if(queryobject.data.hasOwnProperty('username')) {
		if(queryobject.data.username && queryobject.data.username.length > 3 && queryobject.data.username != "__signer") {
			requesteduser = queryobject.data.username;
		}
	}

	if (!Ti.App.Properties.getBool('walletSetup')) {
		//showOverlayCreateWallet();
		// creating wallet via new wallet file.
		var win = Alloy.createController('settings_import_keys', {ipk_account: requesteduser}).getView();
		Alloy.Globals.tabGroup.activeTab.open(win);
	} else {

		var role = steemkeychain_helpers.getRequiredWifType(queryobject['data']);

		wallet_helpers.scanUserObjectForKey(
			requesteduser,
			role,
			function() {
				handleSwRequest(queryobject);
			},
			function() {
				var win = Alloy.createController('settings_import_keys',{ipk_account: requesteduser}).getView();
				Alloy.Globals.tabGroup.activeTab.open(win);
			}
		);
	}
}


function handleSwRequest(queryobject) {

	// receiving a request...
	// populating the request window
	// populating the operation
	// ok / deny request
	// unlock wallet
	// sign request
	//
	// return result to webview

	if(queryobject.hasOwnProperty('data')) {
		if(queryobject['data'].hasOwnProperty('type')) {

			// map the current query object to a global accessible variable.
			current_query_object = queryobject;
			var operationresult = populateOperations();

			if(!operationresult) {
				alert(queryobject['data']['type'] + ' is not implemented');
				return false;
			}
			populateDialog();


			// late time check for ti-identity availability, initialization.
			if (Ti.App.Properties.getBool('usesIdentity')) {
			  if(!Alloy.Globals.tidentity_initialized) {
			    wallet_helpers.initTiIdentity();
			  }
			}


			// check if in dnpl list

			var dnpl = Titanium.App.Properties.getObject('donotpromptlist');


			// check if account in donotpromptlist
			// if not, create account, create client, create empty array, add txtype to array.
			// if yes, check if client in account list
				// if not, create client, create empty array, add txtype to array.
			// if yes check if txtype in array
			// if not, add to array

			var user = current_query_object['data']['username'].toLowerCase();
			var client = current_query_object['hostname'].toLowerCase();
			var txtype = current_query_object['data']['type'].toLowerCase();

			if(dnpl.hasOwnProperty(user)) {
				if(dnpl[user].hasOwnProperty(client)) {
					if(dnpl[user][client].indexOf(txtype) >= 0) {
						// should not show overlay, because we have a hit in the do not prompt list.
						unlockAndSign();
						return false;
					}
				}
			}

			showOverlay($.confirmDialog);

		}
	}
}

function handleSteemKeyCommand(_url) {
	var parsedcommand = XCallbackURL.parse(_url);
	if(parsedcommand.parsedURI.queryKey.hasOwnProperty('params')) {
		// params contains uri encoded version of the steemkeychain_request, which are also JSON.stringified.

		console.log("raw url");
		console.log(parsedcommand.parsedURI.queryKey.params);
		console.log("raw url decoded");
		console.log(decodeURIComponent(parsedcommand.parsedURI.queryKey.params));

		var queryobject = JSON.parse(decodeURIComponent(parsedcommand.parsedURI.queryKey.params));
		console.log(queryobject);

		if(queryobject['name'] == "swHandshake") {
			// ok received handshake request, simply return a response shaking back!
			postSteemKeyCommand({data: {type: "hive_keychain_handshake"}});
		} else if(queryobject['name'] == "swRequest") {
			preCheckHandleSwRequest(queryobject);
		} else {
			alert("Unknown command "+queryobject['name']);
		}
	}
}

// eventlistener for IOS to check for SteemKeychain calls
if(OS_IOS) {
	$.dappview.addEventListener('beforeload', function(e) {
		console.log('beforeload triggered');
		console.log(e.url);
		if(e.url.startsWith(remotecallbackuri)) {
			console.log("yes beforeload got a hit!");
			$.dappview.stopLoading();
			handleSteemKeyCommand(e.url);
		}
	});
}

// eventlistener for Android to check for SteemKeychain calls
if(OS_ANDROID) {
	$.dappview.addEventListener('onLoadResource', function(e) {

		console.log(e.url);

		var lookfor= android_current_origin+"?xrf="+remotecallbackuri;
		console.log('looking for ---> '+ lookfor);

		if(e.url.startsWith(lookfor)) {
			console.log("yes onloadResource got a hit!");
			$.dappview.stopLoading();
			handleSteemKeyCommand(e.url);
		}

	});

	$.dappview.addEventListener('blacklisturl', function(e) {
		console.log("BLACKLISTURL triggered");
		console.log(e.url);

		if(e.url.startsWith("https://steemkeychain.steemwallet.app/android/parameterforwarder.html?xrf="+remotecallbackuri)) {
			console.log("yes BLACKLISTURL got a hit!");
			$.dappview.stopLoading();
			handleSteemKeyCommand(e.url);
		}

	});
}

$.dappview.addEventListener('error', function(e) {
	console.log('error triggered');
	console.log(e);

	$.progressbar.width = 0;
	$.progressbar.opacity = 0;

	if(e.hasOwnProperty('error')) {
		if(e.error != "unsupported URL") {
			alert($.browser_url.value +"\n\n" + e.error);
		}
	}

});

$.dappview.addEventListener('progress', function(p){
	console.log('progress');
	console.log(p.value);
	$.progressbar.opacity = 1;
	$.progressbar.width = p.value * Alloy.Globals.dimensions.DP_platformWidth;
});


// after webview loaded, the steemkeychain should be injected.
$.dappview.addEventListener('load', function(e){


	$.browser_url.value = e.url;



	if(OS_IOS) {
		$.browser_url.value = $.dappview.evalJS('window.location.href');
	}

	if(OS_ANDROID) {
		// android_current_origin = $.dappview.evalJS('window.location.origin');
		// console.log('android current origin ====> '+android_current_origin);
	}

	$.progressbar.width = Alloy.Globals.dimensions.DP_platformWidth;
	$.progressbar.opacity = 0;

	setTimeout(function() {
		console.log("\n\n******* injecting Keychain for Hive ******** \n\n");
		console.log("e.url  ===> "+ e.url);
		console.log("window.location.origin  ===> "+ $.dappview.evalJS('window.location.origin'));
		console.log("window.location.href  ===> "+ $.dappview.evalJS('window.location.href'));

		if(OS_ANDROID) {
			$.dappview.url = 'javascript:var scriptTag = document.createElement("script"); scriptTag.type = \'text/javascript\'; var inlineScript = document.createTextNode(\''+inlinecode_android+'\'); scriptTag.appendChild(inlineScript); var swcontainer =  document.getElementsByTagName(\'script\')[0]; swcontainer.parentNode.insertBefore(scriptTag, swcontainer);';

			android_current_origin = $.dappview.evalJS('window.location.origin');
			var locationhref = $.dappview.evalJS('window.location.href');

			if(locationhref) {
				$.browser_url.value = locationhref;
			}


			if(!android_current_origin) {
				var location = $.browser_url.value;
				var matches = location.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
				var domain = matches && matches[1];
				android_current_origin = "https://"+domain;
			} else {
				android_current_origin = android_current_origin;
			}

			// android_current_origin should end with /
			if(!(android_current_origin.slice(-1) == "/")) {
				android_current_origin = android_current_origin + "/";
			}

		console.log("set android_current_origin to ---> "+android_current_origin);
		} else {
			$.dappview.evalJS('var scriptTag = document.createElement("script"); scriptTag.type = \'text/javascript\'; var inlineScript = document.createTextNode(\''+inlinecode_ios+'\'); scriptTag.appendChild(inlineScript); var swcontainer =  document.getElementsByTagName(\'script\')[0]; swcontainer.parentNode.insertBefore(scriptTag, swcontainer);');
		}
		$.progressbar.opacity = 0;
	},700);

});

function goHome() {
	$.progressbar.width = 0;
	$.progressbar.opacity = 1;
	$.dappview.url = Alloy.Globals.homepage;
}
function goPrev() {
	if($.dappview.canGoBack()) {
		$.progressbar.width = 0;
		$.progressbar.opacity = 1;
		$.dappview.goBack();
	} else {
		alert("No more pages in history");
	}
}

function goNext() {
	if($.dappview.canGoForward()){
		$.progressbar.width = 0;
		$.progressbar.opacity = 1;
		$.dappview.goForward();
	} else {
		goPage();
	}
}
function goPage(){
	$.progressbar.width = 0;
	$.progressbar.opacity = 1;
	var pagetogo = $.browser_url.value.toLowerCase();

	if(pagetogo.startsWith('https://')) {
		$.dappview.url = pagetogo;
	} else {
		if(pagetogo.startsWith('http://')) {
			$.dappview.url = pagetogo.replace("http://","https://");
		} else {
			$.dappview.url = "https://"+pagetogo;
		}
	}
}
$.browser_url.addEventListener('return', goPage);
