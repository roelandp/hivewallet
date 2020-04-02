module.exports = {
  returnDialogTitle: function(requesttype) {
    var titles = {
      'custom': 'Custom Transaction',
      'decode': 'Verify Key',
      'signBuffer': 'Sign Message',
      'addAccountAuthority': 'Add Authority',
      'removeAccountAuthority': 'Remove Authority',
      'broadcast': 'Broadcast',
      'signedCall': 'Signed Call',
      'post': 'Post',
      'vote': 'Vote',
      'transfer': 'Transfer',
      'delegation': 'Delegation',
      'witnessVote': 'Witness Vote',
      "sendToken":"Send Tokens",
      "powerUp":"Power Up",
      "powerDown":"Power Down",
      "createClaimedAccount":"Create Claimed Account",
      'createProposal': 'Create Worker Proposal',
      'removeProposal': 'Remove Worker Proposal',
      'updateProposalVote': 'Vote for Proposal',
    };

    if(titles.hasOwnProperty(requesttype)) {
      return titles[requesttype];
    } else {
      return requesttype;
    }
  },
  returnDialogExplain: function(requesttype) {
    console.log('returnDialogExplain called with length of args: '+arguments.length);
    console.log(arguments);
    var messages = {
      'decode': String.format(L("s_would_like_to_verify_that_you_have_access_to_your_s_key:"),arguments[1],arguments[2]),
      'signBuffer': String.format(L("s_would_like_you_to_sign_a_message_with_your_s_key:"),arguments[1],arguments[2]),
    }

    if(messages.hasOwnProperty(requesttype)) {
      return messages[requesttype];
    } else {
      return String.format(L("s_would_you_like_to_sign_the_following_operation_with_your_s_key"), arguments[1], arguments[2]);
    }

  },
  getRequiredWifType: function(request) {
    switch (request.type) {
        case "decode":
        case "signBuffer":
            return request.method.toLowerCase();
            break;
        case "post":
        case "vote":
            return "posting";
            break;
        case "custom":
            return (request.method == null || request.method == undefined) ? "posting" : request.method.toLowerCase();
            break;
        case "addAccountAuthority":
        case "removeAccountAuthority":
        case "broadcast":
            return request.method.toLowerCase();
        case "signedCall":
            return request.typeWif.toLowerCase();
        case "transfer":
            return "active";
            break;
        case "sendToken":
            return "active";
            break;
        case "delegation":
            return "active";
            break;
        case "witnessVote":
            return "active";
            break;
        case "powerUp":
            return "active";
            break;
        case "powerDown":
            return "active";
            break;
        case "createClaimedAccount":
            return "active";
            break;
        case "createProposal":
          return "active";
          break;
        case "removeProposal":
          return "active";
          break;
        case "updateProposalVote":
          return "active";
          break;
    }
  }
};
