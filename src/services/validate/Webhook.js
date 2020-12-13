const 
    createWebhook = require('./WebhookCreateWebhook'),
    listWebhooks = require('./WebhookListWebhooks'),
    getWebhook = require('./WebhookGetWebhook'),
    saveWebhookChanges = require('./WebhookSaveWebhookChanges'),
    getWebhookDetails = require('./WebhookGetWebhookDetails'),
    acceptWebhook = require('./WebhookAcceptWebhook'),
    downloadWebhookDetail = require('./WebhookDownloadWebhookDetail');

module.exports = {
    createWebhook: createWebhook,
    listWebhooks: listWebhooks,
    getWebhook: getWebhook,
    saveWebhookChanges: saveWebhookChanges,
    getWebhookDetails: getWebhookDetails,
    acceptWebhook: acceptWebhook,
    downloadWebhookDetail: downloadWebhookDetail,
}