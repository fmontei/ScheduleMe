var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('NavController', ['$scope', '$http', '$location',
    'LocalStorage', 'SemesterHttpService', function($scope, $http, $location, 
        localStorage, semesterHttpService) {
    $scope.changeSemester = function() {
        localStorage.set('selectedSemester', $scope.selectedSemester);
    };

    $scope.logout = function() {
        localStorage.clearAll();
        $location.path('/');
    };

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