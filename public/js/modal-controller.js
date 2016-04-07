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
        var classID = $scope.modalData.selectedClass.model.class_id;
        sectionHttpService.getSectionsForClass(classID, false).then(function(sections) {
            $scope.modalData.filteredSections = sections;
        });
        sectionHttpService.getSectionsForClass(classID, true).then(function(labSections) {
            $scope.modalData.filteredLabSections = labSections;
        });
    };

    $scope.selectClass = function() {
        var allSelectedClasses = localStorage.get('selectedClasses');
        var _class = $scope.modalData.selectedClass;
        if (!allSelectedClasses) {
            allSelectedClasses = [];
        }
        if (_class.class) {
            allSelectedClasses.push(_class.class);
        }
        if (_class.lab) {
            allSelectedClasses.push(_class.lab);
        }
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

    $scope.updateSelectedSection = function(type) {
        var allSelectedClasses = localStorage.get('selectedClasses'),
            _class = angular.copy($scope.modalData.selectedClass),
            section = null,
            alreadyExists = false;
        if (type === 'class') {
            section = $scope.modalData.selectedSection;
            alreadyExists = isClassInList(_class, allSelectedClasses);
            if (alreadyExists == false) {
                _class.class = combineClassWithSection(_class.model, section);
            } else {
                _class.class = null;
            }
            $scope.modalData.selectedClass.class = _class.class;
        } else if (type == 'lab') {
            section = $scope.modalData.selectedLabSection;
            alreadyExists = isClassInList(_class, allSelectedClasses);
            if (alreadyExists == false) {
                _class.lab = combineClassWithSection(_class.model, section);
                _class.lab['isLab'] = true;
            } else {
                _class.lab = null;
            }
            $scope.modalData.selectedClass.lab = _class.lab;
        }
    };

    $scope.updateSelectedGroupSections = function() {
        var allSelectedClasses = localStorage.get('selectedClasses');
        var _class = angular.copy($scope.modalData.selectedClass);
        var section = $scope.modalData.selectedSection;
        var alreadyExists = isClassInList(_class, $scope.modalData.groupClasses) ||
            isClassInList(_class, allSelectedClasses);
        if (alreadyExists === false) {
            _class.class = combineClassWithSection(_class.model, section);
            $scope.modalData.groupClasses.push(_class.class);
        }
        $scope.modalData.selectedDept = null;
        $scope.modalData.selectedClass = {
            model: null,
            class: null,
            lab: null
        };
        $scope.modalData.filteredClasses = [];
        $scope.modalData.filteredSections = [];
        $scope.modalData.selectedSection = null;
        sectionType = '';
        $scope.modalData.groupMessage = 'Repeat the previous steps for all the ' +
            'classes that you want grouped together by degree requirement.';
    };

    $scope.removeSelectedGroupOption = function(_class) {
        var index = $scope.modalData.groupClasses.indexOf(_class);
        $scope.modalData.groupClasses.splice(index, 1);
    };

    $scope.resetModal = function() {
        $scope.modalData = {
            selectedDept: null,
            selectedClass: {
                model: null,
                class: null,
                lab: null
            },
            filteredClasses: [],
            filteredSections: [],
            filteredLabSections: [],
            selectedSection: null,
            selectedLabSection: null,
            sectionType: '',
            labSectionType: '',
            groupClasses: [],
            groupMessage: "Select a department and class. If you don't mind what " + 
                "section you're put in, select 'Any' for the section. If the " +
                "class you've chosen has any available sections and you want to " +
                "be in a specific section, select 'Specific' and then pick " +
                "your section from the list that appears."
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
            _class['crn'] = section['crn'];
        } else {
            _class['crn'] = 'Any';
        }
    }
    return _class;
}