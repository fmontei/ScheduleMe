var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('ModalController', ['$rootScope', '$scope', 'LocalStorage',
    function($rootScope, $scope, localStorage) {

    $scope.filterClassesByDept = function() {
        var filteredClasses = [];
        for (var i = 0; i < $scope.allClasses.length; i++) {
            var _class = $scope.allClasses[i];
            if (_class['department'] === $scope.modalData.selectedDept) {
                filteredClasses.push(_class);
            }
        }
        $scope.modalData.filteredClasses = filteredClasses;
    };

    $scope.selectClass = function() {
        var allSelectedClasses = localStorage.get('selectedClasses');
        var _class = $scope.modalData.selectedClass;
        if (!allSelectedClasses) {
            allSelectedClasses = [];
        }
        allSelectedClasses.push(_class);
        localStorage.set('selectedClasses', allSelectedClasses);
        $scope.resetModal();
    };

    $scope.selectGroup = function() {
        var allSelectedGroups = localStorage.get('selectedGroups');
        var allSelectedClasses = localStorage.get('selectedClasses');
        var selectedGroup = $scope.modalData.groupClasses;
        if (selectedGroup.length === 1) {
            $scope.modalData.selectedClass = $scope.modalData.groupClasses[0];
            return $scope.selectClass();
        }
        if (!allSelectedGroups) {
            allSelectedGroups = [];
        }
        if (allSelectedGroups.indexOf(selectedGroup) === -1) {
            allSelectedGroups.push(selectedGroup);
            localStorage.set('selectedGroups', allSelectedGroups);
        }
        $scope.resetModal();
    };

    $scope.updateSelectedClass = function() {
        var allSelectedClasses = localStorage.get('selectedClasses');
        var alreadyExists = isClassInList($scope.modalData.selectedClass,
            allSelectedClasses);
        if (alreadyExists) {
            $scope.modalData.selectedClass = null;
        }
    };

    $scope.updateSelectedGroupClasses = function() {
        var allSelectedClasses = localStorage.get('selectedClasses');
        var _class = $scope.modalData.selectedClass;
        var alreadyExists = isClassInList(_class, $scope.modalData.groupClasses) ||
            isClassInList(_class, allSelectedClasses);
        if (alreadyExists === false) {
            $scope.modalData.groupClasses.push($scope.modalData.selectedClass);
        } else {
            $scope.modalData.selectedClass = null;
        }
    };

    $scope.removeSelectedGroupOption = function(_class) {
        var index = $scope.modalData.groupClasses.indexOf(_class);
        $scope.modalData.groupClasses.splice(index, 1);
    };

    $scope.resetModal = function() {
        $scope.modalData = {
            filteredClasses: [],
            selectedDept: null,
            selectedClass: null,
            groupClasses: [],
        };
    };

    $scope.resetModal();

    $scope.$watch(function() {
        return localStorage.get('allClasses');
    }, function(newValue, oldValue) {
        $scope.allClasses = newValue;
    }, true);

    $scope.$watch(function() {
        return localStorage.get('allDepartments');
    }, function(newValue, oldValue) {
        $scope.allDepartments = newValue;
    }, true);
}]);

// Local storage factory
scheduleMeApp.factory('LocalStorage', ['localStorageService',
    function(localStorageService) {
    var myLocalStorage = {};

    myLocalStorage.get = function(key) {
        return localStorageService.get(key);
    };

    myLocalStorage.set = function(key, val) {
        return localStorageService.set(key, val);
    };

    myLocalStorage.clearAll = function() {
        localStorageService.clearAll();
    };

    return myLocalStorage;
}]);

// Helper functions
function isClassInList(_class, list) {
    for (var i = 0; list && i < list.length; i++) {
        if (list[i]['class_id'] === _class['class_id']) {
            return true;
        }
    }
    return false;
};

function indexOfClass(_class, list) {
    for (var i = 0; list && i < list.length; i++) {
        if (list[i]['class_id'] === _class['class_id']) {
            return i;
        }
    }
    return -1;
};