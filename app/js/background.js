chrome.app.runtime.onLaunched.addListener(function (launchData) {
  var width = 245;
  var height = 80;

  chrome.app.window.create('selectFs.html', {
    minWidth: width,
    minHeight: height,
    maxWidth: width,
    maxHeight: height,
    width: width,
    height: height,
  }, function (win) {
  });
});


//chrome.runtime.onInstalled.addListener(function() {
//  console.log('INSTALLED');
//});


//chrome.experimental.identity.getAuthToken(function(token) {
//  console.log('token', token);
//
//});
