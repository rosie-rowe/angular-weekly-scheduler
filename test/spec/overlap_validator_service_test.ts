import { OverlapValidatorService } from '../../src/ng-weekly-scheduler/schedule-validator/OverlapValidatorService';

export class OverlapValidatorServiceTests {
    static run() {
        describe('overlap validator service', function () {
            var $service: OverlapValidatorService;

            beforeEach(inject(function (_brWeeklySchedulerOverlapValidatorService_) {
                $service = _brWeeklySchedulerOverlapValidatorService_;
            }));

            var testConfig = {
                createItem: (day, schedules) => {
                    return { day: day, schedules: schedules }
                },
                defaultValue: 0,
                maxValue: 1440,
                hourCount: 24,
                intervalCount: 1440 / 15
            }

            function getTestItem(schedules) {
                return {
                    editable: true,
                    schedules: schedules
                }
            }

            describe('should validate', function () {
                describe('non-touching schedules', function () {
                    it('with the same value as valid', function () {
                        let item = [
                            { day: 0, start: 0, end: 60, value: true },
                            { day: 0, start: 75, end: 120, value: true }
                        ];

                        expect($service.validate(item, testConfig)).toBeTruthy();
                    });

                    it('with different values as valid', function () {
                        let item = [
                            { day: 0, start: 0, end: 60, value: true },
                            { day: 0, start: 75, end: 120, value: false }
                        ];

                        expect($service.validate(item, testConfig)).toBeTruthy();
                    });
                });

                describe('touching schedules', function () {
                    it('with the same value as valid', function () {
                        let item = [
                            { day: 0, start: 0, end: 60, value: true },
                            { day: 0, start: 60, end: 120, value: true }
                        ];

                        expect($service.validate(item, testConfig)).toBeTruthy();
                    });

                    it('with different values as valid', function () {
                        let item = [
                            { day: 0, start: 0, end: 60, value: true },
                            { day: 0, start: 60, end: 120, value: false }
                        ];

                        expect($service.validate(item, testConfig)).toBeTruthy();
                    });
                });

                describe('overlapping schedules', function () {
                    it('with the same value as valid', function () {
                        let item = [
                            { day: 0, start: 0, end: 60, value: true },
                            { day: 0, start: 45, end: 120, value: true }
                        ];

                        expect($service.validate(item, testConfig)).toBeTruthy();
                    });

                    it('with different values as invalid', function () {
                        let item = [
                            { day: 0, start: 0, end: 60, value: true },
                            { day: 0, start: 45, end: 120, value: false }
                        ];

                        expect($service.validate(item, testConfig)).toBeFalsy();
                    });
                });
            });
        });
    }
}
