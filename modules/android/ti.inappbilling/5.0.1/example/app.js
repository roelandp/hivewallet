/*
 * Before running this example:
 * 1. Add Your Application to the Developer Console: 
 *     http://developer.android.com/training/in-app-billing/preparing-iab-app.html#AddToDevConsole
 * 2. Create 2 products in the Developer Console with the following product ids:
 *     * "gas" - Managed or Unmanaged (they are treated the same in IAB v3)
 *     * "infinite_gas" - Subscription
 * 3. Build your app for production, and upload the apk for your app to the Dev Console for Alpha or Beta testing.
 *     Building for production will sign the app which is required when uploading it.
 * 4. Copy your "Base64-encoded RSA public key" and paste it into the app assigning it to the PUBLIC_KEY var.
 *     The key can be found by selecting your app on the Dev Console and then clicking on "Services & APIs".
 * 5. To test the products that you created, you must build your app for production using the same
 *     key to sign the app, and run the app on a device.
 * 6. Start the app, if setup completes successfully, click on "queryInventory() gas, infinite_gas".
 *     This will check if those two products are available to your app. Use `adb logcat` to see more details. 
 *     Note: After creating a product, it can take several hours for it to become available.
 * 7. If everything has been successful to this point, you can continue purchasing and consuming products.
 *
 * Note: It is not necessary to run sign the app when testing static responses.
 *       See the documentation for more information.
 */

////////////////////////////////////////////////////////
// Variables
////////////////////////////////////////////////////////
function isIOS7Plus() {
    if (Titanium.Platform.name == 'iPhone OS')
    {
        var version = Titanium.Platform.version.split('.');
        var major = parseInt(version[0],10);
 
        if (major >= 7)
        {
            return true;
        }
    }
    return false;
}
var osname = Ti.Platform.osname,
    ANDROID = (osname === 'android'),
    IOS = (osname === 'iphone' || osname === 'ipad'),
    IOS7PLUS = isIOS7Plus(),
    model = Ti.Platform.model,
    VIRTUAL_DEVICE = (model === 'sdk' || model === 'google_sdk' || model === 'Simulator'),
    defaultFontSize = ANDROID ? '16dp' : 14;

var InAppBilling = require('ti.inappbilling');

// Replace this public key with your app's public key.
// Follow the "Add Your Application to the Developer Console" instructions:
// http://developer.android.com/training/in-app-billing/preparing-iab-app.html#AddToDevConsole
var PUBLIC_KEY = '<< Public Key >>';
// Read more about the developer payload in the "Verify the Developer Payload"
// section of the documentation. It is not necessary to change this to run the example.
var DEVELOPER_PAYLOAD = '<< Developer Payload >>';
var toConsume = null; // A place to hold a purchase that can be consumed

////////////////////////////////////////////////////////
// Tests as Table View Rows
////////////////////////////////////////////////////////
var rows = [
    {
        title: 'subscriptionsSupported()',
        onClick: function(){
            logInApp('subscriptionsSupported: ' + InAppBilling.subscriptionsSupported());
        }
    },
    {
        title: 'queryInventory()',
        onClick: function(){
            logInApp('queryInventory');
            InAppBilling.queryInventory();
        }
    },
    {
        title: 'queryInventory() gas, infinite_gas',
        onClick: function(){
            logInApp('queryInventory');
            InAppBilling.queryInventory({
                moreItems: ['gas'],
                moreSubs: ['infinite_gas']
            });
        }
    },
    {
        title: 'purchase() gas',
        onClick: function(){
            logInApp('purchase gas');
            InAppBilling.purchase({
            	productId: 'gas',
            	type: InAppBilling.ITEM_TYPE_INAPP,
                developerPayload: DEVELOPER_PAYLOAD
            });
        }
    },
    {
        title: 'purchase() infinite_gas',
        onClick: function(){
            logInApp('purchase infinite_gas');
            InAppBilling.purchase({
                productId: 'infinite_gas',
                type: InAppBilling.ITEM_TYPE_SUBSCRIPTION,
                developerPayload: DEVELOPER_PAYLOAD
            });
        }
    },
    {
        title: 'consume()',
        onClick: function(){
            logInApp('consume');
            if (!toConsume) {
                logInApp('There is nothing to consume. Purchase something or query a previous purchase before consuming it.');
                return;
            }
            InAppBilling.consume({
                purchases: [toConsume]
            });
        }
    },
    {
        title: 'android.test.purchased',
        onClick: function(){
            logInApp('purchase');
            InAppBilling.purchase({
                productId: 'android.test.purchased',
                type: InAppBilling.ITEM_TYPE_INAPP
            });
        }
    },
    {
        title: 'android.test.canceled',
        onClick: function(){
            logInApp('android.test.canceled');
            InAppBilling.purchase({
                productId: 'android.test.canceled',
                type: InAppBilling.ITEM_TYPE_INAPP
            });
        }
    },
    {
        title: 'android.test.refunded',
        onClick: function(){
            logInApp('android.test.refunded');
            InAppBilling.purchase({
                productId: 'android.test.refunded',
                type: InAppBilling.ITEM_TYPE_INAPP
            });
        }
    },
    {
        title: 'android.test.item_unavailable',
        onClick: function(){
            logInApp('android.test.item_unavailable');
            InAppBilling.purchase({
                productId: 'android.test.item_unavailable',
                type: InAppBilling.ITEM_TYPE_INAPP
            });
        }
    }
];

InAppBilling.addEventListener('setupcomplete', function(e) {
    logInApp('Setup response: ' + responseString(e.responseCode));
    if (e.success) {
        logInApp('Setup completed successfully!');
    } else {
        logInApp('Setup FAILED.');
    }
});

InAppBilling.addEventListener('queryinventorycomplete', function(e) {
    logInApp('Query Inventory response: ' + responseString(e.responseCode));
    var inventory = e.inventory;
    var purchaseIds = ['gas', 'infinite_gas'];
    var purchase, details;
    if (e.success) {
        for (var i = 0, j = purchaseIds.length; i < j; i++) {
            // Check for details
            if (inventory.hasDetails(purchaseIds[i])) {
                logInApp('Check log for Purchase ' + i + ' details');
                Ti.API.info('Details: ' + JSON.stringify(inventory.getDetails(purchaseIds[i])));
            }
            // Check for purchase
            if (inventory.hasPurchase(purchaseIds[i])) {
                purchase = inventory.getPurchase(purchaseIds[i]);
                // Print details for each purchase
                logInApp('Check log for Purchase ' + i + ' properties');
                Ti.API.info(purchaseProperties(purchase));

                // Queue 'gas' up to be consumed if it is owned
                if (purchase.productId === 'gas' && 
                    purchase.purchaseState === InAppBilling.PURCHASE_STATE_PURCHASED) {
                    toConsume = purchase;
                    logInApp('gas is queued to be consumed');
                }
            }
        }
    }
});

InAppBilling.addEventListener('purchasecomplete', function(e) {
    logInApp('Purchase response: ' + responseString(e.responseCode));
    if (e.success && e.purchase) {
        logInApp(purchaseProperties(e.purchase));
        // Prepare the purchase to be consumed
        if (e.purchase.productId === 'gas') {
            toConsume = e.purchase;
            logInApp('gas is queued to be consumed');
        }
        alert('Purchase completed successfully');
    }
});

InAppBilling.addEventListener('consumecomplete', function(e) {
    logInApp('Consume response: ' + responseString(e.responseCode));
    if (e.success) {
        alert('Consume completed successfully');
    }
});

////////////////////////////////////////////////////////
// Utils
////////////////////////////////////////////////////////

function runSetup() {
    logInApp('Running startSetup...');
    InAppBilling.startSetup({
        publicKey: PUBLIC_KEY
    });
    logInApp('Wait for setup to complete successfully');
}

function responseString(responseCode) {
    switch (responseCode) {
        case InAppBilling.RESULT_OK:
            return 'OK';
        case InAppBilling.RESULT_USER_CANCELED:
            return 'USER CANCELED';
        case InAppBilling.RESULT_BILLING_UNAVAILABLE:
            return 'BILLING UNAVAILABLE';
        case InAppBilling.RESULT_ITEM_UNAVAILABLE:
            return 'ITEM UNAVAILABLE';
        case InAppBilling.RESULT_DEVELOPER_ERROR:
            return 'DEVELOPER ERROR';
        case InAppBilling.RESULT_ERROR:
            return 'RESULT ERROR';
        case InAppBilling.RESULT_ITEM_ALREADY_OWNED:
            return 'RESULT ITEM ALREADY OWNED';
        case InAppBilling.RESULT_ITEM_NOT_OWNED:
            return 'RESULT ITEM NOT OWNED';

        case InAppBilling.IAB_RESULT_REMOTE_EXCEPTION:
            return 'IAB RESULT REMOTE EXCEPTION';
        case InAppBilling.IAB_RESULT_BAD_RESPONSE:
            return 'IAB RESULT BAD RESPONSE';
        case InAppBilling.IAB_RESULT_VERIFICATION_FAILED:
            return 'IAB RESULT VERIFICATION FAILED';
        case InAppBilling.IAB_RESULT_SEND_INTENT_FAILED:
            return 'IAB RESULT SEND INTENT FAILED';
        case InAppBilling.IAB_RESULT_UNKNOWN_PURCHASE_RESPONSE:
            return 'IAB RESULT UNKNOWN PURCHASE RESPONSE';
        case InAppBilling.IAB_RESULT_MISSING_TOKEN:
            return 'IAB RESULT MISSING TOKEN';
        case InAppBilling.IAB_RESULT_UNKNOWN_ERROR:
            return 'IAB RESULT UNKNOWN ERROR';
        case InAppBilling.IAB_RESULT_SUBSCRIPTIONS_NOT_AVAILABLE:
            return 'IAB RESULT SUBSCRIPTIONS NOT AVAILABLE';
        case InAppBilling.IAB_RESULT_INVALID_CONSUMPTION:
            return 'IAB RESULT INVALID CONSUMPTION';
    }
    return '';
}

function purchaseStateString(state) {
    switch (state) {
        case InAppBilling.PURCHASE_STATE_PURCHASED:
            return 'PURCHASE STATE PURCHASED';
        case InAppBilling.PURCHASE_STATE_CANCELED:
            return 'PURCHASE STATE CANCELED';
        case InAppBilling.PURCHASE_STATE_REFUNDED:
            return 'PURCHASE STATE REFUNDED';
    }
    return '';
}

function purchaseTypeString(state) {
    switch (state) {
        case InAppBilling.ITEM_TYPE_INAPP:
            return 'ITEM TYPE INAPP';
        case InAppBilling.ITEM_TYPE_SUBSCRIPTION:
            return 'ITEM TYPE SUBSCRIPTION';
    }
    return '';
}

function purchaseProperties(p) {
    var str = 'type: ' + purchaseTypeString(p.type) + 
        '\norderId: ' + p.orderId +
        '\npackageName: ' + p.packageName + 
        '\nproductId: ' + p.productId +
        '\npurchaseTime: ' + new Date(p.purchaseTime) +
        '\npurchaseState: ' + purchaseStateString(p.purchaseState) +
        '\ndeveloperPayload: ' + p.developerPayload +
        '\ntoken: ' + p.token;

    return str;
}

////////////////////////////////////////////////////////
// UI
////////////////////////////////////////////////////////
var win = Ti.UI.createWindow({
    backgroundColor: 'white'
});
win.open();
 
var textLog = Ti.UI.createTextArea({
    top: IOS7PLUS ? 20 : 0,
    height: '40%',
    width: '100%',
    borderWidth: '2',
    borderColor: '#000',
    color: '#000',
    backgroundColor: '#FFF',
    focusable: false,
    font: {
        fontSize: defaultFontSize
    },
    value: 'AppLog: this log scrolls backwards (newest === top)'
});
win.add(textLog);

if (ANDROID) {
    for (var i = 0, j = rows.length; i < j; i++) {
        rows[i].font = {fontSize: defaultFontSize};
        rows[i].height = '50dp';
        rows[i].color = '#000';
    }
}
 
var tableView = Ti.UI.createTableView({
    top: '40%',
    data: rows
});
tableView.addEventListener('click', function(e){
    rows[e.index].onClick && rows[e.index].onClick();
});

if (VIRTUAL_DEVICE) {
    // The InAppBilling will not work on the Android emulator,
    // it must be tested on a device.
    alert('The InAppBilling module can only be tested on a device.');
} else if (PUBLIC_KEY === '<< Public Key >>') {
    // The public key is required, see the declaration of the 
    // PUBLIC_KEY variable for more details.
    alert("Please put your app's public key in PUBLIC_KEY in this example.");
} else {
    win.add(tableView);
    // Setup must be run and complete successfully before any other
    // module methods are called.
    runSetup();
}
 
// Util - Logs in app and console
function logInApp(text) {
    textLog.value = text + '\n' + textLog.value;
    Ti.API.info(text);
}

