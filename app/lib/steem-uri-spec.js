/**
 * Modified Steem-Uri Signing protocol: just optimized for use with Titanium Appcelerator.
 * Original by/from:
 * https://github.com/steemit/steem-uri-spec
 * Steem URI Signing Protocol
 * @author Johan Nordberg <johan@steemit.com>
 */

var buffer = require('/buffer');
var XCallbackURL = require('/xcallbackurl');

function btoa(str) { return new buffer.Buffer(str, 'binary').toString('base64'); };
function atob(str) { return new buffer.Buffer(str, 'base64').toString('binary'); };

var B64U_LOOKUP = { '/': '_', '_': '/', '+': '-', '-': '+', '=': '.', '.': '=' };
var b64uEnc = function (str) { return btoa(str).replace(/(\+|\/|=)/g, function (m) { return B64U_LOOKUP[m]; }); };
var b64uDec = function (str) { return atob(str.replace(/(-|_|\.)/g, function (m) { return B64U_LOOKUP[m]; })); };

var RESOLVE_PATTERN = /(__(ref_block_(num|prefix)|expiration|signer))/g;

var CALLBACK_RESOLVE_PATTERN = /({{(sig|id|block|txn)}})/g;

/*** Internal helper to encode Parameters to a querystring. */



function encodeParameters(params) {
    var obj = {};
    if (params.no_broadcast === true) {
        obj['nb'] = '';
    }
    if (params.signer) {
        obj['s'] = params.signer;
    }
    if (params.callback) {
        obj['cb'] = b64uEnc(params.callback);
    }

    var qs = "";
    var str = "";
    for (var key in obj) {
        if (str != "") {
            str += "&";
        }
        str += key + "=" + (obj[key]);
    }

    qs = str;

    if (qs.length > 0) {
        qs = '?' + qs;
    }
    return qs;
}
/** Internal helper to encode a tx or op to a b64u+json payload. */
function encodeJson(data) {
    return b64uEnc(JSON.stringify(data, null, 0));
}

// functions to be exposed in module.exports
function functions() {

  this.btoa = function(str){
    return btoa(str);
  }
  /**
   * Parse a steem:// protocol link.
   * @param steemUrl The `steem:` url to parse.
   * @throws If the url can not be parsed.
   * @returns The resolved transaction and parameters.
   */
  this.decode = function(steemUrl) {
      //console.log('decoding url');
      var url = XCallbackURL.parse(steemUrl)['parsedURI'];
      //console.log(url);

      if (url.protocol !== 'steem') {
          throw new Error("Invalid protocol, expected 'steem:' got '" + url.protocol + "'");
      }
      if (url.host !== 'sign') {
          throw new Error("Invalid action, expected 'sign' got '" + url.host + "'");
      }
      var _a = url.path.split('/').slice(1), type = _a[0], rawPayload = _a[1];
      var payload;



      var b64Utypes = ['tx','op','ops'];
      var specialactionstypes = ['transfer','follow']; // lets propose some more here like 'vote', 'delegate-vesting-shares' etc see https://app.steemconnect.com/sign
      // first check if the type is one of tx, op, ops, ... if not, then it might be a "specialized action" which don't need b64uDec
      if( b64Utypes.includes(type)) {

        try {
            payload = JSON.parse(b64uDec(rawPayload));
        }
        catch (error) {
            error.message = "Invalid payload: " + error.message;
            throw error;
        }
        var tx;
        switch (type) {
            case 'tx':
                tx = payload;
                break;
            case 'op':
            case 'ops':
                var operations = type === 'ops' ? payload : [payload];
                tx = {
                    ref_block_num: '__ref_block_num',
                    ref_block_prefix: '__ref_block_prefix',
                    expiration: '__expiration',
                    extensions: [],
                    operations: operations,
                };
                break;
            // case 'transfer':
            // case 'follow':
            default:
                throw new Error("Invalid signing action '" + type + "'");
        }
      } else if(specialactionstypes.includes(type)){
        // check if list of specialized actions
          // prep those operations.
        // do something for each special action ...

        /*
        Hey Roeland this is really cool! Ok i've open sourced SC3 code so i can show you how i implemented the parser, its here https://github.com/steemscript/steemsign/blob/master/src/helpers/utils.js#L46-L70 , its using this json mapping of the operations: https://github.com/steemscript/steemsign/blob/master/src/helpers/operations.json some op are missing but the base is there (edited)
        I use the dash instead of the underscore cuz it's more conventionnel for a page name but underscore or snakeCase method name working too
        And yes the params and op name on SC are exactly same as steemd
        Here i parse the url with steem-uri with fallback to SC2 style urls https://github.com/steemscript/steemsign/blob/e22c1f834c552ea4e24bd8b4cd9e0faec7da58a8/src/views/Sign.vue#L143-L151 (edited)

        roelandp [4:04 PM]
        ok great thank you!
        oh so you are going to start with steem-uri's then or did you already support those? was not aware of that
        (the base64u ones)

        fabien [4:10 PM]
        on SC2 we have a base64 url but it's not using steem-uri syntax, on SC3 we support steem-uri
        but it's not released yet
        It will look like this https://beta.steemconnect.com/sign/ops/W1sidm90ZSIseyJ2b3RlciI6ImZvbyIsImF1dGhvciI6ImJhciIsInBlcm1saW5rIjoiYmF6Iiwid2VpZ2h0IjoxMDAwMH1dLFsidHJhbnNmZXIiLHsiZnJvbSI6ImZvbyIsInRvIjoiYmFyIiwiYW1vdW50IjoiMTAuMDAwIFNURUVNIiwibWVtbyI6ImJheiJ9XV0.?cb=aHR0cHM6Ly9leGFtcGxlLmNvbS93YWxsZXQ_dHg9e3tpZH19

        */

      }
      var params = {};
      if (url.queryKey.hasOwnProperty('cb')) {
          params.callback = b64uDec(url.queryKey['cb']);
      }
      if (url.queryKey.hasOwnProperty('nb')) {
          params.no_broadcast = true;
      }
      if (url.queryKey.hasOwnProperty('s')) {
          params.signer = url.queryKey['s'];
      }
      return { tx: tx, params: params };
  };

  /**
   * Resolves placeholders in a transaction.
   * @param utx Unresolved transaction data.
   * @param params Protocol parameters.
   * @param options Values to use when resolving.
   * @returns The resolved transaction and signer.
   */
  this.resolveTransaction = function(utx, params, options) {
      var signer = params.signer || options.preferred_signer;
      if (!options.signers.includes(signer)) {
          throw new Error("Signer '" + signer + "' not available");
      }
      var ctx = {
          __ref_block_num: options.ref_block_num,
          __ref_block_prefix: options.ref_block_prefix,
          __expiration: options.expiration,
          __signer: signer,
      };
      var walk = function (val) {
          var type = typeof val;
          if (type === 'object' && Array.isArray(val)) {
              type = 'array';
          }
          else if (val === null) {
              type = 'null';
          }
          switch (type) {
              case 'string':
                  return val.replace(RESOLVE_PATTERN, function (m) { return ctx[m]; });
              case 'array':
                  return val.map(walk);
              case 'object': {
                  var rv = {};
                  for (var _i = 0, _a = Object.entries(val); _i < _a.length; _i++) {
                      var _b = _a[_i], k = _b[0], v = _b[1];
                      rv[k] = walk(v);
                  }
                  return rv;
              }
              default:
                  return val;
          }
      };
      var tx = walk(utx);
      return { signer: signer, tx: tx };
  };

  /**
   * Resolves template vars in a callback url.
   * @param url The callback url.
   * @param ctx Values to use when resolving.
   * @returns The resolved url.
   */
  this.resolveCallback = function(url, ctx) {
      return url.replace(CALLBACK_RESOLVE_PATTERN, function (_1, _2, m) { return ctx[m] || ''; });
  };

  /** Encodes a Steem transaction to a steem: URI. */
  this.encodeTx = function(tx, params) {
      if (params === void 0) { params = {}; }
      return "steem://sign/tx/" + encodeJson(tx) + encodeParameters(params);
  };

  /** Encodes a Steem operation to a steem: URI. */
  this.encodeOp = function(op, params) {
      if (params === void 0) { params = {}; }
      return "steem://sign/op/" + encodeJson(op) + encodeParameters(params);
  };

  /** Encodes several Steem operations to a steem: URI. */
  this.encodeOps = function(ops, params) {
      if (params === void 0) { params = {}; }
      return "steem://sign/ops/" + encodeJson(ops) + encodeParameters(params);
  };

}

module.exports = functions;
