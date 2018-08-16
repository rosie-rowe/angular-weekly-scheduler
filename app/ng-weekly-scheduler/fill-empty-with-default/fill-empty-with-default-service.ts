/** @internal */
class FillEmptyWithDefaultService {
    static $name = 'brWeeklySchedulerFillEmptyWithDefaultService';

    fill(schedules: br.weeklyScheduler.IWeeklySchedulerRange<any>[], config: IWeeklySchedulerConfig<any>): br.weeklyScheduler.IWeeklySchedulerRange<any>[] {
        let len = schedules.length - 1;
        
        let newSchedules = [];
        
        // 2 at a time
        for (let i = 0; i < len; i++) {
            let currentSchedule = schedules[i];
            let nextSchedule = schedules[i + 1];

            if (currentSchedule.end !== nextSchedule.start) {
                let newSchedule = {
                    day: currentSchedule.day,
                    start: currentSchedule.end,
                    end: nextSchedule.start,
                    value: config.defaultValue
                }

                newSchedules.push(currentSchedule);
                newSchedules.push(newSchedule);
                newSchedules.push(nextSchedule);
            } else {
                newSchedules.push(currentSchedule);
                newSchedules.push(nextSchedule);
            }

            let isLastLoop = i == len - 1;

            if (isLastLoop && nextSchedule.end !== config.maxTimeSlot) {
                let endSchedule = {
                    day: nextSchedule.day,
                    start: nextSchedule.end,
                    end: config.maxValue,
                    value: config.defaultValue
                }

                newSchedules.push(endSchedule);
            }
        }

        return newSchedules;
    }
}

angular
    .module('br.weeklyScheduler')
    .service(FillEmptyWithDefaultService.$name, FillEmptyWithDefaultService);
