var systemMonitor = angular.module('systemMonitor', ['ngRoute']);

//configure routes
systemMonitor.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider
      .when('/cpu', {
        templateUrl: 'partials/cpu.html',
        controller: 'cpuCtrl'
      })
      .when('/drives', {
        templateUrl: 'partials/drives.html'
      })
      .when('/memory', {
        templateUrl: 'partials/memory.html'
      })
      .when('/processes', {
        templateUrl: 'partials/processes.html'
      })
      .when('/services', {
        templateUrl: 'partials/services.html'
      })
      .when('/system', {
        templateUrl: 'partials/system.html'
      })
      .otherwise({
        redirectTo: '/system'
      });
  }]);