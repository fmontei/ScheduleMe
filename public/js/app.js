var scheduleMeApp = angular.module('ScheduleMeApp', [
    'ngRoute',
    'ui.bootstrap',
    'LocalStorageModule',
    'rzModule'
]);

scheduleMeApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/login', {
        templateUrl: 'partials/login.html',
        controller: 'LoginController'
    }).when('/index', {
        templateUrl: 'partials/load-data.html',
        controller: 'LoadDataController'
    }).when('/workspace-new', {
        templateUrl: 'partials/workspace-new.html',
        controller: 'WorkspaceController'
    }).when('/workspace-edit', {
        templateUrl: 'partials/workspace-edit.html',
        controller: 'WorkspaceController'
    }).when('/schedule', {
        templateUrl: 'partials/schedule.html',
        controller: 'ScheduleController'
    }).when('/schedule-select', {
        templateUrl: 'partials/schedule-select.html',
        controller: 'ScheduleController'
    }).when('/courseoff', {
        templateUrl: 'partials/courseoff.html',
        controller: 'CourseOffController'
    }).otherwise({
       redirectTo: '/login'
    });
}]);

scheduleMeApp.run(function($rootScope, $location) {
    $rootScope.location = $location;
});

// Factories
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

scheduleMeApp.factory('UserHttpService', ['$http', '$q', function($http, $q) {
    var userHttpService = {};

    userHttpService.login = function(username) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: '/get_or_create_user/',
            data: {
                username: username
            }
        }).then(function successCallback(response) {
            deferred.resolve(response['data']);
        }, function errorCallback(response) {
            deferred.resolve(response['error']);
        });
        return deferred.promise;
    };

    return userHttpService;
}]);

scheduleMeApp.factory('SemesterHttpService', ['$http', '$q', function($http, $q) {
    var semesterHttpService = {};

    semesterHttpService.getLatestSemester = function() {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: '/semester/latest'
        }).then(function successCallback(response) {
            deferred.resolve(response['data']);
        }, function errorCallback(response) {
            console.log('Error: ' + response);
            deferred.reject();
        });

        return deferred.promise;
    };

    semesterHttpService.getAllSemesters = function() {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: '/semesters'
        }).then(function successCallback(response) {
            deferred.resolve(response['data']);
        }, function errorCallback(response) {
            console.log('Error: ' + response);
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
            console.log('Error: ' + JSON.stringify(response));
            deferred.reject(response);
        });

        return deferred.promise;
    };

    classHttpService.getDepartments = function(allClasses) {
        var departments = [];
        for (var i = 0; i < allClasses.length; i++) {
            var department = allClasses[i]['department'];
            if (departments.indexOf(department) === -1) {
                departments.push(department);
            }
        }
        return departments;
    };

    return classHttpService;
}]);

scheduleMeApp.factory('ScheduleHttpService', ['$http', '$q', 'LocalStorage',
     function($http, $q, localStorage) {
    var scheduleHttpService = {};

    scheduleHttpService.getScheduleForUser = function(userID) {
        var deferred = $q.defer();
        var selectedSemester = localStorage.get('selectedSemester');

        $http({
            method: 'GET',
            url: '/user/' + userID + '/schedule/' + selectedSemester.semester_id
        }).then(function successCallback(response) {
            deferred.resolve(response['data']);
        }, function errorCallback() {
            console.log('Error: current user has no schedule for selected semester.');
            deferred.reject();
        });

        return deferred.promise;
    };

    scheduleHttpService.saveSchedule = function(sectionIDs) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: '/schedule/',
            data: {
                sectionIDs: sectionIDs,
                userID: localStorage.get('user')['user_id'],
                semesterID: localStorage.get('selectedSemester')['semester_id']
            }
        }).then(function successCallback(response) {
            deferred.resolve(response['data']);
        }, function errorCallback(error) {
            deferred.resolve(error);
        });
        return deferred.promise;
    };

    scheduleHttpService.generateSchedule = function(scheduleInput) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: '/generate_schedule/',
            data: {
                scheduleInput: scheduleInput
            }
        }).then(function successCallback(response) {
            deferred.resolve(response['data']);
        }, function errorCallback(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };

    scheduleHttpService.deleteSchedule = function(schedule_id) {
        var deferred = $q.defer();
        $http({
            method: 'DELETE',
            url: '/schedule/' + schedule_id + '/'
        }).then(function successCallback(response) {
            deferred.resolve(response['data']);
        }, function errorCallback(error) {
            deferred.resolve(error);
        });
        return deferred.promise;
    };
         
    scheduleHttpService.addSectionToSchedule = function(section_id, schedule_id) {
        var deferred = $q.defer();
        $http({
            method: 'PUT',
            url: '/schedule/' + schedule_id.trim() + '/sections/' + section_id.trim()
        }).then(function successCallback(response) {
            deferred.resolve(response['data']);
        }, function errorCallback(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };
    
    scheduleHttpService.removeSectionFromSchedule = function(section_id, schedule_id) {
        var deferred = $q.defer();
        $http({
            method: 'DELETE',
            url: '/schedule/' + schedule_id.trim() + '/sections/' + section_id.trim()
        }).then(function successCallback(response) {
            deferred.resolve(response['data']);
        }, function errorCallback(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };
    
    return scheduleHttpService;
}]);

scheduleMeApp.factory('SectionHttpService', ['$http', '$q', 'LocalStorage',
     function($http, $q, localStorage) {
    var sectionHttpService = {};

    sectionHttpService.getSectionsForClass = function(classID) {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: '/sections/' + classID
        }).then(function successCallback(response) {
            deferred.resolve(response['data']);
        }, function errorCallback() {
            console.log('Error: selected class has no sections.');
            deferred.resolve(null);
        });

        return deferred.promise;
    };

    return sectionHttpService;
}]);

scheduleMeApp.factory('ServerDataService', ['$q', 'LocalStorage', 'ClassHttpService',
    'SemesterHttpService', 'ScheduleHttpService', function($q, localStorage,
    classHttpService, semesterHttpService, scheduleHttpService) {
    var serverDataService = {};

    serverDataService.getAllSemesters = function() {
        var deferred = $q.defer();
        semesterHttpService.getAllSemesters().then(function(allSemesters) {
            localStorage.set('allSemesters', allSemesters);
            deferred.resolve();
        });
        return deferred.promise;
    };

    serverDataService.getClassesForSelectedSemester = function() {
        var deferred = $q.defer();
        var selectedSemester = localStorage.get('selectedSemester');
        if (!selectedSemester) {
            semesterHttpService.getLatestSemester().then(function(latestSemester) {
                selectedSemester = latestSemester;
                localStorage.set('selectedSemester', selectedSemester);
                getClassesWhenReady();
                deferred.resolve();
            });
        } else {
            getClassesWhenReady();
            deferred.resolve();
        }

        function getClassesWhenReady() {
            classHttpService.getAllClasses(selectedSemester['semester_id']).then(
                function(allClasses) {
                localStorage.set('allClasses', allClasses);
                localStorage.set(
                    'allDepartments',
                    classHttpService.getDepartments(allClasses)
                );
            });
        };

        return deferred.promise;
    };

    serverDataService.getScheduleForUser = function(userID) {
        var deferred = $q.defer();
        scheduleHttpService.getScheduleForUser(userID).then(
            function(scheduleData) {
            localStorage.set('savedScheduleData', scheduleData);
            deferred.resolve();
        });
        return deferred.promise;
    };

    serverDataService.getServerData = function() {
        var deferred = $q.defer();
        var userID = localStorage.get('user')['user_id'];

        serverDataService.getAllSemesters().then(function() {
            return serverDataService.getClassesForSelectedSemester();
        }).then(function() {
            return serverDataService.getScheduleForUser(userID);
        }).then(function() {
            deferred.resolve();
        });

        return deferred.promise;
    };

    return serverDataService;
}]);

// Directives
scheduleMeApp.directive('closeModal', function() {
    return {
        restrict: 'AE',
        scope: {
            modalToClose: '@modalToClose',
            functionToCall: '&functionToCall',
            onlyWhenTrue: '@onlyWhenTrue'
        },
        link: function link(scope, element, attrs) {
            element.click(function() {
                scope.functionToCall();
                if (scope.modalToClose[0] !== '#') {
                    scope.modalToClose = '#' + scope.modalToClose;
                }
                if (!scope.onlyWhenTrue) {
                    $(scope.modalToClose).modal('hide');
                }
                scope.$apply();
            });
        }
    };
});


scheduleMeApp.directive('hide', function() {
    return {
        restrict: 'AE',
        scope: {
            condition: '@onCondition'
        },
        link: function link(scope, element, attrs) {
            if (JSON.parse(scope.condition) === true) {
                element.hide();
            }
        }
    };
});

scheduleMeApp.directive('watchHeight', function() {
    return {
        restrict: 'AE',
        link: function link(scope, element, attrs) {
            scope.$watch(function() {
                var numVisibleByCell = [];
                element.parent().find('td').each(function() {
                    numVisibleByCell.push($(this).find('a:visible').length);
                });
                return numVisibleByCell;
            }, function(numVisibleByCell, oldNumVisibleByCell) {
                var numVisibleThisCell = element.find('a:visible').length;
                for (var i = 0; i < numVisibleByCell.length; i++) {
                    if (numVisibleByCell[i] > numVisibleThisCell) {
                        element.find('a:visible').each(function() {
                            $(this).css('height', $(this).parent().css('height'));
                        });
                        break;
                    }
                }
            }, true);
        }
    };
});





