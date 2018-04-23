angular.module('demoApp', ['ngAnimate', 'weeklyScheduler', 'weeklySchedulerI18N'])
    .config(['weeklySchedulerLocaleServiceProvider', function (localeServiceProvider) {
        localeServiceProvider.configure({
            doys: { 'es-es': 4 },
            lang: { 'es-es': { weekNb: 'número de la semana', addNew: 'Añadir' } },
            localeLocationPattern: '/angular-locale_{{locale}}.js'
        });
    }])
    .controller('DemoController', ['$scope', '$timeout', 'weeklySchedulerLocaleService', '$log',
    function ($scope, $timeout, localeService, $log) {
        $scope.model = {
            locale: localeService.$locale.id,
            options: { /*monoSchedule: true*/},
            items: [
                {
                    label: 'Sun',
                    //editable: false,
                    schedules: []
                },
                {
                    label: 'Mon',
                    //editable: false,
                    schedules: [
                        { start: 300, end: 1140 }
                    ]
                },
                {
                    label: 'Tue',
                    schedules: [
                        { start: 0, end: 240 },
                        { start: 300, end: 360 }
                    ]
                },
                {
                    label: 'Wed',
                    schedules: [
                        { start: 120, end: 720 }
                    ]
                },
                {
                    label: 'Thur',
                    editable: false,
                    schedules: [
                        { start: 300, end: 1140 }
                    ]
                },
                {
                    label: 'Fri',
                    schedules: [
                        { start: 720, end: 780 }
                    ]
                },
                {
                    label: 'Sat',
                    schedules: []
                }
            ]
        };
        this.doSomething = function (itemIndex, scheduleIndex, scheduleValue) {
            console.log('The model has changed!', itemIndex, scheduleIndex, scheduleValue);
        };
        this.onLocaleChange = function () {
            $log.debug('The locale is changing to', $scope.model.locale);
            localeService.set($scope.model.locale).then(function ($locale) {
                $log.debug('The locale changed to', $locale.id);
            });
        };
    }]);
angular.module('weeklyScheduler', ['ngWeeklySchedulerTemplates']);
var GRID_TEMPLATE = angular.element('<div class="grid-item"></div>');
var isCtrl;
function ctrlCheck(e) {
    if (e.which === 17) {
        isCtrl = e.type === 'keydown';
    }
}
function mouseScroll(el, delta) {
    window.addEventListener('keydown', ctrlCheck);
    window.addEventListener('keyup', ctrlCheck);
    el.addEventListener('mousewheel', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (isCtrl) {
            var style = el.firstChild.style, currentWidth = parseInt(style.width);
            if ((e.wheelDelta || e.detail) > 0) {
                style.width = (currentWidth + 2 * delta) + '%';
            }
            else {
                var width = currentWidth - 2 * delta;
                style.width = (width > 100 ? width : 100) + '%';
            }
        }
        else {
            if ((e.wheelDelta || e.detail) > 0) {
                el.scrollLeft -= delta;
            }
            else {
                el.scrollLeft += delta;
            }
        }
        return false;
    });
}
function zoomInACell(el, event, data) {
    var nbElements = data.nbElements;
    var idx = data.idx;
    // percentWidthFromBeginning is used when the first element of the grid is not full
    // For instance, in the example below `feb 17` is not full
    // feb 17          march 17
    //       |                          |
    var percentWidthFromBeginning = data.percentWidthFromBeginning;
    var containerWidth = el.offsetWidth;
    // leave (1/3) each side
    // 1/3 |    3/3   | 1/3
    var boxWidth = containerWidth / (5 / 3);
    var gutterSize = boxWidth / 3;
    var scheduleAreaWidthPx = nbElements * boxWidth;
    var scheduleAreaWidthPercent = (scheduleAreaWidthPx / containerWidth) * 100;
    el.querySelector('.schedule-area').style.width = scheduleAreaWidthPercent + '%';
    if (percentWidthFromBeginning === undefined) {
        // All cells of a line have the same size
        el.scrollLeft = idx * boxWidth - gutterSize;
    }
    else {
        // Sizes of cells in a line could different (especially the first one)
        el.scrollLeft = scheduleAreaWidthPx * (percentWidthFromBeginning / 100) - gutterSize;
    }
}
/** @internal */
var HandleDirective = /** @class */ (function () {
    function HandleDirective($document) {
        var _this = this;
        this.$document = $document;
        this.restrict = 'A';
        this.scope = {
            ondrag: '=',
            ondragstop: '=',
            ondragstart: '='
        };
        this.link = function (scope, element) {
            var $document = _this.$document;
            var x = 0;
            element.on('mousedown', function (event) {
                // Prevent default dragging of selected content
                event.preventDefault();
                x = event.pageX;
                $document.on('mousemove', mousemove);
                $document.on('mouseup', mouseup);
                if (scope.ondragstart) {
                    scope.ondragstart();
                }
            });
            function mousemove(event) {
                var delta = event.pageX - x;
                if (scope.ondrag) {
                    scope.ondrag(delta);
                }
            }
            function mouseup() {
                $document.unbind('mousemove', mousemove);
                $document.unbind('mouseup', mouseup);
                if (scope.ondragstop) {
                    scope.ondragstop();
                }
            }
        };
    }
    HandleDirective.Factory = function () {
        var directive = function ($document) { return new HandleDirective($document); };
        directive.$inject = ['$document'];
        return directive;
    };
    HandleDirective.$name = 'handle';
    return HandleDirective;
}());
angular.module('weeklyScheduler')
    .directive(HandleDirective.$name, HandleDirective.Factory());
/** @internal */
var HourlyGridDirective = /** @class */ (function () {
    function HourlyGridDirective() {
        var _this = this;
        this.restrict = 'E';
        this.require = '^weeklyScheduler';
        this.link = function (scope, element, attrs, schedulerCtrl) {
            if (schedulerCtrl.config) {
                _this.doGrid(scope, element, attrs, schedulerCtrl.config);
            }
            schedulerCtrl.$modelChangeListeners.push(function (newConfig) {
                _this.doGrid(scope, element, attrs, newConfig);
            });
        };
    }
    HourlyGridDirective.prototype.handleClickEvent = function (child, hourCount, idx, scope) {
        child.bind('click', function () {
            scope.$emit("clickOnACell" /* CLICK_ON_A_CELL */, {
                nbElements: hourCount,
                idx: idx
            });
        });
    };
    HourlyGridDirective.prototype.doGrid = function (scope, element, attrs, config) {
        var i;
        // Calculate hour width distribution
        var tickcount = config.hourCount;
        var ticksize = 100 / tickcount;
        var gridItemEl = GRID_TEMPLATE.css({ width: ticksize + '%' });
        // Clean element
        element.empty();
        for (i = 0; i < tickcount; i++) {
            var child = gridItemEl.clone();
            if (angular.isUndefined(attrs.noText)) {
                this.handleClickEvent(child, tickcount, i, scope);
                var currentHour = i % 12;
                var meridiem = i >= 12 ? 'pm' : 'am';
                child.text("" + (currentHour || '12') + meridiem);
            }
            element.append(child);
        }
    };
    HourlyGridDirective.Factory = function () {
        var directive = function () { return new HourlyGridDirective(); };
        return directive;
    };
    HourlyGridDirective.$name = 'hourlyGrid';
    return HourlyGridDirective;
}());
angular
    .module('weeklyScheduler')
    .directive(HourlyGridDirective.$name, HourlyGridDirective.Factory());
/** @internal */
var IntervalGridDirective = /** @class */ (function () {
    function IntervalGridDirective() {
        var _this = this;
        this.restrict = 'E';
        this.require = '^weeklyScheduler';
        this.link = function (scope, element, attrs, schedulerCtrl) {
            if (schedulerCtrl.config) {
                _this.doGrid(scope, element, attrs, schedulerCtrl.config);
            }
            schedulerCtrl.$modelChangeListeners.push(function (newConfig) {
                _this.doGrid(scope, element, attrs, newConfig);
            });
        };
    }
    IntervalGridDirective.prototype.doGrid = function (scope, element, attrs, config) {
        // Calculate interval width distribution
        var tickcount = config.intervalCount;
        var ticksize = 100 / tickcount;
        var gridItemEl = GRID_TEMPLATE.css({ width: ticksize + '%' });
        // Clean element
        element.empty();
        for (var i = 0; i < tickcount; i++) {
            var child = gridItemEl.clone();
            // Add border-right at ends of hours
            if (this.shouldAddBorder(i, tickcount, config)) {
                child.addClass('weekly-schedule-border');
            }
            element.append(child);
        }
    };
    IntervalGridDirective.prototype.shouldAddBorder = function (index, tickcount, config) {
        if (index === tickcount - 1) {
            return false;
        }
        return (index + 1) * config.interval % 60 === 0;
    };
    IntervalGridDirective.Factory = function () {
        var directive = function () { return new IntervalGridDirective(); };
        return directive;
    };
    IntervalGridDirective.$name = 'intervalGrid';
    return IntervalGridDirective;
}());
angular
    .module('weeklyScheduler')
    .directive(IntervalGridDirective.$name, IntervalGridDirective.Factory());
angular.module('weeklySchedulerI18N', ['tmh.dynamicLocale']);
angular.module('weeklySchedulerI18N')
    .provider('weeklySchedulerLocaleService', ['tmhDynamicLocaleProvider', function (tmhDynamicLocaleProvider) {
        var defaultConfig = {
            doys: { 'de-de': 4, 'en-gb': 4, 'en-us': 6, 'fr-fr': 4 },
            lang: {
                'de-de': { weekNb: 'Wochenummer', addNew: 'Hinzufügen' },
                'en-gb': { weekNb: 'Week #', addNew: 'Add' },
                'en-us': { weekNb: 'Week #', addNew: 'Add' },
                'fr-fr': { weekNb: 'N° de semaine', addNew: 'Ajouter' }
            }
        };
        this.configure = function (config) {
            if (config && angular.isObject(config)) {
                angular.merge(defaultConfig, config);
                if (defaultConfig.localeLocationPattern) {
                    tmhDynamicLocaleProvider.localeLocationPattern(defaultConfig.localeLocationPattern);
                }
            }
        };
        this.$get = ['$rootScope', '$locale', 'tmhDynamicLocale', function ($rootScope, $locale, tmhDynamicLocale) {
                var momentLocaleCache = {};
                function getLang() {
                    var key = $locale.id;
                    if (!momentLocaleCache[key]) {
                        momentLocaleCache[key] = getMomentLocale(key);
                        moment.locale(momentLocaleCache[key].id, momentLocaleCache[key].locale);
                    }
                    else {
                        moment.locale(momentLocaleCache[key].id);
                    }
                    return defaultConfig.lang[key];
                }
                // We just need few moment local information
                function getMomentLocale(key) {
                    return {
                        id: key,
                        locale: {
                            week: {
                                // Angular monday = 0 whereas Moment monday = 1
                                dow: ($locale.DATETIME_FORMATS.FIRSTDAYOFWEEK + 1) % 7,
                                doy: defaultConfig.doys[key]
                            }
                        }
                    };
                }
                $rootScope.$on('$localeChangeSuccess', function () {
                    $rootScope.$broadcast('weeklySchedulerLocaleChanged', getLang());
                });
                return {
                    $locale: $locale,
                    getLang: getLang,
                    set: function (key) {
                        return tmhDynamicLocale.set(key);
                    }
                };
            }];
    }]);
/** @internal */
var MultiSliderController = /** @class */ (function () {
    function MultiSliderController($element) {
        this.$element = $element;
        this.defaultNewScheduleSize = 60; // minutes
        this.element = this.$element[0];
    }
    MultiSliderController.prototype.$onInit = function () {
        if (this.size) {
            this.defaultNewScheduleSize = this.size;
        }
    };
    MultiSliderController.prototype.$postLink = function () {
        var _this = this;
        this.$hoverElement = angular.element(this.$element.find('div')[0]);
        var hoverElementWidth = this.valToPixel(this.defaultNewScheduleSize);
        this.$hoverElement.css({
            width: hoverElementWidth + "px"
        });
        this.$element.on('mousemove', function (e) {
            var elOffX = _this.getElementOffsetX(_this.$element);
            var left = e.pageX - elOffX - hoverElementWidth / 2;
            var snapped = _this.valToPixel(_this.pixelToVal(left));
            _this.$hoverElement.css({
                left: snapped + 'px'
            });
        });
    };
    MultiSliderController.prototype.addSlot = function (start, end) {
        if (start < 0) {
            start = 0;
        }
        if (end > this.config.maxValue) {
            end = this.config.maxValue;
        }
        var item = this.item;
        if (!item.schedules) {
            item.schedules = [];
        }
        item.schedules.push({
            start: start,
            end: end
        });
    };
    MultiSliderController.prototype.getElementOffsetX = function (elem) {
        return elem[0].getBoundingClientRect().left;
    };
    MultiSliderController.prototype.getSlotLeft = function (schedule) {
        return schedule.start / this.config.maxValue * 100 + '%';
    };
    MultiSliderController.prototype.getSlotWidth = function (schedule) {
        return (schedule.end - schedule.start) / this.config.maxValue * 100 + '%';
    };
    MultiSliderController.prototype.onHoverElementClick = function (event) {
        if (!this.$element.attr('no-add')) {
            var elOffX = this.getElementOffsetX(this.$element);
            var hoverElOffX = this.getElementOffsetX(this.$hoverElement) - elOffX;
            var start = this.pixelToVal(hoverElOffX);
            var end = start + this.defaultNewScheduleSize;
            this.addSlot(start, end);
        }
    };
    MultiSliderController.prototype.onWeeklySlotMouseOver = function () {
        this.$element.addClass('slot-hover');
    };
    MultiSliderController.prototype.onWeeklySlotMouseLeave = function () {
        this.$element.removeClass('slot-hover');
    };
    MultiSliderController.prototype.valToPixel = function (val) {
        var percent = val / this.config.intervalCount / this.config.interval;
        return Math.floor(percent * this.element.clientWidth + 0.5);
    };
    MultiSliderController.prototype.pixelToVal = function (pixel) {
        var percent = pixel / this.element.clientWidth;
        return Math.floor(percent * (this.config.intervalCount) + 0.5) * this.config.interval;
    };
    MultiSliderController.$name = 'multiSliderController';
    MultiSliderController.$controllerAs = 'multiSliderCtrl';
    MultiSliderController.$inject = [
        '$element'
    ];
    return MultiSliderController;
}());
/** @internal */
var MultiSliderComponent = /** @class */ (function () {
    function MultiSliderComponent() {
        this.bindings = {
            config: '<',
            item: '=',
            size: '<?'
        };
        this.controller = MultiSliderController.$name;
        this.controllerAs = MultiSliderController.$controllerAs;
        this.templateUrl = 'ng-weekly-scheduler/multislider/multislider.html';
    }
    MultiSliderComponent.$name = 'multiSlider';
    return MultiSliderComponent;
}());
angular.module('weeklyScheduler')
    .controller(MultiSliderController.$name, MultiSliderController)
    .component(MultiSliderComponent.$name, new MultiSliderComponent());
var ScheduleAreaContainerController = /** @class */ (function () {
    function ScheduleAreaContainerController($element, $scope) {
        this.$element = $element;
        this.$scope = $scope;
    }
    ScheduleAreaContainerController.prototype.$postLink = function () {
        var element = this.$element[0]; // grab plain js, not jqlite
        mouseScroll(element, 20);
        this.$scope.$on("clickOnACell" /* CLICK_ON_A_CELL */, function (e, data) {
            zoomInACell(element, e, data);
        });
    };
    ScheduleAreaContainerController.$name = 'scheduleAreaContainerController';
    ScheduleAreaContainerController.$inject = [
        '$element',
        '$scope'
    ];
    return ScheduleAreaContainerController;
}());
var ScheduleAreaContainerComponent = /** @class */ (function () {
    function ScheduleAreaContainerComponent() {
        this.controller = ScheduleAreaContainerController.$name;
        this.transclude = true;
        this.template = "<ng-transclude></ng-transclude>";
    }
    ScheduleAreaContainerComponent.$name = 'scheduleAreaContainer';
    return ScheduleAreaContainerComponent;
}());
angular.module('weeklyScheduler')
    .controller(ScheduleAreaContainerController.$name, ScheduleAreaContainerController)
    .component(ScheduleAreaContainerComponent.$name, new ScheduleAreaContainerComponent());
/** @internal */
var TimeOfDayFilter = /** @class */ (function () {
    function TimeOfDayFilter() {
    }
    TimeOfDayFilter.Factory = function () {
        var standardFormat = 'h:mmA';
        var militaryFormat = 'HH:mm';
        return function (minutes) {
            // The moment-duration-format package always outputs military time, (it converts a duration to a time string, not a time of day) so we'll need to grab that and then convert
            var militaryTime = moment.duration(minutes, 'minutes').format(militaryFormat, { trim: false });
            return moment(militaryTime, militaryFormat).format(standardFormat);
        };
    };
    TimeOfDayFilter.$name = 'timeOfDay';
    return TimeOfDayFilter;
}());
angular
    .module('weeklyScheduler')
    .filter(TimeOfDayFilter.$name, [TimeOfDayFilter.Factory]);
/** @internal */
var WeeklySchedulerController = /** @class */ (function () {
    function WeeklySchedulerController($scope, localeService /* TODO type */) {
        this.$scope = $scope;
        this.localeService = localeService;
        this.defaultOptions = {
            monoSchedule: false,
        };
    }
    WeeklySchedulerController.prototype.$onInit = function () {
        var _this = this;
        this.defaultOptions.labels = this.localeService.getLang();
        // Will hang our model change listeners
        this.$modelChangeListeners = [];
        /**
         * Watch the model items
         */
        this.$scope.$watchCollection(function () { return _this.items; }, function (newItems) { return _this.onModelChange(newItems); });
        /**
         * Listen to $locale change (brought by external module weeklySchedulerI18N)
         */
        this.$scope.$on('weeklySchedulerLocaleChanged', function (e, labels) {
            if (this.config) {
                this.config.labels = labels;
            }
            this.onModelChange(angular.copy(this.items, []));
        });
    };
    /**
     * Configure the scheduler.
     */
    WeeklySchedulerController.prototype.configure = function (options) {
        var interval = options.interval || 15; // minutes
        var hoursInDay = 24;
        var minutesInDay = hoursInDay * 60;
        var intervalCount = minutesInDay / interval;
        var result = angular.extend(this.defaultOptions, { interval: interval, maxValue: minutesInDay, hourCount: hoursInDay, intervalCount: intervalCount });
        return result;
    };
    WeeklySchedulerController.prototype.onModelChange = function (items) {
        var _this = this;
        // Check items are present
        if (items) {
            // Check items are in an Array
            if (!angular.isArray(items)) {
                throw 'You should use weekly-scheduler directive with an Array of items';
            }
            // Keep track of our model (use it in template)
            this.items = items;
            // If in multiSlider mode, ensure a schedule array is present on each item
            // Else only use first element of schedule array
            items.forEach(function (item) {
                var schedules = item.schedules;
                if (schedules && schedules.length) {
                    if (_this.options.monoSchedule) {
                        item.schedules = [schedules[0]];
                    }
                }
                else {
                    item.schedules = [];
                }
            });
            // Calculate configuration
            this.config = this.configure(this.options);
            // Finally, run the sub directives listeners
            this.$modelChangeListeners.forEach(function (listener) {
                listener(_this.config);
            });
        }
    };
    WeeklySchedulerController.$controllerAs = 'schedulerCtrl';
    WeeklySchedulerController.$name = 'weeklySchedulerController';
    WeeklySchedulerController.$inject = [
        '$scope',
        'weeklySchedulerLocaleService'
    ];
    return WeeklySchedulerController;
}());
/** @internal */
var WeeklySchedulerComponent = /** @class */ (function () {
    function WeeklySchedulerComponent() {
        this.bindings = {
            items: '=',
            options: '=',
            onChange: '&'
        };
        this.controller = WeeklySchedulerController.$name;
        this.controllerAs = WeeklySchedulerController.$controllerAs;
        this.transclude = true;
        this.templateUrl = 'ng-weekly-scheduler/weekly-scheduler/weekly-scheduler.html';
    }
    WeeklySchedulerComponent.$name = 'weeklyScheduler';
    return WeeklySchedulerComponent;
}());
angular.module('weeklyScheduler')
    .controller(WeeklySchedulerController.$name, WeeklySchedulerController)
    .component(WeeklySchedulerComponent.$name, new WeeklySchedulerComponent());
/** @internal */
var WeeklySlotDirective = /** @class */ (function () {
    function WeeklySlotDirective() {
        this.restrict = 'E';
        this.require = ['^weeklyScheduler', 'ngModel'];
        this.scope = {
            schedule: '=ngModel',
            item: '='
        };
        this.templateUrl = 'ng-weekly-scheduler/weekly-slot/weekly-slot.html';
        this.link = function (scope, element, attrs, ctrls) {
            var schedulerCtrl = ctrls[0], ngModelCtrl = ctrls[1];
            var conf = schedulerCtrl.config;
            var index = scope.$parent.$index;
            var containerEl = element.parent();
            var resizeDirectionIsStart = true;
            var valuesOnDragStart = { start: scope.schedule.start, end: scope.schedule.end };
            var pixelToVal = function (pixel) {
                var percent = pixel / containerEl[0].clientWidth;
                return Math.floor(percent * (conf.intervalCount) + 0.5) * conf.interval;
            };
            var removeSchedule = function (schedule) {
                var schedules = scope.item.schedules;
                schedules.splice(schedules.indexOf(schedule), 1);
            };
            var mergeOverlaps = function () {
                var schedule = scope.schedule;
                var schedules = scope.item.schedules;
                schedules.forEach(function (el) {
                    if (el !== schedule) {
                        // model is inside another slot
                        if (el.end >= schedule.end && el.start <= schedule.start) {
                            removeSchedule(el);
                            updateSelf({
                                start: el.start,
                                end: el.end
                            });
                        }
                        // model completely covers another slot
                        else if (schedule.end >= el.end && schedule.start <= el.start) {
                            removeSchedule(el);
                        }
                        // another slot's end is inside current model
                        else if (el.end >= schedule.start && el.end <= schedule.end) {
                            removeSchedule(el);
                            updateSelf({
                                start: el.start,
                                end: schedule.end
                            });
                        }
                        // another slot's start is inside current model
                        else if (el.start >= schedule.start && el.start <= schedule.end) {
                            removeSchedule(el);
                            updateSelf({
                                start: schedule.start,
                                end: el.end
                            });
                        }
                    }
                });
            };
            var updateSelf = function (update) {
                ngModelCtrl.$setViewValue(update);
            };
            scope.canRemove = function () { return !angular.isDefined(scope.item.editable) || scope.item.editable; };
            if (scope.item.editable !== false) {
                scope.deleteSelf = function () {
                    containerEl.removeClass('dragging');
                    containerEl.removeClass('slot-hover');
                    removeSchedule(scope.schedule);
                };
                scope.startResizeStart = function () {
                    resizeDirectionIsStart = true;
                    scope.startDrag();
                };
                scope.startResizeEnd = function () {
                    resizeDirectionIsStart = false;
                    scope.startDrag();
                };
                scope.startDrag = function () {
                    element.addClass('active');
                    containerEl.addClass('dragging');
                    containerEl.attr('no-add', 'true');
                    valuesOnDragStart = { start: ngModelCtrl.$viewValue.start, end: ngModelCtrl.$viewValue.end };
                };
                scope.endDrag = function () {
                    // this prevents user from accidentally
                    // adding new slot after resizing or dragging
                    setTimeout(function () {
                        containerEl.removeAttr('no-add');
                    }, 500);
                    element.removeClass('active');
                    containerEl.removeClass('dragging');
                    mergeOverlaps();
                };
                scope.resize = function (d) {
                    var ui = ngModelCtrl.$viewValue;
                    var delta = pixelToVal(d);
                    if (resizeDirectionIsStart) {
                        var newStart = Math.round(valuesOnDragStart.start + delta);
                        if (ui.start !== newStart && newStart <= ui.end - 1 && newStart >= 0) {
                            updateSelf({
                                start: newStart,
                                end: ui.end
                            });
                        }
                    }
                    else {
                        var newEnd = Math.round(valuesOnDragStart.end + delta);
                        if (ui.end !== newEnd && newEnd >= ui.start + 1 && newEnd <= conf.maxValue) {
                            updateSelf({
                                start: ui.start,
                                end: newEnd
                            });
                        }
                    }
                };
                scope.drag = function (d) {
                    var ui = ngModelCtrl.$viewValue;
                    var delta = pixelToVal(d);
                    var duration = valuesOnDragStart.end - valuesOnDragStart.start;
                    var newStart = Math.round(valuesOnDragStart.start + delta);
                    var newEnd = Math.round(newStart + duration);
                    if (ui.start !== newStart && newStart >= 0 && newEnd <= conf.maxValue) {
                        updateSelf({
                            start: newStart,
                            end: newEnd
                        });
                    }
                };
            }
            // on init, merge overlaps
            mergeOverlaps();
            //// UI -> model ////////////////////////////////////
            ngModelCtrl.$parsers.push(function (ui) {
                ngModelCtrl.$modelValue.start = ui.start;
                ngModelCtrl.$modelValue.end = ui.end;
                schedulerCtrl.onChange({ itemIndex: index, scheduleIndex: scope.$index, scheduleValue: ngModelCtrl.$modelValue });
                return ngModelCtrl.$modelValue;
            });
            scope.$on('weeklySchedulerLocaleChanged', function () {
                // Simple change object reference so that ngModel triggers formatting & rendering
                scope.schedule = angular.copy(scope.schedule);
            });
        };
    }
    WeeklySlotDirective.Factory = function () {
        var directive = function () { return new WeeklySlotDirective(); };
        return directive;
    };
    WeeklySlotDirective.$name = 'weeklySlot';
    return WeeklySlotDirective;
}());
angular
    .module('weeklyScheduler')
    .directive(WeeklySlotDirective.$name, WeeklySlotDirective.Factory());

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC9kZW1vLWFwcC50cyIsImFwcC9uZy13ZWVrbHktc2NoZWR1bGVyL21vZHVsZS50cyIsImFwcC9uZy13ZWVrbHktc2NoZWR1bGVyL2hhbmRsZS9oYW5kbGUudHMiLCJhcHAvbmctd2Vla2x5LXNjaGVkdWxlci9ob3VybHktZ3JpZC9ob3VybHktZ3JpZC50cyIsImFwcC9uZy13ZWVrbHktc2NoZWR1bGVyL2ludGVydmFsLWdyaWQvaW50ZXJ2YWwtZ3JpZC50cyIsImFwcC9uZy13ZWVrbHktc2NoZWR1bGVyL2xvY2FsZS9sb2NhbGUtc2VydmljZS50cyIsImFwcC9uZy13ZWVrbHktc2NoZWR1bGVyL211bHRpc2xpZGVyL211bHRpc2xpZGVyLnRzIiwiYXBwL25nLXdlZWtseS1zY2hlZHVsZXIvc2NoZWR1bGUtYXJlYS1jb250YWluZXIvc2NoZWR1bGUtYXJlYS1jb250YWluZXIudHMiLCJhcHAvbmctd2Vla2x5LXNjaGVkdWxlci90aW1lL3RpbWUtb2YtZGF5LnRzIiwiYXBwL25nLXdlZWtseS1zY2hlZHVsZXIvd2Vla2x5LXNjaGVkdWxlci93ZWVrbHktc2NoZWR1bGVyLnRzIiwiYXBwL25nLXdlZWtseS1zY2hlZHVsZXIvd2Vla2x5LXNsb3Qvd2Vla2x5LXNsb3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxXQUFXLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLENBQUMsQ0FBQztLQUUvRSxNQUFNLENBQUMsQ0FBQyxzQ0FBc0MsRUFBRSxVQUFVLHFCQUFxQjtRQUM5RSxxQkFBcUIsQ0FBQyxTQUFTLENBQUM7WUFDOUIsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRTtZQUNwQixJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUscUJBQXFCLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFO1lBQ3RFLHFCQUFxQixFQUFFLCtCQUErQjtT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QyIsImZpbGUiOiJuZy13ZWVrbHktc2NoZWR1bGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZGVjbGFyZSB2YXIgbW9tZW50O1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2RlbW9BcHAnLCBbJ25nQW5pbWF0ZScsICd3ZWVrbHlTY2hlZHVsZXInLCAnd2Vla2x5U2NoZWR1bGVySTE4TiddKVxyXG5cclxuICAuY29uZmlnKFsnd2Vla2x5U2NoZWR1bGVyTG9jYWxlU2VydmljZVByb3ZpZGVyJywgZnVuY3Rpb24gKGxvY2FsZVNlcnZpY2VQcm92aWRlcikge1xyXG4gICAgbG9jYWxlU2VydmljZVByb3ZpZGVyLmNvbmZpZ3VyZSh7XHJcbiAgICAgIGRveXM6IHsgJ2VzLWVzJzogNCB9LFxyXG4gICAgICBsYW5nOiB7ICdlcy1lcyc6IHsgd2Vla05iOiAnbsO6bWVybyBkZSBsYSBzZW1hbmEnLCBhZGROZXc6ICdBw7FhZGlyJyB9IH0sXHJcbiAgICAgIGxvY2FsZUxvY2F0aW9uUGF0dGVybjogJy9hbmd1bGFyLWxvY2FsZV97e2xvY2FsZX19LmpzJ1xyXG4gICAgfSk7XHJcbiAgfV0pXHJcblxyXG4gIC5jb250cm9sbGVyKCdEZW1vQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyR0aW1lb3V0JywgJ3dlZWtseVNjaGVkdWxlckxvY2FsZVNlcnZpY2UnLCAnJGxvZycsXHJcbiAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdGltZW91dCwgbG9jYWxlU2VydmljZSwgJGxvZykge1xyXG5cclxuICAgICAgJHNjb3BlLm1vZGVsID0ge1xyXG4gICAgICAgIGxvY2FsZTogbG9jYWxlU2VydmljZS4kbG9jYWxlLmlkLFxyXG4gICAgICAgIG9wdGlvbnM6IHsvKm1vbm9TY2hlZHVsZTogdHJ1ZSovIH0sXHJcbiAgICAgICAgaXRlbXM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbGFiZWw6ICdTdW4nLFxyXG4gICAgICAgICAgICAvL2VkaXRhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgc2NoZWR1bGVzOiBbXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGxhYmVsOiAnTW9uJyxcclxuICAgICAgICAgICAgLy9lZGl0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHNjaGVkdWxlczogW1xyXG4gICAgICAgICAgICAgIHsgc3RhcnQ6IDMwMCwgZW5kOiAxMTQwIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbGFiZWw6ICdUdWUnLFxyXG4gICAgICAgICAgICBzY2hlZHVsZXM6IFtcclxuICAgICAgICAgICAgICB7IHN0YXJ0OiAwLCBlbmQ6IDI0MCB9LFxyXG4gICAgICAgICAgICAgIHsgc3RhcnQ6IDMwMCwgZW5kOiAzNjAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBsYWJlbDogJ1dlZCcsXHJcbiAgICAgICAgICAgIHNjaGVkdWxlczogW1xyXG4gICAgICAgICAgICAgIHsgc3RhcnQ6IDEyMCwgZW5kOiA3MjAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBsYWJlbDogJ1RodXInLFxyXG4gICAgICAgICAgICBlZGl0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHNjaGVkdWxlczogW1xyXG4gICAgICAgICAgICAgIHsgc3RhcnQ6IDMwMCwgZW5kOiAxMTQwIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbGFiZWw6ICdGcmknLFxyXG4gICAgICAgICAgICBzY2hlZHVsZXM6IFtcclxuICAgICAgICAgICAgICB7IHN0YXJ0OiA3MjAsIGVuZDogNzgwIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbGFiZWw6ICdTYXQnLFxyXG4gICAgICAgICAgICBzY2hlZHVsZXM6IFtcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHRoaXMuZG9Tb21ldGhpbmcgPSBmdW5jdGlvbiAoaXRlbUluZGV4LCBzY2hlZHVsZUluZGV4LCBzY2hlZHVsZVZhbHVlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1RoZSBtb2RlbCBoYXMgY2hhbmdlZCEnLCBpdGVtSW5kZXgsIHNjaGVkdWxlSW5kZXgsIHNjaGVkdWxlVmFsdWUpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgdGhpcy5vbkxvY2FsZUNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkbG9nLmRlYnVnKCdUaGUgbG9jYWxlIGlzIGNoYW5naW5nIHRvJywgJHNjb3BlLm1vZGVsLmxvY2FsZSk7XHJcbiAgICAgICAgbG9jYWxlU2VydmljZS5zZXQoJHNjb3BlLm1vZGVsLmxvY2FsZSkudGhlbihmdW5jdGlvbiAoJGxvY2FsZSkge1xyXG4gICAgICAgICAgJGxvZy5kZWJ1ZygnVGhlIGxvY2FsZSBjaGFuZ2VkIHRvJywgJGxvY2FsZS5pZCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH07XHJcbiAgICB9XSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCd3ZWVrbHlTY2hlZHVsZXInLCBbJ25nV2Vla2x5U2NoZWR1bGVyVGVtcGxhdGVzJ10pO1xyXG5cclxudmFyIEdSSURfVEVNUExBVEUgPSBhbmd1bGFyLmVsZW1lbnQoJzxkaXYgY2xhc3M9XCJncmlkLWl0ZW1cIj48L2Rpdj4nKTtcclxudmFyIGlzQ3RybDtcclxuXHJcbmZ1bmN0aW9uIGN0cmxDaGVjayhlKSB7XHJcbiAgaWYgKGUud2hpY2ggPT09IDE3KSB7XHJcbiAgICBpc0N0cmwgPSBlLnR5cGUgPT09ICdrZXlkb3duJztcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdXNlU2Nyb2xsKGVsLCBkZWx0YSkge1xyXG5cclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGN0cmxDaGVjayk7XHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgY3RybENoZWNrKTtcclxuXHJcbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgIGlmIChpc0N0cmwpIHtcclxuICAgICAgdmFyIHN0eWxlID0gZWwuZmlyc3RDaGlsZC5zdHlsZSwgY3VycmVudFdpZHRoID0gcGFyc2VJbnQoc3R5bGUud2lkdGgpO1xyXG4gICAgICBpZiAoKGUud2hlZWxEZWx0YSB8fCBlLmRldGFpbCkgPiAwKSB7XHJcbiAgICAgICAgc3R5bGUud2lkdGggPSAoY3VycmVudFdpZHRoICsgMiAqIGRlbHRhKSArICclJztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgd2lkdGggPSBjdXJyZW50V2lkdGggLSAyICogZGVsdGE7XHJcbiAgICAgICAgc3R5bGUud2lkdGggPSAod2lkdGggPiAxMDAgPyB3aWR0aCA6IDEwMCkgKyAnJSc7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICgoZS53aGVlbERlbHRhIHx8IGUuZGV0YWlsKSA+IDApIHtcclxuICAgICAgICBlbC5zY3JvbGxMZWZ0IC09IGRlbHRhO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsLnNjcm9sbExlZnQgKz0gZGVsdGE7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gem9vbUluQUNlbGwoZWwsIGV2ZW50LCBkYXRhKSB7XHJcblxyXG4gIHZhciBuYkVsZW1lbnRzID0gZGF0YS5uYkVsZW1lbnRzO1xyXG4gIHZhciBpZHggPSBkYXRhLmlkeDtcclxuICAvLyBwZXJjZW50V2lkdGhGcm9tQmVnaW5uaW5nIGlzIHVzZWQgd2hlbiB0aGUgZmlyc3QgZWxlbWVudCBvZiB0aGUgZ3JpZCBpcyBub3QgZnVsbFxyXG4gIC8vIEZvciBpbnN0YW5jZSwgaW4gdGhlIGV4YW1wbGUgYmVsb3cgYGZlYiAxN2AgaXMgbm90IGZ1bGxcclxuICAvLyBmZWIgMTcgICAgICAgICAgbWFyY2ggMTdcclxuICAvLyAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAgdmFyIHBlcmNlbnRXaWR0aEZyb21CZWdpbm5pbmcgPSBkYXRhLnBlcmNlbnRXaWR0aEZyb21CZWdpbm5pbmc7XHJcblxyXG4gIHZhciBjb250YWluZXJXaWR0aCA9IGVsLm9mZnNldFdpZHRoO1xyXG5cclxuICAvLyBsZWF2ZSAoMS8zKSBlYWNoIHNpZGVcclxuICAvLyAxLzMgfCAgICAzLzMgICB8IDEvM1xyXG4gIHZhciBib3hXaWR0aCA9IGNvbnRhaW5lcldpZHRoIC8gKDUgLyAzKTtcclxuICB2YXIgZ3V0dGVyU2l6ZSA9IGJveFdpZHRoIC8gMztcclxuXHJcbiAgdmFyIHNjaGVkdWxlQXJlYVdpZHRoUHggPSBuYkVsZW1lbnRzICogYm94V2lkdGg7XHJcbiAgdmFyIHNjaGVkdWxlQXJlYVdpZHRoUGVyY2VudCA9IChzY2hlZHVsZUFyZWFXaWR0aFB4IC8gY29udGFpbmVyV2lkdGgpICogMTAwO1xyXG5cclxuICBlbC5xdWVyeVNlbGVjdG9yKCcuc2NoZWR1bGUtYXJlYScpLnN0eWxlLndpZHRoID0gc2NoZWR1bGVBcmVhV2lkdGhQZXJjZW50ICsgJyUnO1xyXG5cclxuICBpZiAocGVyY2VudFdpZHRoRnJvbUJlZ2lubmluZyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBBbGwgY2VsbHMgb2YgYSBsaW5lIGhhdmUgdGhlIHNhbWUgc2l6ZVxyXG4gICAgZWwuc2Nyb2xsTGVmdCA9IGlkeCAqIGJveFdpZHRoIC0gZ3V0dGVyU2l6ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gU2l6ZXMgb2YgY2VsbHMgaW4gYSBsaW5lIGNvdWxkIGRpZmZlcmVudCAoZXNwZWNpYWxseSB0aGUgZmlyc3Qgb25lKVxyXG4gICAgZWwuc2Nyb2xsTGVmdCA9IHNjaGVkdWxlQXJlYVdpZHRoUHggKiAocGVyY2VudFdpZHRoRnJvbUJlZ2lubmluZyAvIDEwMCkgLSBndXR0ZXJTaXplO1xyXG4gIH1cclxufVxyXG4iLCIvKiogQGludGVybmFsICovXHJcbmNsYXNzIEhhbmRsZURpcmVjdGl2ZSBpbXBsZW1lbnRzIGFuZ3VsYXIuSURpcmVjdGl2ZSB7XHJcbiAgc3RhdGljICRuYW1lID0gJ2hhbmRsZSc7XHJcbiAgcmVzdHJpY3QgPSAnQSc7XHJcblxyXG4gIHNjb3BlID0ge1xyXG4gICAgb25kcmFnOiAnPScsXHJcbiAgICBvbmRyYWdzdG9wOiAnPScsXHJcbiAgICBvbmRyYWdzdGFydDogJz0nXHJcbiAgfTtcclxuXHJcbiAgbGluayA9IChzY29wZSwgZWxlbWVudDogYW5ndWxhci5JQXVnbWVudGVkSlF1ZXJ5KSA9PiB7XHJcbiAgICB2YXIgJGRvY3VtZW50ID0gdGhpcy4kZG9jdW1lbnQ7XHJcbiAgICB2YXIgeCA9IDA7XHJcbiAgICBcclxuICAgIGVsZW1lbnQub24oJ21vdXNlZG93bicsIChldmVudCkgPT4ge1xyXG4gICAgICAvLyBQcmV2ZW50IGRlZmF1bHQgZHJhZ2dpbmcgb2Ygc2VsZWN0ZWQgY29udGVudFxyXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgeCA9IGV2ZW50LnBhZ2VYO1xyXG5cclxuICAgICAgJGRvY3VtZW50Lm9uKCdtb3VzZW1vdmUnLCBtb3VzZW1vdmUpO1xyXG4gICAgICAkZG9jdW1lbnQub24oJ21vdXNldXAnLCBtb3VzZXVwKTtcclxuXHJcbiAgICAgIGlmIChzY29wZS5vbmRyYWdzdGFydCkge1xyXG4gICAgICAgIHNjb3BlLm9uZHJhZ3N0YXJ0KCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIG1vdXNlbW92ZShldmVudCkge1xyXG4gICAgICB2YXIgZGVsdGEgPSBldmVudC5wYWdlWCAtIHg7XHJcbiAgICAgIGlmIChzY29wZS5vbmRyYWcpIHtcclxuICAgICAgICBzY29wZS5vbmRyYWcoZGVsdGEpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbW91c2V1cCgpIHtcclxuICAgICAgJGRvY3VtZW50LnVuYmluZCgnbW91c2Vtb3ZlJywgbW91c2Vtb3ZlKTtcclxuICAgICAgJGRvY3VtZW50LnVuYmluZCgnbW91c2V1cCcsIG1vdXNldXApO1xyXG5cclxuICAgICAgaWYgKHNjb3BlLm9uZHJhZ3N0b3ApIHtcclxuICAgICAgICBzY29wZS5vbmRyYWdzdG9wKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSAkZG9jdW1lbnQ6IGFuZ3VsYXIuSURvY3VtZW50U2VydmljZVxyXG4gICkge1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIEZhY3RvcnkoKSB7XHJcbiAgICBsZXQgZGlyZWN0aXZlID0gKCRkb2N1bWVudCkgPT4gbmV3IEhhbmRsZURpcmVjdGl2ZSgkZG9jdW1lbnQpO1xyXG5cclxuICAgIGRpcmVjdGl2ZS4kaW5qZWN0ID0gWyckZG9jdW1lbnQnXTtcclxuXHJcbiAgICByZXR1cm4gZGlyZWN0aXZlO1xyXG4gIH1cclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3dlZWtseVNjaGVkdWxlcicpXHJcbiAgLmRpcmVjdGl2ZShIYW5kbGVEaXJlY3RpdmUuJG5hbWUsIEhhbmRsZURpcmVjdGl2ZS5GYWN0b3J5KCkpO1xyXG4iLCIvKiogQGludGVybmFsICovXHJcbmNsYXNzIEhvdXJseUdyaWREaXJlY3RpdmUgaW1wbGVtZW50cyBhbmd1bGFyLklEaXJlY3RpdmUge1xyXG4gICAgc3RhdGljICRuYW1lID0gJ2hvdXJseUdyaWQnO1xyXG5cclxuICAgIHJlc3RyaWN0ID0gJ0UnO1xyXG4gICAgcmVxdWlyZSA9ICded2Vla2x5U2NoZWR1bGVyJztcclxuXHJcbiAgICBwcml2YXRlIGhhbmRsZUNsaWNrRXZlbnQoY2hpbGQsIGhvdXJDb3VudCwgaWR4LCBzY29wZSkge1xyXG4gICAgICAgIGNoaWxkLmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgc2NvcGUuJGVtaXQoV2Vla2x5U2NoZWR1bGVyRXZlbnRzLkNMSUNLX09OX0FfQ0VMTCwge1xyXG4gICAgICAgICAgICBuYkVsZW1lbnRzOiBob3VyQ291bnQsXHJcbiAgICAgICAgICAgIGlkeDogaWR4XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRvR3JpZChzY29wZSwgZWxlbWVudCwgYXR0cnMsIGNvbmZpZzogSVdlZWtseVNjaGVkdWxlckNvbmZpZykge1xyXG4gICAgICAgIHZhciBpO1xyXG4gICAgICAgIC8vIENhbGN1bGF0ZSBob3VyIHdpZHRoIGRpc3RyaWJ1dGlvblxyXG4gICAgICAgIHZhciB0aWNrY291bnQgPSBjb25maWcuaG91ckNvdW50O1xyXG4gICAgICAgIHZhciB0aWNrc2l6ZSA9IDEwMCAvIHRpY2tjb3VudDtcclxuICAgICAgICB2YXIgZ3JpZEl0ZW1FbCA9IEdSSURfVEVNUExBVEUuY3NzKHt3aWR0aDogdGlja3NpemUgKyAnJSd9KTtcclxuICBcclxuICAgICAgICAvLyBDbGVhbiBlbGVtZW50XHJcbiAgICAgICAgZWxlbWVudC5lbXB0eSgpO1xyXG4gIFxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aWNrY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgdmFyIGNoaWxkID0gZ3JpZEl0ZW1FbC5jbG9uZSgpO1xyXG5cclxuICAgICAgICAgIGlmIChhbmd1bGFyLmlzVW5kZWZpbmVkKGF0dHJzLm5vVGV4dCkpIHtcclxuICAgICAgICAgICAgdGhpcy5oYW5kbGVDbGlja0V2ZW50KGNoaWxkLCB0aWNrY291bnQsIGksIHNjb3BlKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjdXJyZW50SG91ciA9IGkgJSAxMjtcclxuICAgICAgICAgICAgbGV0IG1lcmlkaWVtID0gaSA+PSAxMiA/ICdwbScgOiAnYW0nO1xyXG5cclxuICAgICAgICAgICAgY2hpbGQudGV4dChgJHtjdXJyZW50SG91ciB8fCAnMTInfSR7bWVyaWRpZW19YCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgZWxlbWVudC5hcHBlbmQoY2hpbGQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBsaW5rID0gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgc2NoZWR1bGVyQ3RybDogV2Vla2x5U2NoZWR1bGVyQ29udHJvbGxlcikgPT4ge1xyXG4gICAgICAgIGlmIChzY2hlZHVsZXJDdHJsLmNvbmZpZykge1xyXG4gICAgICAgICAgICB0aGlzLmRvR3JpZChzY29wZSwgZWxlbWVudCwgYXR0cnMsIHNjaGVkdWxlckN0cmwuY29uZmlnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNjaGVkdWxlckN0cmwuJG1vZGVsQ2hhbmdlTGlzdGVuZXJzLnB1c2goKG5ld0NvbmZpZykgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmRvR3JpZChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG5ld0NvbmZpZyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIEZhY3RvcnkoKSB7XHJcbiAgICAgICAgbGV0IGRpcmVjdGl2ZSA9ICgpID0+IG5ldyBIb3VybHlHcmlkRGlyZWN0aXZlKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBkaXJlY3RpdmU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmFuZ3VsYXJcclxuICAgIC5tb2R1bGUoJ3dlZWtseVNjaGVkdWxlcicpXHJcbiAgICAuZGlyZWN0aXZlKEhvdXJseUdyaWREaXJlY3RpdmUuJG5hbWUsIEhvdXJseUdyaWREaXJlY3RpdmUuRmFjdG9yeSgpKTtcclxuIiwiLyoqIEBpbnRlcm5hbCAqL1xyXG5jbGFzcyBJbnRlcnZhbEdyaWREaXJlY3RpdmUgaW1wbGVtZW50cyBhbmd1bGFyLklEaXJlY3RpdmUge1xyXG4gICAgc3RhdGljICRuYW1lID0gJ2ludGVydmFsR3JpZCc7XHJcblxyXG4gICAgcmVzdHJpY3QgPSAnRSc7XHJcbiAgICByZXF1aXJlID0gJ153ZWVrbHlTY2hlZHVsZXInO1xyXG5cclxuICAgIHByaXZhdGUgZG9HcmlkKHNjb3BlLCBlbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnksIGF0dHJzOiBhbmd1bGFyLklBdHRyaWJ1dGVzLCBjb25maWc6IElXZWVrbHlTY2hlZHVsZXJDb25maWcpIHtcclxuICAgICAgICAvLyBDYWxjdWxhdGUgaW50ZXJ2YWwgd2lkdGggZGlzdHJpYnV0aW9uXHJcbiAgICAgICAgdmFyIHRpY2tjb3VudCA9IGNvbmZpZy5pbnRlcnZhbENvdW50O1xyXG4gICAgICAgIHZhciB0aWNrc2l6ZSA9IDEwMCAvIHRpY2tjb3VudDtcclxuICAgICAgICB2YXIgZ3JpZEl0ZW1FbCA9IEdSSURfVEVNUExBVEUuY3NzKHt3aWR0aDogdGlja3NpemUgKyAnJSd9KTtcclxuXHJcbiAgICAgICAgLy8gQ2xlYW4gZWxlbWVudFxyXG4gICAgICAgIGVsZW1lbnQuZW1wdHkoKTtcclxuICBcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRpY2tjb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICB2YXIgY2hpbGQgPSBncmlkSXRlbUVsLmNsb25lKCk7XHJcblxyXG4gICAgICAgICAgLy8gQWRkIGJvcmRlci1yaWdodCBhdCBlbmRzIG9mIGhvdXJzXHJcbiAgICAgICAgICBpZiAodGhpcy5zaG91bGRBZGRCb3JkZXIoaSwgdGlja2NvdW50LCBjb25maWcpKSB7XHJcbiAgICAgICAgICAgICAgY2hpbGQuYWRkQ2xhc3MoJ3dlZWtseS1zY2hlZHVsZS1ib3JkZXInKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBlbGVtZW50LmFwcGVuZChjaGlsZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2hvdWxkQWRkQm9yZGVyKGluZGV4OiBudW1iZXIsIHRpY2tjb3VudDogbnVtYmVyLCBjb25maWc6IElXZWVrbHlTY2hlZHVsZXJDb25maWcpIHtcclxuICAgICAgICBpZiAoaW5kZXggPT09IHRpY2tjb3VudCAtIDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIChpbmRleCArIDEpICogY29uZmlnLmludGVydmFsICUgNjAgPT09IDA7XHJcbiAgICB9XHJcblxyXG4gICAgbGluayA9IChzY29wZSwgZWxlbWVudCwgYXR0cnMsIHNjaGVkdWxlckN0cmw6IFdlZWtseVNjaGVkdWxlckNvbnRyb2xsZXIpID0+IHtcclxuICAgICAgICBpZiAoc2NoZWR1bGVyQ3RybC5jb25maWcpIHtcclxuICAgICAgICAgICAgdGhpcy5kb0dyaWQoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBzY2hlZHVsZXJDdHJsLmNvbmZpZyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzY2hlZHVsZXJDdHJsLiRtb2RlbENoYW5nZUxpc3RlbmVycy5wdXNoKChuZXdDb25maWcpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5kb0dyaWQoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBuZXdDb25maWcpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBGYWN0b3J5KCkge1xyXG4gICAgICAgIGxldCBkaXJlY3RpdmUgPSAoKSA9PiBuZXcgSW50ZXJ2YWxHcmlkRGlyZWN0aXZlKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBkaXJlY3RpdmU7XHJcbiAgICB9XHJcbn1cclxuYW5ndWxhclxyXG4gICAgLm1vZHVsZSgnd2Vla2x5U2NoZWR1bGVyJylcclxuICAgIC5kaXJlY3RpdmUoSW50ZXJ2YWxHcmlkRGlyZWN0aXZlLiRuYW1lLCBJbnRlcnZhbEdyaWREaXJlY3RpdmUuRmFjdG9yeSgpKTtcclxuIiwiYW5ndWxhci5tb2R1bGUoJ3dlZWtseVNjaGVkdWxlckkxOE4nLCBbJ3RtaC5keW5hbWljTG9jYWxlJ10pO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3dlZWtseVNjaGVkdWxlckkxOE4nKVxyXG4gIC5wcm92aWRlcignd2Vla2x5U2NoZWR1bGVyTG9jYWxlU2VydmljZScsIFsndG1oRHluYW1pY0xvY2FsZVByb3ZpZGVyJywgZnVuY3Rpb24gKHRtaER5bmFtaWNMb2NhbGVQcm92aWRlcikge1xyXG5cclxuICAgIHZhciBkZWZhdWx0Q29uZmlnOiBhbnkgLyogVE9ETyB0eXBlICovID0ge1xyXG4gICAgICBkb3lzOiB7J2RlLWRlJzogNCwgJ2VuLWdiJzogNCwgJ2VuLXVzJzogNiwgJ2ZyLWZyJzogNH0sXHJcbiAgICAgIGxhbmc6IHtcclxuICAgICAgICAnZGUtZGUnOiB7d2Vla05iOiAnV29jaGVudW1tZXInLCBhZGROZXc6ICdIaW56dWbDvGdlbid9LFxyXG4gICAgICAgICdlbi1nYic6IHt3ZWVrTmI6ICdXZWVrICMnLCBhZGROZXc6ICdBZGQnfSxcclxuICAgICAgICAnZW4tdXMnOiB7d2Vla05iOiAnV2VlayAjJywgYWRkTmV3OiAnQWRkJ30sXHJcbiAgICAgICAgJ2ZyLWZyJzoge3dlZWtOYjogJ07CsCBkZSBzZW1haW5lJywgYWRkTmV3OiAnQWpvdXRlcid9XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5jb25maWd1cmUgPSBmdW5jdGlvbiAoY29uZmlnKSB7XHJcblxyXG4gICAgICBpZiAoY29uZmlnICYmIGFuZ3VsYXIuaXNPYmplY3QoY29uZmlnKSkge1xyXG4gICAgICAgIGFuZ3VsYXIubWVyZ2UoZGVmYXVsdENvbmZpZywgY29uZmlnKTtcclxuXHJcbiAgICAgICAgaWYgKGRlZmF1bHRDb25maWcubG9jYWxlTG9jYXRpb25QYXR0ZXJuKSB7XHJcbiAgICAgICAgICB0bWhEeW5hbWljTG9jYWxlUHJvdmlkZXIubG9jYWxlTG9jYXRpb25QYXR0ZXJuKGRlZmF1bHRDb25maWcubG9jYWxlTG9jYXRpb25QYXR0ZXJuKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy4kZ2V0ID0gWyckcm9vdFNjb3BlJywgJyRsb2NhbGUnLCAndG1oRHluYW1pY0xvY2FsZScsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkbG9jYWxlLCB0bWhEeW5hbWljTG9jYWxlKSB7XHJcblxyXG4gICAgICB2YXIgbW9tZW50TG9jYWxlQ2FjaGUgPSB7fTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGdldExhbmcoKSB7XHJcbiAgICAgICAgdmFyIGtleSA9ICRsb2NhbGUuaWQ7XHJcbiAgICAgICAgaWYgKCFtb21lbnRMb2NhbGVDYWNoZVtrZXldKSB7XHJcbiAgICAgICAgICBtb21lbnRMb2NhbGVDYWNoZVtrZXldID0gZ2V0TW9tZW50TG9jYWxlKGtleSk7XHJcbiAgICAgICAgICBtb21lbnQubG9jYWxlKG1vbWVudExvY2FsZUNhY2hlW2tleV0uaWQsIG1vbWVudExvY2FsZUNhY2hlW2tleV0ubG9jYWxlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbW9tZW50LmxvY2FsZShtb21lbnRMb2NhbGVDYWNoZVtrZXldLmlkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRDb25maWcubGFuZ1trZXldO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBXZSBqdXN0IG5lZWQgZmV3IG1vbWVudCBsb2NhbCBpbmZvcm1hdGlvblxyXG4gICAgICBmdW5jdGlvbiBnZXRNb21lbnRMb2NhbGUoa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGlkOiBrZXksXHJcbiAgICAgICAgICBsb2NhbGU6IHtcclxuICAgICAgICAgICAgd2Vlazoge1xyXG4gICAgICAgICAgICAgIC8vIEFuZ3VsYXIgbW9uZGF5ID0gMCB3aGVyZWFzIE1vbWVudCBtb25kYXkgPSAxXHJcbiAgICAgICAgICAgICAgZG93OiAoJGxvY2FsZS5EQVRFVElNRV9GT1JNQVRTLkZJUlNUREFZT0ZXRUVLICsgMSkgJSA3LFxyXG4gICAgICAgICAgICAgIGRveTogZGVmYXVsdENvbmZpZy5kb3lzW2tleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgICRyb290U2NvcGUuJG9uKCckbG9jYWxlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3dlZWtseVNjaGVkdWxlckxvY2FsZUNoYW5nZWQnLCBnZXRMYW5nKCkpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgJGxvY2FsZTogJGxvY2FsZSxcclxuICAgICAgICBnZXRMYW5nOiBnZXRMYW5nLFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgICAgcmV0dXJuIHRtaER5bmFtaWNMb2NhbGUuc2V0KGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgfV07XHJcbiAgfV0pO1xyXG4iLCIvKiogQGludGVybmFsICovXHJcbmNsYXNzIE11bHRpU2xpZGVyQ29udHJvbGxlciBpbXBsZW1lbnRzIGFuZ3VsYXIuSUNvbXBvbmVudENvbnRyb2xsZXIge1xyXG4gIHN0YXRpYyAkbmFtZSA9ICdtdWx0aVNsaWRlckNvbnRyb2xsZXInO1xyXG4gIHN0YXRpYyAkY29udHJvbGxlckFzID0gJ211bHRpU2xpZGVyQ3RybCc7XHJcblxyXG4gIHN0YXRpYyAkaW5qZWN0ID0gW1xyXG4gICAgJyRlbGVtZW50J1xyXG4gIF07XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSAkZWxlbWVudDogYW5ndWxhci5JQXVnbWVudGVkSlF1ZXJ5XHJcbiAgKSB7XHJcbiAgICB0aGlzLmVsZW1lbnQgPSB0aGlzLiRlbGVtZW50WzBdO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSAkaG92ZXJFbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnk7XHJcblxyXG4gIHB1YmxpYyBlbGVtZW50OiBFbGVtZW50O1xyXG4gIHB1YmxpYyBjb25maWc6IElXZWVrbHlTY2hlZHVsZXJDb25maWc7XHJcbiAgcHVibGljIGRlZmF1bHROZXdTY2hlZHVsZVNpemU6IG51bWJlciA9IDYwOyAvLyBtaW51dGVzXHJcbiAgcHVibGljIGl0ZW06IElXZWVrbHlTY2hlZHVsZXJJdGVtPG51bWJlcj47XHJcbiAgcHVibGljIHNpemU/OiBudW1iZXI7XHJcblxyXG4gICRvbkluaXQoKSB7XHJcbiAgICBpZiAodGhpcy5zaXplKSB7XHJcbiAgICAgIHRoaXMuZGVmYXVsdE5ld1NjaGVkdWxlU2l6ZSA9IHRoaXMuc2l6ZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gICRwb3N0TGluaygpIHtcclxuICAgIHRoaXMuJGhvdmVyRWxlbWVudCA9IGFuZ3VsYXIuZWxlbWVudCh0aGlzLiRlbGVtZW50LmZpbmQoJ2RpdicpWzBdKTtcclxuICAgIGxldCBob3ZlckVsZW1lbnRXaWR0aCA9IHRoaXMudmFsVG9QaXhlbCh0aGlzLmRlZmF1bHROZXdTY2hlZHVsZVNpemUpO1xyXG5cclxuICAgIHRoaXMuJGhvdmVyRWxlbWVudC5jc3Moe1xyXG4gICAgICB3aWR0aDogYCR7aG92ZXJFbGVtZW50V2lkdGh9cHhgXHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLiRlbGVtZW50Lm9uKCdtb3VzZW1vdmUnLCAoZSkgPT4ge1xyXG4gICAgICB2YXIgZWxPZmZYID0gdGhpcy5nZXRFbGVtZW50T2Zmc2V0WCh0aGlzLiRlbGVtZW50KTtcclxuICAgICAgdmFyIGxlZnQgPSBlLnBhZ2VYIC0gZWxPZmZYIC0gaG92ZXJFbGVtZW50V2lkdGggLyAyO1xyXG4gICAgICB2YXIgc25hcHBlZCA9IHRoaXMudmFsVG9QaXhlbCh0aGlzLnBpeGVsVG9WYWwobGVmdCkpO1xyXG5cclxuICAgICAgdGhpcy4kaG92ZXJFbGVtZW50LmNzcyh7XHJcbiAgICAgICAgbGVmdDogc25hcHBlZCArICdweCdcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhZGRTbG90KHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKSB7XHJcbiAgICBpZiAoc3RhcnQgPCAwKSB7XHJcbiAgICAgIHN0YXJ0ID0gMDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZW5kID4gdGhpcy5jb25maWcubWF4VmFsdWUpIHtcclxuICAgICAgZW5kID0gdGhpcy5jb25maWcubWF4VmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGl0ZW0gPSB0aGlzLml0ZW07XHJcblxyXG4gICAgaWYgKCFpdGVtLnNjaGVkdWxlcykge1xyXG4gICAgICBpdGVtLnNjaGVkdWxlcyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGl0ZW0uc2NoZWR1bGVzLnB1c2goe1xyXG4gICAgICBzdGFydDogc3RhcnQsXHJcbiAgICAgIGVuZDogZW5kXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRFbGVtZW50T2Zmc2V0WChlbGVtOiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnkpIHtcclxuICAgIHJldHVybiBlbGVtWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQ7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldFNsb3RMZWZ0KHNjaGVkdWxlOiBJV2Vla2x5U2NoZWR1bGVyUmFuZ2U8bnVtYmVyPikge1xyXG4gICAgcmV0dXJuIHNjaGVkdWxlLnN0YXJ0IC8gdGhpcy5jb25maWcubWF4VmFsdWUgKiAxMDAgKyAnJSc7XHJcbiAgfVxyXG4gIFxyXG4gIHByaXZhdGUgZ2V0U2xvdFdpZHRoKHNjaGVkdWxlOiBJV2Vla2x5U2NoZWR1bGVyUmFuZ2U8bnVtYmVyPikge1xyXG4gICAgcmV0dXJuIChzY2hlZHVsZS5lbmQgLSBzY2hlZHVsZS5zdGFydCkgLyB0aGlzLmNvbmZpZy5tYXhWYWx1ZSAqIDEwMCArICclJztcclxuICB9XHJcblxyXG4gIHByaXZhdGUgb25Ib3ZlckVsZW1lbnRDbGljayhldmVudCkge1xyXG4gICAgaWYgKCF0aGlzLiRlbGVtZW50LmF0dHIoJ25vLWFkZCcpKSB7XHJcbiAgICAgIHZhciBlbE9mZlggPSB0aGlzLmdldEVsZW1lbnRPZmZzZXRYKHRoaXMuJGVsZW1lbnQpO1xyXG4gICAgICB2YXIgaG92ZXJFbE9mZlggPSB0aGlzLmdldEVsZW1lbnRPZmZzZXRYKHRoaXMuJGhvdmVyRWxlbWVudCkgLSBlbE9mZlg7XHJcbiAgICAgIFxyXG4gICAgICB2YXIgc3RhcnQgPSB0aGlzLnBpeGVsVG9WYWwoaG92ZXJFbE9mZlgpO1xyXG4gICAgICB2YXIgZW5kID0gc3RhcnQgKyB0aGlzLmRlZmF1bHROZXdTY2hlZHVsZVNpemU7XHJcblxyXG4gICAgICB0aGlzLmFkZFNsb3Qoc3RhcnQsIGVuZCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG9uV2Vla2x5U2xvdE1vdXNlT3ZlcigpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ3Nsb3QtaG92ZXInKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgb25XZWVrbHlTbG90TW91c2VMZWF2ZSgpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ3Nsb3QtaG92ZXInKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyB2YWxUb1BpeGVsKHZhbDogbnVtYmVyKSB7XHJcbiAgICBsZXQgcGVyY2VudCA9IHZhbCAvIHRoaXMuY29uZmlnLmludGVydmFsQ291bnQgLyB0aGlzLmNvbmZpZy5pbnRlcnZhbDtcclxuICAgIHJldHVybiBNYXRoLmZsb29yKHBlcmNlbnQgKiB0aGlzLmVsZW1lbnQuY2xpZW50V2lkdGggKyAwLjUpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHBpeGVsVG9WYWwocGl4ZWw6IG51bWJlcikge1xyXG4gICAgdmFyIHBlcmNlbnQgPSBwaXhlbCAvIHRoaXMuZWxlbWVudC5jbGllbnRXaWR0aDtcclxuICAgIHJldHVybiBNYXRoLmZsb29yKHBlcmNlbnQgKiAodGhpcy5jb25maWcuaW50ZXJ2YWxDb3VudCkgKyAwLjUpICogdGhpcy5jb25maWcuaW50ZXJ2YWw7XHJcbiAgfVxyXG59XHJcblxyXG4vKiogQGludGVybmFsICovXHJcbmNsYXNzIE11bHRpU2xpZGVyQ29tcG9uZW50IGltcGxlbWVudHMgYW5ndWxhci5JQ29tcG9uZW50T3B0aW9ucyB7XHJcbiAgc3RhdGljICRuYW1lID0gJ211bHRpU2xpZGVyJztcclxuICBcclxuICBiaW5kaW5ncyA9IHtcclxuICAgIGNvbmZpZzogJzwnLFxyXG4gICAgaXRlbTogJz0nLFxyXG4gICAgc2l6ZTogJzw/J1xyXG4gIH1cclxuXHJcbiAgY29udHJvbGxlciA9IE11bHRpU2xpZGVyQ29udHJvbGxlci4kbmFtZTtcclxuICBjb250cm9sbGVyQXMgPSBNdWx0aVNsaWRlckNvbnRyb2xsZXIuJGNvbnRyb2xsZXJBcztcclxuXHJcbiAgdGVtcGxhdGVVcmwgPSAnbmctd2Vla2x5LXNjaGVkdWxlci9tdWx0aXNsaWRlci9tdWx0aXNsaWRlci5odG1sJztcclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3dlZWtseVNjaGVkdWxlcicpXHJcbiAgLmNvbnRyb2xsZXIoTXVsdGlTbGlkZXJDb250cm9sbGVyLiRuYW1lLCBNdWx0aVNsaWRlckNvbnRyb2xsZXIpXHJcbiAgLmNvbXBvbmVudChNdWx0aVNsaWRlckNvbXBvbmVudC4kbmFtZSwgbmV3IE11bHRpU2xpZGVyQ29tcG9uZW50KCkpO1xyXG4iLCJjbGFzcyBTY2hlZHVsZUFyZWFDb250YWluZXJDb250cm9sbGVyIGltcGxlbWVudHMgYW5ndWxhci5JQ29tcG9uZW50Q29udHJvbGxlciB7XHJcbiAgICBzdGF0aWMgJG5hbWUgPSAnc2NoZWR1bGVBcmVhQ29udGFpbmVyQ29udHJvbGxlcic7XHJcblxyXG4gICAgc3RhdGljICRpbmplY3QgPSBbXHJcbiAgICAgICAgJyRlbGVtZW50JyxcclxuICAgICAgICAnJHNjb3BlJ1xyXG4gICAgXTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBwcml2YXRlICRlbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnksXHJcbiAgICAgICAgcHJpdmF0ZSAkc2NvcGU6IGFuZ3VsYXIuSVNjb3BlXHJcbiAgICApIHtcclxuICAgIH1cclxuXHJcbiAgICAkcG9zdExpbmsoKSB7XHJcbiAgICAgICAgbGV0IGVsZW1lbnQgPSB0aGlzLiRlbGVtZW50WzBdOyAvLyBncmFiIHBsYWluIGpzLCBub3QganFsaXRlXHJcblxyXG4gICAgICAgIG1vdXNlU2Nyb2xsKGVsZW1lbnQsIDIwKTtcclxuXHJcbiAgICAgICAgdGhpcy4kc2NvcGUuJG9uKFdlZWtseVNjaGVkdWxlckV2ZW50cy5DTElDS19PTl9BX0NFTEwsIChlLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIHpvb21JbkFDZWxsKGVsZW1lbnQsIGUsIGRhdGEpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBTY2hlZHVsZUFyZWFDb250YWluZXJDb21wb25lbnQgaW1wbGVtZW50cyBhbmd1bGFyLklDb21wb25lbnRPcHRpb25zIHtcclxuICAgIHN0YXRpYyAkbmFtZSA9ICdzY2hlZHVsZUFyZWFDb250YWluZXInO1xyXG5cclxuICAgIGNvbnRyb2xsZXIgPSBTY2hlZHVsZUFyZWFDb250YWluZXJDb250cm9sbGVyLiRuYW1lO1xyXG4gICAgdHJhbnNjbHVkZSA9IHRydWU7XHJcblxyXG4gICAgdGVtcGxhdGUgPSBgPG5nLXRyYW5zY2x1ZGU+PC9uZy10cmFuc2NsdWRlPmA7XHJcbn1cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd3ZWVrbHlTY2hlZHVsZXInKVxyXG4gICAgLmNvbnRyb2xsZXIoU2NoZWR1bGVBcmVhQ29udGFpbmVyQ29udHJvbGxlci4kbmFtZSwgU2NoZWR1bGVBcmVhQ29udGFpbmVyQ29udHJvbGxlcilcclxuICAgIC5jb21wb25lbnQoU2NoZWR1bGVBcmVhQ29udGFpbmVyQ29tcG9uZW50LiRuYW1lLCBuZXcgU2NoZWR1bGVBcmVhQ29udGFpbmVyQ29tcG9uZW50KCkpO1xyXG4iLCIvKiogQGludGVybmFsICovXHJcbmNsYXNzIFRpbWVPZkRheUZpbHRlciB7XHJcbiAgICBzdGF0aWMgJG5hbWUgPSAndGltZU9mRGF5JztcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIEZhY3RvcnkoKSB7XHJcbiAgICAgICAgY29uc3Qgc3RhbmRhcmRGb3JtYXQ6IHN0cmluZyA9ICdoOm1tQSc7XHJcbiAgICAgICAgY29uc3QgbWlsaXRhcnlGb3JtYXQ6IHN0cmluZyA9ICdISDptbSc7XHJcblxyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihtaW51dGVzOiBudW1iZXIpOiBzdHJpbmcge1xyXG4gICAgICAgICAgICAvLyBUaGUgbW9tZW50LWR1cmF0aW9uLWZvcm1hdCBwYWNrYWdlIGFsd2F5cyBvdXRwdXRzIG1pbGl0YXJ5IHRpbWUsIChpdCBjb252ZXJ0cyBhIGR1cmF0aW9uIHRvIGEgdGltZSBzdHJpbmcsIG5vdCBhIHRpbWUgb2YgZGF5KSBzbyB3ZSdsbCBuZWVkIHRvIGdyYWIgdGhhdCBhbmQgdGhlbiBjb252ZXJ0XHJcbiAgICAgICAgICAgIGxldCBtaWxpdGFyeVRpbWUgPSBtb21lbnQuZHVyYXRpb24obWludXRlcywgJ21pbnV0ZXMnKS5mb3JtYXQobWlsaXRhcnlGb3JtYXQsIHsgdHJpbTogZmFsc2UgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbW9tZW50KG1pbGl0YXJ5VGltZSwgbWlsaXRhcnlGb3JtYXQpLmZvcm1hdChzdGFuZGFyZEZvcm1hdCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5hbmd1bGFyXHJcbiAgICAubW9kdWxlKCd3ZWVrbHlTY2hlZHVsZXInKVxyXG4gICAgLmZpbHRlcihUaW1lT2ZEYXlGaWx0ZXIuJG5hbWUsIFtUaW1lT2ZEYXlGaWx0ZXIuRmFjdG9yeV0pO1xyXG4iLCIvKiogQGludGVybmFsICovXHJcbmNsYXNzIFdlZWtseVNjaGVkdWxlckNvbnRyb2xsZXIgaW1wbGVtZW50cyBhbmd1bGFyLklDb250cm9sbGVyIHtcclxuICBzdGF0aWMgJGNvbnRyb2xsZXJBcyA9ICdzY2hlZHVsZXJDdHJsJztcclxuICBzdGF0aWMgJG5hbWUgPSAnd2Vla2x5U2NoZWR1bGVyQ29udHJvbGxlcic7XHJcblxyXG4gIHN0YXRpYyAkaW5qZWN0ID0gW1xyXG4gICAgJyRzY29wZScsXHJcbiAgICAnd2Vla2x5U2NoZWR1bGVyTG9jYWxlU2VydmljZSdcclxuICBdO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgJHNjb3BlOiBhbmd1bGFyLklTY29wZSxcclxuICAgIHByaXZhdGUgbG9jYWxlU2VydmljZTogYW55ICAvKiBUT0RPIHR5cGUgKi9cclxuICApIHtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBjb25maWc6IElXZWVrbHlTY2hlZHVsZXJDb25maWc7XHJcbiAgcHVibGljIGl0ZW1zOiBJV2Vla2x5U2NoZWR1bGVySXRlbTxudW1iZXI+W107XHJcbiAgcHVibGljIG9wdGlvbnM6IElXZWVrbHlTY2hlZHVsZXJPcHRpb25zO1xyXG4gIHB1YmxpYyBvbkNoYW5nZTogKG9wdGlvbnM6IHsgaXRlbUluZGV4OiBudW1iZXIsIHNjaGVkdWxlSW5kZXg6IG51bWJlciwgc2NoZWR1bGVWYWx1ZTogSVdlZWtseVNjaGVkdWxlclJhbmdlPG51bWJlcj4gfSkgPT4gdm9pZDtcclxuXHJcbiAgcHVibGljIGRlZmF1bHRPcHRpb25zOiBJV2Vla2x5U2NoZWR1bGVyT3B0aW9ucyA9IHtcclxuICAgIG1vbm9TY2hlZHVsZTogZmFsc2UsXHJcbiAgfTtcclxuXHJcbiAgcHVibGljICRtb2RlbENoYW5nZUxpc3RlbmVyczogKChjb25maWc6IElXZWVrbHlTY2hlZHVsZXJDb25maWcpID0+IHZvaWQpW107XHJcblxyXG4gICRvbkluaXQoKSB7XHJcbiAgICB0aGlzLmRlZmF1bHRPcHRpb25zLmxhYmVscyA9IHRoaXMubG9jYWxlU2VydmljZS5nZXRMYW5nKCk7XHJcblxyXG4gICAgLy8gV2lsbCBoYW5nIG91ciBtb2RlbCBjaGFuZ2UgbGlzdGVuZXJzXHJcbiAgICB0aGlzLiRtb2RlbENoYW5nZUxpc3RlbmVycyA9IFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2F0Y2ggdGhlIG1vZGVsIGl0ZW1zXHJcbiAgICAgKi9cclxuICAgIHRoaXMuJHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oKCkgPT4gdGhpcy5pdGVtcywgKG5ld0l0ZW1zKSA9PiB0aGlzLm9uTW9kZWxDaGFuZ2UobmV3SXRlbXMpKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIExpc3RlbiB0byAkbG9jYWxlIGNoYW5nZSAoYnJvdWdodCBieSBleHRlcm5hbCBtb2R1bGUgd2Vla2x5U2NoZWR1bGVySTE4TilcclxuICAgICAqL1xyXG4gICAgdGhpcy4kc2NvcGUuJG9uKCd3ZWVrbHlTY2hlZHVsZXJMb2NhbGVDaGFuZ2VkJywgZnVuY3Rpb24gKGUsIGxhYmVscykge1xyXG4gICAgICBpZiAodGhpcy5jb25maWcpIHtcclxuICAgICAgICB0aGlzLmNvbmZpZy5sYWJlbHMgPSBsYWJlbHM7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5vbk1vZGVsQ2hhbmdlKGFuZ3VsYXIuY29weSh0aGlzLml0ZW1zLCBbXSkpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25maWd1cmUgdGhlIHNjaGVkdWxlci5cclxuICAgKi9cclxuICBwcml2YXRlIGNvbmZpZ3VyZShvcHRpb25zOiBJV2Vla2x5U2NoZWR1bGVyT3B0aW9ucyk6IElXZWVrbHlTY2hlZHVsZXJDb25maWcge1xyXG4gICAgdmFyIGludGVydmFsID0gb3B0aW9ucy5pbnRlcnZhbCB8fCAxNTsgLy8gbWludXRlc1xyXG4gICAgdmFyIGhvdXJzSW5EYXkgPSAyNDtcclxuICAgIHZhciBtaW51dGVzSW5EYXkgPSBob3Vyc0luRGF5ICogNjA7XHJcbiAgICB2YXIgaW50ZXJ2YWxDb3VudCA9IG1pbnV0ZXNJbkRheSAvIGludGVydmFsO1xyXG5cclxuICAgIHZhciByZXN1bHQ6IElXZWVrbHlTY2hlZHVsZXJDb25maWcgPSBhbmd1bGFyLmV4dGVuZCh0aGlzLmRlZmF1bHRPcHRpb25zLCB7IGludGVydmFsOiBpbnRlcnZhbCwgbWF4VmFsdWU6IG1pbnV0ZXNJbkRheSwgaG91ckNvdW50OiBob3Vyc0luRGF5LCBpbnRlcnZhbENvdW50OiBpbnRlcnZhbENvdW50IH0pO1xyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG9uTW9kZWxDaGFuZ2UoaXRlbXM6IElXZWVrbHlTY2hlZHVsZXJJdGVtPG51bWJlcj5bXSkge1xyXG4gICAgLy8gQ2hlY2sgaXRlbXMgYXJlIHByZXNlbnRcclxuICAgIGlmIChpdGVtcykge1xyXG5cclxuICAgICAgLy8gQ2hlY2sgaXRlbXMgYXJlIGluIGFuIEFycmF5XHJcbiAgICAgIGlmICghYW5ndWxhci5pc0FycmF5KGl0ZW1zKSkge1xyXG4gICAgICAgIHRocm93ICdZb3Ugc2hvdWxkIHVzZSB3ZWVrbHktc2NoZWR1bGVyIGRpcmVjdGl2ZSB3aXRoIGFuIEFycmF5IG9mIGl0ZW1zJztcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gS2VlcCB0cmFjayBvZiBvdXIgbW9kZWwgKHVzZSBpdCBpbiB0ZW1wbGF0ZSlcclxuICAgICAgdGhpcy5pdGVtcyA9IGl0ZW1zO1xyXG5cclxuICAgICAgLy8gSWYgaW4gbXVsdGlTbGlkZXIgbW9kZSwgZW5zdXJlIGEgc2NoZWR1bGUgYXJyYXkgaXMgcHJlc2VudCBvbiBlYWNoIGl0ZW1cclxuICAgICAgLy8gRWxzZSBvbmx5IHVzZSBmaXJzdCBlbGVtZW50IG9mIHNjaGVkdWxlIGFycmF5XHJcbiAgICAgIGl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcclxuICAgICAgICB2YXIgc2NoZWR1bGVzID0gaXRlbS5zY2hlZHVsZXM7XHJcblxyXG4gICAgICAgIGlmIChzY2hlZHVsZXMgJiYgc2NoZWR1bGVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tb25vU2NoZWR1bGUpIHtcclxuICAgICAgICAgICAgaXRlbS5zY2hlZHVsZXMgPSBbc2NoZWR1bGVzWzBdXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaXRlbS5zY2hlZHVsZXMgPSBbXTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gQ2FsY3VsYXRlIGNvbmZpZ3VyYXRpb25cclxuICAgICAgdGhpcy5jb25maWcgPSB0aGlzLmNvbmZpZ3VyZSh0aGlzLm9wdGlvbnMpO1xyXG5cclxuICAgICAgLy8gRmluYWxseSwgcnVuIHRoZSBzdWIgZGlyZWN0aXZlcyBsaXN0ZW5lcnNcclxuICAgICAgdGhpcy4kbW9kZWxDaGFuZ2VMaXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcclxuICAgICAgICBsaXN0ZW5lcih0aGlzLmNvbmZpZyk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLyoqIEBpbnRlcm5hbCAqL1xyXG5jbGFzcyBXZWVrbHlTY2hlZHVsZXJDb21wb25lbnQgaW1wbGVtZW50cyBhbmd1bGFyLklDb21wb25lbnRPcHRpb25zIHtcclxuICBzdGF0aWMgJG5hbWUgPSAnd2Vla2x5U2NoZWR1bGVyJztcclxuXHJcbiAgYmluZGluZ3MgPSB7XHJcbiAgICBpdGVtczogJz0nLFxyXG4gICAgb3B0aW9uczogJz0nLFxyXG4gICAgb25DaGFuZ2U6ICcmJ1xyXG4gIH07XHJcbiAgXHJcbiAgY29udHJvbGxlciA9IFdlZWtseVNjaGVkdWxlckNvbnRyb2xsZXIuJG5hbWU7XHJcbiAgY29udHJvbGxlckFzID0gV2Vla2x5U2NoZWR1bGVyQ29udHJvbGxlci4kY29udHJvbGxlckFzO1xyXG5cclxuICB0cmFuc2NsdWRlID0gdHJ1ZTtcclxuICB0ZW1wbGF0ZVVybCA9ICduZy13ZWVrbHktc2NoZWR1bGVyL3dlZWtseS1zY2hlZHVsZXIvd2Vla2x5LXNjaGVkdWxlci5odG1sJztcclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3dlZWtseVNjaGVkdWxlcicpXHJcbiAgLmNvbnRyb2xsZXIoV2Vla2x5U2NoZWR1bGVyQ29udHJvbGxlci4kbmFtZSwgV2Vla2x5U2NoZWR1bGVyQ29udHJvbGxlcilcclxuICAuY29tcG9uZW50KFdlZWtseVNjaGVkdWxlckNvbXBvbmVudC4kbmFtZSwgbmV3IFdlZWtseVNjaGVkdWxlckNvbXBvbmVudCgpKTtcclxuIiwiLyoqIEBpbnRlcm5hbCAqL1xyXG5jbGFzcyBXZWVrbHlTbG90RGlyZWN0aXZlIGltcGxlbWVudHMgYW5ndWxhci5JRGlyZWN0aXZlIHtcclxuICBzdGF0aWMgJG5hbWUgPSAnd2Vla2x5U2xvdCc7XHJcblxyXG4gIHJlc3RyaWN0ID0gJ0UnO1xyXG4gIHJlcXVpcmUgPSBbJ153ZWVrbHlTY2hlZHVsZXInLCAnbmdNb2RlbCddO1xyXG5cclxuICBzY29wZSA9IHtcclxuICAgIHNjaGVkdWxlOiAnPW5nTW9kZWwnLFxyXG4gICAgaXRlbTogJz0nXHJcbiAgfTtcclxuXHJcbiAgdGVtcGxhdGVVcmwgPSAnbmctd2Vla2x5LXNjaGVkdWxlci93ZWVrbHktc2xvdC93ZWVrbHktc2xvdC5odG1sJztcclxuXHJcbiAgbGluayA9IChzY29wZSwgZWxlbWVudDogYW5ndWxhci5JQXVnbWVudGVkSlF1ZXJ5LCBhdHRyczogYW5ndWxhci5JQXR0cmlidXRlcywgY3RybHMpID0+IHtcclxuICAgIHZhciBzY2hlZHVsZXJDdHJsOiBXZWVrbHlTY2hlZHVsZXJDb250cm9sbGVyID0gY3RybHNbMF0sXHJcbiAgICAgICAgbmdNb2RlbEN0cmw6IGFuZ3VsYXIuSU5nTW9kZWxDb250cm9sbGVyID0gY3RybHNbMV07XHJcblxyXG4gICAgdmFyIGNvbmYgPSBzY2hlZHVsZXJDdHJsLmNvbmZpZztcclxuICAgIHZhciBpbmRleCA9IHNjb3BlLiRwYXJlbnQuJGluZGV4O1xyXG4gICAgdmFyIGNvbnRhaW5lckVsID0gZWxlbWVudC5wYXJlbnQoKTtcclxuICAgIHZhciByZXNpemVEaXJlY3Rpb25Jc1N0YXJ0ID0gdHJ1ZTtcclxuICAgIHZhciB2YWx1ZXNPbkRyYWdTdGFydCA9IHtzdGFydDogc2NvcGUuc2NoZWR1bGUuc3RhcnQsIGVuZDogc2NvcGUuc2NoZWR1bGUuZW5kfTtcclxuXHJcbiAgICB2YXIgcGl4ZWxUb1ZhbCA9IGZ1bmN0aW9uIChwaXhlbCkge1xyXG4gICAgICB2YXIgcGVyY2VudCA9IHBpeGVsIC8gY29udGFpbmVyRWxbMF0uY2xpZW50V2lkdGg7XHJcbiAgICAgIHJldHVybiBNYXRoLmZsb29yKHBlcmNlbnQgKiAoY29uZi5pbnRlcnZhbENvdW50KSArIDAuNSkgKiBjb25mLmludGVydmFsO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgcmVtb3ZlU2NoZWR1bGUgPSBmdW5jdGlvbihzY2hlZHVsZSkge1xyXG4gICAgICB2YXIgc2NoZWR1bGVzID0gc2NvcGUuaXRlbS5zY2hlZHVsZXM7XHJcblxyXG4gICAgICBzY2hlZHVsZXMuc3BsaWNlKHNjaGVkdWxlcy5pbmRleE9mKHNjaGVkdWxlKSwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIG1lcmdlT3ZlcmxhcHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBzY2hlZHVsZSA9IHNjb3BlLnNjaGVkdWxlO1xyXG4gICAgICB2YXIgc2NoZWR1bGVzID0gc2NvcGUuaXRlbS5zY2hlZHVsZXM7XHJcbiAgICAgIHNjaGVkdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xyXG4gICAgICAgIGlmIChlbCAhPT0gc2NoZWR1bGUpIHtcclxuICAgICAgICAgIC8vIG1vZGVsIGlzIGluc2lkZSBhbm90aGVyIHNsb3RcclxuICAgICAgICAgIGlmIChlbC5lbmQgPj0gc2NoZWR1bGUuZW5kICYmIGVsLnN0YXJ0IDw9IHNjaGVkdWxlLnN0YXJ0KSB7XHJcbiAgICAgICAgICAgIHJlbW92ZVNjaGVkdWxlKGVsKTtcclxuXHJcbiAgICAgICAgICAgIHVwZGF0ZVNlbGYoe1xyXG4gICAgICAgICAgICAgIHN0YXJ0OiBlbC5zdGFydCxcclxuICAgICAgICAgICAgICBlbmQ6IGVsLmVuZFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIG1vZGVsIGNvbXBsZXRlbHkgY292ZXJzIGFub3RoZXIgc2xvdFxyXG4gICAgICAgICAgZWxzZSBpZiAoc2NoZWR1bGUuZW5kID49IGVsLmVuZCAmJiBzY2hlZHVsZS5zdGFydCA8PSBlbC5zdGFydCkge1xyXG4gICAgICAgICAgICByZW1vdmVTY2hlZHVsZShlbCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBhbm90aGVyIHNsb3QncyBlbmQgaXMgaW5zaWRlIGN1cnJlbnQgbW9kZWxcclxuICAgICAgICAgIGVsc2UgaWYgKGVsLmVuZCA+PSBzY2hlZHVsZS5zdGFydCAmJiBlbC5lbmQgPD0gc2NoZWR1bGUuZW5kKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZVNjaGVkdWxlKGVsKTtcclxuXHJcbiAgICAgICAgICAgIHVwZGF0ZVNlbGYoe1xyXG4gICAgICAgICAgICAgIHN0YXJ0OiBlbC5zdGFydCxcclxuICAgICAgICAgICAgICBlbmQ6IHNjaGVkdWxlLmVuZFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIGFub3RoZXIgc2xvdCdzIHN0YXJ0IGlzIGluc2lkZSBjdXJyZW50IG1vZGVsXHJcbiAgICAgICAgICBlbHNlIGlmIChlbC5zdGFydCA+PSBzY2hlZHVsZS5zdGFydCAmJiBlbC5zdGFydCA8PSBzY2hlZHVsZS5lbmQpIHtcclxuICAgICAgICAgICAgcmVtb3ZlU2NoZWR1bGUoZWwpO1xyXG5cclxuICAgICAgICAgICAgdXBkYXRlU2VsZih7XHJcbiAgICAgICAgICAgICAgc3RhcnQ6IHNjaGVkdWxlLnN0YXJ0LFxyXG4gICAgICAgICAgICAgIGVuZDogZWwuZW5kXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciB1cGRhdGVTZWxmID0gKHVwZGF0ZTogSVdlZWtseVNjaGVkdWxlclJhbmdlPG51bWJlcj4pID0+IHtcclxuICAgICAgbmdNb2RlbEN0cmwuJHNldFZpZXdWYWx1ZSh1cGRhdGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHNjb3BlLmNhblJlbW92ZSA9ICgpID0+ICFhbmd1bGFyLmlzRGVmaW5lZChzY29wZS5pdGVtLmVkaXRhYmxlKSB8fCBzY29wZS5pdGVtLmVkaXRhYmxlO1xyXG5cclxuICAgIGlmIChzY29wZS5pdGVtLmVkaXRhYmxlICE9PSBmYWxzZSkge1xyXG4gICAgICBzY29wZS5kZWxldGVTZWxmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnRhaW5lckVsLnJlbW92ZUNsYXNzKCdkcmFnZ2luZycpO1xyXG4gICAgICAgIGNvbnRhaW5lckVsLnJlbW92ZUNsYXNzKCdzbG90LWhvdmVyJyk7XHJcbiAgICAgICAgcmVtb3ZlU2NoZWR1bGUoc2NvcGUuc2NoZWR1bGUpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgc2NvcGUuc3RhcnRSZXNpemVTdGFydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXNpemVEaXJlY3Rpb25Jc1N0YXJ0ID0gdHJ1ZTtcclxuICAgICAgICBzY29wZS5zdGFydERyYWcoKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHNjb3BlLnN0YXJ0UmVzaXplRW5kID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJlc2l6ZURpcmVjdGlvbklzU3RhcnQgPSBmYWxzZTtcclxuICAgICAgICBzY29wZS5zdGFydERyYWcoKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHNjb3BlLnN0YXJ0RHJhZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBlbGVtZW50LmFkZENsYXNzKCdhY3RpdmUnKTtcclxuXHJcbiAgICAgICAgY29udGFpbmVyRWwuYWRkQ2xhc3MoJ2RyYWdnaW5nJyk7XHJcbiAgICAgICAgY29udGFpbmVyRWwuYXR0cignbm8tYWRkJywgJ3RydWUnKTtcclxuXHJcbiAgICAgICAgdmFsdWVzT25EcmFnU3RhcnQgPSB7c3RhcnQ6IG5nTW9kZWxDdHJsLiR2aWV3VmFsdWUuc3RhcnQsIGVuZDogbmdNb2RlbEN0cmwuJHZpZXdWYWx1ZS5lbmR9O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgc2NvcGUuZW5kRHJhZyA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgLy8gdGhpcyBwcmV2ZW50cyB1c2VyIGZyb20gYWNjaWRlbnRhbGx5XHJcbiAgICAgICAgLy8gYWRkaW5nIG5ldyBzbG90IGFmdGVyIHJlc2l6aW5nIG9yIGRyYWdnaW5nXHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBjb250YWluZXJFbC5yZW1vdmVBdHRyKCduby1hZGQnKTtcclxuICAgICAgICB9LCA1MDApO1xyXG5cclxuICAgICAgICBlbGVtZW50LnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICBjb250YWluZXJFbC5yZW1vdmVDbGFzcygnZHJhZ2dpbmcnKTtcclxuXHJcbiAgICAgICAgbWVyZ2VPdmVybGFwcygpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgc2NvcGUucmVzaXplID0gZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICB2YXIgdWkgPSBuZ01vZGVsQ3RybC4kdmlld1ZhbHVlO1xyXG4gICAgICAgIHZhciBkZWx0YSA9IHBpeGVsVG9WYWwoZCk7XHJcblxyXG4gICAgICAgIGlmIChyZXNpemVEaXJlY3Rpb25Jc1N0YXJ0KSB7XHJcbiAgICAgICAgICB2YXIgbmV3U3RhcnQgPSBNYXRoLnJvdW5kKHZhbHVlc09uRHJhZ1N0YXJ0LnN0YXJ0ICsgZGVsdGEpO1xyXG5cclxuICAgICAgICAgIGlmICh1aS5zdGFydCAhPT0gbmV3U3RhcnQgJiYgbmV3U3RhcnQgPD0gdWkuZW5kIC0gMSAmJiBuZXdTdGFydCA+PSAwKSB7XHJcbiAgICAgICAgICAgIHVwZGF0ZVNlbGYoe1xyXG4gICAgICAgICAgICAgIHN0YXJ0OiBuZXdTdGFydCxcclxuICAgICAgICAgICAgICBlbmQ6IHVpLmVuZFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdmFyIG5ld0VuZCA9IE1hdGgucm91bmQodmFsdWVzT25EcmFnU3RhcnQuZW5kICsgZGVsdGEpO1xyXG5cclxuICAgICAgICAgIGlmICh1aS5lbmQgIT09IG5ld0VuZCAmJiBuZXdFbmQgPj0gdWkuc3RhcnQgKyAxICYmIG5ld0VuZCA8PSBjb25mLm1heFZhbHVlKSB7XHJcbiAgICAgICAgICAgIHVwZGF0ZVNlbGYoe1xyXG4gICAgICAgICAgICAgIHN0YXJ0OiB1aS5zdGFydCxcclxuICAgICAgICAgICAgICBlbmQ6IG5ld0VuZFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBzY29wZS5kcmFnID0gZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICB2YXIgdWkgPSBuZ01vZGVsQ3RybC4kdmlld1ZhbHVlO1xyXG4gICAgICAgIHZhciBkZWx0YSA9IHBpeGVsVG9WYWwoZCk7XHJcbiAgICAgICAgdmFyIGR1cmF0aW9uID0gdmFsdWVzT25EcmFnU3RhcnQuZW5kIC0gdmFsdWVzT25EcmFnU3RhcnQuc3RhcnQ7XHJcblxyXG4gICAgICAgIHZhciBuZXdTdGFydCA9IE1hdGgucm91bmQodmFsdWVzT25EcmFnU3RhcnQuc3RhcnQgKyBkZWx0YSk7XHJcbiAgICAgICAgdmFyIG5ld0VuZCA9IE1hdGgucm91bmQobmV3U3RhcnQgKyBkdXJhdGlvbik7XHJcblxyXG4gICAgICAgIGlmICh1aS5zdGFydCAhPT0gbmV3U3RhcnQgJiYgbmV3U3RhcnQgPj0gMCAmJiBuZXdFbmQgPD0gY29uZi5tYXhWYWx1ZSkge1xyXG4gICAgICAgICAgdXBkYXRlU2VsZih7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBuZXdTdGFydCxcclxuICAgICAgICAgICAgZW5kOiBuZXdFbmRcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIG9uIGluaXQsIG1lcmdlIG92ZXJsYXBzXHJcbiAgICBtZXJnZU92ZXJsYXBzKCk7XHJcblxyXG4gICAgLy8vLyBVSSAtPiBtb2RlbCAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIG5nTW9kZWxDdHJsLiRwYXJzZXJzLnB1c2goKHVpKSA9PiB7XHJcbiAgICAgIG5nTW9kZWxDdHJsLiRtb2RlbFZhbHVlLnN0YXJ0ID0gdWkuc3RhcnQ7XHJcbiAgICAgIG5nTW9kZWxDdHJsLiRtb2RlbFZhbHVlLmVuZCA9IHVpLmVuZDtcclxuICAgICAgc2NoZWR1bGVyQ3RybC5vbkNoYW5nZSh7IGl0ZW1JbmRleDogaW5kZXgsIHNjaGVkdWxlSW5kZXg6IHNjb3BlLiRpbmRleCwgc2NoZWR1bGVWYWx1ZTogbmdNb2RlbEN0cmwuJG1vZGVsVmFsdWUgfSk7XHJcbiAgICAgIHJldHVybiBuZ01vZGVsQ3RybC4kbW9kZWxWYWx1ZTtcclxuICAgIH0pO1xyXG5cclxuICAgIHNjb3BlLiRvbignd2Vla2x5U2NoZWR1bGVyTG9jYWxlQ2hhbmdlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgLy8gU2ltcGxlIGNoYW5nZSBvYmplY3QgcmVmZXJlbmNlIHNvIHRoYXQgbmdNb2RlbCB0cmlnZ2VycyBmb3JtYXR0aW5nICYgcmVuZGVyaW5nXHJcbiAgICAgIHNjb3BlLnNjaGVkdWxlID0gYW5ndWxhci5jb3B5KHNjb3BlLnNjaGVkdWxlKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIEZhY3RvcnkoKSB7XHJcbiAgICBsZXQgZGlyZWN0aXZlID0gKCkgPT4gbmV3IFdlZWtseVNsb3REaXJlY3RpdmUoKTtcclxuXHJcbiAgICByZXR1cm4gZGlyZWN0aXZlO1xyXG4gIH1cclxufVxyXG5cclxuYW5ndWxhclxyXG4gIC5tb2R1bGUoJ3dlZWtseVNjaGVkdWxlcicpXHJcbiAgLmRpcmVjdGl2ZShXZWVrbHlTbG90RGlyZWN0aXZlLiRuYW1lLCBXZWVrbHlTbG90RGlyZWN0aXZlLkZhY3RvcnkoKSk7XHJcbiJdfQ==

angular.module('ngWeeklySchedulerTemplates', []).run(['$templateCache', function($templateCache) {$templateCache.put('index.html','<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Angularjs weekly scheduler demo</title><link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-fork-ribbon-css/0.2.0/gh-fork-ribbon.min.css"><!--[if lt IE 9]>\r\n  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-fork-ribbon-css/0.2.0/gh-fork-ribbon.ie.min.css"/>\r\n  <![endif]--><link rel="stylesheet" href="testStyles.css"></head><body class="container-fluid" ng-app="demoApp"><a class="github-fork-ribbon" href="https://github.com/fmaturel/angular-weekly-scheduler" title="Fork me on GitHub">Fork me on GitHub</a><nav class="navbar navbar-default"><div class="container-fluid"><div class="navbar-header"><button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false"><span class="sr-only">Toggle navigation</span> <span class="icon-bar"></span> <span class="icon-bar"></span> <span class="icon-bar"></span></button> <a class="navbar-brand" href="#">dijit</a></div><div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1"><ul class="nav navbar-nav"><li class="active"><a href="#demo">Demo <span class="sr-only">(current)</span></a></li><li><a href="#run">Run @ Home</a></li><li><a href="#install">Install</a></li><li><a href="#features">Features</a></li></ul></div></div></nav><div class="row" ng-controller="DemoController as demo"><div class="col-xs-10 col-xs-offset-1"><h1>Angularjs weekly scheduler</h1><h2 id="demo" class="page-header">1. Demo</h2><div><label for="language">Choose your language:</label><select id="language" ng-model="model.locale" ng-change="demo.onLocaleChange()"><option value="en-us" selected="selected">us</option><option value="en-gb" selected="selected">gb</option><option value="fr-fr">fr</option><option value="de-de">de</option><option value="es-es">es (lang customized in demo)</option></select></div><div><code>$scope.model</code><pre ng-bind="model | json" style="max-height: 200px"></pre></div><weekly-scheduler class="scheduler" items="model.items" on-change="demo.doSomething(itemIndex, scheduleIndex, scheduleValue)" on-delete="demo.doSomething()" options="model.options"></weekly-scheduler><h2 id="run" class="page-header">2. Run @ Home</h2><p>Run the demo @home with few steps (prerequisite git & node V0.10+ & npm installed):</p><pre>\r\ngit clone https://github.com/brian-rowe/angular-weekly-scheduler.git && cd angular-weekly-scheduler\r\nnpm install\r\n</pre><p>Then run <code>gulp server</code></p><h2 id="install" class="page-header">3. Install</h2><p><code>bower install --save angular-weekly-scheduler</code></p><p>or</p><p><code>npm install --save angular-weekly-scheduler</code></p><p>Add the scripts and css to your index.html. The angular-locale_xx-xx.js file is your locale file</p><pre>\r\n&lt;link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css"&gt;\r\n&lt;script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.10/angular.min.js"&gt;&lt;/script&gt;\r\n&lt;script src="https://cdnjs.cloudflare.com/ajax/libs/angular-i18n/1.4.10/angular-locale_xx-xx.js"&gt;&lt;/script&gt;\r\n&lt;script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.13.0/moment.js"&gt;&lt;/script&gt;\r\n\r\n&lt;!-- The library to replace with your local copy of ng-weekly-scheduler --&gt;\r\n&lt;script src="https://github.com/fmaturel/angular-weekly-scheduler/blob/master/dist/js/ng-weekly-scheduler.js"&gt;&lt;/script&gt;</pre><p>Add dependency to timeline your angular module: weeklyScheduler.</p><p>Use the directive:</p><code>&lt;weekly-scheduler class="scheduler" ng-model="myScopeModel" options="options"&gt;&lt;/weekly-scheduler&gt;</code><h2 id="features" class="page-header">4. Features</h2><p>This directive displays a weekly item scheduler. You can see, add and modify items easily.</p><h3>Keyboard shortcuts</h3><ul><li>Use <kbd>mouse wheel</kbd> on schedule to scroll left and right</li><li>Use <kbd>ctrl + mouse wheel</kbd> to zoom in and out the schedule</li></ul><hr><h3>Schedules</h3><div class="alert alert-info alert-dismissible fade in" role="alert">This directive uses <a href="http://momentjs.com/"><strong>MomentJS</strong></a> to position items and calculate localized calendar weeks.</div><p>Drag the time bar start, end and body to quickly change your schedule period.</p><p>You can set an <code>editable</code> variable on each item, that will be used to disable item edition if <code>false</code>.<pre>\r\n"items": [{\r\n  "label": "Item 1",\r\n  "editable": false,\r\n  "schedules": [\r\n    {\r\n      "start": "2015-12-26T23:00:00.000Z",\r\n      "end": "2016-07-31T22:00:00.000Z"\r\n    }\r\n  ]\r\n}, ...]</pre></p><hr><h3>Transclusion</h3><p>This directive is using <code>ng-transclude</code> so that everything in <code>&lt;weekly-scheduler&gt;</code> element will be treated as the labelling object of one item.</p><pre>&lt;div class="srow"&gt;\\{\\{::$index + 1\\}\\}. \\{\\{ item.label \\}\\}&lt;/div&gt;</pre><p>On transcluded item label, the scope contains <code>item</code> attribute name containing each item model and regular <code>ng-repeat</code> scope attributes</p><h3>Internationalisation (i18n)</h3><p>I18N uses <a href="https://github.com/lgalfaso/angular-dynamic-locale">dynamic angular <code>$locale</code> change</a>.</p><p>An i18n module named <code>weeklySchedulerI18N</code> is optionally registered when using the core module :</p><pre>angular.module(\'demoApp\', [\'weeklyScheduler\', \'weeklySchedulerI18N\'])</pre><p>If present, core directive will retrieve current <code>$locale</code> and use it to translate labelling elements.</p><p>You can add more <code>$locale</code> translation using provider <code>weeklySchedulerLocaleServiceProvider</code>:</p><pre>\r\nangular.module(\'demoApp\', [\'weeklyScheduler\', \'weeklySchedulerI18N\'])\r\n  .config([\'weeklySchedulerLocaleServiceProvider\', function (localeServiceProvider) {\r\n    localeServiceProvider.configure({\r\n      doys: {\'es-es\': 4},\r\n      lang: {\'es-es\': {weekNb: \'n\xFAmero de la semana\', addNew: \'A\xF1adir\'}},\r\n      localeLocationPattern: \'/vendor/angular-i18n/angular-locale_{{locale}}.js\'\r\n    });\r\n  }])</pre><h3>Animation</h3><p>You can add animation to the weekly scheduler directive easily by importing angular module <code>ngAnimate</code>.<br>Your application could for instance use :</p><pre>angular.module(\'demoApp\', [\'ngAnimate\', \'weeklyScheduler\'])</pre><p>Don\'t forget to add the angular-animate javascript file to your Single Page App <code>index.html</code>.</p><pre>&lt;script src="/vendor/angular-animate/angular-animate.js"&gt;&lt;/script&gt;</pre><p>Styling can be changed to whatever you like. This is an example of fading-in items entering the DOM :</p><pre>.schedule-animate {\r\n  transition: opacity 200ms ease-out;\r\n}\r\n.schedule-animate.ng-enter, .schedule-animate.ng-hide-remove {\r\n  opacity: 0;\r\n}\r\n.schedule-animate.ng-leave, .schedule-animate.ng-hide-add {\r\n  display: none;\r\n  opacity: 1;\r\n}</pre><p>You should see your scheduler items fading in!</p></div></div><script src="testVendorScripts.js"></script><script src="testScripts.js"></script><script>(function (i, s, o, g, r, a, m) {\r\n    i[\'GoogleAnalyticsObject\'] = r;\r\n    i[r] = i[r] || function () {\r\n        (i[r].q = i[r].q || []).push(arguments)\r\n      }, i[r].l = 1 * new Date();\r\n    a = s.createElement(o),\r\n      m = s.getElementsByTagName(o)[0];\r\n    a.async = 1;\r\n    a.src = g;\r\n    m.parentNode.insertBefore(a, m)\r\n  })(window, document, \'script\', \'https://www.google-analytics.com/analytics.js\', \'ga\');\r\n\r\n  ga(\'create\', \'UA-22755333-1\', \'auto\');\r\n  ga(\'send\', \'pageview\');</script></body></html>');
$templateCache.put('ng-weekly-scheduler/multislider/multislider.html','<div class="slot ghost" ng-click="multiSliderCtrl.onHoverElementClick()" ng-show="multiSliderCtrl.item.editable !== false && (!multiSliderCtrl.config.monoSchedule || !multiSliderCtrl.item.schedules.length)">{{multiSliderCtrl.config.labels.addNew || \'Add New\'}}</div><weekly-slot class="slot" item="multiSliderCtrl.item" ng-class="{disable: multiSliderCtrl.item.editable === false}" ng-repeat="schedule in multiSliderCtrl.item.schedules" ng-model="schedule" ng-model-options="{ updateOn: \'default blur\' }" ng-mouseleave="multiSliderCtrl.onWeeklySlotMouseLeave()" ng-mouseover="multiSliderCtrl.onWeeklySlotMouseOver()" ng-style="{\r\n                left: multiSliderCtrl.getSlotLeft(schedule),\r\n                width: multiSliderCtrl.getSlotWidth(schedule) \r\n             }"></weekly-slot>');
$templateCache.put('ng-weekly-scheduler/weekly-scheduler/weekly-scheduler.html','<div class="labels"><div class="srow timestamps"></div><div class="srow schedule-animate" ng-repeat="item in schedulerCtrl.items">{{ item.label }}</div></div><schedule-area-container><div class="schedule-area"><div class="srow timestamps"><hourly-grid class="grid-container"></hourly-grid></div><div class="srow schedule-animate" ng-repeat="item in schedulerCtrl.items"><interval-grid class="grid-container striped" no-text></interval-grid><multi-slider config="schedulerCtrl.config" item="item" index="{{$index}}"></multi-slider></div></div></schedule-area-container>');
$templateCache.put('ng-weekly-scheduler/weekly-slot/weekly-slot.html','<div title="{{schedule.start | timeOfDay}} - {{schedule.end | timeOfDay}}"><div class="handle left" ondrag="resize" ondragstart="startResizeStart" ondragstop="endDrag" handle></div><div ondrag="drag" ondragstart="startDrag" ondragstop="endDrag" handle>{{schedule.start | timeOfDay}} - {{schedule.end | timeOfDay}}</div><div class="handle right" ondrag="resize" ondragstart="startResizeEnd" ondragstop="endDrag" handle></div><div class="remove" ng-click="deleteSelf()" ng-if="::canRemove()"><span class="glyphicon glyphicon-remove"></span></div></div>');}]);