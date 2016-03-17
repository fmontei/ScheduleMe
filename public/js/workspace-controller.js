var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('WorkspaceController', ['$rootScope', '$scope', '$http',
    'LocalStorage', 'ClassHttpService', 'SemesterHttpService',
    function($rootScope, $scope, $http, localStorage, classHttpService,
        semesterHttpService) {
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
