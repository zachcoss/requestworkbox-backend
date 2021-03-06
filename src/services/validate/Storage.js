const 
    createStorage = require('./StorageCreateStorage'),
    listStorages = require('./StorageListStorages'),
    getStorage = require('./StorageGetStorage'),
    getStorageData = require('./StorageGetStorageData'),
    updateTextStorageData = require('./StorageUpdateTextStorageData'),
    updateFileStorageData = require('./StorageUpdateFileStorageData'),
    archiveStorage = require('./StorageArchiveStorage'),
    restoreStorage = require('./StorageRestoreStorage'),
    saveStorageChanges = require('./StorageSaveStorageChanges');
    

module.exports = {
    createStorage: createStorage,
    listStorages: listStorages,

    getStorage: getStorage,
    getStorageData: getStorageData,

    updateTextStorageData: updateTextStorageData,
    updateFileStorageData: updateFileStorageData,

    archiveStorage: archiveStorage,
    restoreStorage: restoreStorage,
    saveStorageChanges: saveStorageChanges,
}