describe('null end validator service', () => {
    let $service;
    let $q;

    beforeEach(angular.mock.module('br.weeklyScheduler'));

    beforeEach(inject(function (_$q_, _brWeeklySchedulerNullEndValidatorService_) {
        $q = _$q_;
        $service = _brWeeklySchedulerNullEndValidatorService_;
    }));

    describe('should validate', () => {
        let createItem = (day, schedules) => {
            return { day: day, schedules: schedules }
        };

        let allowNullEndsConfig = {
            allowNullEnds: true,
            createItem: createItem,
            defaultValue: true,
            hourCount: 24,
            intervalCount: 96,
            maxValue: 1440,
            monoSchedule: true,
            saveScheduler: () => $q.when(true)
        };

        let noNullEndsConfig = {
            allowNullEnds: false,
            createItem: createItem,
            defaultValue: true,
            hourCount: 24,
            intervalCount: 96,
            maxValue: 1440,
            monoSchedule: true,
            saveScheduler: () => $q.when(true) 
        }

        describe('items with no schedules', () => {
            let item = [];

            it('as valid when allowNullEnds is false', () => {
                expect($service.validate(item, noNullEndsConfig)).toBeTruthy();
            });

            it('as valid when allowNullEnds is true', () => {
                expect($service.validate(item, allowNullEndsConfig)).toBeTruthy();
            });
        });

        describe('items with 1 schedule with a null end', () => {
            let item = [
                { day: 0, start: 300, end: null, value: true }
            ];

            it('as invalid when allowNullEnds is false', () => {
                expect($service.validate(item, noNullEndsConfig)).toBeFalsy();
            });

            it('as valid when allowNullEnds is true', () => {
                expect($service.validate(item, allowNullEndsConfig)).toBeTruthy();
            });
        });

        describe('items with multiple schedules with at least one having a null end', () => {
            let item = [
                { day: 0, start: 300, end: null, value: true },
                { day: 0, start: 600, end: 900, value: false }
            ];

            it('as invalid when allowNullEnds is false', () => {
                expect($service.validate(item, noNullEndsConfig)).toBeFalsy();
            });

            it('as invalid when allowNullEnds is true', () => {
                expect($service.validate(item, allowNullEndsConfig)).toBeFalsy();
            });
        });

    });
});