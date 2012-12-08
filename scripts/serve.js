var connect = require('connect');
var http = require('http');
var jsDAV = require('jsDAV/lib/jsdav');
var Path = require('path');

function redirect(req, res, next) {
  if (req.url == '/') {
    res.statusCode = 301;
    res.setHeader('Location', '/static/index.html');
    res.end();
    return;
  }
  next();
}

function serveDAV(dir) {
  var mount = jsDAV.mount({
    'node': dir,
    'sandboxed': true,
    'server': {},
    'standalone': false,
  });
  return mount.exec.bind(mount);
}

var dir_to_serve = process.argv[2] || process.cwd();

var app = connect()
  .use('/static', connect.static(Path.normalize(__dirname + '/../app')))
  .use('/dav', serveDAV(dir_to_serve))
  .use(redirect);

http.createServer(app).listen(8398, '127.0.0.1');
