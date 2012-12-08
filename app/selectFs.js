function openApp(url) {
  chrome.app.window.create('index.html', {
    frame: 'none',
    minWidth: 400,
    minHeight: 400,
    width: 700,
    height: 750,
    left: 0,
    top: 0
  }, function (win) {
    win.webDAVUrl = url;
    window.close();
  });
}

function submit() {
  openApp(document.getElementById('url').value);
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('go').onclick = submit;
  document.getElementById('url').onkeyup = function(e) {
    if (e.charCode == 13)
      submit();
  };
  document.getElementById('url').focus();
});
