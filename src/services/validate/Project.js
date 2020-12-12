const 
    createProject = require('./ProjectCreateProject'),
    listProjects = require('./ProjectListProjects'),
    getProject = require('./ProjectGetProject'),
    updateProject = require('./ProjectUpdateProject'),
    archiveProject = require('./ProjectArchiveProject'),
    restoreProject = require('./ProjectRestoreProject');

module.exports = {
    createProject: createProject,
    listProjects: listProjects,
    getProject: getProject,
    updateProject: updateProject,
    archiveProject: archiveProject,
    restoreProject: restoreProject,
}