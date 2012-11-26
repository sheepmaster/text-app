var connect = require('connect');
var http = require('http');
var Path = require('path');
var url = require('url');

function error(res, status, msg) {
  msg = msg || http.STATUS_CODES[status];
  res.statusCode = status;
  res.end(msg);
}

function redirect(req, res) {
  if (req.url == '/') {
    res.statusCode = 301;
    res.setHeader('Location', '/static/index.html');
    res.end();
  }
}

function decode(path) {
  try {
    return decodeURIComponent(path);
  } catch (err) {
    return null;
  }
}

function cat(path, res) {
  var stream = fs.createReadStream(path);
  stream.on('error', function(err) {
    if (err.code == 'ENOENT') {
      error(res, 404, 'File not found: \'' + path + '\'');
      return;
    }
    error(res, 500, JSON.stringify(err))
  })
  stream.on('open', function() {
    res.writeHead(200, {'Content-Type': 'text/plain'});
  });
  stream.pipe(res);
}

function ls(dir, res) {
  Q.ncall(fs.readdir, fs, dir).then(function(files) {
    return Q.all(files.map(function(file) {
      return Q.ncall(fs.stat, fs, file).then(function(stat) {
        stat.file = file;
        return stat;
      });
    }));
  }).then(function(stats) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    var listing = stats.map(function(stat) {
      return {
        'file': stat.file,
        'is_dir': stat.isDirectory()
      };
    });
    res.end(pretty_print ? JSON.stringify(listing, null, '  ') :
                           JSON.stringify(listing));
  }, function(err) {
    error(res, 500, err);
  });
}

function echo(path, req, res) {
  var stream = fs.createWriteStream(path);
  stream.on('error', function(err) {
    if (err.code == 'ENOENT') {
      error(res, 404, 'File not found: \'' + path + '\'');
      return;
    }
    error(res, 500, JSON.stringify(err));
  });
  stream.on('open', function() {
    res.writeHead(200, {'Content-Type': 'text/plain'});
  });
  req.on('end', function() {
    // If we haven't thrown an error, end the response.
    if (res.writable)
      res.end();
  });
  req.pipe(stream);
}

function serve(dir, allowed_methods) {
  return function(req, res, next) {
    var path = decode(url.parse(req).pathname);
    if (!path)
      return error(res, 400);

    if (~path.indexOf('\0'))
      return error(res, 400);

    var full_path = Path.normalize(dir + path);
    if (full_path.substr(0, dir.length) != dir)
      return error(res, 403);

    var method = req.method;
    if (~allowed_methods.indexOf(method))
      return error(res, 501);

    switch(method) {
      case 'GET': {
        if (is_dir) {
          ls(full_path, res);
        } else {
          cat(full_path, res);
        }
        break;
      }
      case 'PUT': {
        echo(full_path, req, res);
        break;
      }
      default: {
        error(res, 501);
      }
    }
  };
}

var dir_to_serve = process.argv[2] || process.cwd();

var app = connect()
  .use('/static', serve(__dirname + 'app', ['GET']))
  .use('/api', serve(dir_to_serve, ['GET', 'PUT']))
  .use(redirect);

http.createServer(app).listen(8398, '127.0.0.1');
