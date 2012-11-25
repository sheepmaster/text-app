/**
 * Platform Access to native FS
 * https://docs.google.com/a/google.com/document/d/1B3Bbns0vP6lx7w8agrIZbSgfMsfQJc5dqv34_z5ARQY/edit?pli=1
 */

TD.factory('chromeFs', function($q, $rootScope, log) {
  return {
    chooseFile: function(options, callback) {
      var type = options.type;
      switch (type) {
        case 'openWritableFile': {
          callback({
            'fullPath': 'hello.txt',
            'name': 'hello.txt'
          });
          break;
        }
        case 'saveFile': {
          break;
        }
        default: {
          
        }
      }
    }
  };
});
