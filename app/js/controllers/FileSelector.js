TD.controller('FileSelector', function($scope, $rootScope, focus) {

  $scope.isFileSelectorVisible = false;

  $scope.cancelFileSelector = function() {
    $scope.isFileSelectorVisible = false;
    editor.focus();
  }

  $scope.fileSelected = function() {
    $rootScope.$broadcast('file_selected', $scope.file);
    $scope.file = '';
    $scope.cancelFileSelector();
  };

  $scope.$on('search', function() {
    $scope.cancelFileSelector();
  });

  $scope.$on('select_file', function() {
    $scope.isFileSelectorVisible = true;
    focus('input[ng-model=file]');
  });

});
