const 
    createProject = require('./ProjectCreateProject'),
    listProjects = require('./ProjectListProjects'),
    listTeamProjects = require('./ProjectListTeamProjects'),
    getProject = require('./ProjectGetProject'),
    updateProject = require('./ProjectUpdateProject'),
    archiveProject = require('./ProjectArchiveProject'),
    restoreProject = require('./ProjectRestoreProject');

module.exports = {
    createProject: createProject,
    listProjects: listProjects,
    listTeamProjects: listTeamProjects,
    getProject: getProject,
    updateProject: updateProject,
    archiveProject: archiveProject,
    restoreProject: restoreProject,
}