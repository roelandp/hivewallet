function functions() {

	this.alerter = function (str) {
		alert(str);
	};

	this.randomString = function (length) {
		return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1);
	};

	var apicounter = 1;
	this.prepareAPIbody = function (method, params) {
		// function to fill the api body
		apicounter++;

		var baseobj = { jsonrpc: '2.0', method: 'condenser_api.' + method, id: apicounter };

		if (params) {
			baseobj['params'] = params;
		}

		return baseobj;
	};

	this.formatToLocale = function (number, digits) {
		return parseFloat(number).toLocaleString(Titanium.Locale.getCurrentLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
	};

	this.getUserObject = function (username) {
		var currentaccounts = Ti.App.Properties.getObject('accounts');

		if (currentaccounts.length == 0) {
			return false;
		}

		for (var i = 0; i < currentaccounts.length; i++) {
			// loop through currentaccounts, break if found.
			if (currentaccounts[i]['name'] == username) {
				// found account to delete, remove it now.

				return currentaccounts[i];

				break;
			}
		}
	};

	this.formatUserBalanceObject = function (uo) {
		return {
			balance: uo.balance,
			sbd_balance: uo.sbd_balance,
			savings_balance: uo.savings_balance,
			savings_sbd_balance: uo.savings_sbd_balance,
			name: uo.name,
			last_updated: Date.now(),
			privatekey: uo.privatekey,
			image: uo.image,
		};
	};

	this.updateUserObject = function (account, key, value) {

		var currentaccounts = Ti.App.Properties.getObject('accounts');

		var accountstosave = [];

		for (var j = 0; j < currentaccounts.length; j++) {

			if (currentaccounts[j].name == account) {
				// account found update value where key = key.
				currentaccounts[j][key] = value;
			}

			accountstosave.push(currentaccounts[j]);
		}

		Ti.App.Properties.setObject('accounts', accountstosave);
		// console.log('accounts object',Ti.App.Properties.getObject('accounts'));
	};

	this.steemAPIcall = function (method, params, cbres, cberr) {
		this.xhrcall(
			Alloy.Globals.config.apiurl,
			'POST',
			false,
			function (e) {
				// simple validation here.

				try {
					// try parse the response...
					// console.log(e);
					var result = JSON.parse(e);
					if ('error' in result) {
						cberr(result.error);
					} else {
						cbres(result);
					}

				} catch (e) {
					cberr(e.message);
				}
			},
			cberr,
			this.prepareAPIbody(method, params)
		);
	};

	this.xhrcall = function (urli, transport, fn_progress, fn_complete, fn_error, vars) {
		var file_obj;

		// Ti.API.info('####### XHR CALL REQUESTED TO ::::: ' + urli);

		if (vars) {

			// Ti.API.info(vars);
		}

		try {
			if (Titanium.Network.online == true) {

				var c = Titanium.Network.createHTTPClient({ autoRedirect: false, autoEncodeUrl: false });

				c.ondatastream = function (e) {
					if (fn_progress) {
						fn_progress({ progress: e.progress, kb: 0 });
					}
				};

				c.onsendstream = function (e) {
					if (fn_progress) {
						fn_progress({ progress: e.progress, kb: 0 });
					}
				};

				c.onerror = function (e) {
					if (fn_error) {
						fn_error(this.responseText);
					} else {
						alert(e);
					}
				};

				c.onload = function (e) {
					if (fn_complete) {
						fn_complete(this.responseText);
					}
				};

				c.setTimeout(45000);

				c.open(transport, urli);

				c.setRequestHeader('Content-Type', 'application/json');
				c.setRequestHeader('charset', 'utf-8');
				if (vars && transport == 'POST') {
					c.send(JSON.stringify(vars));
				} else {
					c.send();
				}
			} else {
				file_obj.error = 'no internet';
				alert('No connectivity.. ');
			}
		} catch (err) {
			alert(err);
		}
	};
}

module.exports = functions;
