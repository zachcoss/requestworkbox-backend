const
    ValidateStorage = require('../validate/Storage');

module.exports = {
    createStorage: async (req, res, next) => {
        try {
            const payload = ValidateStorage.createStorage.validate(req)
            const authorize = await ValidateStorage.createStorage.authorize(payload)
            const request = await ValidateStorage.createStorage.request(authorize)
            return ValidateStorage.createStorage.response(request, res)
        } catch (err) {
            return ValidateStorage.createStorage.error(err, res)
        }
    },
    listStorages: async (req, res, next) => {
        try {
            const payload = ValidateStorage.listStorages.validate(req)
            const authorize = await ValidateStorage.listStorages.authorize(payload)
            const request = await ValidateStorage.listStorages.request(authorize)
            return ValidateStorage.listStorages.response(request, res)
        } catch (err) {
            return ValidateStorage.listStorages.error(err, res)
        }
    },
    getStorage: async (req, res, next) => {
        try {
            const payload = ValidateStorage.getStorage.validate(req)
            const authorize = await ValidateStorage.getStorage.authorize(payload)
            const request = await ValidateStorage.getStorage.request(authorize)
            return ValidateStorage.getStorage.response(request, res)
        } catch (err) {
            return ValidateStorage.getStorage.error(err, res)
        }
    },
    getTextStorageData: async (req, res, next) => {
        try {
            const payload = ValidateStorage.getTextStorageData.validate(req)
            const authorize = await ValidateStorage.getTextStorageData.authorize(payload)
            const request = await ValidateStorage.getTextStorageData.request(authorize)
            return ValidateStorage.getTextStorageData.response(request, res)
        } catch (err) {
            return ValidateStorage.getTextStorageData.error(err, res)
        }
    },
    getFileStorageData: async (req, res, next) => {
        try {
            const payload = ValidateStorage.getFileStorageData.validate(req)
            const authorize = await ValidateStorage.getFileStorageData.authorize(payload)
            const request = await ValidateStorage.getFileStorageData.request(authorize)
            return ValidateStorage.getFileStorageData.response(request, res)
        } catch (err) {
            return ValidateStorage.getFileStorageData.error(err, res)
        }
    },
    updateTextStorageData: async (req, res, next) => {
        try {
            const payload = ValidateStorage.updateTextStorageData.validate(req)
            const authorize = await ValidateStorage.updateTextStorageData.authorize(payload)
            const request = await ValidateStorage.updateTextStorageData.request(authorize)
            return ValidateStorage.updateTextStorageData.response(request, res)
        } catch (err) {
            return ValidateStorage.updateTextStorageData.error(err, res)
        }
    },
    updateFileStorageData: async (req, res, next) => {
        try {
            const payload = ValidateStorage.updateFileStorageData.validate(req)
            const authorize = await ValidateStorage.updateFileStorageData.authorize(payload)
            const request = await ValidateStorage.updateFileStorageData.request(authorize)
            return ValidateStorage.updateFileStorageData.response(request, res)
        } catch (err) {
            return ValidateStorage.updateFileStorageData.error(err, res)
        }
    },
    saveStorageChanges: async (req, res, next) => {
        try {
            const payload = ValidateStorage.saveStorageChanges.validate(req)
            const authorize = await ValidateStorage.saveStorageChanges.authorize(payload)
            const request = await ValidateStorage.saveStorageChanges.request(authorize)
            return ValidateStorage.saveStorageChanges.response(request, res)
        } catch (err) {
            return ValidateStorage.saveStorageChanges.error(err, res)
        }
    },
    archiveStorage: async (req, res, next) => {
        try {
            const payload = ValidateStorage.archiveStorage.validate(req)
            const authorize = await ValidateStorage.archiveStorage.authorize(payload)
            const request = await ValidateStorage.archiveStorage.request(authorize)
            return ValidateStorage.archiveStorage.response(request, res)
        } catch (err) {
            return ValidateStorage.archiveStorage.error(err, res)
        }
    },
    restoreStorage: async (req, res, next) => {
        try {
            const payload = ValidateStorage.restoreStorage.validate(req)
            const authorize = await ValidateStorage.restoreStorage.authorize(payload)
            const request = await ValidateStorage.restoreStorage.request(authorize)
            return ValidateStorage.restoreStorage.response(request, res)
        } catch (err) {
            return ValidateStorage.restoreStorage.error(err, res)
        }
    },
    getStorageUsage: async (req, res, next) => {
        try {
            const payload = ValidateStorage.getStorageUsage.validate(req)
            const authorize = await ValidateStorage.getStorageUsage.authorize(payload)
            const request = await ValidateStorage.getStorageUsage.request(authorize)
            return ValidateStorage.getStorageUsage.response(request, res)
        } catch (err) {
            return ValidateStorage.getStorageUsage.error(err, res)
        }
    },
}