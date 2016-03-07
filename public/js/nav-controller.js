var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('NavController', ['$scope', '$http',
    'LocalStorage', 'SemesterHttpService', function($scope, $http, localStorage,
        semesterHttpService) {
    $scope.changeSemester = function() {
        localStorage.set('selectedSemester', $scope.selectedSemester);
    };

    $scope.$watch(function() {
        return localStorage.get('allSemesters');
    }, function(newValue, oldValue) {
        $scope.allSemesters = newValue;
    }, true);
}]);