(function(exports) {

function Socket(socketId) {
  this.socketId_ = socketId;
  this.buffer_ = Q(new ArrayBuffer(0));
  this.refs_ = 0;
}

function readFromSocket(socketId) {
  var defered = Q.defer();
  chrome.socket.read(socketId, undefined, function(readInfo) {
    if (readInfo.resultCode < 0) {
      defered.reject('Read error: ' + readInfo.resultCode);
      return;
    }
    defered.resolve(readInfo.data);
  });
  return defered.promise;
}

Socket.prototype = {
  'readAndBuffer_': function(test) {
    var buffersToReturn = [];
    var lastBufferPromise = this.buffer_;
    var defered = Q.defer();
    this.buffer_ = defered.promise;
    var self = this;
    return lastBufferPromise.then(readAndBufferInternal);
    function readAndBufferInternal(lastBuffer) {
      var index = test(lastBuffer);
      if (typeof index != 'undefined') {
        buffersToReturn.push(new Uint8Array(lastBuffer.slice(0, index)));
        defered.resolve(lastBuffer.slice(index));
        return buffersToReturn;
      }
      buffersToReturn.push(new Uint8Array(lastBuffer));
      return readFromSocket(self.socketId_)
      .then(function(buf) {
        if (!buf) {
          defered.resolve();
          return buffersToReturn;
        }
        return readAndBufferInternal(buf);
      });
    }
  },

  'read': function(numBytes) {
    var length = 0;
    return this.readAndBuffer_(function(buf) {
      length += buf.byteLength;
      if (length >= numBytes)
        return numBytes - length;
    });
  },

  'readline': function() {
    return this.readAndBuffer_(function (buf) {
      var bytes = new Uint8Array(buf);
      var index = Array.prototype.indexOf.call(bytes, 10);
      if (index >= 0)
        return index + 1;
    });
  },

  'write': function(bufOrPromise) {
    var socketId = this.socketId_;
    return Q.when(bufOrPromise, function(buf) {
      var defered = Q.defer();
      chrome.socket.write(socketId, buf, function(writeInfo) {
        if (writeInfo.bytesWritten < 0) {
          defered.reject('Write error: ' + writeInfo.bytesWritten);
          return;
        }
        defered.resolve(writeInfo.bytesWritten);
      });
      return defered.promise;
    });
  },

  'close': function() {
    chrome.socket.disconnect(this.socketId_);
  }
};

function createServerSocket() {
  var defered = Q.defer();
  chrome.socket.create('tcp', {}, function(createInfo) {
    defered.resolve(createInfo.socketId);
  });
  return defered.promise;
}

function listenOnSocket(socketId, interface, port) {
  var defered = Q.defer();
  chrome.socket.listen(socketId, interface, port, undefined,
                       function(result) {
    if (result < 0) {
      defered.reject('Listen error: ' + result);
      return;
    }
    defered.resolve();
  });
  return defered.promise;
}

function createConnectionSocket(socketId) {
  var defered = Q.defer();
  chrome.socket.accept(socketId, function(acceptInfo) {
    if (acceptInfo.resultCode < 0) {
      defered.reject('Accept error: ' + acceptInfo.resultCode);
      return;
    }
    defered.resolve(acceptInfo.socketId);
  });
  return defered.promise;
}

function getStorage(key) {
  var defered = Q.defer();
  chrome.storage.local.get(key, function(data) {
    defered.resolve(data[key]);
  });
  return defered.promise;
}

function setStorage(key, value) {
  var defered = Q.defer();
  chrome.storage.local.set({key: value}, function() {
    defered.resolve();
  });
  return defered.promise;
}

function Server(interface, port) {
  this.interface_ = interface;
  this.port_ = port;
}

function getSocketInfo(socketId) {
  var defered = Q.defer();
  chrome.socket.getInfo(socketId, function(socketInfo) {
    defered.resolve(socketInfo);
  });
  return defered.promise;
}

Server.prototype = {
  'start': function(onConnected) {
    var interface = this.interface_;
    var port = this.port_;
    getStorage(interface + ':' + port)
    .then(function(socketId) {
      if (!socketId)
        return;

      return getSocketInfo(socketId).then(function(socketInfo) {
        if (socketInfo.localAddress === interface &&
            socketInfo.localPort === port) {
          return socketId;
        }
      });
    }).then(function(socketId) {
      if (socketId)
        return socketId;

      return createServerSocket().then(function(socketId) {
        return listenOnSocket(socketId, interface, port)
        .then(function() {
          setStorage(interface + ':' + port, socketId).done();
          return socketId;
        });
      });
    }).done(acceptConnection);
    function acceptConnection(socketId) {
      return createConnectionSocket(socketId)
      .then(function(clientSocketId) {
        var socket = new Socket(clientSocketId);
        Q.try(function() {
          return onConnected(socket);
        }).finally(function() {
          socket.close();
        }).done();
        return acceptConnection(socketId);
      });
    }
  }
};

exports.Server = Server;

})(window);
