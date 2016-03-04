var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('ScheduleController', ['$rootScope', '$scope', '$http',
    'LocalStorage', 'ScheduleHttpService', function($rootScope, $scope, $http,
        localStorage, scheduleHttpService) {
        scheduleHttpService.getScheduleForUser(1).then(function(classData) {
            console.log(JSON.stringify(classData))
            localStorage.set('classData', classData);
        });

        $scope.$watch(function() {
            return localStorage.get('classData');
        }, function(newValue, oldValue) {
            $scope.classData = newValue;
        }, true);
}]);