/** When using the 'fillEmptyWithDefault' option, this service will be used to construct the correct calendar for server submission */
/** @internal */
class FillEmptyWithDefaultService {
    static $name = 'brWeeklySchedulerFillEmptyWithDefaultService';

    static $inject = [
        'brWeeklySchedulerEndAdjusterService',
        'brWeeklySchedulerRangeFactory'
    ];

    private constructor(
        private endAdjusterService: EndAdjusterService,
        private rangeFactory: WeeklySchedulerRangeFactory
    ) {
    }

    fill(item: WeeklySchedulerItem<any>, config: IWeeklySchedulerConfig<any>): WeeklySchedulerRange<any>[] {
        let schedules = item.schedules;

        if (!schedules.length) {
            return [this.getEmptySchedule(item, config)];
        }

        return this.getFilledSchedules(schedules, config);
    }

    private getEmptySchedule(item: WeeklySchedulerItem<any>, config: IWeeklySchedulerConfig<any>) {
        return this.rangeFactory.createRange(config, {
            day: item.day,
            start: 0,
            end: this.endAdjusterService.adjustEndForModel(config, config.maxValue),
            value: config.defaultValue
        });
    }

    private getEndSchedule(lastSchedule: WeeklySchedulerRange<any>, config: IWeeklySchedulerConfig<any>) {
        return this.rangeFactory.createRange(config, {
            day: lastSchedule.day,
            start: lastSchedule.end,
            end: this.endAdjusterService.adjustEndForModel(config, config.maxValue),
            value: config.defaultValue
        })
    }

    private getStartSchedule(firstSchedule: WeeklySchedulerRange<any>, config: IWeeklySchedulerConfig<any>) {
        return this.rangeFactory.createRange(config, {
            day: firstSchedule.day,
            start: 0,
            end: firstSchedule.start,
            value: config.defaultValue
        });
    }

    private getFilledSchedulesForSingleSchedule(schedule: WeeklySchedulerRange<any>, config: IWeeklySchedulerConfig<any>) {
        let schedules = [schedule];

        if (!this.scheduleTouchesStart(schedule, config)) {
            schedules.push(this.getStartSchedule(schedule, config));
        }

        if (!this.scheduleTouchesEnd(schedule, config)) {
            schedules.push(this.getEndSchedule(schedule, config));
        }

        return this.getSortedSchedules(schedules);
    }

    private getFilledSchedules(schedules: WeeklySchedulerRange<any>[], config: IWeeklySchedulerConfig<any>) {
        schedules = this.getSortedSchedules(schedules);

        if (schedules.length === 1) {
            return this.getFilledSchedulesForSingleSchedule(schedules[0], config);
        }

        let len = schedules.length - 1;
        
        // 2 at a time
        for (let i = 0; i < len; i++) {
            let currentSchedule = schedules[i];
            let nextSchedule = schedules[i + 1];

            let isFirstLoop = i == 0;

            if (isFirstLoop && !this.scheduleTouchesStart(currentSchedule, config)) {
                let startSchedule = this.getStartSchedule(currentSchedule, config);

                schedules.push(startSchedule);
            }

            if (!this.schedulesTouch(currentSchedule, nextSchedule)) {
                let newSchedule = this.getNewSchedule(currentSchedule, nextSchedule, config);

                schedules.push(newSchedule);
            }

            let isLastLoop = i == len - 1;

            if (isLastLoop && !this.scheduleTouchesEnd(nextSchedule, config)) {
                let endSchedule = this.getEndSchedule(nextSchedule, config);

                schedules.push(endSchedule);
                break;
            }
        }

        return this.getSortedSchedules(schedules);
    }

    private getNewSchedule(currentSchedule: WeeklySchedulerRange<any>, nextSchedule: WeeklySchedulerRange<any>, config: IWeeklySchedulerConfig<any>) {
        return this.rangeFactory.createRange(config, {
            day: currentSchedule.day,
            start: currentSchedule.end,
            end: nextSchedule.start,
            value: config.defaultValue
        });
    }

    private getSortedSchedules(schedules: WeeklySchedulerRange<any>[]) {
        return schedules.sort((a, b) => a.start - b.start);
    }

    private schedulesTouch(earlierSchedule: WeeklySchedulerRange<any>, laterSchedule: WeeklySchedulerRange<any>) {
        return earlierSchedule.end === laterSchedule.start;
    }

    private scheduleTouchesStart(schedule: WeeklySchedulerRange<any>, config: IWeeklySchedulerConfig<any>) {
        return schedule.start === 0;
    }
    
    private scheduleTouchesEnd(schedule: WeeklySchedulerRange<any>, config: IWeeklySchedulerConfig<any>) {
        return schedule.end === this.endAdjusterService.adjustEndForModel(config, config.maxValue);
    }
}

angular
    .module('br.weeklyScheduler')
    .service(FillEmptyWithDefaultService.$name, FillEmptyWithDefaultService);