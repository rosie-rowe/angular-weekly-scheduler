/** @internal */
class MaxTimeSlotDirective implements angular.IDirective {
    static $name = 'brMaxTimeSlot';

    constructor(
        private validator: MaxTimeSlotValidatorService
    ) {
    }

    link = (scope: angular.IScope, element: angular.IAugmentedJQuery, attrs: angular.IAttributes, ngModelCtrl: angular.INgModelController) => {
        if (attrs.brMaxTimeSlot) {
            ngModelCtrl.$validators[this.validator.error] = (modelValue: WeeklySchedulerItem<any>) => {
                return this.validator.validate(modelValue.schedules, modelValue.config);
            };
        }
    }

    require = 'ngModel';

    static Factory() {
        let directive = (validator) => {
            return new MaxTimeSlotDirective(validator);
        };

        directive.$inject = ['brWeeklySchedulerMaxTimeSlotValidatorService'];

        return directive;
    }
}

angular
    .module('br.weeklyScheduler')
    .directive(MaxTimeSlotDirective.$name, MaxTimeSlotDirective.Factory());

