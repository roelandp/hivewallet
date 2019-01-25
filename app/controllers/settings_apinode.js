$.settings_apinode.transform = Titanium.UI.create2DMatrix().scale(0);
//$.settings_apinode.left = Alloy.Globals.dimensions.DP_platformWidth;
$.settings_apinode.anchorPoint = {x:0.5, y:1};

// include the helper functions here.
var fns = require('/functions');
var helpers = new fns();

var curr_node = Ti.App.Properties.getString('apiurl').toLowerCase();

var apinodes = require('/apinodeslist');

function compileNodeList() {
var listdata = [];

if(!Ti.App.Properties.hasProperty('apinodes')) {
  console.log('no api nodes property set');
    Ti.App.Properties.setObject('apinodes', apinodes);
} else {
  console.log('api nodes property set!');
  apinodes = Ti.App.Properties.getObject('apinodes');
}


for (var node in apinodes) {

  if(apinodes[node].hasOwnProperty('url')) {

    var formattednode = (apinodes[node]['url']).split("://")[1].split(":")[0];
    var template = "nodeli";

    if(apinodes[node]['url'] === curr_node) {
      template = "nodeliselected";
    }

    listdata.push({
      template: template,
      labeltitle: {
        text: formattednode,
      },
      labelmaintainer: {
        text: apinodes[node].maintainer+":",
      },
      node: apinodes[node].url,
    });
  }

}
  $.node_picker.sections[0].setItems(listdata);
}

function selectNode(e) {

    var newnode = $.node_picker.sections[0].getItemAt(e.itemIndex).node;
    if (Ti.App.Properties.getString('apiurl').toLowerCase() != newnode) {
      // update to new node, should first test availability here...
      console.log('trying to api call to '+newnode);
      helpers.steemAPIcall(
        "get_dynamic_global_properties", [],
  			function(response) {
  				console.log('get_dynamic_global_properties', response);
          Ti.App.Properties.setString('apiurl', newnode);
          Alloy.Globals.updateSettingsPreviewText("settings_preview_node", newnode.split("://")[1].split(":")[0]);
          Alloy.Globals.config.apiurl = newnode;
          closeWin();
        },
        function(error) {
          console.log(error);
        },
        newnode
      );


      // trigger notification to submenu's, force update price calculation in mainscreen.

    } else {
      closeWin();
    }

  //
}

function closeWin(){
  $.settings_apinode.animate(b);
  helpers = null;
  fns = null;
  apinodes = null;
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
    $.settings_apinode.close();
});

function animateOpen() {
    $.addnodecontainer.setHeight(0.001);
    $.addnodecontainer.setOpacity(0.001);
    $.settings_apinode.animate(a);

}



function addNode() {

  // validate form fields...
  if($.textfield_addnewnode_name.getValue() == "") {
    alert(L('error_empty_node_name'));
    return false;
  }

  if($.textfield_addnewnode_url.getValue() == "") {
    alert(L('error_empty_node_url'));
    return false;
  }

  if(!$.textfield_addnewnode_url.getValue().startsWith('https://')) {
    if($.textfield_addnewnode_url.getValue().startsWith('http://localhost') || $.textfield_addnewnode_url.getValue().startsWith('http://127.0.0.1')) {
    } else {
      alert(L('error_node_url_should_start_https'));
      return false;
    }
  }

  // check if not in current api node list
  if(helpers.getNodeObject($.textfield_addnewnode_url.getValue().trim().toLowerCase())) {
    alert(L('error_node_url_already_added'));
    return false;
  }

  // test api node connection
  helpers.steemAPIcall(
    "get_dynamic_global_properties", [],
    function(response) {
      console.log('get_dynamic_global_properties', response);
      try {
        console.log(response);
        if(response.hasOwnProperty('result')) {
          if(response['result'].hasOwnProperty('head_block_id')) {
            var apinodes = Ti.App.Properties.getObject('apinodes');
            apinodes.push({
              maintainer: $.textfield_addnewnode_name.getValue().trim(),
              url: $.textfield_addnewnode_url.getValue().trim().toLowerCase()
            });

            Ti.App.Properties.setObject('apinodes', apinodes);
            toggleAddNodeView();
            compileNodeList();
            alert('node_added_not_yet_active');
          } else {
            alert(L('node_unexpected_response_cant_add'));
            return false;
          }
        } else {
          alert(L('node_unexpected_response_cant_add'));
          return false;
        }
      } catch(err) {
        alert(err);
        return false;
      }
      // Ti.App.Properties.setString('apiurl', $.textfield_addnewnode_url.getValue().trim().toLowerCase());
      // Alloy.Globals.updateSettingsPreviewText("settings_preview_node", $.textfield_addnewnode_url.getValue().trim().toLowerCase().split("://")[1].split(":")[0]);
      // Alloy.Globals.config.apiurl = $.textfield_addnewnode_url.getValue().trim().toLowerCase();
      //closeWin();
    },
    function(error) {
      console.log(error);
    },
    $.textfield_addnewnode_url.getValue().trim().toLowerCase()
  );
  // all good? add new node.



}

function toggleAddNodeView(){
  console.log($.addnodecontainer.getHeight() );
  if($.addnodecontainer.getHeight() <= 0.01) {
    //$.addnodecontainer.animate(animate_openaddnodecontainer);
    $.addnodecontainer.setHeight(162);
    $.addnodecontainer.setOpacity(1);
  } else {
    //$.addnodecontainer.animate(animate_closeaddnodecontainer);
    $.addnodecontainer.setHeight(0.001);
    $.addnodecontainer.setOpacity(0.001);
  }
}

function delNode(e) {

  var item = $.node_picker.sections[0].getItemAt(e.itemIndex).node.trim().toLowerCase();
  var nodei = helpers.getNodeObject(item);

  console.log("removing .... ", item,nodei);

  helpers.removeNode(nodei, function(){
    alert(String.format(L('removed_node_with_url_s'), item));
    compileNodeList();
  });




}

function returnAddnewnodefield() {

}

compileNodeList();
