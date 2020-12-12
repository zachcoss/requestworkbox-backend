const 
    createProject = require('./ProjectCreateProject'),
    getProjects = require('./ProjectGetProjects'),
    getProject = require('./ProjectGetProject'),
    updateProject = require('./ProjectUpdateProject'),
    archiveProject = require('./ProjectArchiveProject'),
    restoreProject = require('./ProjectRestoreProject');

module.exports = {
    createProject: createProject,
    getProjects: getProjects,
    getProject: getProject,
    updateProject: updateProject,
    archiveProject: archiveProject,
    restoreProject: restoreProject,
}