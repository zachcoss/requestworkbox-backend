const
    ValidateStorage = require('../validate/Storage');

module.exports = {
    createStorage: async (req, res, next) => {
        try {
            const payload = ValidateStorage.createStorage.validate(req)
            const request = await ValidateStorage.createStorage.request(payload)
            return ValidateStorage.createStorage.response(request, res)
        } catch (err) {
            return ValidateStorage.createStorage.error(err, res)
        }
    },
    listStorages: async (req, res, next) => {
        try {
            const payload = ValidateStorage.listStorages.validate(req)
            const request = await ValidateStorage.listStorages.request(payload)
            return ValidateStorage.listStorages.response(request, res)
        } catch (err) {
            return ValidateStorage.listStorages.error(err, res)
        }
    },
    getStorage: async (req, res, next) => {
        try {
            const payload = ValidateStorage.getStorage.validate(req)
            const request = await ValidateStorage.getStorage.request(payload)
            return ValidateStorage.getStorage.response(request, res)
        } catch (err) {
            return ValidateStorage.getStorage.error(err, res)
        }
    },
    getTextStorageData: async (req, res, next) => {
        try {
            const payload = ValidateStorage.getTextStorageData.validate(req)
            const request = await ValidateStorage.getTextStorageData.request(payload)
            return ValidateStorage.getTextStorageData.response(request, res)
        } catch (err) {
            return ValidateStorage.getTextStorageData.error(err, res)
        }
    },
    getFileStorageData: async (req, res, next) => {
        try {
            const payload = ValidateStorage.getFileStorageData.validate(req)
            const request = await ValidateStorage.getFileStorageData.request(payload)
            return ValidateStorage.getFileStorageData.response(request, res)
        } catch (err) {
            return ValidateStorage.getFileStorageData.error(err, res)
        }
    },
    updateTextStorageData: async (req, res, next) => {
        try {
            const payload = ValidateStorage.updateTextStorageData.validate(req)
            const request = await ValidateStorage.updateTextStorageData.request(payload)
            return ValidateStorage.updateTextStorageData.response(request, res)
        } catch (err) {
            return ValidateStorage.updateTextStorageData.error(err, res)
        }
    },
    updateFileStorageData: async (req, res, next) => {
        try {
            const payload = ValidateStorage.updateFileStorageData.validate(req)
            const request = await ValidateStorage.updateFileStorageData.request(payload)
            return ValidateStorage.updateFileStorageData.response(request, res)
        } catch (err) {
            return ValidateStorage.updateFileStorageData.error(err, res)
        }
    },
    saveStorageChanges: async (req, res, next) => {
        try {
            const payload = ValidateStorage.saveStorageChanges.validate(req)
            const request = await ValidateStorage.saveStorageChanges.request(payload)
            return ValidateStorage.saveStorageChanges.response(request, res)
        } catch (err) {
            return ValidateStorage.saveStorageChanges.error(err, res)
        }
    },
    archiveStorage: async (req, res, next) => {
        try {
            const payload = ValidateStorage.archiveStorage.validate(req)
            const request = await ValidateStorage.archiveStorage.request(payload)
            return ValidateStorage.archiveStorage.response(request, res)
        } catch (err) {
            return ValidateStorage.archiveStorage.error(err, res)
        }
    },
    restoreStorage: async (req, res, next) => {
        try {
            const payload = ValidateStorage.restoreStorage.validate(req)
            const request = await ValidateStorage.restoreStorage.request(payload)
            return ValidateStorage.restoreStorage.response(request, res)
        } catch (err) {
            return ValidateStorage.restoreStorage.error(err, res)
        }
    },
    getStorageUsage: async (req, res, next) => {
        try {
            const payload = ValidateStorage.getStorageUsage.validate(req)
            const request = await ValidateStorage.getStorageUsage.request(payload)
            return ValidateStorage.getStorageUsage.response(request, res)
        } catch (err) {
            return ValidateStorage.getStorageUsage.error(err, res)
        }
    },
}