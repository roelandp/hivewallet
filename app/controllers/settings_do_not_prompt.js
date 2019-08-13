// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;

function objsize(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)){ size++; }
    }
    return size;
}

function closeWin(){
  $.settings_do_not_prompt.close();
}

function delPrompt(e){
  // remove e.prompt from donotpromptlist ... if the parent key has no other items afterwards: cleanup.
  // then save the Titanium.App.Properties.getObject('donotpromptlist') and recompile compileList();

  //compileList();
  console.log(e);
  var item = $.dnpl_listview.sections[e.sectionIndex].getItemAt(e.itemIndex);
  var todel = item.promptdata;

  //console.log("should remove that item now");

  // account = roelandp;
  // client = "steempeak.com";
  // operation = vote;

  var dnpl = Titanium.App.Properties.getObject('donotpromptlist');
  dnpl[todel.account][todel.client];
  dnpl[todel.account][todel.client].splice(dnpl[todel.account][todel.client].indexOf(todel.operation),1);

  // now check if client has any ops left, if not, remove client.
  if(dnpl[todel.account][todel.client].length == 0) {
    delete dnpl[todel.account][todel.client];
  }

  if(objsize(dnpl[todel.account]) == 0) {
    delete dnpl[todel.account];
  }

  Titanium.App.Properties.setObject('donotpromptlist',dnpl);

  compileList();
}

function compileList(){
  var dnpl = Titanium.App.Properties.getObject('donotpromptlist');
  var sections = [];

  if(objsize(dnpl) > 0) {

    // first an explainer section...
    var listSection = Ti.UI.createListSection();
    sections.push(listSection);

    listSection.items = ([{
      template: 'dnpl_top_explainer',
      dnpl_top_explainer_label: {
        text: L('dnpl_top_explainer')
      }
    }]);

    // then loop through accounts in dnpl-object and list each do-not-prompt-filter


    for (key in dnpl) {
      // this will only contain filled do_no_prompt filters, as we take care of cleaning up the list in the delPrompt function.
      // no need to check

      for(client in dnpl[key]) {
        // array of clients
        console.log('trying create listsection for '+key);
        var headerView = Ti.UI.createView({
          height: 35,
          backgroundColor: Alloy.Globals.theme.steemlightblue,
        });

        var headerTitle = Ti.UI.createLabel({
          text: key + " ⟷ "+ client + ":",
          font: {
        		fontWeight: "semibold",
            fontSize: 20,
        	},
          height: 35,
          color: Alloy.Globals.theme.backgroundColor,
          left: 20,
          right: 20,
          textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
        });

        headerView.add(headerTitle);

        var listSection = Ti.UI.createListSection({ headerView: headerView});
        var listItems = [];

        for(var i =0; i < dnpl[key][client].length; i++) {

          listItems.push(
            //var row = Ti.UI.createTableViewRow({"title": shd.get('title')});
        		{
        			template: 'promptli',
        			labeltitle: {
        				text: "↳ "+dnpl[key][client][i],
        			},
        			promptdata: {account: key, client: client, operation: dnpl[key][client][i]}
        		}
          );
        }

        listSection.items = listItems;
        sections.push(listSection);

      }

    }

  } else {
    // compile empty explainer when user has no single dnpl-filter (yet)
    // first an explainer section...
    // var listSection = Ti.UI.createListSection();
    // sections.push(listSection);

    var listSection = Ti.UI.createListSection();
    sections.push(listSection);

    listSection.items = ([{
      template: 'txlinocontent',
      txli_nocontent_label: {
        text: L('dnpl_no_content_explainer')
      }
    }]);



  }

  // put section into listview
  $.dnpl_listview.sections = sections;
}

function animateOpen() {
  if(OS_IOS) {
    $.topspacer.height = $.settings_do_not_prompt.safeAreaPadding.top;
    //Alloy.Globals.topspacer = $.settings_do_not_prompt.safeAreaPadding.top;
  }

}

compileList();
