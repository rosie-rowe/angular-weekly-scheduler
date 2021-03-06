import * as angular from 'angular';
import { IWeeklySchedulerRange } from '../weekly-scheduler-range/IWeeklySchedulerRange';

/** @internal */
export class TimeRangeComponent implements angular.IComponentOptions {
    static $name = 'brTimeRange';

    bindings = {
        schedule: '<'
    }

    controller = TimeRangeController.$name;
    controllerAs = TimeRangeController.$controllerAs;

    template = `
        <span ng-if="timeRangeCtrl.hasStart && timeRangeCtrl.hasEnd">{{ timeRangeCtrl.schedule.start | brWeeklySchedulerTimeOfDay }}-{{ timeRangeCtrl.schedule.end | brWeeklySchedulerTimeOfDay }}</span>
        <span ng-if="timeRangeCtrl.hasStart && !timeRangeCtrl.hasEnd">{{ timeRangeCtrl.schedule.start | brWeeklySchedulerTimeOfDay }} until</span>
    `
}

/** @internal */
export class TimeRangeController implements angular.IComponentController {
    static $controllerAs = 'timeRangeCtrl';
    static $name = 'brTimeRangeController';

    private hasStart: boolean;
    private hasEnd: boolean;

    private schedule: IWeeklySchedulerRange<any>;

    $onInit() {
        this.hasStart = angular.isDefined(this.schedule.start);
        this.hasEnd = angular.isDefined(this.schedule.end) && this.schedule.end !== null;
    }
}
