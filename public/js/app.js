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
    }).when('/workspace', {
        templateUrl: 'partials/workspace.html',
        controller: 'WorkspaceController'
    }).when('/schedule', {
        templateUrl: 'partials/schedule.html',
        controller: 'ScheduleController'
    }).when('/schedule-select', {
        templateUrl: 'partials/schedule-select.html',
        controller: 'ScheduleController'
    }).when('/loading', {
        templateUrl: 'partials/load-data.html'
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

    userHttpService.logout = function(userID) {
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: '/logout/' + userID
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
            console.log('Error: current user has no schedules for selected semester.');
            deferred.reject();
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

    scheduleHttpService.updateSchedule = function(scheduleID, sectionIDs) {
        var deferred = $q.defer();
        $http({
            method: 'PUT',
            url: '/schedule/' + scheduleID,
            data: {
                sectionIDs: sectionIDs
            }
        }).then(function successCallback(response) {
            deferred.resolve(response['data']);
        }, function errorCallback(error) {
            deferred.resolve(error);
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
    
    return scheduleHttpService;
}]);

scheduleMeApp.factory('SectionHttpService', ['$http', '$q', 'LocalStorage',
     function($http, $q, localStorage) {
    var sectionHttpService = {};

    sectionHttpService.getSectionsForClass = function(classID, filterByLab) {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: '/sections/' + classID + "?lab=" + filterByLab
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
                localStorage.set('selectedSemester', latestSemester);
                getClassesWhenReady();
            });
        } else {
            getClassesWhenReady();
        }

        function getClassesWhenReady() {
            classHttpService.getAllClasses(selectedSemester['semester_id']).then(
                function(allClasses) {
                localStorage.set('allClasses', allClasses);
                localStorage.set(
                    'allDepartments',
                    classHttpService.getDepartments(allClasses)
                );
                deferred.resolve();
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
            // Keep this function call here -- it specifically runs multiple
            // times on the server in case there are any SQL_BUSY errors
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
                if (scope.onlyWhenTrue === undefined || 
                    JSON.parse(scope.onlyWhenTrue) === false) {
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
 
scheduleMeApp.directive('pngTimeInput', function($compile) {
    var TEMPLATE = '<div class="png-time form-control" ng-click="focus()">' +
    '<input type="text" name="hour" class="hour" maxlength="2" />' +
    '<span>:</span>' +
    '<input type="text" name="minute" class="minute" maxlength="2" />' +
    '<input type="text" name="mode" class="meridian" maxlength="2" />' +
    '</div>';

    var timepickerLinkFn = function(scope, element, attrs, ngModel) {
        element.html(TEMPLATE);
        $compile(element.contents())(scope);

        var hourKeyPressCount = 0,
            minuteKeyPressCount = 0,
            inputHour = '00',
            inputMinute = '00',
            inputMeridian = 'AM';

        scope.$watch(function() {
            return ngModel.$viewValue;
        }, function(newValue) {
            if (!newValue) {
                element.find('.png-time').addClass('ng-invalid');
            } else {
                element.find('.png-time').removeClass('ng-invalid');
            }
        });

        var updateModel = function() {
            var date = new Date('2000-01-01 ' + inputHour + ':' + inputMinute +
                ' ' + inputMeridian);
            ngModel.$setViewValue(date);
        };

        var isNavigationKeyCode = function(e) {
            // Allow: backspace, delete, tab, escape, enter and .
            return $.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
                // Allow: Ctrl+A, Command+A
                (e.keyCode == 65 && (e.ctrlKey === true || e.metaKey === true)) || 
                 // Allow: home, end, left, right, down, up
                (e.keyCode >= 35 && e.keyCode <= 40);
        };

        element.find('input.hour').focus(function(e) {
            $(this).val('');
            inputHour = $(this).val();
        });

        element.find('input.hour').keyup(function(e) {
            if (isNavigationKeyCode(e)) return;
            hourKeyPressCount = $(this).val().length;
            var val = $(this).val();
            if (hourKeyPressCount === 1) {
                if (isNaN(val) === false) {
                    var hour = parseInt(val);
                    if (hour === 0) {
                        $(this).val('0');
                    } else if (hour === 1) {
                        $(this).val('1');
                    } else {
                        $(this).val('0' + val);
                        inputHour = $(this).val();
                        updateModel();
                        element.find('input.minute').focus();
                        hourKeyPressCount = 0;
                    }
                } else {
                    $(this).val('');
                    inputHour = $(this).val();
                    updateModel();
                    hourKeyPressCount = 0;
                }
            } else if (hourKeyPressCount === 2) {
                if (isNaN(val) === false) {
                    var hour = parseInt(val);
                    if (hour <= 12) {
                        inputHour = $(this).val();
                        updateModel();
                        element.find('input.minute').focus();
                        hourKeyPressCount = 0;
                    } else {
                        $(this).val('0' + val[1]);
                        inputHour = $(this).val();
                        updateModel();
                        element.find('input.minute').focus();
                        hourKeyPressCount = 0;
                    }
                } else {
                    $(this).val('');
                    inputHour = $(this).val();
                    updateModel();
                    hourKeyPressCount = 0;
                }
            }
        });

        element.find('input.minute').focus(function(e) {
            $(this).val('');
            inputMinute = $(this).val();
            updateModel();
        });

        element.find('input.minute').keyup(function(e) {
            if (isNavigationKeyCode(e)) return;
            minuteKeyPressCount = $(this).val().length;
            var val = $(this).val();
            if (minuteKeyPressCount === 1) {
                if (isNaN(val) === false) {
                    var minute = parseInt(val);
                    if (minute <= 6) {
                        return;
                    } else {
                        $(this).val('0' + val);
                        inputMinute = $(this).val();
                        updateModel();
                        element.find('input.meridian').focus();
                        minuteKeyPressCount = 0;
                    }
                } else {
                    $(this).val('');
                    minuteKeyPressCount = 0;
                }
            } else if (minuteKeyPressCount === 2) {
                if (isNaN(val) === false) {
                    var minute = parseInt(val);
                    if (minute <= 60) {
                        inputMinute = $(this).val();
                        updateModel();
                        element.find('input.meridian').focus();
                        minuteKeyPressCount = 0;
                    } else {
                        $(this).val('0' + val[1]);
                        inputMinute = $(this).val();
                        updateModel();
                        element.find('input.meridian').focus();
                        minuteKeyPressCount = 0;
                    }
                } else {
                    $(this).val('');
                    inputMinute = $(this).val();
                    updateModel();
                    minuteKeyPressCount = 0;
                }
            }
        });

        element.find('input.meridian').focus(function(e) {
            $(this).val('AM');
            inputMeridian = $(this).val();
            updateModel();
        });

        element.find('input.meridian').keyup(function(e) {
            if (e.keyCode === 65) {
                $(this).val('AM');
                inputMeridian = $(this).val();
                updateModel();
            } else if (e.keyCode === 80) {
                $(this).val('PM');
                inputMeridian = $(this).val();
                updateModel();
            }
        });
    };

    return {
        restrict: 'E',
        replace: true,
        require: 'ngModel',
        scope: {
        },
        link: timepickerLinkFn
    };
});






