angular.module('demoApp', ['weeklyScheduler'])
  .controller('DemoController', ['$scope', '$timeout', '$log',
    function ($scope, $timeout, $log) {

      $scope.isDirty = false;

      $scope.model = {
        options: {
          editSlot: function(schedule) {
            schedule.end += 15;

            return $timeout(() => schedule, 400);
          }
        },
        items: [
          // {
          //   label: 'Sun',
          //   //editable: false,
          //   schedules: [
          //     { start: 315, end: 375 }
          //   ]
          // },
          // {
          //   label: 'Mon',
          //   //editable: false,
          //   schedules: [
          //     { start: 300, end: 1140 }
          //   ]
          // },
          // {
          //   label: 'Tue',
          //   schedules: [
          //     { start: 0, end: 240 },
          //     { start: 300, end: 360 }
          //   ]
          // },
          // {
          //   label: 'Wed',
          //   schedules: [
          //     { start: 120, end: 720 }
          //   ]
          // },
          // {
          //   label: 'Thur',
          //   editable: false,
          //   schedules: [
          //     { start: 300, end: 1140 }
          //   ]
          // },
          {
            label: 'Fri',
            defaultValue: false,
            schedules: [
              { start: 720, end: 900, value: false },
              { start: 915, end: 960, value: false }
            ]
          },
          {
            defaultValue: false,
            label: 'Sat',
            schedules: [
              { start: 720, end: 900, value: false },
              { start: 930, end: 960, value: false }
            ]
          }
        ]
      };

      this.doSomething = function (itemIndex, scheduleIndex, scheduleValue) {
        $scope.isDirty = true;

        console.log('The model has changed!', itemIndex, scheduleIndex, scheduleValue);
      };
    }]);
