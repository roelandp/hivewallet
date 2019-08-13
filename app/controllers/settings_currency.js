var helpers = require("/functions");

var curr_currency = Ti.App.Properties.getString('currency').toLowerCase();

var listdata = [];

if(Alloy.Globals.currencies[curr_currency]) {
  currency_symbol = Alloy.Globals.currencies[curr_currency];
  listdata.push({
    template: 'currencyliselected',
    labeltitle: {
      text: curr_currency.toUpperCase(),
    },
    currencysymbol: {
      text: Alloy.Globals.currencies[curr_currency],
    },
    currency: curr_currency,
  });
}


for (var currency in Alloy.Globals.currencies) {

  if(currency != curr_currency) {
    console.log(currency);

    listdata.push({
      template: 'currencyli',
      labeltitle: {
        text: currency.toUpperCase(),
      },
      currencysymbol: {
        text: Alloy.Globals.currencies[currency],
      },
      currency: currency,
    });
  }
}

$.currency_picker.sections[0].items = (listdata);

function selectCurrency(e){
  var newcurrency = $.currency_picker.sections[0].getItemAt(e.itemIndex).currency;
  if (Ti.App.Properties.getString('currency').toLowerCase() != newcurrency) {
    // update new currency
    Ti.App.Properties.setString('currency', newcurrency);
    Alloy.Globals.updateSettingsPreviewText("settings_preview_currency", newcurrency);
    // trigger notification to submenu's, force update price calculation in mainscreen.
    Ti.App.Properties.setInt('lastPricesCheck', 0);
    helpers.checkPrices(false);

  }

  closeWin();
}

// $.settings_currency.transform = Titanium.UI.create2DMatrix().scale(0);
// //$.settings_currency.left = Alloy.Globals.dimensions.DP_platformWidth;
// $.settings_currency.anchorPoint = {x:0.5, y:1};
function closeWin(){
  $.settings_currency.close();
}

// var a = Ti.UI.createAnimation({
//     transform : Ti.UI.create2DMatrix().scale(1),
//     duration : 300,
//     anchorPoint: {x:0.5, y:1}
// });
//
// var b = Ti.UI.createAnimation({
//     transform : Ti.UI.create2DMatrix().scale(0),
//     duration : 150,
//     anchorPoint: {x:0.5, y:1}
// });
//
// b.addEventListener('complete', function() {
//     $.settings_currency.close();
// });

function animateOpen() {
    //$.settings_currency.animate(a);
}
