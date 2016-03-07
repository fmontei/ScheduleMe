var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('WorkspaceController', ['$rootScope', '$scope', '$http',
    'LocalStorage', 'ClassHttpService', 'SemesterHttpService',
    function($rootScope, $scope, $http, localStorage, classHttpService,
        semesterHttpService) {
    $scope.updateClassMandatoryStatus = function(_class) {
        var selectedClasses = localStorage.get('selectedClasses');
        var index = indexOfClass(_class, selectedClasses);
        if (index !== -1) {
            selectedClasses[index].isMandatory = !selectedClasses[index].isMandatory;
            localStorage.set('selectedClasses', selectedClasses);
        }
    };

    $scope.undoSelection = function(_class, listName) {
        var list = (listName === 'selectedClasses') ? $scope.selectedClasses : $scope.selectedGroups;
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
}]);