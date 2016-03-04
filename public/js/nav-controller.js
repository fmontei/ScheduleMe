var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('NavController', ['$scope', '$http',
    'LocalStorage', 'SemesterHttpService', function($scope, $http, localStorage,
        semesterHttpService) {

    $scope.getAllSemesters = function() {
        semesterHttpService.getAllSemesters().then(function(allSemesters) {
            localStorage.set('allSemesters', allSemesters);
        });
    };

    $scope.changeSemester = function() {
        console.log($scope.selectedSemester);
        localStorage.set('selectedSemester', $scope.selectedSemester);
    };

    $scope.getAllSemesters();

    $scope.$watch(function() {
        return localStorage.get('allSemesters');
    }, function(newValue, oldValue) {
        $scope.allSemesters = newValue;
    }, true);
}]);