import * as angular from 'angular';
import { WeeklySchedulerController } from '../weekly-scheduler/weekly-scheduler';
import { GridGeneratorService } from '../grid-generator/GridGeneratorService';
import { IntervalGenerationService } from '../interval-generation/IntervalGenerationService';
import { TimeConstantsService } from '../time/TimeConstantsService';
/** @internal */
export declare class DailyGridDirective implements angular.IDirective {
    private gridGeneratorService;
    private intevalGenerationService;
    private timeConstants;
    static $name: string;
    restrict: string;
    require: string;
    private config;
    private tickCount;
    private doGrid(scope, element, attrs);
    link: (scope: any, element: any, attrs: any, schedulerCtrl: WeeklySchedulerController) => void;
    constructor(gridGeneratorService: GridGeneratorService, intevalGenerationService: IntervalGenerationService, timeConstants: TimeConstantsService);
    static Factory(): (gridGeneratorService: any, intervalGenerationService: any, timeConstants: any) => DailyGridDirective;
}
