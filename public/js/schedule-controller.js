var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('ScheduleController', ['$rootScope', '$scope', '$http',
    'LocalStorage', 'ScheduleHttpService', function($rootScope, $scope, $http,
        localStorage, scheduleHttpService) {
        $scope.getTimeSlots = function() {
            var classData = localStorage.get('classData'),
                timeSlots = [];
            for (var i = 7; i <= 19; i++) {
                var hours = i.toString();
                if (i < 10) {
                    hours = '0' + i;
                }
                for (var j = 0; j < 60; j += 60) {
                    var minutes = j.toString();
                    if (j < 10) {
                        minutes = '0' + j;
                    }
                    timeSlots.push({
                        'hours': i,
                        'minutes': j,
                        'time': hours + ':' + minutes,
                        'classes': []
                    });
                }
            }
            for (var i = 0; i < timeSlots.length; i++) {
                for (var j = 0; j < classData.length; j++) {
                    var classStartTime = classData[j]['start_time'];
                    var classEndTime = classData[j]['end_time']
                    var delimStartTime = classStartTime.indexOf(':');
                    var delimEndTime = classEndTime.indexOf(':');
                    var classStartHours = parseInt(
                        classStartTime.substring(0, delimStartTime)
                    );
                    var classEndHours = parseInt(
                        classEndTime.substring(0, delimEndTime)
                    );
                    var classStartMins = parseInt(
                        classStartTime.substring(delimStartTime + 1)
                    );
                    var classEndMins = parseInt(
                        classEndTime.substring(delimEndTime + 1)
                    );
                    var roundedStartMins = classStartMins - (classStartMins % 60);
                    var roundedEndMins = classEndMins - (classEndMins % 60);
                    if (classStartHours === timeSlots[i]['hours'] &&
                        roundedStartMins === timeSlots[i]['minutes']) {
                        timeSlots[i].classes.push(classData[j]);
                    }
                    if (i > 0 &&
                        timeSlots[i - 1].classes.indexOf(classData[j]) !== -1 &&
                        timeSlots[i]['hours'] <= classEndHours &&
                        timeSlots[i]['minutes'] <= roundedEndMins) {
                        timeSlots[i].classes.push(classData[j]);
                    }
                }
            }
            return timeSlots;
        };
        
        $scope.addSectionToSchedule = function(section_id, schedule_id) {
            scheduleHttpService.addSectionToSchedule(section_id, schedule_id).
                then(function(response) {
                console.log(response);     
             });
        };

        $scope.formatTime = function(time) {
            var hours = parseInt(time.substring(0, time.indexOf(':'))),
                mins = time.substring(time.indexOf(':') + 1),
                meridian = 'am';
            if (hours > 12) {
                hours -= 12;
                meridian = 'pm';
            }
            return hours + ':' + mins + ' ' + meridian;
        };

        $scope.weekDays = ['M', 'T', 'W', 'R', 'F'];
        $scope.timeSlots = $scope.getTimeSlots();

        $scope.$watch(function() {
            return localStorage.get('classData');
        }, function(newValue, oldValue) {
        }, true);

        $scope.$watch(function() {
            return localStorage.get('groupedClassData');
        }, function(newValue, oldValue) {
            $scope.groupedClassData = newValue;
        }, true);
}]);