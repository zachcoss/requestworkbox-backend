const 
    createStorage = require('./StorageCreateStorage'),
    listStorages = require('./StorageListStorages'),
    getStorage = require('./StorageGetStorage'),
    getTextStorageData = require('./StorageGetTextStorageData'),
    getFileStorageData = require('./StorageGetFileStorageData'),
    updateTextStorageData = require('./StorageUpdateTextStorageData'),
    updateFileStorageData = require('./StorageUpdateFileStorageData'),
    saveStorageChanges = require('./StorageSaveStorageChanges'),
    archiveStorage = require('./StorageArchiveStorage'),
    restoreStorage = require('./StorageRestoreStorage'),
    getStorageUsage = require('./StorageGetStorageUsage');

module.exports = {
    createStorage: createStorage,
    listStorages: listStorages,
    getStorage: getStorage,
    getTextStorageData: getTextStorageData,
    getFileStorageData: getFileStorageData,
    updateTextStorageData: updateTextStorageData,
    updateFileStorageData: updateFileStorageData,
    saveStorageChanges: saveStorageChanges,
    archiveStorage: archiveStorage,
    restoreStorage: restoreStorage,
    getStorageUsage: getStorageUsage,
}