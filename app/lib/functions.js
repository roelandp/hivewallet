
var SeedRandom = require('/seedrandom');
var apicounter = 1;
var functions = {



	alerter: function (str) {
		alert(str);
	},

	randomString: function (length) {
		return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1);
	},

	prepareAPIbody: function (method, params) {
		//function to fill the api body
		apicounter++;

		var baseobj = {"jsonrpc":"2.0", "method":"condenser_api."+method, "id":apicounter};

		if(params) {
			baseobj['params'] = params;
		}

		return baseobj;
	},

	getImgFromJsonMetaData: function(json_metadata) {
		try {
			var metadata = JSON.parse(json_metadata);
			if ('profile' in metadata) {
				if ('profile_image' in metadata['profile']) {
					if (metadata['profile']['profile_image'] != "" && metadata['profile']['profile_image'].toLowerCase().startsWith("http")) {
						return metadata['profile']['profile_image'];
					}
				}
			}
		} catch (e) {
			return "";
		}
		return "";
	},

	randomInt : function(n) {
		// pseudo random number using SeedRandom https://github.com/davidbau/seedrandom and some entropy like uptime, sessionid, availablememory etc.
		var x = Math.floor(Math.random() * n);
		if (x < 0 || x >= n) {
			throw "Arithmetic exception";
		}

		var rng = SeedRandom(Ti.App.installId);
		//console.log("rng", rng);
		var resrngint32;
		do {
			var entropy = Ti.App.installId + "" + Ti.App.sessionId + "" + Ti.Platform.uptime + ""+ Ti.Platform.netmask + ""+ Ti.Platform.availableMemory;
			//console.log("entropy", entropy);
			rng = SeedRandom(entropy, { entropy: true });
			//console.log("rng_after_entropy", rng);

			resrngint32 = rng.int32();
			//console.log("resrngint32", resrngint32);
		}
		while (resrngint32 - resrngint32 % n > 4294967296 - n);

		var randseednum = resrngint32 % n;
		//console.log("randseednum", randseednum);

		x = Math.abs((x + randseednum) % n);
		//console.log("x", x);

		return x;
	},

	generateBase58Password: function(pwdlength){
		//base58 charset
		var charset = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

		var result = "SW";
	    for (var i = 0; i < pwdlength-2; i++) {
	    	result += charset[module.exports.randomInt(charset.length)];
	    }
		return(result);
	},

	formatToLocale : function(number, digits) {

		var result = number;
		if(OS_IOS) {
			result = parseFloat(number).toLocaleString(Titanium.Locale.getCurrentLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
		} else {
			result = parseFloat(number).toFixed(digits);
		}
		return result;
	},

	validate_account_name : function(value) {
    var i, label, len, length, ref;

    if (!value) {
        return L('ERROR_account_name_should_not_be_empty');
    }
    length = value.length;
    if (length < 3) {
        return L('ERROR_account_name_should_be_longer');
    }
    if (length > 16) {
        return L('ERROR_account_name_should_be_shorter');
    }
    ref = value.split('.');
    for (i = 0, len = ref.length; i < len; i++) {
        label = ref[i];
        if (!/^[a-z]/.test(label)) {
            return L('ERROR_each_account_segment_should_start_with_a_letter');
        }
        if (!/^[a-z0-9-]*$/.test(label)) {
            return L('ERROR_each_account_segment_should_have_only_letters_digits_or_dashes');
        }
        if (/--/.test(label)) {
            return L('ERROR_each_account_segment_should_have_only_one_dash_in_a_row');
        }
        if (!/[a-z0-9]$/.test(label)) {
            return L('ERROR_each_account_segment_should_end_with_a_letter_or_digit');
        }
        if (!(label.length >= 3)) {
            return L('ERROR_each_account_segment_should_be_longer');
        }
    }
    return null;
	},

	getUserObject : function(username) {
		var currentaccounts = Ti.App.Properties.getObject('accounts');

		if(currentaccounts.length == 0) {
			return false;
		}

		for(var i =0; i < currentaccounts.length; i++) {
			// loop through currentaccounts, break if found.
			if(currentaccounts[i]['name'] == username) {
				//found account to delete, remove it now.

				return currentaccounts[i];

				break;
			}
		}
		return false;
	},

	formatUserBalanceObject : function(uo) {
		return {
			'balance': uo.balance,
			'sbd_balance': uo.sbd_balance,
			'savings_balance': uo.savings_balance,
			'savings_sbd_balance': uo.savings_sbd_balance,
			'name': uo.name,
			'last_updated': Date.now(),
			'privatekey': uo.privatekey,
			'privatekey_posting': uo.privatekey_posting,
			'privatekey_active': uo.privatekey_active,
			'privatekey_memo': uo.privatekey_memo,
			'image': uo.image,
		};
	},

	updateUserObject : function(account,key,value) {

		var currentaccounts = Ti.App.Properties.getObject('accounts');

		var accountstosave = [];

			for(var j =0; j < currentaccounts.length; j++) {

				if(currentaccounts[j].name == account) {
					// account found update value where key = key.
					currentaccounts[j][key] = value;

				}
				console.log("updating user object");
				console.log(currentaccounts[j]);
				accountstosave.push(currentaccounts[j]);
			}

		Ti.App.Properties.setObject('accounts', accountstosave);

	},

	getNodeObject : function(nodeurl) {
		var apinodes = Ti.App.Properties.getObject('apinodes');

		if(apinodes.length == 0) {
			return false;
		}

		for(var i =0; i < apinodes.length; i++) {
			// loop through currentaccounts, break if found.
			if(apinodes[i]['url'] == nodeurl) {
				//found account to delete, remove it now.

				return i;

				break;
			}
		}
		return false;
	},

	removeNode : function(i,cb) {

		// get current nodes
		var currentnodes = Ti.App.Properties.getObject('apinodes');

		// remove node from list
		currentnodes.splice(i, 1);

		// store modified list
		Ti.App.Properties.setObject('apinodes', currentnodes);

		// callback if set
		if(cb){
			cb();
		}
	},

	steemAPIcall : function(method,params,cbres,cberr, node) {
		var apiurl = Alloy.Globals.config.apiurl;

		if(node){
			apiurl = node;
		}
		module.exports.xhrcall(
			apiurl,
			'POST',
			false,
			function(e){
				// simple validation here.

				try {
					// try parse the response...
					//console.log(e);
					var result = JSON.parse(e);
					if("error" in result) {
						cberr(result.error);
					} else {
						cbres(result);
					}

				} catch(e) {
					cberr(e.message);
				}
			},
			cberr,
				module.exports.prepareAPIbody(method,params)
			);
	},

	xhrcall : function (urli, transport, fn_progress, fn_complete, fn_error, vars, timeout) {
		var file_obj;

		try {
			if (Titanium.Network.online == true) {

				var c = Titanium.Network.createHTTPClient({ autoRedirect: false, autoEncodeUrl: false });

				c.ondatastream = function (e) {
					if (fn_progress) {
						fn_progress({ 'progress': e.progress, 'kb': 0 });
					}
				};

				c.onsendstream = function (e) {
					if (fn_progress) {
						fn_progress({ 'progress': e.progress, 'kb': 0 });
					}
				};

				c.onerror = function (e) {
					if (fn_error) {
						fn_error(this.responseText);
					} else {
						alert(e);
						//Alloy.Globals.loading.show(JSON.stringify(e), true);
					}
				};

				c.onload = function (e) {
					if (fn_complete) {
						fn_complete(this.responseText);
					}
				};


				var defaulttimeout = 45000;


				if(timeout) {
					defaulttimeout = timeout;
				}

				c.setTimeout(defaulttimeout);

				c.open(transport, urli);

				c.setRequestHeader("Content-Type", "application/json");
				c.setRequestHeader('charset', 'utf-8');
				if (vars && transport == 'POST') {
					c.send(JSON.stringify(vars));
				} else {
					c.send();
				}
			} else {
				file_obj.error = 'no internet';
				//alert('No connectivity.. ');
				Alloy.Globals.loading.show('No connection', true);
			}
		} catch (err) {

			Alloy.Globals.loading.show(JSON.stringify(err), true);
		}
	},
	checkPrices: function(cb) {

		if (Date.now() - Ti.App.Properties.getInt('lastPricesCheck') > (30 * 60 * 1 * 1000)) {
			//console.log('now checking prices');
			var currency = Ti.App.Properties.getString('currency').toLowerCase();
			module.exports.xhrcall(
				"https://api.coingecko.com/api/v3/simple/price?ids=steem,steem-dollars&vs_currencies="+currency,
				"GET",
				false,
				function(resje) {
					var res = JSON.parse(resje.toLowerCase());
					//console.log(res);
					Ti.App.Properties.setString('price_steem_usd', res['steem'][currency.toLowerCase()]);
					Ti.App.Properties.setString('price_sbd_usd', res['steem-dollars'][currency.toLowerCase()]);



					Ti.App.Properties.setInt('lastPricesCheck', Date.now());

					if(cb) {
						cb();
					}
				},
				false);

		}
	}
}

module.exports = functions;
