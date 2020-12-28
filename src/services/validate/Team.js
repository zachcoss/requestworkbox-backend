const 
    createInvite = require('./TeamCreateInvite'),
    acceptInvite = require('./TeamAcceptInvite'),
    listTeam = require('./TeamListTeam'),
    removeInvite = require('./TeamRemoveInvite'),
    listInvites = require('./TeamListInvites'),
    updateTeam = require('./TeamUpdateTeam');

module.exports = {
    createInvite: createInvite,
    acceptInvite: acceptInvite,
    listTeam: listTeam,
    removeInvite: removeInvite,
    listInvites: listInvites,
    updateTeam: updateTeam,
}