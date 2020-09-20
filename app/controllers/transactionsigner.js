var steemurifns = require('/steem-uri-spec');
var steemurihelpers = new steemurifns();
var buffer = require('/buffer');
var dsteem = require('/hive-tx-min');

var has_nobroadcast = false;
var has_signer = false;
var has_callback = false;
var expirationtimeinseconds = 60; // default sixty sec

function signConfirm(){

  var operations = [];

  // should loop through ops here, add the params.
  for(var i = 0; i < $.operationsContainer.children.length; i++) {

    var operation = [];
    var operationparams = {};

    var operationchild = $.operationsContainer.children[i];
    console.log(operationchild);
    console.log(JSON.stringify(operationchild));
    console.log(JSON.stringify(operationchild.children[0].text));

    operation[0] = (operationchild.children[0].text);

    // each operationchild has a paramsview containing children containers with params.
    for(var j = 0; j < operationchild.children[1].children.length; j++) {
      var paramsview = operationchild.children[1].children[j];

      // each paramsview contains a pair of "[0] label, [1] textfield";
      var paramval = paramsview.children[1].value;

      console.log(paramsview.children[1].typeof, paramsview.children[1].param);

      if(paramsview.children[1].typeof == 'number') {
        paramval = parseFloat(paramval);
      }

      if(paramsview.children[1].typeof == 'boolean') {
        if(paramval == "1" || paramval == "true") {
          paramval = true;
        } else {
          paramval = false;
        }
      }
      operationparams[paramsview.children[1].param] = paramval;
    }

    if(Object.keys(operationparams).length > 0) {
      operation[1] = operationparams;
    }

    operations.push(operation);

  }

  console.log('recompiled all operations');
  console.log(operations);

  var signer = Ti.App.Properties.getString('currentaccount');

  if(has_signer) {
    signer = has_signer;
  }

Alloy.Globals.scanWalletForKey(signer, function(key) {
    //console.log(key);

    // then should sign the tx.

    // then either do nothing, or broadcast, or populate callback

    // if broadcast, check if callback is set, then it should also callthe callback after broadcast

    Alloy.Globals.loading.show(L('signing'), false);

		Alloy.Globals.helpers.steemAPIcall(
			"get_dynamic_global_properties", [],
			function(response) {
				//console.log('get_dynamic_global_properties', result);

				var head_block_number = response.result.head_block_number;
				var head_block_id = response.result.head_block_id;
				var refblock_prefix = new buffer.Buffer(head_block_id, 'hex').readUInt32LE(4);

				var op = {
					ref_block_num: head_block_number, //reference head block number required by tapos (transaction as proof of stake)
					ref_block_prefix: refblock_prefix, //reference buffer of block id as prefix
					expiration: new Date(Date.now() + (expirationtimeinseconds * 1000)).toISOString().slice(0, -5), //set expiration time for transaction (+1 min)

					operations: operations,
					extensions: [], //extensions for this transaction
				};

				var dsteemkey = dsteem.PrivateKey.fromString(key['key']);
				//console.log(key);
				var stx = Alloy.Globals.dsteemclient.broadcast.sign(op, dsteemkey);

				key, dsteemkey, op = null;

        console.log(stx);

        Alloy.Globals.loading.hide();

        if(has_nobroadcast) {
          // has_nobroadcast specifically set. logically the app would now expect a callback instruction as there is no alternative for handling this.
          if(has_callback) {

            var callbackurl = steemurihelpers.resolveCallback(has_callback, {'sig': stx.signatures.join(',')});
            Ti.Platform.openURL(callbackurl);
            closeWin();

          } else {
            // could maybe create a txt file here with a share intent
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
            // edit: data:uri's not supported on ios/android for "openURL", falling back to filling the clipboard with the signed tx's data.

            Ti.UI.Clipboard.setText(JSON.stringify(stx));
            alert('The clipboard now contains the transaction including your signature');
            closeWin();

          }

        } else {
          Alloy.Globals.loading.show(L('broadcasting'), false);
  				Alloy.Globals.helpers.steemAPIcall(
  					"broadcast_transaction_synchronous", [stx],
  					function(transactionresponse) {
  						// expects []

  						Alloy.Globals.loading.hide();

  						//console.log(transactionresponse);

  						var answerfromchain = transactionresponse.result;

  						if ((Array.isArray(answerfromchain.result) && answerfromchain.length == 0) || (Object.keys(answerfromchain).length === 0 && answerfromchain.constructor === Object)) {
  							// success!
  							//resetSendWindow();
  							//hideOverlaySend();

  						} else {

  							if ('block_num' in answerfromchain) {

                  if(has_callback) {

                    var callbackurl = steemurihelpers.resolveCallback(has_callback, {'sig': stx.signatures.join(','), 'block': answerfromchain['block_num'], 'id': answerfromchain['id'], 'txn': answerfromchain['trx_num']});
                    Ti.Platform.openURL(callbackurl);
                    closeWin();

                  } else {

                    alert(String.format(L('transaction_included_in_block_s'), answerfromchain['block_num'] + ""));
                    closeWin();

                  }
  								//resetSendWindow();
  								//hideOverlaySend();

  							} else {
  								//$.button_send.enabled = (true);
  								// hideOverlaySend();
  							}

  						}


  					},
  					function(err2) {
  						Alloy.Globals.loading.hide();
              console.log(err2);
  						alert(err2.message);
  					});

        } // end has_nobroadcast = false

  			},
  			function(err) {
  				Alloy.Globals.loading.hide();
  				alert(err);
  				key = null;

  			});




  },function(err) {
		//error.
		//$.button_send.enabled = (true);
		Alloy.Globals.loading.hide();
		alert(err);
	});


  //alert('should sign now');
  // check if broadcast is set or not...
}


$.transactionsigner.transform = Titanium.UI.create2DMatrix().scale(0);
//$.transactionsigner.left = Alloy.Globals.dimensions.DP_platformWidth;
$.transactionsigner.anchorPoint = {x:0.5, y:1};

function closeWin(){
  $.transactionsigner.animate(b);
}

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
    Alloy.Globals.indexJStransactionWindowClose();
    $.transactionsigner.close();
});

function animateOpen() {
    $.transactionsigner.animate(a);
}


// should parse url here.
console.log('url in tx signer win', arguments[0].url);

if(arguments[0].url) {
  var decoded = steemurihelpers.decode(arguments[0].url);
  console.log(decoded);
  if(decoded.tx.operations) {
    if(decoded.tx.operations.length > 0) {
      for(var i =0; i < decoded.tx.operations.length; i++){
        console.log('operation ',i, decoded.tx.operations[i][0]);

        var view = Titanium.UI.createView({
           height: Ti.UI.SIZE,
           layout: 'vertical',
           top: 5,
           left: 10,
           right: 10,

        });

        var label = Titanium.UI.createLabel({
          text: decoded.tx.operations[i][0],
          height: 50,
          top: 5,
          left: 0,
          font: {fontSize: 20, fontWeight: "bold"},
          color: Alloy.Globals.theme.textColor
        });

        view.add(label);

        //
        var paramsView = Titanium.UI.createView({
          height: Ti.UI.SIZE,
          layout: 'vertical',
          top: 5,

        });

        console.log('params length', decoded.tx.operations[i][1]);

        for(var k in decoded.tx.operations[i][1]) {

          console.log(k, decoded.tx.operations[i][1][k]);
        //for(var j = 0; j < decoded.tx.operations[i][1].length; j++) {

          var paramview = Titanium.UI.createView({
            height: 40,
            top: 5,
            param: k,
            left: 0,
            width: Ti.UI.FILL,
            right: 0,
            //backgroundColor: 'blue'
          });

          console.log(decoded.tx.operations[i][1][k]);

          var paramlabel = Titanium.UI.createLabel({
            text: '⌙ '+k,
            height: 40,
            width: 100,
            font: {fontSize: 16, fontFamily:'monospace'},
            minimumFontSize: 10,
            left: 0,
            top: 0,
            color: Alloy.Globals.theme.textColor
          });

          var inputfield = Titanium.UI.createTextField({
            height: 40,
            left: 115,
            font: {fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace'},
            right: 0,
            param: k,
            typeof: typeof(decoded.tx.operations[i][1][k]),
            top: 0,
            color: Alloy.Globals.theme.steemdarkblue,
          	backgroundColor: 'transparent',
          	borderWidth: 0,
          	borderRadius: 0,
          	autocorrect: false,
          	autocapitalization: false,
            width: Ti.UI.FILL,
          	padding: {
          		left: 0,
          		right: 0,
          		top: 0,
          		bottom: 0
          	}
          });

          paramview.add(paramlabel);
          paramview.add(inputfield);


          paramsView.add(paramview);

          var inputvalue = decoded.tx.operations[i][1][k];

          if(inputvalue == "__signer") {
              inputvalue = Ti.App.Properties.getString('currentaccount');
          }
          inputfield.value = inputvalue;

        }

        view.add(paramsView);

        $.operationsContainer.add(view);
      }
    }

    //
    // now add specifics like no_broadcast (params.no_broadcast) / preferred_signer (params.signer)/ callback -> params.callback
    if(decoded.params.no_broadcast){

      has_nobroadcast = decoded.params.no_broadcast;

      expirationtimeinseconds = 3599;

      var paramview = Titanium.UI.createView({
        height: 40,
        top: 5,
        param: 'no_broadcast',
        left: 10,
        right: 10,
        width: Ti.UI.FILL,
        //backgroundColor: 'blue'
      });

      var paramlabel = Titanium.UI.createLabel({
        text: 'no broadcast',
        height: 40,
        width: 100,
        font: {fontSize: 16, fontFamily:'monospace'},
        minimumFontSize: 10,
        left: 0,
        top: 0,
        color: Alloy.Globals.theme.textColor
      });

      var inputfield = Titanium.UI.createTextField({
        value: decoded.params.no_broadcast,
        height: 40,
        left: 115,
        font: {fontSize: 16, fontWeight: 'bold', fontFamily:'monospace'},
        right: 0,
        param: 'no_broadcast',
        top: 0,
        color: Alloy.Globals.theme.steemdarkblue,
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        autocorrect: false,
        autocapitalization: false,
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      });

      paramview.add(paramlabel);
      paramview.add(inputfield);


      //
      $.opsView.add(paramview);

      $.button_sign.title = L('sign');

    }

    if(decoded.params.signer){

      has_signer = decoded.params.signer;

      var paramview = Titanium.UI.createView({
        height: 40,
        top: 5,
        param: 'signer',
        left: 10,
        right: 10,
        width: Ti.UI.FILL,
        //backgroundColor: 'blue'
      });

      var paramlabel = Titanium.UI.createLabel({
        text: 'signer',
        height: 40,
        width: 100,
        font: {fontSize: 16, fontFamily:'monospace'},
        minimumFontSize: 10,
        left: 0,
        top: 0,
        color: Alloy.Globals.theme.textColor
      });

      var inputfield = Titanium.UI.createTextField({
        value: decoded.params.signer,
        height: 40,
        left: 115,
        font: {fontSize: 16, fontWeight: 'bold', fontFamily:'monospace'},
        right: 0,
        param: 'signer',
        top: 0,
        color: Alloy.Globals.theme.steemdarkblue,
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        autocorrect: false,
        autocapitalization: false,
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      });

      paramview.add(paramlabel);
      paramview.add(inputfield);

      $.opsView.add(paramview);

    }

    if(decoded.params.callback){

      has_callback = decoded.params.callback;

      var paramview = Titanium.UI.createView({
        height: 40,
        top: 5,
        param: 'callback',
        left: 10,
        right: 10,
        width: Ti.UI.FILL,
        //backgroundColor: 'blue'
      });

      var paramlabel = Titanium.UI.createLabel({
        text: 'callback',
        height: 40,
        width: 100,
        font: {fontSize: 16, fontFamily:'monospace'},
        minimumFontSize: 10,
        left: 0,
        top: 0,
        color: Alloy.Globals.theme.textColor
      });

      var inputfield = Titanium.UI.createTextField({
        value: decoded.params.callback,
        height: 40,
        left: 115,
        font: {fontSize: 16, fontWeight: 'bold', fontFamily:'monospace'},
        right: 0,
        param: 'callback',
        top: 0,
        color: Alloy.Globals.theme.steemdarkblue,
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        autocorrect: false,
        autocapitalization: false,
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      });

      paramview.add(paramlabel);
      paramview.add(inputfield);

      $.opsView.add(paramview);

    }


  }
}

// var op = ["account_witness_vote",{ "account":"__signer", "witness": "roelandp", "approve": true }];
// console.log('witness vote url = ', steemurihelpers.encodeOp(op));
