TD.controller('App', function($scope, settings, editor, focus, $rootScope) {

  $scope.settings = settings;

  $scope.isSettingsVisible = false;
  $scope.isSearchVisible = false;
  $scope.isFileSelectorVisible = false;

  $scope.toggleSearch = function(value) {
    $scope.isSearchVisible = angular.isDefined(value) ? value : !$scope.isSearchVisible;

    if ($scope.isSearchVisible) {
      focus('input[ng-model=search]');
      $scope.isFileSelectorVisible = false;
    } else {
      $scope.search = '';
      editor.clearFilter();
      editor.focus();
    }
  };


  $scope.doSearch = function() {
    if (!$scope.search) {
      return;
    }

    if ($scope.search.charAt(0) === ':') {
      var lineNumber = parseInt($scope.search.substr(1), 10);
      if (lineNumber) {
        editor.goToLine(lineNumber);
      }
    } else if ($scope.search.charAt(0) === '/') {
      var filter = $scope.search.substr(1);
      if (filter.length >= 3) {
        // TODO(vojta): delay
        editor.filter(new RegExp(filter, filter.toLowerCase() === filter ? 'i' : ''));
      } else {
        editor.clearFilter();
      }
    } else {
      editor.find($scope.search);
    }
  };


  $scope.searchPrevious = function() {
    if (!$scope.search || $scope.search.charAt(0) === '/' || $scope.search.charAt(0) === ':') {
      return;
    }

    editor.findPrevious();
  };


  $scope.searchNext = function() {
    if (!$scope.search || $scope.search.charAt(0) === '/' || $scope.search.charAt(0) === ':') {
      return;
    }

    editor.findNext();
  };


  $scope.enterSearch = function() {
    if (!$scope.search) {
      return;
    }

    if ($scope.search.charAt(0) === '/') {
      editor.goToFirstFiltered();
      editor.focus();
    } else if ($scope.search.charAt(0) === ':') {
      $scope.toggleSearch(false);
    } else {
      editor.findNext();
    }
  };

  $scope.openFileSelector = function() {
    $scope.isSearchVisible = false;
    $scope.isFileSelectorVisible = true;
    focus('input[ng-model=file]');
  }

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
    $scope.toggleSearch();
    $scope.cancelFileSelector();
  });

  $scope.$on('select_file', function() {
    $scope.openFileSelector();
  });

  $scope.$on('tab_deselected', function() {
    $scope.toggleSearch(false);
  });
});
