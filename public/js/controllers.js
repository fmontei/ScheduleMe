var scheduleMeApp = angular.module('ScheduleMeApp', [
    'ngRoute',
    'ui.bootstrap',
    'LocalStorageModule'
]);

scheduleMeApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/schedule', {
        templateUrl: 'partials/schedule.html',
        controller: 'ScheduleMeCtrl'
    }).when('/courseoff', {
        templateUrl: 'partials/courseoff.html',
        controller: 'CourseOffCtrl'
    }).otherwise({
       redirectTo: '/schedule'
    });
}]);

scheduleMeApp.run(function($rootScope, $location) {
    $rootScope.location = $location;
});

scheduleMeApp.controller('CourseOffCtrl', ['$scope', function($scope) {
    // Intentionally left blank for now
}]);

scheduleMeApp.controller('ScheduleMeCtrl', ['$rootScope', '$scope', '$http',
    'LocalStorage', 'ClassHttpService', 'SemesterHttpService',
    function($rootScope, $scope, $http, localStorage, classHttpService,
        semesterHttpService) {
    semesterHttpService.getAllSemesters().then(function(allSemesters) {
        localStorage.set('allSemesters', allSemesters);

        var thisSemester = allSemesters[0];
        classHttpService.getAllClasses(thisSemester.semester_id).then(
            function(allClasses) {
            localStorage.set('allClasses', allClasses);
            localStorage.set('allDepartments', getDepartments(allClasses));
        });
    });

    $scope.undoSelection = function(_class, listName) {
        var list = (listName === 'selectedClasses') ? $scope.selectedClasses : $scope.selectedGroups;
        var index = list.indexOf(_class);
        list.splice(index, 1);
        localStorage.set(listName, list);
    };

    $scope.$watch(function() {
        return localStorage.get('allSemesters');
    }, function(newValue, oldValue) {
        $scope.allSemesters = newValue;
    }, true);

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

scheduleMeApp.controller('ModalCtrl', ['$rootScope', '$scope', 'LocalStorage',
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
        if (allSelectedClasses.indexOf(_class) === -1) {
            // Get the actual object
            var classObj = null;
            for (var i = 0; i < $scope.allClasses.length; i++) {
                if ($scope.allClasses[i]['class_number'] === _class['class_number'] &&
                    $scope.allClasses[i]['department'] === _class['department']) {
                    classObj = $scope.allClasses[i];
                    break;
                }
            }
            if (classObj && !isClassAlreadySelected(classObj, allSelectedClasses)) {
                allSelectedClasses.push(classObj);
                localStorage.set('selectedClasses', allSelectedClasses);
            }
        }
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
            var classObjs = [];
            for (var i = 0; i < $scope.modalData.groupClasses.length; i++) {
                var _class = $scope.modalData.groupClasses[i];
                for (var j = 0; j < $scope.allClasses.length; j++) {
                    if ($scope.allClasses[j]['class_number'] === _class['class_number'] &&
                        $scope.allClasses[j]['department'] === _class['department']) {
                        var classObj = $scope.allClasses[j];
                        // If the class hasn't been individually selected and doesn't
                        // already belong to this group, then add it.
                        if (!isClassAlreadySelected(classObj, allSelectedClasses) &&
                            !isClassAlreadySelected(classObj, classObjs)) {
                            classObjs.push(classObj);
                        }
                        break;
                    }
                }
            }
            if (classObjs && classObjs.length > 0) {
                if (classObjs.length == 1) {
                    allSelectedClasses.push(classObjs[0]);
                    localStorage.set('selectedClasses', allSelectedClasses);
                } else {
                    allSelectedGroups.push(classObjs);
                    localStorage.set('selectedGroups', allSelectedGroups);
                }
            }
        }
        $scope.resetModal();
    };

    $scope.updateSelectedClass = function() {
        var _class = $scope.modalData.selectedClassOption;
        var classNum = parseInt(_class.substring(0, _class.indexOf(' ')));
        var className = _class.substring(_class.indexOf(' '));
        $scope.modalData.selectedClass = {
            'class_number': classNum,
            'name': className,
            'department': $scope.modalData.selectedDept
        }
    };

    $scope.updateSelectedGroupClasses = function() {
        var _class = $scope.modalData.selectedClass;
        var classNum = parseInt(_class.substring(0, _class.indexOf(' ')));
        var className = _class.substring(_class.indexOf(' '));
        $scope.modalData.groupClasses.push(
            {
                'class_number': classNum,
                'name': className,
                'department': $scope.modalData.selectedDept
            }
        );
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

scheduleMeApp.factory('SemesterHttpService', ['$http', '$q', function($http, $q) {
  var semesterHttpService = {};

  semesterHttpService.getAllSemesters = function() {
    var deferred = $q.defer();

    $http({
        method: 'GET',
        url: '/semesters'
    }).then(function successCallback(response) {
        deferred.resolve(response['data']);
    }, function errorCallback(response) {
        console.log(response);
        deferred.reject(response);
    });

    return deferred.promise;
  };

  return semesterHttpService;
}]);

scheduleMeApp.factory('ClassHttpService', ['$http', '$q', function($http, $q) {
    var classHttpService = {};

    classHttpService.getAllClasses = function(semesterID) {
    var deferred = $q.defer();

    $http({
        method: 'GET',
        url: '/classes/' + semesterID
    }).then(function successCallback(response) {
        deferred.resolve(response['data']);
    }, function errorCallback(response) {
        console.log('Error: ' + response);
        deferred.reject(response);
    });

    return deferred.promise;
    };

    return classHttpService;
}]);

scheduleMeApp.directive('closeModal', function () {
    return {
        restrict: 'AE',
        scope: {
            modalToClose: '@modalToClose',
            functionToCall: '&functionToCall'
        },
        link: function link(scope, element, attrs) {
            element.click(function() {
                scope.functionToCall();
                if (scope.modalToClose[0] != '#') {
                    scope.modalToClose = '#' + scope.modalToClose;
                }
                $(scope.modalToClose).modal('hide');
                scope.$apply();
            });
        }
    };
});

// Helper functions
function getDepartments(allClasses) {
    var departments = [];
    for (var i = 0; i < allClasses.length; i++) {
        var department = allClasses[i]['department'];
        if (departments.indexOf(department) === -1) {
            departments.push(department);
        }
    }
    return departments;
};

function isClassAlreadySelected(_class, list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i]['class_id'] === _class['class_id']) {
            return true;
        }
    }
    return false;
};


