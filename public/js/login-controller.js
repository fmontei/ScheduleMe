var scheduleMeApp = angular.module('ScheduleMeApp');

scheduleMeApp.controller('LoginController', ['$scope', '$http', '$location',
    'LocalStorage', 'UserHttpService', function($scope, $http, $location, 
        localStorage, userHttpService) {
    var isLoggedIn = localStorage.get('user') !== undefined &&
        localStorage.get('user') !== null;
    if (isLoggedIn === true) {
        $location.path('/index');
    }

    $scope.login = function() {
        userHttpService.login($scope.username).then(function(user) {
            localStorage.set('user', user);
            $location.path('/index');
        });
    };
}]);