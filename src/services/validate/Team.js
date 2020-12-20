const 
    createInvite = require('./ProjectCreateProject'),
    acceptInvite = require('./ProjectListProjects'),
    removeFromTeam = require('./ProjectGetProject');

module.exports = {
    createInvite: createInvite,
    acceptInvite: acceptInvite,
    removeFromTeam: removeFromTeam,
}