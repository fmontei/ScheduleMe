var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('ModalController', ['$rootScope', '$scope', 'LocalStorage',
    'SectionHttpService', function($rootScope, $scope, localStorage,
    sectionHttpService) {

    $scope.filterClassesByDept = function() {
        $scope.modalData.filteredClasses = [];
        $scope.modalData.filteredSections = [];
        var filteredClasses = [];
        for (var i = 0; i < $scope.allClasses.length; i++) {
            var _class = $scope.allClasses[i];
            if (_class['department'] === $scope.modalData.selectedDept) {
                filteredClasses.push(_class);
            }
        }
        $scope.modalData.filteredClasses = filteredClasses;
    };

    $scope.filterSectionsByClass = function() {
        $scope.modalData.filteredSections = [];
        if (!$scope.modalData.selectedClass) {
            return;
        }
        var classID = $scope.modalData.selectedClass.class_id;
        sectionHttpService.getSectionsForClass(classID).then(function(sections) {
            $scope.modalData.filteredSections = sections;
        });
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
        var _class = $scope.modalData.selectedClass;
        var section = $scope.modalData.selectedSection || null;
        var alreadyExists = isClassInList(_class, allSelectedClasses);
        if (alreadyExists === false) {
            _class = combineClassWithSection(_class, section);
            $scope.modalData.selectedClass = _class;
        } else {
            $scope.modalData.selectedClass = null;
        }
    };

    $scope.updateSelectedGroupClasses = function() {
        var allSelectedClasses = localStorage.get('selectedClasses');
        var _class = angular.copy($scope.modalData.selectedClass);
        var section = $scope.modalData.selectedSection;
        var alreadyExists = isClassInList(_class, $scope.modalData.groupClasses) ||
            isClassInList(_class, allSelectedClasses);
        if (alreadyExists === false) {
            _class = combineClassWithSection(_class, section);
            $scope.modalData.groupClasses.push(_class);
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
            selectedSection: null,
            groupClasses: [],
            sectionType: ''
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

// Helper functions
function isClassInList(_class, list) {
    for (var i = 0; _class && list && i < list.length; i++) {
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

function combineClassWithSection(_class, section) {
    if (_class) {
        if (section) {
            _class['section'] = section;
        } else {
            _class['section'] = {};
            _class['section']['crn'] = 'Any';
        }
    }
    return _class;
}