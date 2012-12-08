TD.factory('chromeFs', function($rootScope, log, webDAVFs) {

  var endpoint = '/dav/';

  var fs = webDAVFs.create(endpoint);

  var saved_callback;

  function selectFile(for_saving, callback) {
    if (saved_callback) {
      console.error('Multiple selectFile calls');
      saved_callback();
    }

    saved_callback = callback;
    var unregister = $rootScope.$on('file_selected', function(event, path) {
      fs.root.getFile(path, null, callback);
      unregister();
      saved_callback = null;
    });

    $rootScope.$broadcast('select_file');
  }

  return {
    chooseFile: function(options, callback) {
      var type = options.type;
      switch (type) {
        case 'openWritableFile': {
          selectFile(false, callback);
          break;
        }
        case 'saveFile': {
          selectFile(true, callback);
          break;
        }
        default: {
          throw new Error('Unknown type ' + type);
        }
      }
    }
  };
});
