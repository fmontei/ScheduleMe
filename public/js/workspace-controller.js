var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('WorkspaceController', ['$location', '$scope', '$http',
    'LocalStorage', 'ClassHttpService', 'SemesterHttpService', 'ScheduleHttpService',
    function($location, $scope, $http, localStorage, classHttpService,
        semesterHttpService, scheduleHttpService) {
    $scope.criteria = {
        gpaSlider: {
            value: 3.0,
            options: {
                floor: 1.0,
                ceil: 4.0,
                step: 0.1,
                precision: 1,
                showSelectionBarEnd: true
            }
        },
        defaultMinCredits: 6,
        defaultMaxCredits: 15,
        timeslots: [],
    };

    $scope.addTimeslot = function(day, type, start, end) {
        $scope.criteria.timeslots.push({});
    };

    $scope.updateClassMandatoryStatus = function(_class, listName) {
        var list = [];
        if (listName === 'selectedClasses') list = $scope.selectedClasses;
        else if (listName === 'savedClassData') list = $scope.savedClassData;
        var selectedClasses = localStorage.get(listName);
        var index = indexOfClass(_class, list);
        if (index !== -1) {
            list[index].isMandatory = !list[index].isMandatory;
            localStorage.set(listName, list);
        }
    };

    $scope.undoSelection = function(_class, listName) {
        var list = localStorage.get(listName),
            index = list.indexOf(_class);
        list.splice(index, 1);
        localStorage.set(listName, list);
    };

    $scope.generateSchedule = function() {
        var classGroups = [];
        var lockedClassGroups = [];
        var lockedSections = [];
        var classGroupID = 0;
        for (var i = 0; $scope.selectedClasses && i < $scope.selectedClasses.length; i++) {
            var group = {
                'class_group_id': classGroupID++,
                'classes': []
            };
            group['classes'].push($scope.selectedClasses[i]['class_id']);
            classGroups.push(group);
            if ($scope.selectedClasses[i]['isMandatory'] === true) {
                lockedClassGroups.push($scope.selectedClasses[i]['class_id']);
            }
            if ($scope.selectedClasses[i]['crn'] && 
                $scope.selectedClasses[i]['crn'] !== 'Any') {
                lockedSections.push($scope.selectedClasses[i]['crn']);
            }
        }

        for (var i = 0; $scope.selectedGroups && i < $scope.selectedGroups.length; i++) {
            var group = {
                'class_group_id': classGroupID++,
                'classes': []
            };
            for (var j = 0; j < $scope.selectedGroups[i].length; j++) {
                var _class = $scope.selectedGroups[i][j];
                group.classes.push(_class['class_id']);
                if (_class['crn'] && _class['crn'] !== 'Any') {
                    lockedSections.push(_class['crn']);
                }
            }
            classGroups.push(group);
        }

        var criteria = [];

        criteria.push({
            'type': 'credits',
            'parameters': [ 
                $scope.criteria.defaultMinCredits, 
                $scope.criteria.defaultMaxCredits 
            ],
            'priority': 'required'
        });

        if ($scope.criteria.earliestTime && $scope.criteria.latestTime) {
            var startTime = convertDateToTimeStr($scope.criteria.earliestTime),
                endTime = convertDateToTimeStr($scope.criteria.latestTime);
            criteria.push({
                'type': 'timeofday',
                'parameters': { 
                    'start_time': startTime, 
                    'end_time': endTime
                },
                'priority': 'required'
            });
        }

        if ($scope.criteria.timeslots.length > 0) {
            for (var i = 0; i < $scope.criteria.timeslots.length; i++) {
                var timeslot = $scope.criteria.timeslots[i];
                var startTime = (timeslot.type === 'allday') ? '00:00' : timeslot.start;
                var endTime =  (timeslot.type === 'allday') ? '23:59' : timeslot.end;
                criteria.push({
                    'type': 'timeslot',
                    'parameters': { 
                        'day_of_week': timeslot.day, 
                        'start_time': startTime, 
                        'end_time': endTime 
                    },
                    'priority': 'required'
                });
            }
        }

        var scheduleInput = {
            'class_groups': classGroups,
            'locked_class_groups': lockedClassGroups,
            'locked_sections': lockedSections,
            'criteria': criteria
        };

        scheduleHttpService.generateSchedule(scheduleInput).then(
            function(tempScheduleData) {
                localStorage.set('tempScheduleCount', 0);
                localStorage.set('tempScheduleData', tempScheduleData);
                $location.path('/schedule-select');
            }
        );
    };

    $scope.$watch(function() {
        return localStorage.get('selectedClasses');
    }, function(newValue, oldValue) {
        $scope.selectedClasses = newValue;
    }, true);

    $scope.$watch(function() {
        return localStorage.get('selectedGroups');
    }, function(newValue, oldValue) {
        $scope.selectedGroups = newValue;
    }, true);
    
    $scope.$watch(function() {
        return localStorage.get('savedClassData');
    }, function(newValue, oldValue) {
        $scope.savedClassData = newValue;
    }, true);

    $scope.$watch(function() {
        return $location.path();
    }, function(newValue, oldValue) {
        if (newValue.indexOf('workspace-new') !== -1) {
            localStorage.set('scheduleToUpdate', null);
        }
    });
}]);

function convertDateToTimeStr(date) {
    var hourIndex = date.toString().indexOf(':');
    var hours = date.substring(hourIndex - 2, hourIndex);
    var mins = date.substring(hourIndex + 1, hourIndex + 3);
    return hours + ':' + mins;
};