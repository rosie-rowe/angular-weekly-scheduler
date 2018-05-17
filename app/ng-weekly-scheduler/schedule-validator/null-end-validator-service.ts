/** @internal */
class NullEndScheduleValidatorService {
    static $name = 'brWeeklySchedulerNullEndValidatorService';

    validate(schedules: br.weeklyScheduler.IWeeklySchedulerRange<any>[], config: IWeeklySchedulerConfig<any>): boolean {
        if (config.nullEnds) {
            return schedules.length <= 1;
        } else {
            return schedules.every(schedule => schedule.end !== null);
        }
    }
}


angular
    .module('br.weeklyScheduler')
    .service(NullEndScheduleValidatorService.$name, NullEndScheduleValidatorService);
