var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('ScheduleController', ['$rootScope', '$scope', '$http',
    'LocalStorage', 'ScheduleHttpService', function($rootScope, $scope, $http,
        localStorage, scheduleHttpService) {
        scheduleHttpService.getScheduleForUser(1).then(function(classData) {
            localStorage.set('classData', classData);
            $scope.timeSlots = $scope.getTimeSlots(classData);
        });

        $scope.getTimeSlots = function(classData) {
            var timeSlots = [];
            for (var i = 8; i <= 19; i++) {
                var hours = i.toString();
                if (i < 10) {
                    hours = '0' + i;
                }
                for (var j = 0; j <= 30; j += 30) {
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
                    var delimStartTime = classStartTime.indexOf(':');
                    var classStartHours = parseInt(
                        classStartTime.substring(0, delimStartTime)
                    );
                    var classStartMins = parseInt(
                        classStartTime.substring(delimStartTime + 1)
                    );
                    var roundedStartMins = classStartMins - (classStartMins % 15);
                    if (classStartHours === timeSlots[i]['hours'] && 
                        roundedStartMins === timeSlots[i]['minutes']) {
                        timeSlots[i].classes.push(classData[j]);
                    }
                }
            }
            return timeSlots;
        };

        $scope.weekDays = ['M', 'T', 'W', 'R', 'F'];

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

        $scope.$watch(function() {
            return localStorage.get('classData');
        }, function(newValue, oldValue) {
            $scope.classData = newValue;
        }, true);
}]);