TD.factory('fileSelectorUI', function($rootScope, log, webDAVFs) {

  function fileSelectorUI(endpoint) {
    this.fs = webDAVFs.create(endpoint);
  }

  fileSelectorUI.prototype.chooseFile = function(options, callback) {
    var type = options.type;
    switch (type) {
      case 'openWritableFile': {
        this.selectFile(false, callback);
        break;
      }
      case 'saveFile': {
        this.selectFile(true, callback);
        break;
      }
      default: {
        throw new Error('Unknown type ' + type);
      }
    }
  };

  fileSelectorUI.prototype.selectFile = function(for_saving, callback) {
    if (this.saved_callback) {
      console.error('Multiple selectFile calls');
      this.saved_callback();
    }

    this.saved_callback = callback;
    var self = this;
    var unregister = $rootScope.$on('file_selected', function(event, path) {
      self.fs.root.getFile(path, null, callback);
      unregister();
      self.saved_callback = null;
    });

    $rootScope.$broadcast('select_file');
  };

  return fileSelectorUI;
});
