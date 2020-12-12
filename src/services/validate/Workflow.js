const 
    createWorkflow = require('./WorkflowCreateWorkflow'),
    listWorkflows = require('./WorkflowListWorkflows'),
    getWorkflow = require('./WorkflowGetWorkflow'),
    saveWorkflowChanges = require('./WorkflowSaveWorkflowChanges'),
    addWorkflowTask = require('./WorkflowAddWorkflowTask'),
    deleteWorkflowTask = require('./WorkflowDeleteWorkflowTask'),
    archiveWorkflow = require('./WorkflowArchiveWorkflow'),
    restoreWorkflow = require('./WorkflowRestoreWorkflow');

module.exports = {
    createWorkflow: createWorkflow,
    listWorkflows: listWorkflows,
    getWorkflow: getWorkflow,
    saveWorkflowChanges: saveWorkflowChanges,
    addWorkflowTask: addWorkflowTask,
    deleteWorkflowTask: deleteWorkflowTask,
    archiveWorkflow: archiveWorkflow,
    restoreWorkflow: restoreWorkflow,
}