# [hivewallet.app](https://hivewallet.app)
##### [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

[![hivewallet.app](https://hivewallet.app/images/social_fb.jpg)](https://hivewallet.app)

##### hivewallet is a fast, secure and open source wallet for the Steem blockchain, available for iOS and Android.

# Key features
  - Monitor any / multiple account's balances from the Steem blockchain
  - Create, sign and broadcast transfer transactions (send steem & sbd) (optional)
  - AES 256 encrypted storage for keys should you want to sign transfer operations (send steem & sbd)
  - QR code reader for easy importing of keys and sending to others
  - QR code generator for easy proposing your wallet address for others to send to
  - Optional use of Touch ID / Face ID for retrieving your passphrase
  - Forced creation of a difficult passphrase including cracktime hints, should you want to use the AES 256 encrypted storage.

# Build instructions
  - Download & install Appcelerator CLI (you need nodejs for that): https://wiki.appcelerator.org/display/guides2/Appcelerator+CLI+Getting+Started
  - Have the sdk's for Android and/or IOS on your device
  - Git clone this repo
  - `appc run -p (ios|android)`


# This app uses the following libraries / software
  - Build on [Axway Titanium Appcelerator](https://github.com/appcelerator/titanium_mobile) for crossplatform native compiled apps
  - Dsteem for steem key related functions: https://github.com/steemit/dsteem
  - Node buffer implementation, used for head-block prefix calcs: https://github.com/feross/buffer
  - Client side qr code generator: https://github.com/siciarek/javascript-qrcode
  - For time manipulations: https://github.com/moment/moment
  - AES encryption for wallet encryption: https://github.com/benbahrenburg/Ti.SlowAES
  - ZXCVBN password strength checker library: https://github.com/dropbox/zxcvbn
  - Identity module for integration with biometry: https://github.com/appcelerator-modules/titanium-identity/
  - Steem's Bad Actors List from: https://github.com/steemit/condenser/blob/master/src/app/utils/BadActorList.js
  - Detecting crossplatform resume / pause of app: https://github.com/dieskim/Appcelerator.Hyperloop.appPauseResume
  - QR code scanner from: https://github.com/appcelerator-modules/ti.barcode
  - Ti.Deeply URI-scheme support for android from: https://github.com/caffeinalab/ti.deeply

### Feature requests, pull-requests

I specifically envision keeping the app lightweight. I certainly don't intend to compete with other great apps out there such as the eSteem app..

If you want to help, and want the app in your native language, feel free to help translate!
Translations are a community effort and thanks to opensource support from [Crowdin](https://crowdin.com/project/hivewallet) you can now help add your translation via https://crowdin.com/project/steemwallet - please explore the app thoroughly when adding translations!

#### Translations already done

| language 	| steem user                                    	|
|----------	|-----------------------------------------------	|
| DE       	| [pharesim](https://hive.blog/@pharesim)     	|
| ES       	| [tashidelek](https://hive.blog/@tashidelek),[hedac](https://hive.blog/@hedac) 	|
| FR       	| [helo](https://hive.blog/@helo)             	|
| IT       	| Tiwi90             	                            |
| NL       	| [guchte](https://hive.blog/@guchte)		        |
| RO       	| [rasozauru](https://hive.blog/@rasozauru)		  |
| RU       	| [dunsky](https://hive.blog/@dunsky)		        |

Cheers, [@roelandp](https://hive.blog/@roelandp)
