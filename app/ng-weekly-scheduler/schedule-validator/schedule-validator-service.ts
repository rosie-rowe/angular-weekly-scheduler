/** @internal */
class ScheduleValidationService {
    static $name = 'brWeeklySchedulerValidationService';

    static $inject = [
        'brWeeklySchedulerOverlapValidatorService'
    ]

    private constructor(
        private overlapValidatorService: ValidatorService
    ) {
    }

    public getValidationErrors(item: br.weeklyScheduler.IWeeklySchedulerItem<any>, config: IWeeklySchedulerConfig<any>): ValidationError[] {
        let validators: ValidatorService[] = [
            this.overlapValidatorService
        ];

        let result: ValidationError[] = [];

        validators.forEach(validator => {
            if (!validator.validate(item.schedules, config)) {
                result.push(validator.error);
            }
        });

        return result;
    }
}

angular
    .module('br.weeklyScheduler')
    .service(ScheduleValidationService.$name, ScheduleValidationService);
