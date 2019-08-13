import * as angular from 'angular';
import { ScheduleCountValidatorService } from '../schedule-validator/ScheduleCountValidatorService';
import { WeeklySchedulerItem } from '../weekly-scheduler-item/WeeklySchedulerItem';

/** @internal */
export class ScheduleCountDirective implements angular.IDirective {
    static $name = 'rrScheduleCount';

    constructor(
        private validator: ScheduleCountValidatorService
    ) {
    }

    link = (scope: angular.IScope, element: angular.IAugmentedJQuery, attrs: angular.IAttributes, ngModelCtrl: angular.INgModelController) => {
        if (attrs.rrScheduleCount) {
            ngModelCtrl.$validators[this.validator.error] = (modelValue: WeeklySchedulerItem<any>) => {
                return this.validator.validate(modelValue.schedules, modelValue.config);
            };
        }
    }

    require = 'ngModel';

    static Factory() {
        let directive = (validator) => {
            return new ScheduleCountDirective(validator);
        };

        directive.$inject = [ScheduleCountValidatorService.$name];

        return directive;
    }
}
