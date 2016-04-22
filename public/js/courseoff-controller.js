var scheduleMeApp = angular.module('ScheduleMeApp');

/*
 * Controller for /courseoff screen -- used strictly for testing purposes.
 */
scheduleMeApp.controller('CourseOffController', ['$rootScope', '$scope', '$http',
    'LocalStorage', 'ScheduleHttpService', function($rootScope, $scope, $http,
        localStorage, scheduleHttpService) {

    $scope.addSectionToSchedule = function(section_id, schedule_id) {
        scheduleHttpService.addSectionToSchedule(section_id, schedule_id).
            then(function(response) {
            console.log(JSON.stringify(response));   
         });
    };
    
    $scope.removeSectionFromSchedule = function(section_id, schedule_id) {
        scheduleHttpService.removeSectionFromSchedule(section_id, schedule_id).
            then(function(response) {
            console.log(JSON.stringify(response));   
         });
    };
}]);
