var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('CourseOffController', ['$rootScope', '$scope', '$http',
    'LocalStorage', 'ScheduleHttpService', function($rootScope, $scope, $http,
        localStorage, scheduleHttpService) {

    $scope.addSectionToSchedule = function(section_id, schedule_id) {
        scheduleHttpService.addSectionToSchedule(section_id, schedule_id).
            then(function(response)) {
            console.log(response);     
         });
    };
}]);