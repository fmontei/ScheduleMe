var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('NavController', ['$scope', '$http', '$location',
    'LocalStorage', 'SemesterHttpService', function($scope, $http, $location, 
        localStorage, semesterHttpService) {
    $scope.changeSemester = function() {
        localStorage.set('selectedSemester', $scope.selectedSemester);
    };

    $scope.logout = function() {
        // TODO: invoke logout server call
        localStorage.clearAll();
        $location.path('/');
    };

    // Force logged-out/unregistered users to login before being allowed to
    // navigate to another part of the app.
    $scope.$watch(function() {
        return $location.path();
    }, function(newValue, oldValue) {
        if (!localStorage.get('user')) {
            $location.path('/');
        }
    });

    $scope.$watch(function() {
        return localStorage.get('allSemesters');
    }, function(newValue, oldValue) {
        $scope.allSemesters = newValue;
    }, true);

    $scope.$watch(function() {
        return localStorage.get('user');
    }, function(newValue, oldValue) {
        $scope.user = newValue;
    }, true);
}]);