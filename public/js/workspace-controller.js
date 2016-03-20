var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('WorkspaceController', ['$location', '$scope', '$http',
    'LocalStorage', 'ClassHttpService', 'SemesterHttpService', 'ScheduleHttpService',
    function($location, $scope, $http, localStorage, classHttpService,
        semesterHttpService, scheduleHttpService) {
    $scope.gpaSlider = {
        value: 3.0,
        options: {
            floor: 1.0,
            ceil: 4.0,
            step: 0.1,
            precision: 1,
            showSelectionBarEnd: true
        }
    };

    $scope.defaultTotalCredits = 15;

    $scope.timeslots = [];

    $scope.addTimeslot = function() {
        $scope.timeslots.push({
            day: 'monday',
            type: 'allday'
        });
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
        var list = [];
        if (listName === 'selectedClasses') list = $scope.selectedClasses;
        else if (listName === 'selectedGroups') list = $scope.selectedGroups;
        else if (listName === 'savedClassData') list = $scope.savedClassData;
        var index = list.indexOf(_class);
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

        var scheduleInput = {
            'class_groups': classGroups,
            'locked_class_groups': lockedClassGroups,
            'locked_sections': lockedSections,
            'criteria': [
                {
                    'type': 'credits',
                    'parameters': [ 6, 12 ],
                    'priority': 'required'
                },
            ]
        };

        scheduleHttpService.generateSchedule(scheduleInput).then(
            function(tempScheduleData) {
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
}]);
