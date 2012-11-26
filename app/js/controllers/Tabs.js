TD.controller('Tabs', function($scope, tabs, settings, appWindow) {

  $scope.tabs = tabs;


  $scope.$on('quit', function() {
    $scope.quit();
  });

  $scope.$on('close', function() {
    tabs.close();
  });

  $scope.$on('new', function() {
    tabs.add();
  });

  $scope.$on('save', function() {
    tabs.saveCurrent();
  });

  $scope.$on('open', function() {
    tabs.open();
  });
});
