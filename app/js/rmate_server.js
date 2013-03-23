(function() {

function readLineAndChomp(socket) {
  return socket.readline()
  .then(function(bufs) {
    return bufs.map(function(buf) {
      return String.fromCharCode.apply(null, buf);
    }).join('').replace(/\n$/, '');
  });
}

function encodeString(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i=0; i<str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function blobToArrayBuffer(blob) {
  var defered = Q.defer();
  var f = new FileReader();
  f.onload = function(e) {
    defered.resolve(e.target.result);
  };
  f.readAsArrayBuffer(blob);
  return defered.promise;
}

function RMateFileWriter(socket, token) {
  this.socket_ = socket;
  this.token_ = token;
}

RMateFileWriter.prototype = {
  'write': function(blob) {
    var socket = this.socket_;
    var onwrite = this.onwrite;
    blobToArrayBuffer(
        new Blob(['save\n' +
                  'token: ' + this.token_ + '\n' +
                  'data: ' + blob.size + '\n',
                 blob,
                 '\n']))
    .then(function(buf) {
      socket.write(buf);
    })
    .done(function() {
      if (onwrite)
        onwrite(new ProgressEvent('load'));
    });
  },

  'truncate': function(size) {
    if (this.onwrite)
      this.onwrite(new ProgressEvent('loadend'));
  }
}

function RMateFileEntry(params, blob, socket) {
  this.socket_ = socket;
  this.blob_ = blob;
  this.closed_ = Q.defer();
  this.fullPath = params.token;
  this.name = params['display-name'];
}

RMateFileEntry.prototype = {
  file: function(callback) {
    callback(this.blob_);
  },

  createWriter: function(successCallback, errorCallback) {
    successCallback(new RMateFileWriter(this.socket_, this.fullPath));
  },

  close: function() {
    this.closed_.resolve();
  },

  get closed() {
    return this.closed_.promise;
  }
};

function handleRMateConnection(socket) {
  var handles = [];
  var entries = [];
  var greeting = '220 localhost RMATE TextHyperDrive (Chrome XXX)\n';
  return socket.write(encodeString(greeting))
  .then(readFile).then(function() {
    background.openEntries(entries);
    return Q.all(handles);
  });
  function readFile() {
    return readLineAndChomp(socket)
    .then(function(command) {
      if (command == '.')
        return;  // Finished reading files.

      if (command != 'open')
        throw new Error('Unexpected command "' + command + '"');

      var params = {};
      var file;
      return readParams();
      function readParams() {
        return readLineAndChomp(socket)
        .then(function(line) {
          if (!line) {
            // Finished reading a single file.
            var fileEntry = new RMateFileEntry(params, file, socket);
            entries.push(fileEntry);
            handles.push(fileEntry.closed);
            return readFile();
          }

          var match = line.match('(.*): (.*)');
          if (!match)
            throw new Error('Invalid param line: "' + line + '"');

          var key = match[1];
          var value = match[2];
          var cont;
          if (key == 'data') {
            var numBytes = Number(value);
            cont = socket.read(numBytes)
            .then(function(bufs) {
              file = new Blob(bufs);
              // If the blob doesn't end with a newline, we expect one
              // afterwards.
              var lastBuf = bufs[bufs.length - 1];
              if (lastBuf && lastBuf[lastBuf.length - 1] != 10) {
                return socket.read(1)
                .then(function(bufs) {
                  if (bufs[0][0] != 10) {
                    throw new Error('Expected newline, got "' + bufs[0][0] +
                                    '"');
                  }
                });
              }
            });
          } else {
            params[key] = value;
          }
          return Q.when(cont, readParams);
        });
      }
    });
  }
}

new Server('rmate', handleRMateConnection).start('127.0.0.1', 52698);

})();
