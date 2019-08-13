import { EndAdjusterService } from '../end-adjuster/EndAdjusterService';
import { IWeeklySchedulerConfig } from '../weekly-scheduler-config/IWeeklySchedulerConfig';
import { IWeeklySchedulerRange } from '../weekly-scheduler-range/IWeeklySchedulerRange';
import { WeeklySchedulerRange } from '../weekly-scheduler-range/WeeklySchedulerRange';

/** @internal */
export class WeeklySchedulerRangeFactory {
    static $name = 'rrWeeklySchedulerRangeFactory';

    static $inject = [
        EndAdjusterService.$name
    ];

    private constructor(
        private endAdjusterService: EndAdjusterService
    ) {
    }

    public createRange(config: IWeeklySchedulerConfig<any>, schedule: IWeeklySchedulerRange<any>) {
        return new WeeklySchedulerRange(config, schedule, this.endAdjusterService);
    }
}
