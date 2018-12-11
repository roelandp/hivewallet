function functions() {

	this.alerter = function (str) {
		alert(str);
	};

	this.randomString = function (length) {
		return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1);
	};

	var apicounter = 1;
	this.prepareAPIbody = function (method, params) {
		//function to fill the api body
		apicounter++;

		var baseobj = {"jsonrpc":"2.0", "method":"condenser_api."+method, "id":apicounter};

		if(params) {
			baseobj['params'] = params;
		}

		return baseobj;
	};

	this.formatToLocale = function(number, digits) {
		return parseFloat(number).toLocaleString(Titanium.Locale.getCurrentLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
	};

	this.validate_account_name = function(value) {
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
	};

	this.getUserObject = function(username) {
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
	};

	this.formatUserBalanceObject = function(uo) {
		return {
			'balance': uo.balance,
			'sbd_balance': uo.sbd_balance,
			'savings_balance': uo.savings_balance,
			'savings_sbd_balance': uo.savings_sbd_balance,
			'name': uo.name,
			'last_updated': Date.now(),
			'privatekey': uo.privatekey,
			'image': uo.image,
		};
	};

	this.updateUserObject = function(account,key,value) {

		var currentaccounts = Ti.App.Properties.getObject('accounts');

		var accountstosave = [];

			for(var j =0; j < currentaccounts.length; j++) {

				if(currentaccounts[j].name == account) {
					// account found update value where key = key.
					currentaccounts[j][key] = value;
				}

				accountstosave.push(currentaccounts[j]);
			}

		Ti.App.Properties.setObject('accounts', accountstosave);
		//console.log('accounts object',Ti.App.Properties.getObject('accounts'));
	};

	this.getNodeObject = function(nodeurl) {
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
	};

	this.removeNode = function(i,cb) {

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
	};

	this.steemAPIcall = function(method,params,cbres,cberr, node) {
		var apiurl = Alloy.Globals.config.apiurl;
		console.log('loggin steemapicall ', node);
		if(node){
			apiurl = node;
		}
		this.xhrcall(
			apiurl,
			'POST',
			false,
			function(e){
				// simple validation here.
				console.log('callback steemapi call - '+ apiurl);
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
				this.prepareAPIbody(method,params)
			);
	};

	this.xhrcall = function (urli, transport, fn_progress, fn_complete, fn_error, vars) {
		var file_obj;

		//Ti.API.info('####### XHR CALL REQUESTED TO ::::: ' + urli);

		if (vars) {

			//Ti.API.info(vars);
		}

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
						//alert(e);
						Alloy.Globals.loading.show(e, true);
					}
				};

				c.onload = function (e) {
					if (fn_complete) {
						fn_complete(this.responseText);
					}
				};

				c.setTimeout(45000);

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
			Alloy.Globals.loading.show(err, true);
		}
	};
}

module.exports = functions;
