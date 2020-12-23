const 
    createInvite = require('./TeamCreateInvite'),
    acceptInvite = require('./TeamAcceptInvite'),
    listTeam = require('./TeamListTeam'),
    removeFromTeam = require('./TeamRemoveFromTeam');

module.exports = {
    createInvite: createInvite,
    acceptInvite: acceptInvite,
    listTeam: listTeam,
    removeFromTeam: removeFromTeam,
}