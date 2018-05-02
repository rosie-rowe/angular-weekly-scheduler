declare class ScheduleValidatorService {
    private overlapService;
    static $name: string;
    static $inject: string[];
    private constructor();
    areSchedulesValid(item: IWeeklySchedulerItem<any>): boolean;
}
interface IWeeklySchedulerItem<T> {
    defaultValue: T;
    label: string;
    editable?: boolean;
    schedules: IWeeklySchedulerRange<T>[];
}
interface IWeeklySchedulerOptions {
    editSlot?: (schedule: IWeeklySchedulerRange<any>) => void;
    monoSchedule?: boolean;
    interval?: number;
}
interface IWeeklySchedulerRange<T> {
    $index?: number;
    /** This will indicate whether the item is currently considered active to the UI */
    $isActive?: boolean;
    start: number;
    end: number;
    value: T;
}
