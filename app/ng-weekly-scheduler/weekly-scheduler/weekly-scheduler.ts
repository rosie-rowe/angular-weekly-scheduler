/** @internal */
class WeeklySchedulerController implements angular.IController {
  static $controllerAs = 'schedulerCtrl';
  static $name = 'brWeeklySchedulerController';

  static $inject = [
    '$element',
    '$q',
    '$scope',
    'brWeeklySchedulerGroupService',
    'brWeeklySchedulerDayMap',
    'brWeeklySchedulerEndAdjusterService',
    'brWeeklySchedulerOverlapService',
    'brWeeklySchedulerValidationService',
  ];

  constructor(
    private $element: angular.IAugmentedJQuery,
    private $q: angular.IQService,
    private $scope: angular.IScope,
    private groupService: GroupService,
    private dayMap: { [key: number]: string },
    private endAdjusterService: EndAdjusterService,
    private overlapService: OverlapService,
    private scheduleValidatorService: ScheduleValidationService
  ) {
  }

  private _originalItems: WeeklySchedulerItem<any>[];

  private overlapHandlers: { [key: number]: (item: WeeklySchedulerItem<any>, current: br.weeklyScheduler.IWeeklySchedulerRange<any>, other: br.weeklyScheduler.IWeeklySchedulerRange<any>) => void; } = {
    [OverlapState.NoOverlap]: (item, current, other) => this.handleNoOverlap(item, current, other),
    [OverlapState.CurrentIsInsideOther]: (item, current, other) => this.handleCurrentIsInsideOther(item, current, other),
    [OverlapState.CurrentCoversOther]: (item, current, other) => this.handleCurrentCoversOther(item, current, other),
    [OverlapState.OtherEndIsInsideCurrent]: (item, current, other) => this.handleOtherEndIsInsideCurrent(item, current, other),
    [OverlapState.OtherStartIsInsideCurrent]: (item, current, other) => this.handleOtherStartIsInsideCurrent(item, current, other),
    [OverlapState.OtherEndIsCurrentStart]: (item, current, other) => this.handleOtherEndIsCurrentStart(item, current, other),
    [OverlapState.OtherStartIsCurrentEnd]: (item, current, other) => this.handleOtherStartIsCurrentEnd(item, current, other)
  };

  private adapter: br.weeklyScheduler.IWeeklySchedulerAdapter<any, any>;

  /** should be true if the user is currently holding down the primary mouse button on a slot */
  public dragging: boolean;

  /** should be true if the user is currently holding the mouse pointer over a slot */
  public hoveringSlot: boolean;

  /** should be true if the scheduler became invalid after being initialized */
  public invalid: boolean;

  /** this is required to be part of a form for dirty/valid checks */
  public formController: angular.IFormController;

  /** should be true if the scheduler was **initialized** with invalid values */
  public startedWithInvalidSchedule: boolean;
  public hoverClass: string;

  public config: IWeeklySchedulerConfig<any>;
  public items: WeeklySchedulerItem<any>[];
  public options: br.weeklyScheduler.IWeeklySchedulerOptions<any>;

  public defaultOptions: br.weeklyScheduler.IWeeklySchedulerOptions<any> = {
    createItem: (day, schedules) => { return { day: day, schedules: schedules } },
    monoSchedule: false,
    onChange: (isValid) => angular.noop()
  };

  public validationErrors: ValidationError[];

  $doCheck() {
    this.validationErrors = this.getValidationErrors();
  }

  $onInit() {
    this.config = this.configure(this.options);
    this.buildItemsFromAdapter();
    this.startedWithInvalidSchedule = this.hasInvalidSchedule();
    this.watchAdapter();
    this.watchHoverClass();
  }

  public hasInvalidSchedule() {
    let validationErrors: ValidationError[] = this.getValidationErrors();

    return validationErrors.length > 0;
  }

  public mergeScheduleIntoItem(item: WeeklySchedulerItem<any>, schedule: br.weeklyScheduler.IWeeklySchedulerRange<any>) {
    // We consider the schedule we were working with to be the most important, so handle its overlaps first.
    this.mergeOverlaps(item, schedule);
    this.mergeAllOverlapsForItem(item);
  }

  public onChange() {
    this.config.onChange(!this.hasInvalidSchedule());
  }

  /**
   * Actually remove the schedule from both the screen and the model
   */
  public removeScheduleFromItem(item: WeeklySchedulerItem<any>, schedule: br.weeklyScheduler.IWeeklySchedulerRange<any>) {
    this.dragging = false;
    this.hoveringSlot = false;

    item.removeSchedule(schedule);
  }

  /**
   * Commit new values to the schedule
   */
  public updateSchedule(schedule: br.weeklyScheduler.IWeeklySchedulerRange<any>, update: br.weeklyScheduler.IWeeklySchedulerRange<any>) {
    schedule.start = update.start;
    schedule.end = this.endAdjusterService.adjustEndForModel(this.config, update.end);

    this.onChange();
  }

  private buildItems(items: WeeklySchedulerItem<any>[]) {
    this.items = this.fillItems(items);

    this.items.forEach(item => this.mergeAllOverlapsForItem(item));

    // keep a reference on the adapter so we can pull it out later
    this.adapter.items = this.items;

    // keep a copy of the items in case we need to rollback
    this._originalItems = angular.copy(this.items);
  }

  private buildItemsFromAdapter() {
    return this.buildItems(this.getItemsFromAdapter());
  }

  private getItemsFromAdapter() {
    let result = [];

    if (this.adapter) {
      let schedules = this.adapter.initialData.map(data => this.adapter.customModelToWeeklySchedulerRange(data));
      let groupedSchedules = this.groupService.groupSchedules(schedules);

      for (let key in groupedSchedules) {
        let item = this.createItem(parseInt(key, 10), groupedSchedules[key]);

        result.push(item);
      }
    }

    return result;
  }

  private getValidationErrors() {
    return Array.prototype.concat.apply([], this.items.map(item => this.scheduleValidatorService.getValidationErrors(item, this.config)));
  }

  /**
   * Configure the scheduler.
   */
  private configure(options: br.weeklyScheduler.IWeeklySchedulerOptions<any>): IWeeklySchedulerConfig<any> {
    var interval = options.interval || 15; // minutes
    var hoursInDay = 24;
    var minutesInDay = hoursInDay * 60;
    var intervalCount = minutesInDay / interval;

    var userOptions = angular.extend(this.defaultOptions, options);

    var result = angular.extend(userOptions, {
      interval: interval,
      maxValue: minutesInDay,
      hourCount: hoursInDay,
      intervalCount: intervalCount,
    });

    return result;
  }

  private createItem(day: number, schedules: br.weeklyScheduler.IWeeklySchedulerRange<any>[]) {
    let result: IInternalWeeklySchedulerItem<any>;

    let builder: br.weeklyScheduler.IWeeklySchedulerItem<any> = this.config.createItem(day, schedules);

    result = angular.extend(builder, { label: this.dayMap[day] });

    return new WeeklySchedulerItem(this.config, result, this.overlapService);
  }

  /**
   * The scheduler should always show all days, even if it was not passed any schedules for that day
   */
  private fillItems(items: WeeklySchedulerItem<any>[]) {
    let result: WeeklySchedulerItem<any>[] = [];

    angular.forEach(this.dayMap, (day: string, stringKey: string) => {
      let key = parseInt(stringKey, 10);
      let filteredItems = items.filter(item => item.day === key);
      let item: WeeklySchedulerItem<any> = filteredItems.length ? filteredItems[0] : null;

      if (!item) {
        result.push(this.createItem(key, []));
      } else {
        // If the item DID exist just set the label
        item.label = day;

        result.push(item);
      }
    });

    return angular.copy(result).sort((a, b) => a.day > b.day ? 1 : -1);
  }

  // Overlap handlers

  private handleCurrentCoversOther(item: WeeklySchedulerItem<any>, current: br.weeklyScheduler.IWeeklySchedulerRange<any>, other: br.weeklyScheduler.IWeeklySchedulerRange<any>): void {
    // Here, it doesn't matter if the values match -- the covering slot can always "eat" the other one
    this.removeScheduleFromItem(item, other);
  }

  private handleCurrentIsInsideOther(item: WeeklySchedulerItem<any>, current: br.weeklyScheduler.IWeeklySchedulerRange<any>, other: br.weeklyScheduler.IWeeklySchedulerRange<any>): void {
    if (this.valuesMatch(current, other)) {
      // Remove 'other' & make current expand to fit the other slot
      this.removeScheduleFromItem(item, other);

      this.updateSchedule(current, {
        day: other.day,
        start: other.start,
        end: other.end,
        value: other.value
      });
    } else {
      // Just remove 'current'
      this.removeScheduleFromItem(item, current);
    }
  }

  private handleNoOverlap(item: WeeklySchedulerItem<any>, current: br.weeklyScheduler.IWeeklySchedulerRange<any>, other: br.weeklyScheduler.IWeeklySchedulerRange<any>) {
    // Do nothing
  }

  private handleOtherEndIsInsideCurrent(item: WeeklySchedulerItem<any>, current: br.weeklyScheduler.IWeeklySchedulerRange<any>, other: br.weeklyScheduler.IWeeklySchedulerRange<any>): void {
    if (this.valuesMatch(current, other)) {
      this.removeScheduleFromItem(item, other);

      this.updateSchedule(current, {
        day: current.day,
        start: other.start,
        end: current.end,
        value: other.value
      });
    } else {
      this.updateSchedule(other, {
        day: other.day,
        start: other.start,
        end: current.start,
        value: current.value
      });
    }
  }

  private handleOtherStartIsInsideCurrent(item: WeeklySchedulerItem<any>, current: br.weeklyScheduler.IWeeklySchedulerRange<any>, other: br.weeklyScheduler.IWeeklySchedulerRange<any>): void {
    if (this.valuesMatch(current, other)) {
      this.removeScheduleFromItem(item, other);

      this.updateSchedule(current, {
        day: current.day,
        start: current.start,
        end: other.end,
        value: other.value
      });
    } else {
      this.updateSchedule(other, {
        day: other.day,
        start: current.end,
        end: other.end,
        value: other.value
      })
    }
  }

  private handleOtherEndIsCurrentStart(item: WeeklySchedulerItem<any>, current: br.weeklyScheduler.IWeeklySchedulerRange<any>, other: br.weeklyScheduler.IWeeklySchedulerRange<any>): void {
    if (this.valuesMatch(current, other)) {
      this.handleOtherEndIsInsideCurrent(item, current, other);
    } else {
      // DO NOTHING, this is okay if the values don't match
    }
  }

  private handleOtherStartIsCurrentEnd(item: WeeklySchedulerItem<any>, current: br.weeklyScheduler.IWeeklySchedulerRange<any>, other: br.weeklyScheduler.IWeeklySchedulerRange<any>): void {
    if (this.valuesMatch(current, other)) {
      this.handleOtherStartIsInsideCurrent(item, current, other);
    } else {
      // DO NOTHING, this is okay if the values don't match
    }
  }

  // End overlap handlers

  private mergeAllOverlapsForItem(item: WeeklySchedulerItem<any>) {
    do {
      item.schedules.forEach(schedule => this.mergeOverlaps(item, schedule));
    } while (item.needsOverlapsMerged());
  }

  private mergeOverlaps(item: WeeklySchedulerItem<any>, schedule: br.weeklyScheduler.IWeeklySchedulerRange<any>) {
    let schedules = item.schedules;

    schedules.forEach((el => {
      if (el !== schedule) {
        let overlapState = this.overlapService.getOverlapState(this.config, schedule, el);
        let overlapHandler = this.overlapHandlers[overlapState];

        overlapHandler(item, schedule, el);
      }
    }));
  }

  private resetZoom() {
    this.$scope.$broadcast(WeeklySchedulerEvents.RESET_ZOOM);
  }

  private zoomIn() {
    this.$scope.$broadcast(WeeklySchedulerEvents.ZOOM_IN);
  }

  private rollback() {
    this.buildItems(this._originalItems);
    this.formController.$setPristine();
  }

  private save() {
    return this.config.saveScheduler();
  }

  private watchAdapter() {
    this.$scope.$watch(() => {
      return this.adapter;
    }, () => {
      this.buildItemsFromAdapter();
    });
  }

  private watchHoverClass() {
    const pulseClass = 'pulse';
    const pulseSelector = `.${pulseClass}`;

    this.$scope.$watch(() => this.hoverClass, () => {
      this.$element.find(pulseSelector).removeClass(pulseClass);

      if (this.hoverClass) {
        this.$element.find(`.${this.hoverClass}`).addClass(pulseClass);
      }
    });
  }

  private valuesMatch(schedule: br.weeklyScheduler.IWeeklySchedulerRange<any>, other: br.weeklyScheduler.IWeeklySchedulerRange<any>) {
    return schedule.value === other.value;
  }
}

/** @internal */
class WeeklySchedulerComponent implements angular.IComponentOptions {
  static $name = 'brWeeklyScheduler';

  bindings = {
    adapter: '<',
    hoverClass: '<',
    options: '='
  };

  controller = WeeklySchedulerController.$name;
  controllerAs = WeeklySchedulerController.$controllerAs;

  require = {
    formController: 'form'
  };

  transclude = true;

  templateUrl = 'ng-weekly-scheduler/weekly-scheduler/weekly-scheduler.html';
}

angular.module('br.weeklyScheduler')
  .controller(WeeklySchedulerController.$name, WeeklySchedulerController)
  .component(WeeklySchedulerComponent.$name, new WeeklySchedulerComponent());
