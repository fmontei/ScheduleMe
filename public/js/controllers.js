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
        var thisSemester = allSemesters[0];
        localStorage.set('allSemesters', allSemesters);

        classHttpService.getAllClasses(thisSemester.semester_id).then(
            function(allClasses) {
            localStorage.set('allClasses', allClasses);
            localStorage.set('allDepartments', getDepartments(allClasses));
        });
    });

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

    $scope.groupClasses = [];

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
        if (allSelectedClasses.indexOf(selectedClass) === -1) {
            // Get the actual object
            var classNum = parseInt(_class.substring(0, _class.indexOf(' ')));
            var classObj = {};
            for (var i = 0; i < $scope.allClasses.length; i++) {
                if ($scope.allClasses[i]['course_number'] === classNum) {
                    classObj = $scope.allClasses[i];
                    break;
                }
            }
            allSelectedClasses.push(classObj);
            localStorage.set('selectedClasses', allSelectedClasses);
        }
    };

    $scope.updateGroupClasses = function() {
        $scope.modalData.groupClasses.push($scope.modalData.groupClass);
    };

    $scope.selectGroup = function() {
        var allSelectedGroups = localStorage.get('selectedGroups');
        var selectedGroup = $scope.modalData.groupClasses;
        if (!allSelectedGroups) {
            allSelectedGroups = [];
        }
        if (allSelectedGroups.indexOf(selectedGroup) === -1) {
            var classObjs = [];
            for (var i = 0; i < $scope.modalData.groupClasses.length; i++) {
                var _class = $scope.modalData.groupClasses[i];
                var classNum = parseInt(_class.substring(0, _class.indexOf(' ')));
                for (var i = 0; i < $scope.allClasses.length; i++) {
                    if ($scope.allClasses[i]['course_number'] === classNum) {
                        classObjs.push($scope.allClasses[i]);
                        break;
                    }
                }
            }
            allSelectedGroups.push(selectedGroup);
            localStorage.set('selectedGroups', allSelectedGroups);
        }
    };

    $scope.resetModal = function() {
        $scope.modalData = {
            filteredClasses: [],
            selectedDept: null,
            selectedClass: null,
            groupClass: null,
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
        console.log(response);
        deferred.reject(response);
    });

    return deferred.promise;
  };

  return classHttpService;
}]);

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



