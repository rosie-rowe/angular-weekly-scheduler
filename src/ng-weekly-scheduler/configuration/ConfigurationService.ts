import * as angular from 'angular';
import { IWeeklySchedulerOptions } from '../weekly-scheduler-config/IWeeklySchedulerOptions';
import { TimeConstantsService } from '../time/TimeConstantsService';

/** @internal */
export class ConfigurationService {
    static $name = 'brWeeklySchedulerConfigurationService';

    static $inject = [
        'brWeeklySchedulerTimeConstantsService'
    ];

    private constructor(
        private timeConstants: TimeConstantsService
    ) {
    }

    public getConfiguration(options: IWeeklySchedulerOptions<any>) {
        var interval = options.interval || 900; // seconds
        var intervalCount = this.timeConstants.SECONDS_IN_DAY / interval;

        const defaultOptions = this.getDefaultOptions();

        var userOptions = angular.merge(defaultOptions, options);

        var result = angular.extend(userOptions, {
            interval: interval,
            maxValue: this.timeConstants.SECONDS_IN_DAY,
            hourCount: this.timeConstants.HOURS_IN_DAY,
            intervalCount: intervalCount,
        });

        return result;
    }

    private getDefaultOptions(): IWeeklySchedulerOptions<any> {
        return {
            createItem: (day, schedules) => { return { day: day, schedules: schedules } },
            monoSchedule: false,
            onChange: () => angular.noop(),
            onRemove: () => angular.noop(),
            orientationOptions: {
                defaultOrientation: 'horizontal'
            },
            restrictionExplanations: {
                maxTimeSlot: (value) => `Max time slot length: ${value}`,
                minimumSeparation: (value) => `Slots must be at least ${value} apart!`,
                fullCalendar: 'For this calendar, every day must be completely full of schedules.',
                monoSchedule: 'This calendar may only have one time slot per day',
                nullEnds: 'Items in this calendar do not have end times. Scheduled events begin at the start time and end when they are finished.',
                scheduleCount: (options) => {
                    let pluralizedSlot = 'slot' + (options.count === 1 ? '' : 's');

                    if (options.exact) {
                        return `This calendar must have exactly ${options.count} ${pluralizedSlot} per day`;
                    } else {
                        return `This calendar may only have a maximum of ${options.count} ${pluralizedSlot} per day`;
                    }
                }
            },
            scheduleCountOptions: {
                count: null,
                exact: false
            }
        };
    }
}
