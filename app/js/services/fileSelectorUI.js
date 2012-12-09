TD.factory('fileSelectorUI', function($rootScope, log) {

  function fileSelectorUI(fs) {
    this.fs = fs;
  }

  fileSelectorUI.prototype.chooseFile = function(options, callback) {
    var type = options.type;
    switch (type) {
      case 'openWritableFile': {
        this.selectFile_(false, callback);
        break;
      }
      case 'saveFile': {
        this.selectFile_(true, callback);
        break;
      }
      default: {
        throw new Error('Unknown type ' + type);
      }
    }
  };

  fileSelectorUI.prototype.selectFile_ = function(for_saving, callback) {
    if (this.saved_callback) {
      console.error('Multiple selectFile calls');
      this.saved_callback();
    }

    this.saved_callback = callback;
    var self = this;
    var unregister = $rootScope.$on('file_selected', function(event, path) {
      var flags = {
        'create': for_saving,
      };
      self.fs.root.getFile(path, flags, callback, function(error) {
        console.error(error);
        callback();
      });
      unregister();
      self.saved_callback = null;
    });

    $rootScope.$broadcast('select_file');
  };

  return fileSelectorUI;
});
