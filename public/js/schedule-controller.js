var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('ScheduleController', ['$location', '$scope', '$http',
    'LocalStorage', 'ScheduleHttpService', function($location, $scope, $http,
        localStorage, scheduleHttpService) {
        $scope.getTimeSlots = function(scheduleData) {
            var timeSlots = [];
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
                for (var j = 0; j < scheduleData.length; j++) {
                    var classStartTime = scheduleData[j]['start_time'];
                    var classEndTime = scheduleData[j]['end_time']
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
                        timeSlots[i].classes.push(scheduleData[j]);
                    }
                    if (i > 0 &&
                        timeSlots[i - 1].classes.indexOf(scheduleData[j]) !== -1 &&
                        timeSlots[i]['hours'] <= classEndHours &&
                        timeSlots[i]['minutes'] <= roundedEndMins) {
                        timeSlots[i].classes.push(scheduleData[j]);
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

        $scope.getTempSchedule = function(count) {
            if (count === 'prev') {
                count = $scope.tempScheduleCount - 1;
            } else if (count === 'next') {
                count = $scope.tempScheduleCount + 1;
            }
            if (count >= 0 && count < $scope.tempScheduleData.length) {
                $scope.tempScheduleCount = count;
                localStorage.set('tempScheduleCount', count);
                var schedule = $scope.tempScheduleData[$scope.tempScheduleCount]['raw'];
                $scope.timeSlots = $scope.getTimeSlots(schedule);
            } 
        };

        $scope.getSavedSchedule = function(count) {
            if (count === 'prev') {
                count = $scope.savedScheduleCount - 1;
            } else if (count === 'next') {
                count = $scope.savedScheduleCount + 1;
            }
            if (count >= 0 && count < $scope.savedScheduleData.length) {
                $scope.savedScheduleCount = count;
                localStorage.set('savedScheduleCount', count);
                var schedule = $scope.savedScheduleData[$scope.savedScheduleCount]['raw'];
                $scope.timeSlots = $scope.getTimeSlots(schedule);
            } 
        };

        $scope.saveSchedule = function() {
            var schedule = $scope.tempScheduleData[$scope.tempScheduleCount]['raw'];
            var sectionIDs = [];
            for (var i = 0; i < schedule.length; i++) {
                if (sectionIDs.indexOf(schedule[i]['section_id']) === -1) {
                    sectionIDs.push(schedule[i]['section_id']);
                }
            }
            scheduleHttpService.saveSchedule(sectionIDs).then(function(result) {
                console.log(result);
                if (result) {
                    $location.path('/');
                }
            });
        };

        $scope.weekDays = ['M', 'T', 'W', 'R', 'F'];

        $scope.$watch(function() {
            return localStorage.get('savedScheduleData');
        }, function(newValue, oldValue) {
            $scope.savedScheduleData = newValue;
            if (newValue && newValue.length > 0) {
                $scope.getSavedSchedule(0);
            }
        }, true);

        $scope.$watch(function() {
            return localStorage.get('tempScheduleData');
        }, function(newValue, oldValue) {
            $scope.tempScheduleData = newValue;
            if (newValue && newValue.length > 0) {
                $scope.getTempSchedule(0);
            }
        }, true);
}]);