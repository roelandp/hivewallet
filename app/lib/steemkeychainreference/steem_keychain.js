/*

This is a rewritten file originating from Keychain for Hive. Please see it's license below:
Note: this file is not directly used in the HiveWallet app, but a minified 1-liner version derrived from this file is, this is just here so we can quickly edit/change/add stuff and then minify. As humans can only read prettified code afaik :)

MIT License

Copyright (c) 2018 Steem Monsters, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// Content script interfacing the website and the extension

var hive_keychain = {
    current_id: 1,
    requests: {},
    handshake_callback: null,

    requestHandshake: function(callback) {
        hive_keychain.handshake_callback = callback;
        hive_keychain.dispatchCustomEvent("swHandshake", "");
    },

    requestVerifyKey: function(account, message, key, callback) {
        var request = {
            type: "decode",
            username: account,
            message: message,
            method: key
        };

        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },

    requestSignBuffer: function(account, message, key, callback) {
        var request = {
            type: "signBuffer",
            username: account,
            message: message,
            method: key
        };

        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },

    requestAddAccountAuthority: function(account, authorizedUsername, role, weight, callback) {
        var request = {
            type: "addAccountAuthority",
            username: account,
            authorizedUsername: authorizedUsername,
            role: role,
            weight: weight,
            method: "Active"
        };

        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },

    requestRemoveAccountAuthority: function(account, authorizedUsername, role, callback) {
        var request = {
            type: "removeAccountAuthority",
            username: account,
            authorizedUsername: authorizedUsername,
            role: role,
            method: "Active"
        };

        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },

    requestBroadcast: function(account, operations, key, callback) {
        var request = {
            type: "broadcast",
            username: account,
            operations: operations,
            method: key
        };

        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },

    requestSignedCall: function(account, method, params, key, callback) {
        var request = {
            type: "signedCall",
            username: account,
            method: method,
            params: params,
            typeWif: key,
        };

        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },

    // Example comment_options: {"author":"stoodkev","permlink":"hi","max_accepted_payout":"100000.000 HBD","percent_steem_dollars":10000,"allow_votes":true,"allow_curation_rewards":true,"extensions":[[0,{"beneficiaries":[{"account":"yabapmatt","weight":1000},{"account":"steemplus-pay","weight":500}]}]]}
    requestPost: function(account, title, body, parent_perm, parent_account, json_metadata, permlink, comment_options, callback) {
        var request = {
            type: "post",
            username: account,
            title: title,
            body: body,
            parent_permlink: parent_perm,
            parent_author: parent_account,
            json_metadata: json_metadata,
            permlink: permlink,
            comment_options: comment_options
        };
        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },

    requestVote: function(account, permlink, author, weight, callback) {
        var request = {
            type: "vote",
            username: account,
            permlink: permlink,
            author: author,
            weight: weight
        };

        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },

    requestCustomJson: function(account, id, key, json, display_msg, callback) {
        var request = {
            type: "custom",
            username: account,
            id: id, //can be "custom", "follow", "reblog" etc.
            method: key, // Posting key is used by default, active can be specified for id=custom .
            json: json, //content of your json
            display_msg: display_msg
        };

        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },
    requestTransfer: function(account, to, amount, memo, currency, callback, enforce) {
        var request = {
            type: "transfer",
            username: account,
            to: to,
            amount: amount,
            memo: memo,
            enforce: (enforce || false),
            currency: currency
        };
        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },
    requestSendToken: function(account, to, amount, memo, currency, callback) {
        var request = {
            type: "sendToken",
            username: account,
            to: to,
            amount: amount,
            memo: memo,
            currency: currency
        };
        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },
    requestDelegation: function(username, delegatee, amount, unit, callback) {
        var request = {
            type: "delegation",
            username: username,
            delegatee: delegatee,
            amount: amount,
            unit: unit
        };
        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },
    requestWitnessVote: function(username, witness, vote, callback) {
        var request = {
            type: "witnessVote",
            username: username,
            witness: witness,
            vote: vote
        };
        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },
    requestPowerUp: function(username, recipient, steem, callback) {
        var request = {
            type: "powerUp",
            username: username,
            recipient: recipient,
            hive: steem
        };
        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },
    requestPowerDown: function(username, steem_power, callback) {
        var request = {
            type: "powerDown",
            username: username,
            steem_power: steem_power,
        };
        hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },

    //HF21
    requestCreateProposal: function(username, receiver, subject, permlink, daily_pay, start, end, extensions, callback) {
      var request = {
        type: "createProposal",
        username: username,
        receiver: receiver,
        subject: subject,
        permlink: permlink,
        start: start,
        end: end,
        daily_pay: daily_pay,
        extensions: extensions
      };

      hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },

    requestRemoveProposal: function(username, proposal_ids, extensions, callback) {
      var request = {
        type: "removeProposal",
        username: username,
        proposal_ids: proposal_ids,
        extensions: extensions,
      };
      hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },

    requestUpdateProposalVote: function(username, proposal_ids, approve, extensions, callback) {
      var request = {
        type: "updateProposalVote",
        username: username,
        proposal_ids: proposal_ids,
        approve: approve,
        extensions: extensions
      };
      hive_keychain.dispatchCustomEvent("swRequest", request, callback);
    },

    // Send the customEvent
    dispatchCustomEvent: function(name, data, callback) {
        hive_keychain.requests[hive_keychain.current_id] = callback;
        //
        var sendobject = {
          name: name,
          data: data,
          detail: { request_id: hive_keychain.current_id }
        };

        hive_keychain.current_id++;

        //on android: xmlhttprequest which we can monitor in "onloadresource"-event
        // 1. Create a new XMLHttpRequest object
        var xhr = new XMLHttpRequest();

        // 2. Configure it: GET-request for the URL
        var currenthost = window.location.origin;
        if(!(currenthost.slice(-1) == "/")) { currenthost = currenthost + "/"; }
        var swsk_url = currenthost+ "?xrf=XXXRF&params="+encodeURIComponent(JSON.stringify(sendobject));
        //xhr.open('HEAD', 'https://keychain.hivewallet.app/android/parameterforwarder.html?xrf=XXXRF&params='+encodeURIComponent(JSON.stringify(sendobject)));
        xhr.open('HEAD', swsk_url);

        // 3. Send the request over the network
        xhr.send();

        // on ios a simple document.location forwarder which gets cancelled because it does not exist yet it still triggers an "onbeforeload"-event:
        //document.location = 'XXXRF://?params=' + encodeURIComponent(JSON.stringify(sendobject));

    },
    // receiver for getting messages back from the app environment into the browser window.
    postMessage : function(jsonnedeventi) {
    // We only accept messages from ourselves
    console.log('received PostMessage');
    console.log(jsonnedeventi);
    var eventi = JSON.parse(decodeURIComponent(jsonnedeventi));
    //console.log(eventi);
    if(eventi.data.type && (eventi.data.type == "hive_keychain_response")) {
      //console.log("ok this is a steem_key_chain_response");
        var response = eventi.data.response;
        console.log("response object = ");
        console.log(response);
        if (response && response.request_id) {
          // console.log("ok inside if (response && response.request_id) { ");
          // console.log("now logging hive_keychain requests");
          //console.log(hive_keychain.requests);
        //  console.log(hive_keychain);
          console.log("will now try to execute hive_keychain.requests["+response.request_id+"]");
            if (hive_keychain.requests[response.request_id]) {
                hive_keychain.requests[response.request_id](response);
                delete hive_keychain.requests[response.request_id];
            } else {
              console.log("no such request");
            }
        }
    } else if (eventi.data.type && (eventi.data.type == "hive_keychain_handshake")) {
        if (hive_keychain.handshake_callback) {
            hive_keychain.handshake_callback();
        }
    }
  }
};
