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
            items: [{
                    label: 'Item 1',
                    editable: false,
                    schedules: [
                        { start: moment('2015-12-27').toDate(), end: moment('2016-01-02').toDate() }
                    ]
                },
                {
                    label: 'Item 2',
                    schedules: [
                        { start: moment('2015-12-25').toDate(), end: moment('2016-01-01').toDate() }
                    ]
                }, {
                    label: 'Item 3',
                    schedules: [
                        { start: moment('2015-12-26').toDate(), end: moment('2015-12-31').toDate() }
                    ]
                }]
        };
        this.doSomething = function (itemIndex, scheduleIndex, scheduleValue) {
            $log.debug('The model has changed!', itemIndex, scheduleIndex, scheduleValue);
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
var CLICK_ON_A_CELL = 'clickOnACell';
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
    el.firstChild.style.width = scheduleAreaWidthPercent + '%';
    if (percentWidthFromBeginning === undefined) {
        // All cells of a line have the same size
        el.scrollLeft = idx * boxWidth - gutterSize;
    }
    else {
        // Sizes of cells in a line could different (especially the first one)
        el.scrollLeft = scheduleAreaWidthPx * (percentWidthFromBeginning / 100) - gutterSize;
    }
}
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
var InjectDirective = /** @class */ (function () {
    function InjectDirective() {
        this.link = function ($scope, $element, $attrs, controller, $transclude) {
            if (!$transclude) {
                throw 'Illegal use of ngTransclude directive in the template! No parent directive that requires a transclusion found.';
            }
            var innerScope = $scope.$new();
            $transclude(innerScope, function (clone) {
                $element.empty();
                $element.append(clone);
                $element.on('$destroy', function () {
                    innerScope.$destroy();
                });
            });
        };
    }
    InjectDirective.Factory = function () {
        var directive = function () { return new InjectDirective(); };
        return directive;
    };
    InjectDirective.$name = 'inject';
    return InjectDirective;
}());
angular
    .module('weeklyScheduler')
    .directive(InjectDirective.$name, InjectDirective.Factory());
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
var MultiSliderDirective = /** @class */ (function () {
    function MultiSliderDirective(timeService) {
        var _this = this;
        this.timeService = timeService;
        this.restrict = 'E';
        this.require = '^weeklyScheduler';
        this.templateUrl = 'ng-weekly-scheduler/multislider/multislider.html';
        this.link = function (scope, element, attrs, schedulerCtrl) {
            var conf = schedulerCtrl.config;
            // The default scheduler block size when adding a new item
            var defaultNewScheduleSize = parseInt(attrs.size) || 8;
            var valToPixel = function (val) {
                var percent = val / (conf.nbWeeks);
                return Math.floor(percent * element[0].clientWidth + 0.5);
            };
            var pixelToVal = function (pixel) {
                var percent = pixel / element[0].clientWidth;
                return Math.floor(percent * (conf.nbWeeks) + 0.5);
            };
            var addSlot = function (start, end) {
                start = start >= 0 ? start : 0;
                end = end <= conf.nbWeeks ? end : conf.nbWeeks;
                var startDate = _this.timeService.addWeek(conf.minDate, start);
                var endDate = _this.timeService.addWeek(conf.minDate, end);
                scope.$apply(function () {
                    var item = scope.item;
                    if (!item.schedules) {
                        item.schedules = [];
                    }
                    item.schedules.push({ start: startDate.toDate(), end: endDate.toDate() });
                });
            };
            var hoverElement = angular.element(element.find('div')[0]);
            var hoverElementWidth = valToPixel(defaultNewScheduleSize);
            hoverElement.css({
                width: hoverElementWidth + 'px'
            });
            element.on('mousemove', function (e) {
                var elOffX = element[0].getBoundingClientRect().left;
                hoverElement.css({
                    left: e.pageX - elOffX - hoverElementWidth / 2 + 'px'
                });
            });
            hoverElement.on('click', function (event) {
                if (!element.attr('no-add')) {
                    var elOffX = element[0].getBoundingClientRect().left;
                    var pixelOnClick = event.pageX - elOffX;
                    var valOnClick = pixelToVal(pixelOnClick);
                    var start = Math.round(valOnClick - defaultNewScheduleSize / 2);
                    var end = start + defaultNewScheduleSize;
                    addSlot(start, end);
                }
            });
        };
    }
    MultiSliderDirective.Factory = function () {
        var directive = function (timeService) { return new MultiSliderDirective(timeService); };
        directive.$inject = [
            'weeklySchedulerTimeService'
        ];
        return directive;
    };
    MultiSliderDirective.$name = 'multiSlider';
    return MultiSliderDirective;
}());
angular.module('weeklyScheduler')
    .directive(MultiSliderDirective.$name, MultiSliderDirective.Factory());
var WeeklySchedulerTimeService = /** @class */ (function () {
    function WeeklySchedulerTimeService() {
        this.WEEK = 'week';
    }
    WeeklySchedulerTimeService.prototype.addWeek = function (moment, nbWeek) {
        return moment.clone().add(nbWeek, this.WEEK);
    };
    WeeklySchedulerTimeService.prototype.compare = function (date, method, lastMin) {
        if (date) {
            var dateAsMoment;
            if (angular.isDate(date)) {
                dateAsMoment = moment(date);
            }
            else if (date._isAMomentObject) {
                dateAsMoment = date;
            }
            else {
                throw 'Could not parse date [' + date + ']';
            }
            return dateAsMoment[method](lastMin) ? dateAsMoment : lastMin;
        }
    };
    WeeklySchedulerTimeService.prototype.weekPreciseDiff = function (start, end) {
        return end.clone().diff(start.clone(), this.WEEK, true);
    };
    WeeklySchedulerTimeService.prototype.weekDiff = function (start, end) {
        return end.clone().endOf(this.WEEK).diff(start.clone().startOf(this.WEEK), this.WEEK) + 1;
    };
    WeeklySchedulerTimeService.$name = 'weeklySchedulerTimeService';
    return WeeklySchedulerTimeService;
}());
angular.module('weeklyScheduler')
    .service(WeeklySchedulerTimeService.$name, WeeklySchedulerTimeService);
/* global GRID_TEMPLATE, CLICK_ON_A_CELL */
angular.module('weeklyScheduler')
    .directive('weeklyGrid', [function () {
        function handleClickEvent(child, nbWeeks, idx, scope) {
            child.bind('click', function () {
                scope.$broadcast(CLICK_ON_A_CELL, {
                    nbElements: nbWeeks,
                    idx: idx
                });
            });
        }
        function doGrid(scope, element, attrs, model) {
            var i;
            // Calculate week width distribution
            var tickcount = model.nbWeeks;
            var ticksize = 100 / tickcount;
            var gridItemEl = GRID_TEMPLATE.css({ width: ticksize + '%' });
            var now = model.minDate.clone().startOf('week');
            // Clean element
            element.empty();
            for (i = 0; i < tickcount; i++) {
                var child = gridItemEl.clone();
                if (angular.isUndefined(attrs.noText)) {
                    handleClickEvent(child, tickcount, i, scope);
                    child.text(now.add(i && 1, 'week').week());
                }
                element.append(child);
            }
        }
        return {
            restrict: 'E',
            require: '^weeklyScheduler',
            link: function (scope, element, attrs, schedulerCtrl) {
                if (schedulerCtrl.config) {
                    doGrid(scope, element, attrs, schedulerCtrl.config);
                }
                schedulerCtrl.$modelChangeListeners.push(function (newModel) {
                    doGrid(scope, element, attrs, newModel);
                });
            }
        };
    }]);
var WeeklySchedulerController = /** @class */ (function () {
    function WeeklySchedulerController($injector, $log) {
        this.$injector = $injector;
        this.$log = $log;
        this.defaultOptions = {
            monoSchedule: false,
            selector: '.schedule-area-container'
        };
    }
    WeeklySchedulerController.prototype.$onInit = function () {
        // Try to get the i18n service
        var name = 'weeklySchedulerLocaleService';
        if (this.$injector.has(name)) {
            this.$log.info('The I18N service has successfully been initialized!');
            var localeService = this.$injector.get(name); /* TODO type */
            this.defaultOptions.labels = localeService.getLang();
        }
        else {
            this.$log.info('No I18N found for this module, check the ng module [weeklySchedulerI18N] if you need i18n.');
        }
        // Will hang our model change listeners
        this.$modelChangeListeners = [];
    };
    WeeklySchedulerController.$controllerAs = 'schedulerCtrl';
    WeeklySchedulerController.$name = 'weeklySchedulerController';
    WeeklySchedulerController.$inject = [
        '$injector',
        '$log'
    ];
    return WeeklySchedulerController;
}());
var WeeklySchedulerDirective = /** @class */ (function () {
    function WeeklySchedulerDirective($log, $parse, timeService) {
        var _this = this;
        this.$log = $log;
        this.$parse = $parse;
        this.timeService = timeService;
        this.restrict = 'E';
        this.require = 'weeklyScheduler';
        this.transclude = true;
        this.templateUrl = 'ng-weekly-scheduler/weekly-scheduler/weekly-scheduler.html';
        this.controller = WeeklySchedulerController.$name;
        this.controllerAs = WeeklySchedulerController.$controllerAs;
        this.link = function (scope, element, attrs, schedulerCtrl) {
            var optionsFn = _this.$parse(attrs.options), options = angular.extend(schedulerCtrl.defaultOptions, optionsFn(scope) || {});
            // Get the schedule container element
            var el = element[0].querySelector(schedulerCtrl.defaultOptions.selector);
            var self = _this;
            function onModelChange(items) {
                // Check items are present
                if (items) {
                    // Check items are in an Array
                    if (!angular.isArray(items)) {
                        throw 'You should use weekly-scheduler directive with an Array of items';
                    }
                    // Keep track of our model (use it in template)
                    schedulerCtrl.items = items;
                    // First calculate configuration
                    schedulerCtrl.config = self.config(items.reduce(function (result, item) {
                        var schedules = item.schedules;
                        return result.concat(schedules && schedules.length ?
                            // If in multiSlider mode, ensure a schedule array is present on each item
                            // Else only use first element of schedule array
                            (options.monoSchedule ? item.schedules = [schedules[0]] : schedules) :
                            item.schedules = []);
                    }, []), options);
                    // Finally, run the sub directives listeners
                    schedulerCtrl.$modelChangeListeners.forEach(function (listener) {
                        listener(schedulerCtrl.config);
                    });
                }
            }
            if (el) {
                // Install mouse scrolling event listener for H scrolling
                mouseScroll(el, 20);
                scope.$on(CLICK_ON_A_CELL, function (e, data) {
                    zoomInACell(el, e, data);
                });
                schedulerCtrl.on = {
                    change: function (itemIndex, scheduleIndex, scheduleValue) {
                        var onChangeFunction = _this.$parse(attrs.onChange)(scope);
                        if (angular.isFunction(onChangeFunction)) {
                            return onChangeFunction(itemIndex, scheduleIndex, scheduleValue);
                        }
                    }
                };
                /**
                 * Watch the model items
                 */
                scope.$watchCollection(attrs.items, onModelChange);
                /**
                 * Listen to $locale change (brought by external module weeklySchedulerI18N)
                 */
                scope.$on('weeklySchedulerLocaleChanged', function (e, labels) {
                    if (schedulerCtrl.config) {
                        schedulerCtrl.config.labels = labels;
                    }
                    onModelChange(angular.copy(this.$parse(attrs.items)(scope), []));
                });
            }
        };
    }
    /**
     * Configure the scheduler.
     * @param schedules
     * @param options
     * @returns {{minDate: *, maxDate: *, nbWeeks: *}}
     */
    WeeklySchedulerDirective.prototype.config = function (schedules, options) {
        var _this = this;
        var now = moment();
        // Calculate min date of all scheduled events
        var minDate = (schedules ? schedules.reduce(function (minDate, slot) {
            return _this.timeService.compare(slot.start, 'isBefore', minDate);
        }, now) : now).startOf('week');
        // Calculate max date of all scheduled events
        var maxDate = (schedules ? schedules.reduce(function (maxDate, slot) {
            return _this.timeService.compare(slot.end, 'isAfter', maxDate);
        }, minDate) : now).clone().add(1, 'day').endOf('day');
        // Calculate nb of weeks covered by minDate => maxDate
        var nbWeeks = this.timeService.weekDiff(minDate, maxDate);
        var result = angular.extend(options, { minDate: minDate, maxDate: maxDate, nbWeeks: nbWeeks });
        // Log configuration
        this.$log.debug('Weekly Scheduler configuration:', result);
        return result;
    };
    WeeklySchedulerDirective.Factory = function () {
        var directive = function ($log, $parse, timeService) { return new WeeklySchedulerDirective($log, $parse, timeService); };
        directive.$inject = [
            '$log',
            '$parse',
            'weeklySchedulerTimeService'
        ];
        return directive;
    };
    WeeklySchedulerDirective.$name = 'weeklyScheduler';
    return WeeklySchedulerDirective;
}());
/* global mouseScroll, CLICK_ON_A_CELL, zoomInACell */
angular.module('weeklyScheduler')
    .controller(WeeklySchedulerController.$name, WeeklySchedulerController)
    .directive(WeeklySchedulerDirective.$name, WeeklySchedulerDirective.Factory());
var WeeklySlotDirective = /** @class */ (function () {
    function WeeklySlotDirective(timeService) {
        var _this = this;
        this.timeService = timeService;
        this.restrict = 'E';
        this.require = ['^weeklyScheduler', 'ngModel'];
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
                return Math.floor(percent * conf.nbWeeks + 0.5);
            };
            var mergeOverlaps = function () {
                var schedule = scope.schedule;
                var schedules = scope.item.schedules;
                schedules.forEach(function (el) {
                    if (el !== schedule) {
                        // model is inside another slot
                        if (el.end >= schedule.end && el.start <= schedule.start) {
                            schedules.splice(schedules.indexOf(el), 1);
                            schedule.end = el.end;
                            schedule.start = el.start;
                        }
                        // model completely covers another slot
                        else if (schedule.end >= el.end && schedule.start <= el.start) {
                            schedules.splice(schedules.indexOf(el), 1);
                        }
                        // another slot's end is inside current model
                        else if (el.end >= schedule.start && el.end <= schedule.end) {
                            schedules.splice(schedules.indexOf(el), 1);
                            schedule.start = el.start;
                        }
                        // another slot's start is inside current model
                        else if (el.start >= schedule.start && el.start <= schedule.end) {
                            schedules.splice(schedules.indexOf(el), 1);
                            schedule.end = el.end;
                        }
                    }
                });
            };
            /**
             * Delete on right click on slot
             */
            var deleteSelf = function () {
                containerEl.removeClass('dragging');
                containerEl.removeClass('slot-hover');
                scope.item.schedules.splice(scope.item.schedules.indexOf(scope.schedule), 1);
                containerEl.find('weekly-slot').remove();
                scope.$apply();
            };
            element.find('span').on('click', function (e) {
                e.preventDefault();
                deleteSelf();
            });
            element.on('mouseover', function () {
                containerEl.addClass('slot-hover');
            });
            element.on('mouseleave', function () {
                containerEl.removeClass('slot-hover');
            });
            if (scope.item.editable !== false) {
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
                    scope.$apply();
                };
                scope.resize = function (d) {
                    var ui = ngModelCtrl.$viewValue;
                    var delta = pixelToVal(d);
                    if (resizeDirectionIsStart) {
                        var newStart = Math.round(valuesOnDragStart.start + delta);
                        if (ui.start !== newStart && newStart <= ui.end - 1 && newStart >= 0) {
                            ngModelCtrl.$setViewValue({
                                start: newStart,
                                end: ui.end
                            });
                            ngModelCtrl.$render();
                        }
                    }
                    else {
                        var newEnd = Math.round(valuesOnDragStart.end + delta);
                        if (ui.end !== newEnd && newEnd >= ui.start + 1 && newEnd <= conf.nbWeeks) {
                            ngModelCtrl.$setViewValue({
                                start: ui.start,
                                end: newEnd
                            });
                            ngModelCtrl.$render();
                        }
                    }
                };
                scope.drag = function (d) {
                    var ui = ngModelCtrl.$viewValue;
                    var delta = pixelToVal(d);
                    var duration = valuesOnDragStart.end - valuesOnDragStart.start;
                    var newStart = Math.round(valuesOnDragStart.start + delta);
                    var newEnd = Math.round(newStart + duration);
                    if (ui.start !== newStart && newStart >= 0 && newEnd <= conf.nbWeeks) {
                        ngModelCtrl.$setViewValue({
                            start: newStart,
                            end: newEnd
                        });
                        ngModelCtrl.$render();
                    }
                };
            }
            // on init, merge overlaps
            mergeOverlaps();
            //// UI -> model ////////////////////////////////////
            ngModelCtrl.$parsers.push(function (ui) {
                ngModelCtrl.$modelValue.start = _this.timeService.addWeek(conf.minDate, ui.start).toDate();
                ngModelCtrl.$modelValue.end = _this.timeService.addWeek(conf.minDate, ui.end).toDate();
                //$log.debug('PARSER :', ngModelCtrl.$modelValue.$$hashKey, index, scope.$index, ngModelCtrl.$modelValue);
                schedulerCtrl.on.change(index, scope.$index, ngModelCtrl.$modelValue);
                return ngModelCtrl.$modelValue;
            });
            //// model -> UI ////////////////////////////////////
            ngModelCtrl.$formatters.push(function (model) {
                var ui = {
                    start: _this.timeService.weekPreciseDiff(conf.minDate, moment(model.start), true),
                    end: _this.timeService.weekPreciseDiff(conf.minDate, moment(model.end), true)
                };
                //$log.debug('FORMATTER :', index, scope.$index, ui);
                return ui;
            });
            ngModelCtrl.$render = function () {
                var ui = ngModelCtrl.$viewValue;
                var css = {
                    left: ui.start / conf.nbWeeks * 100 + '%',
                    width: (ui.end - ui.start) / conf.nbWeeks * 100 + '%'
                };
                //$log.debug('RENDER :', index, scope.$index, css);
                element.css(css);
            };
            scope.$on('weeklySchedulerLocaleChanged', function () {
                // Simple change object reference so that ngModel triggers formatting & rendering
                scope.schedule = angular.copy(scope.schedule);
            });
        };
    }
    WeeklySlotDirective.Factory = function () {
        var directive = function (timeService) { return new WeeklySlotDirective(timeService); };
        directive.$inject = ['weeklySchedulerTimeService'];
        return directive;
    };
    WeeklySlotDirective.$name = 'weeklySlot';
    return WeeklySlotDirective;
}());
angular
    .module('weeklyScheduler')
    .directive(WeeklySlotDirective.$name, WeeklySlotDirective.Factory());

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC9kZW1vLWFwcC50cyIsImFwcC9uZy13ZWVrbHktc2NoZWR1bGVyL21vZHVsZS50cyIsImFwcC9uZy13ZWVrbHktc2NoZWR1bGVyL2hhbmRsZS9oYW5kbGUudHMiLCJhcHAvbmctd2Vla2x5LXNjaGVkdWxlci9pbmplY3QvaW5qZWN0LnRzIiwiYXBwL25nLXdlZWtseS1zY2hlZHVsZXIvbG9jYWxlL2xvY2FsZS1zZXJ2aWNlLnRzIiwiYXBwL25nLXdlZWtseS1zY2hlZHVsZXIvbXVsdGlzbGlkZXIvbXVsdGlzbGlkZXIudHMiLCJhcHAvbmctd2Vla2x5LXNjaGVkdWxlci90aW1lL3RpbWUtc2VydmljZXMudHMiLCJhcHAvbmctd2Vla2x5LXNjaGVkdWxlci93ZWVrbHktZ3JpZC93ZWVrbHktZ3JpZC50cyIsImFwcC9uZy13ZWVrbHktc2NoZWR1bGVyL3dlZWtseS1zY2hlZHVsZXIvd2Vla2x5LXNjaGVkdWxlci50cyIsImFwcC9uZy13ZWVrbHktc2NoZWR1bGVyL3dlZWtseS1zbG90L3dlZWtseS1zbG90LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsV0FBVyxFQUFFLGlCQUFpQixFQUFFLHFCQUFxQixDQUFDLENBQUM7S0FFL0UsTUFBTSxDQUFDLENBQUMsc0NBQXNDLEVBQUUsVUFBVSxxQkFBcUI7UUFDOUUscUJBQXFCLENBQUMsU0FBUyxDQUFDO1lBQzlCLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUU7WUFDcEIsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLHFCQUFxQixFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFBRTtZQUN0RSxxQkFBcUIsRUFBRSwrQkFBK0I7U0FDdkQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7S0FFRixVQUFVLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLDhCQUE4QixFQUFFLE1BQU07SUFDekYsVUFBVSxNQUFNLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxJQUFJO1FBRTdDLE1BQU0sQ0FBQyxLQUFLLEdBQUc7WUFDYixNQUFNLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ2hDLE9BQU8sRUFBRSxFQUFDLHNCQUFzQixDQUFFO1lBQ2xDLEtBQUssRUFBRSxDQUFDO29CQUNOLEtBQUssRUFBRSxRQUFRO29CQUNmLFFBQVEsRUFBRSxLQUFLO29CQUNmLFNBQVMsRUFBRTt3QkFDVCxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtxQkFDN0U7aUJBQ0Y7Z0JBQ0Q7b0JBQ0UsS0FBSyxFQUFFLFFBQVE7b0JBQ2YsU0FBUyxFQUFFO3dCQUNULEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO3FCQUM3RTtpQkFDRixFQUFFO29CQUNELEtBQUssRUFBRSxRQUFRO29CQUNmLFNBQVMsRUFBRTt3QkFDVCxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtxQkFDN0U7aUJBQ0YsQ0FBQztTQUNILENBQUM7UUFFRixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsU0FBUyxFQUFFLGFBQWEsRUFBRSxhQUFhO1lBQ2xFLElBQUksQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUNoRixDQUFDLENBQUM7UUFFRixJQUFJLENBQUMsY0FBYyxHQUFHO1lBQ3BCLElBQUksQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM3RCxhQUFhLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsT0FBTztnQkFDM0QsSUFBSSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDO0FDaERSLE9BQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7QUFFbEUsSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO0FBQ3JFLElBQUksZUFBZSxHQUFHLGNBQWMsQ0FBQztBQUVyQyxJQUFJLE1BQU0sQ0FBQztBQUVYLG1CQUFtQixDQUFDO0lBQ2xCLElBQUksQ0FBQyxDQUFDLEtBQUssS0FBSyxFQUFFLEVBQUU7UUFDbEIsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDO0tBQy9CO0FBQ0gsQ0FBQztBQUVELHFCQUFxQixFQUFFLEVBQUUsS0FBSztJQUU1QixNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzlDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFFNUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxVQUFVLENBQUM7UUFDM0MsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ25CLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUVwQixJQUFJLE1BQU0sRUFBRTtZQUNWLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLFlBQVksR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ2xDLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxZQUFZLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQzthQUNoRDtpQkFBTTtnQkFDTCxJQUFJLEtBQUssR0FBRyxZQUFZLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztnQkFDckMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO2FBQ2pEO1NBQ0Y7YUFBTTtZQUNMLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ2xDLEVBQUUsQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDO2FBQ3hCO2lCQUFNO2dCQUNMLEVBQUUsQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDO2FBQ3hCO1NBQ0Y7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELHFCQUFxQixFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUk7SUFFbEMsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUNqQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO0lBQ25CLG1GQUFtRjtJQUNuRiwwREFBMEQ7SUFDMUQsMkJBQTJCO0lBQzNCLHFDQUFxQztJQUNyQyxJQUFJLHlCQUF5QixHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQztJQUUvRCxJQUFJLGNBQWMsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDO0lBRXBDLHdCQUF3QjtJQUN4Qix1QkFBdUI7SUFDdkIsSUFBSSxRQUFRLEdBQUcsY0FBYyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLElBQUksVUFBVSxHQUFHLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFFOUIsSUFBSSxtQkFBbUIsR0FBRyxVQUFVLEdBQUcsUUFBUSxDQUFDO0lBQ2hELElBQUksd0JBQXdCLEdBQUcsQ0FBQyxtQkFBbUIsR0FBRyxjQUFjLENBQUMsR0FBRyxHQUFHLENBQUM7SUFFNUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLHdCQUF3QixHQUFHLEdBQUcsQ0FBQztJQUUzRCxJQUFJLHlCQUF5QixLQUFLLFNBQVMsRUFBRTtRQUMzQyx5Q0FBeUM7UUFDekMsRUFBRSxDQUFDLFVBQVUsR0FBRyxHQUFHLEdBQUcsUUFBUSxHQUFHLFVBQVUsQ0FBQztLQUM3QztTQUFNO1FBQ0wsc0VBQXNFO1FBQ3RFLEVBQUUsQ0FBQyxVQUFVLEdBQUcsbUJBQW1CLEdBQUcsQ0FBQyx5QkFBeUIsR0FBRyxHQUFHLENBQUMsR0FBRyxVQUFVLENBQUM7S0FDdEY7QUFDSCxDQUFDO0FDdEVEO0lBNkNFLHlCQUNVLFNBQW1DO1FBRDdDLGlCQUdDO1FBRlMsY0FBUyxHQUFULFNBQVMsQ0FBMEI7UUE1QzdDLGFBQVEsR0FBRyxHQUFHLENBQUM7UUFFZixVQUFLLEdBQUc7WUFDTixNQUFNLEVBQUUsR0FBRztZQUNYLFVBQVUsRUFBRSxHQUFHO1lBQ2YsV0FBVyxFQUFFLEdBQUc7U0FDakIsQ0FBQztRQUVGLFNBQUksR0FBRyxVQUFDLEtBQUssRUFBRSxPQUFpQztZQUM5QyxJQUFJLFNBQVMsR0FBRyxLQUFJLENBQUMsU0FBUyxDQUFDO1lBQy9CLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVWLE9BQU8sQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLFVBQUMsS0FBSztnQkFDNUIsK0NBQStDO2dCQUMvQyxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBRXZCLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO2dCQUVoQixTQUFTLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDckMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRWpDLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRTtvQkFDckIsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO2lCQUNyQjtZQUNILENBQUMsQ0FBQyxDQUFDO1lBRUgsbUJBQW1CLEtBQUs7Z0JBQ3RCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7b0JBQ2hCLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ3JCO1lBQ0gsQ0FBQztZQUVEO2dCQUNFLFNBQVMsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN6QyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFFckMsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFO29CQUNwQixLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7aUJBQ3BCO1lBQ0gsQ0FBQztRQUNILENBQUMsQ0FBQTtJQUtELENBQUM7SUFFTSx1QkFBTyxHQUFkO1FBQ0UsSUFBSSxTQUFTLEdBQUcsVUFBQyxTQUFTLElBQUssT0FBQSxJQUFJLGVBQWUsQ0FBQyxTQUFTLENBQUMsRUFBOUIsQ0FBOEIsQ0FBQztRQUU5RCxTQUFTLENBQUMsT0FBTyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFbEMsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQXZETSxxQkFBSyxHQUFHLFFBQVEsQ0FBQztJQXdEMUIsc0JBQUM7Q0F6REQsQUF5REMsSUFBQTtBQUVELE9BQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUM7S0FDOUIsU0FBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7QUM1RC9EO0lBQUE7UUFHRSxTQUFJLEdBQUcsVUFBQyxNQUFzQixFQUFFLFFBQWtDLEVBQUUsTUFBMkIsRUFBRSxVQUFVLEVBQUUsV0FBd0M7WUFDbkosSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDaEIsTUFBTSxnSEFBZ0gsQ0FBQzthQUN4SDtZQUVELElBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUUvQixXQUFXLENBQUMsVUFBVSxFQUFFLFVBQVUsS0FBSztnQkFDckMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNqQixRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN2QixRQUFRLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRTtvQkFDdEIsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN4QixDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFBO0lBT0gsQ0FBQztJQUxRLHVCQUFPLEdBQWQ7UUFDRSxJQUFJLFNBQVMsR0FBRyxjQUFNLE9BQUEsSUFBSSxlQUFlLEVBQUUsRUFBckIsQ0FBcUIsQ0FBQztRQUU1QyxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0lBdEJNLHFCQUFLLEdBQUcsUUFBUSxDQUFDO0lBdUIxQixzQkFBQztDQXhCRCxBQXdCQyxJQUFBO0FBRUQsT0FBTztLQUNKLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztLQUN6QixTQUFTLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztBQzVCL0QsT0FBTyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztBQUU3RCxPQUFPLENBQUMsTUFBTSxDQUFDLHFCQUFxQixDQUFDO0tBQ2xDLFFBQVEsQ0FBQyw4QkFBOEIsRUFBRSxDQUFDLDBCQUEwQixFQUFFLFVBQVUsd0JBQXdCO1FBRXZHLElBQUksYUFBYSxHQUF3QjtZQUN2QyxJQUFJLEVBQUUsRUFBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFDO1lBQ3RELElBQUksRUFBRTtnQkFDSixPQUFPLEVBQUUsRUFBQyxNQUFNLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUM7Z0JBQ3RELE9BQU8sRUFBRSxFQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBQztnQkFDMUMsT0FBTyxFQUFFLEVBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFDO2dCQUMxQyxPQUFPLEVBQUUsRUFBQyxNQUFNLEVBQUUsZUFBZSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUM7YUFDdEQ7U0FDRixDQUFDO1FBRUYsSUFBSSxDQUFDLFNBQVMsR0FBRyxVQUFVLE1BQU07WUFFL0IsSUFBSSxNQUFNLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDdEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRXJDLElBQUksYUFBYSxDQUFDLHFCQUFxQixFQUFFO29CQUN2Qyx3QkFBd0IsQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhLENBQUMscUJBQXFCLENBQUMsQ0FBQztpQkFDckY7YUFDRjtRQUNILENBQUMsQ0FBQztRQUVGLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLGtCQUFrQixFQUFFLFVBQVUsVUFBVSxFQUFFLE9BQU8sRUFBRSxnQkFBZ0I7Z0JBRXZHLElBQUksaUJBQWlCLEdBQUcsRUFBRSxDQUFDO2dCQUUzQjtvQkFDRSxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNyQixJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEVBQUU7d0JBQzNCLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDOUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQ3pFO3lCQUFNO3dCQUNMLE1BQU0sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7cUJBQzFDO29CQUNELE9BQU8sYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDakMsQ0FBQztnQkFFRCw0Q0FBNEM7Z0JBQzVDLHlCQUF5QixHQUFHO29CQUMxQixPQUFPO3dCQUNMLEVBQUUsRUFBRSxHQUFHO3dCQUNQLE1BQU0sRUFBRTs0QkFDTixJQUFJLEVBQUU7Z0NBQ0osK0NBQStDO2dDQUMvQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7Z0NBQ3RELEdBQUcsRUFBRSxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQzs2QkFDN0I7eUJBQ0Y7cUJBQ0YsQ0FBQztnQkFDSixDQUFDO2dCQUVELFVBQVUsQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUU7b0JBQ3JDLFVBQVUsQ0FBQyxVQUFVLENBQUMsOEJBQThCLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDbkUsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsT0FBTztvQkFDTCxPQUFPLEVBQUUsT0FBTztvQkFDaEIsT0FBTyxFQUFFLE9BQU87b0JBQ2hCLEdBQUcsRUFBRSxVQUFVLEdBQUc7d0JBQ2hCLE9BQU8sZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNuQyxDQUFDO2lCQUNGLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDLENBQUM7QUNuRU47SUFPRSw4QkFDVSxXQUFXO1FBRHJCLGlCQUdDO1FBRlMsZ0JBQVcsR0FBWCxXQUFXLENBQUE7UUFMckIsYUFBUSxHQUFHLEdBQUcsQ0FBQztRQUNmLFlBQU8sR0FBRyxrQkFBa0IsQ0FBQztRQUM3QixnQkFBVyxHQUFHLGtEQUFrRCxDQUFDO1FBT2pFLFNBQUksR0FBRyxVQUFDLEtBQUssRUFBRSxPQUFpQyxFQUFFLEtBQTBCLEVBQUUsYUFBYTtZQUN6RixJQUFJLElBQUksR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDO1lBRWhDLDBEQUEwRDtZQUMxRCxJQUFJLHNCQUFzQixHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXZELElBQUksVUFBVSxHQUFHLFVBQVUsR0FBRztnQkFDNUIsSUFBSSxPQUFPLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNuQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDNUQsQ0FBQyxDQUFDO1lBRUYsSUFBSSxVQUFVLEdBQUcsVUFBVSxLQUFLO2dCQUM5QixJQUFJLE9BQU8sR0FBRyxLQUFLLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztnQkFDN0MsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUM7WUFFRixJQUFJLE9BQU8sR0FBRyxVQUFDLEtBQUssRUFBRSxHQUFHO2dCQUN2QixLQUFLLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9CLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUUvQyxJQUFJLFNBQVMsR0FBRyxLQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUM5RCxJQUFJLE9BQU8sR0FBRyxLQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUUxRCxLQUFLLENBQUMsTUFBTSxDQUFDO29CQUNYLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7b0JBQ3RCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO3dCQUNuQixJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztxQkFDckI7b0JBQ0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUMsQ0FBQyxDQUFDO2dCQUMxRSxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQztZQUVGLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNELElBQUksaUJBQWlCLEdBQUcsVUFBVSxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFFM0QsWUFBWSxDQUFDLEdBQUcsQ0FBQztnQkFDZixLQUFLLEVBQUUsaUJBQWlCLEdBQUcsSUFBSTthQUNoQyxDQUFDLENBQUM7WUFFSCxPQUFPLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUM7Z0JBQ2pDLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLElBQUksQ0FBQztnQkFFckQsWUFBWSxDQUFDLEdBQUcsQ0FBQztvQkFDZixJQUFJLEVBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxNQUFNLEdBQUcsaUJBQWlCLEdBQUcsQ0FBQyxHQUFHLElBQUk7aUJBQ3RELENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1lBRUgsWUFBWSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxLQUFLO2dCQUN0QyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDM0IsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixFQUFFLENBQUMsSUFBSSxDQUFDO29CQUNyRCxJQUFJLFlBQVksR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztvQkFDeEMsSUFBSSxVQUFVLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUUxQyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxzQkFBc0IsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDaEUsSUFBSSxHQUFHLEdBQUcsS0FBSyxHQUFHLHNCQUFzQixDQUFDO29CQUV6QyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2lCQUNyQjtZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFBO0lBN0RELENBQUM7SUErRE0sNEJBQU8sR0FBZDtRQUNFLElBQUksU0FBUyxHQUFHLFVBQUMsV0FBVyxJQUFLLE9BQUEsSUFBSSxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsRUFBckMsQ0FBcUMsQ0FBQztRQUV2RSxTQUFTLENBQUMsT0FBTyxHQUFHO1lBQ2xCLDRCQUE0QjtTQUM3QixDQUFDO1FBRUYsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQWhGTSwwQkFBSyxHQUFHLGFBQWEsQ0FBQztJQWlGL0IsMkJBQUM7Q0FsRkQsQUFrRkMsSUFBQTtBQUVELE9BQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUM7S0FDOUIsU0FBUyxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FDckZ6RTtJQUFBO1FBR1UsU0FBSSxHQUFHLE1BQU0sQ0FBQztJQTJCeEIsQ0FBQztJQXpCUSw0Q0FBTyxHQUFkLFVBQWUsTUFBTSxFQUFFLE1BQU07UUFDM0IsT0FBTyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVNLDRDQUFPLEdBQWQsVUFBZSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU87UUFDbEMsSUFBSSxJQUFJLEVBQUU7WUFDUixJQUFJLFlBQVksQ0FBQztZQUNqQixJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3hCLFlBQVksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDN0I7aUJBQU0sSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQ2hDLFlBQVksR0FBRyxJQUFJLENBQUM7YUFDckI7aUJBQU07Z0JBQ0wsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFDO2FBQzdDO1lBQ0QsT0FBTyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1NBQy9EO0lBQ0gsQ0FBQztJQUVNLG9EQUFlLEdBQXRCLFVBQXVCLEtBQUssRUFBRSxHQUFHO1FBQy9CLE9BQU8sR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRU0sNkNBQVEsR0FBZixVQUFnQixLQUFLLEVBQUUsR0FBRztRQUN4QixPQUFPLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzVGLENBQUM7SUE1Qk0sZ0NBQUssR0FBRyw0QkFBNEIsQ0FBQztJQTZCOUMsaUNBQUM7Q0E5QkQsQUE4QkMsSUFBQTtBQUVELE9BQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUM7S0FDOUIsT0FBTyxDQUFDLDBCQUEwQixDQUFDLEtBQUssRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO0FDakN6RSwyQ0FBMkM7QUFDM0MsT0FBTyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztLQUM5QixTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7UUFFeEIsMEJBQTBCLEtBQUssRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLEtBQUs7WUFDbEQsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2xCLEtBQUssQ0FBQyxVQUFVLENBQUMsZUFBZSxFQUFFO29CQUNoQyxVQUFVLEVBQUUsT0FBTztvQkFDbkIsR0FBRyxFQUFFLEdBQUc7aUJBQ1QsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsZ0JBQWdCLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUs7WUFDMUMsSUFBSSxDQUFDLENBQUM7WUFDTixvQ0FBb0M7WUFDcEMsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztZQUM5QixJQUFJLFFBQVEsR0FBRyxHQUFHLEdBQUcsU0FBUyxDQUFDO1lBQy9CLElBQUksVUFBVSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsRUFBQyxLQUFLLEVBQUUsUUFBUSxHQUFHLEdBQUcsRUFBQyxDQUFDLENBQUM7WUFDNUQsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFaEQsZ0JBQWdCO1lBQ2hCLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUVoQixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDOUIsSUFBSSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUMvQixJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUNyQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDN0MsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztpQkFDNUM7Z0JBQ0QsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN2QjtRQUVILENBQUM7UUFFRCxPQUFPO1lBQ0wsUUFBUSxFQUFFLEdBQUc7WUFDYixPQUFPLEVBQUUsa0JBQWtCO1lBQzNCLElBQUksRUFBRSxVQUFVLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLGFBQXdDO2dCQUM3RSxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQ3hCLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQ3JEO2dCQUNELGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxRQUFRO29CQUN6RCxNQUFNLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzFDLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztTQUNGLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDO0FDL0NOO0lBU0UsbUNBQ1UsU0FBd0MsRUFDeEMsSUFBeUI7UUFEekIsY0FBUyxHQUFULFNBQVMsQ0FBK0I7UUFDeEMsU0FBSSxHQUFKLElBQUksQ0FBcUI7UUFPNUIsbUJBQWMsR0FBd0I7WUFDM0MsWUFBWSxFQUFFLEtBQUs7WUFDbkIsUUFBUSxFQUFFLDBCQUEwQjtTQUNyQyxDQUFDO0lBUkYsQ0FBQztJQWdCRCwyQ0FBTyxHQUFQO1FBQ0UsOEJBQThCO1FBQzlCLElBQUksSUFBSSxHQUFHLDhCQUE4QixDQUFDO1FBRTFDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMscURBQXFELENBQUMsQ0FBQztZQUV0RSxJQUFJLGFBQWEsR0FBUSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGVBQWU7WUFDbEUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEdBQUcsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3REO2FBQU07WUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyw0RkFBNEYsQ0FBQyxDQUFDO1NBQzlHO1FBRUQsdUNBQXVDO1FBQ3ZDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxFQUFFLENBQUM7SUFDbEMsQ0FBQztJQTNDTSx1Q0FBYSxHQUFHLGVBQWUsQ0FBQztJQUNoQywrQkFBSyxHQUFHLDJCQUEyQixDQUFDO0lBRXBDLGlDQUFPLEdBQUc7UUFDZixXQUFXO1FBQ1gsTUFBTTtLQUNQLENBQUM7SUFzQ0osZ0NBQUM7Q0E3Q0QsQUE2Q0MsSUFBQTtBQUVEO0lBR0Usa0NBQ1UsSUFBeUIsRUFDekIsTUFBNkIsRUFDN0IsV0FBVztRQUhyQixpQkFLQztRQUpTLFNBQUksR0FBSixJQUFJLENBQXFCO1FBQ3pCLFdBQU0sR0FBTixNQUFNLENBQXVCO1FBQzdCLGdCQUFXLEdBQVgsV0FBVyxDQUFBO1FBSXJCLGFBQVEsR0FBRyxHQUFHLENBQUM7UUFDZixZQUFPLEdBQUcsaUJBQWlCLENBQUM7UUFDNUIsZUFBVSxHQUFHLElBQUksQ0FBQztRQUNsQixnQkFBVyxHQUFHLDREQUE0RCxDQUFDO1FBQzNFLGVBQVUsR0FBRyx5QkFBeUIsQ0FBQyxLQUFLLENBQUM7UUFDN0MsaUJBQVksR0FBRyx5QkFBeUIsQ0FBQyxhQUFhLENBQUM7UUFFdkQsU0FBSSxHQUFHLFVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsYUFBd0M7WUFDckUsSUFBSSxTQUFTLEdBQUcsS0FBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQ3hDLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRWpGLHFDQUFxQztZQUNyQyxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDekUsSUFBSSxJQUFJLEdBQTZCLEtBQUksQ0FBQztZQUUxQyx1QkFBdUIsS0FBSztnQkFDMUIsMEJBQTBCO2dCQUMxQixJQUFJLEtBQUssRUFBRTtvQkFFVCw4QkFBOEI7b0JBQzlCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO3dCQUMzQixNQUFNLGtFQUFrRSxDQUFDO3FCQUMxRTtvQkFFRCwrQ0FBK0M7b0JBQy9DLGFBQWEsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO29CQUU1QixnQ0FBZ0M7b0JBQ2hDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQUMsTUFBTSxFQUFFLElBQUk7d0JBQzNELElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7d0JBRS9CLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzRCQUNsRCwwRUFBMEU7NEJBQzFFLGdEQUFnRDs0QkFDaEQsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7NEJBQ3RFLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUNwQixDQUFDO29CQUNKLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFFakIsNENBQTRDO29CQUM1QyxhQUFhLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLFVBQVUsUUFBUTt3QkFDNUQsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDakMsQ0FBQyxDQUFDLENBQUM7aUJBQ0o7WUFDSCxDQUFDO1lBRUQsSUFBSSxFQUFFLEVBQUU7Z0JBQ04seURBQXlEO2dCQUN6RCxXQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUVwQixLQUFLLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxVQUFVLENBQUMsRUFBRSxJQUFJO29CQUMxQyxXQUFXLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDM0IsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsYUFBYSxDQUFDLEVBQUUsR0FBRztvQkFDakIsTUFBTSxFQUFFLFVBQUMsU0FBUyxFQUFFLGFBQWEsRUFBRSxhQUFhO3dCQUM5QyxJQUFJLGdCQUFnQixHQUFHLEtBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUMxRCxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsRUFBRTs0QkFDeEMsT0FBTyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDO3lCQUNsRTtvQkFDSCxDQUFDO2lCQUNGLENBQUM7Z0JBRUY7O21CQUVHO2dCQUNILEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUVuRDs7bUJBRUc7Z0JBQ0gsS0FBSyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsRUFBRSxVQUFVLENBQUMsRUFBRSxNQUFNO29CQUMzRCxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUU7d0JBQ3hCLGFBQWEsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztxQkFDdEM7b0JBQ0QsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbkUsQ0FBQyxDQUFDLENBQUM7YUFDSjtRQUNILENBQUMsQ0FBQTtJQWhGRCxDQUFDO0lBa0ZEOzs7OztPQUtHO0lBQ0sseUNBQU0sR0FBZCxVQUFlLFNBQWdCLEVBQUUsT0FBTztRQUF4QyxpQkFxQkM7UUFwQkMsSUFBSSxHQUFHLEdBQUcsTUFBTSxFQUFFLENBQUM7UUFFbkIsNkNBQTZDO1FBQzdDLElBQUksT0FBTyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQUMsT0FBTyxFQUFFLElBQUk7WUFDeEQsT0FBTyxLQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNuRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUvQiw2Q0FBNkM7UUFDN0MsSUFBSSxPQUFPLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBQyxPQUFPLEVBQUUsSUFBSTtZQUN4RCxPQUFPLEtBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2hFLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFdEQsc0RBQXNEO1FBQ3RELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUUxRCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUMvRixvQkFBb0I7UUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFM0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVNLGdDQUFPLEdBQWQ7UUFDRSxJQUFJLFNBQVMsR0FBRyxVQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsV0FBVyxJQUFLLE9BQUEsSUFBSSx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFdBQVcsQ0FBQyxFQUF2RCxDQUF1RCxDQUFDO1FBRXZHLFNBQVMsQ0FBQyxPQUFPLEdBQUc7WUFDbEIsTUFBTTtZQUNOLFFBQVE7WUFDUiw0QkFBNEI7U0FDN0IsQ0FBQztRQUVGLE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7SUFoSU0sOEJBQUssR0FBRyxpQkFBaUIsQ0FBQztJQWlJbkMsK0JBQUM7Q0FsSUQsQUFrSUMsSUFBQTtBQUVELHNEQUFzRDtBQUN0RCxPQUFPLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDO0tBQzlCLFVBQVUsQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLEVBQUUseUJBQXlCLENBQUM7S0FDdEUsU0FBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSx3QkFBd0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FDdExqRjtJQUdFLDZCQUNVLFdBQVc7UUFEckIsaUJBR0M7UUFGUyxnQkFBVyxHQUFYLFdBQVcsQ0FBQTtRQUlyQixhQUFRLEdBQUcsR0FBRyxDQUFDO1FBQ2YsWUFBTyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDMUMsZ0JBQVcsR0FBRyxrREFBa0QsQ0FBQztRQUVqRSxTQUFJLEdBQUcsVUFBQyxLQUFLLEVBQUUsT0FBaUMsRUFBRSxLQUEwQixFQUFFLEtBQUs7WUFDakYsSUFBSSxhQUFhLEdBQThCLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFDbkQsV0FBVyxHQUErQixLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdkQsSUFBSSxJQUFJLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQztZQUNoQyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUNqQyxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbkMsSUFBSSxzQkFBc0IsR0FBRyxJQUFJLENBQUM7WUFDbEMsSUFBSSxpQkFBaUIsR0FBRyxFQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUMsQ0FBQztZQUUvRSxJQUFJLFVBQVUsR0FBRyxVQUFVLEtBQUs7Z0JBQzlCLElBQUksT0FBTyxHQUFHLEtBQUssR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO2dCQUNqRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDbEQsQ0FBQyxDQUFDO1lBRUYsSUFBSSxhQUFhLEdBQUc7Z0JBQ2xCLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7Z0JBQzlCLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNyQyxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtvQkFDNUIsSUFBSSxFQUFFLEtBQUssUUFBUSxFQUFFO3dCQUNuQiwrQkFBK0I7d0JBQy9CLElBQUksRUFBRSxDQUFDLEdBQUcsSUFBSSxRQUFRLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxLQUFLLElBQUksUUFBUSxDQUFDLEtBQUssRUFBRTs0QkFDeEQsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOzRCQUMzQyxRQUFRLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUM7NEJBQ3RCLFFBQVEsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQzt5QkFDM0I7d0JBQ0QsdUNBQXVDOzZCQUNsQyxJQUFJLFFBQVEsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUU7NEJBQzdELFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt5QkFDNUM7d0JBQ0QsNkNBQTZDOzZCQUN4QyxJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxHQUFHLEVBQUU7NEJBQzNELFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs0QkFDM0MsUUFBUSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDO3lCQUMzQjt3QkFDRCwrQ0FBK0M7NkJBQzFDLElBQUksRUFBRSxDQUFDLEtBQUssSUFBSSxRQUFRLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxLQUFLLElBQUksUUFBUSxDQUFDLEdBQUcsRUFBRTs0QkFDL0QsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOzRCQUMzQyxRQUFRLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUM7eUJBQ3ZCO3FCQUNGO2dCQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDO1lBRUY7O2VBRUc7WUFDSCxJQUFJLFVBQVUsR0FBRztnQkFDZixXQUFXLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNwQyxXQUFXLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN0QyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDN0UsV0FBVyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDekMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2pCLENBQUMsQ0FBQztZQUVGLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUM7Z0JBQzFDLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDbkIsVUFBVSxFQUFFLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFO2dCQUN0QixXQUFXLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3JDLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUU7Z0JBQ3ZCLFdBQVcsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUM7WUFHSCxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxLQUFLLEtBQUssRUFBRTtnQkFDakMsS0FBSyxDQUFDLGdCQUFnQixHQUFHO29CQUN2QixzQkFBc0IsR0FBRyxJQUFJLENBQUM7b0JBQzlCLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEIsQ0FBQyxDQUFDO2dCQUVGLEtBQUssQ0FBQyxjQUFjLEdBQUc7b0JBQ3JCLHNCQUFzQixHQUFHLEtBQUssQ0FBQztvQkFDL0IsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNwQixDQUFDLENBQUM7Z0JBRUYsS0FBSyxDQUFDLFNBQVMsR0FBRztvQkFDaEIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFFM0IsV0FBVyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDakMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7b0JBRW5DLGlCQUFpQixHQUFHLEVBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBQyxDQUFDO2dCQUM3RixDQUFDLENBQUM7Z0JBRUYsS0FBSyxDQUFDLE9BQU8sR0FBRztvQkFFZCx1Q0FBdUM7b0JBQ3ZDLDZDQUE2QztvQkFDN0MsVUFBVSxDQUFDO3dCQUNULFdBQVcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ25DLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFFUixPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUM5QixXQUFXLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUVwQyxhQUFhLEVBQUUsQ0FBQztvQkFDaEIsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNqQixDQUFDLENBQUM7Z0JBRUYsS0FBSyxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUM7b0JBQ3hCLElBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUM7b0JBQ2hDLElBQUksS0FBSyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFMUIsSUFBSSxzQkFBc0IsRUFBRTt3QkFDMUIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUM7d0JBRTNELElBQUksRUFBRSxDQUFDLEtBQUssS0FBSyxRQUFRLElBQUksUUFBUSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLFFBQVEsSUFBSSxDQUFDLEVBQUU7NEJBQ3BFLFdBQVcsQ0FBQyxhQUFhLENBQUM7Z0NBQ3hCLEtBQUssRUFBRSxRQUFRO2dDQUNmLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRzs2QkFDWixDQUFDLENBQUM7NEJBQ0gsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO3lCQUN2QjtxQkFDRjt5QkFBTTt3QkFDTCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQzt3QkFFdkQsSUFBSSxFQUFFLENBQUMsR0FBRyxLQUFLLE1BQU0sSUFBSSxNQUFNLElBQUksRUFBRSxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7NEJBQ3pFLFdBQVcsQ0FBQyxhQUFhLENBQUM7Z0NBQ3hCLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSztnQ0FDZixHQUFHLEVBQUUsTUFBTTs2QkFDWixDQUFDLENBQUM7NEJBQ0gsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO3lCQUN2QjtxQkFDRjtnQkFDSCxDQUFDLENBQUM7Z0JBRUYsS0FBSyxDQUFDLElBQUksR0FBRyxVQUFVLENBQUM7b0JBQ3RCLElBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUM7b0JBQ2hDLElBQUksS0FBSyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUIsSUFBSSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxHQUFHLGlCQUFpQixDQUFDLEtBQUssQ0FBQztvQkFFL0QsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUM7b0JBQzNELElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxDQUFDO29CQUU3QyxJQUFJLEVBQUUsQ0FBQyxLQUFLLEtBQUssUUFBUSxJQUFJLFFBQVEsSUFBSSxDQUFDLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7d0JBQ3BFLFdBQVcsQ0FBQyxhQUFhLENBQUM7NEJBQ3hCLEtBQUssRUFBRSxRQUFROzRCQUNmLEdBQUcsRUFBRSxNQUFNO3lCQUNaLENBQUMsQ0FBQzt3QkFDSCxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7cUJBQ3ZCO2dCQUNILENBQUMsQ0FBQzthQUNIO1lBRUQsMEJBQTBCO1lBQzFCLGFBQWEsRUFBRSxDQUFDO1lBRWhCLHFEQUFxRDtZQUNyRCxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFDLEVBQUU7Z0JBQzNCLFdBQVcsQ0FBQyxXQUFXLENBQUMsS0FBSyxHQUFHLEtBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMxRixXQUFXLENBQUMsV0FBVyxDQUFDLEdBQUcsR0FBRyxLQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdEYsMEdBQTBHO2dCQUMxRyxhQUFhLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ3RFLE9BQU8sV0FBVyxDQUFDLFdBQVcsQ0FBQztZQUNqQyxDQUFDLENBQUMsQ0FBQztZQUVILHFEQUFxRDtZQUNyRCxXQUFXLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFDLEtBQUs7Z0JBQ2pDLElBQUksRUFBRSxHQUFHO29CQUNQLEtBQUssRUFBRSxLQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDO29CQUNoRixHQUFHLEVBQUUsS0FBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQztpQkFDN0UsQ0FBQztnQkFDRixxREFBcUQ7Z0JBQ3JELE9BQU8sRUFBRSxDQUFDO1lBQ1osQ0FBQyxDQUFDLENBQUM7WUFFSCxXQUFXLENBQUMsT0FBTyxHQUFHO2dCQUNwQixJQUFJLEVBQUUsR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFDO2dCQUNoQyxJQUFJLEdBQUcsR0FBRztvQkFDUixJQUFJLEVBQUUsRUFBRSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsR0FBRyxHQUFHO29CQUN6QyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsR0FBRyxHQUFHO2lCQUN0RCxDQUFDO2dCQUVGLG1EQUFtRDtnQkFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuQixDQUFDLENBQUM7WUFFRixLQUFLLENBQUMsR0FBRyxDQUFDLDhCQUE4QixFQUFFO2dCQUN4QyxpRkFBaUY7Z0JBQ2pGLEtBQUssQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEQsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUE7SUFoTUQsQ0FBQztJQWtNTSwyQkFBTyxHQUFkO1FBQ0UsSUFBSSxTQUFTLEdBQUcsVUFBQyxXQUFXLElBQUssT0FBQSxJQUFJLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxFQUFwQyxDQUFvQyxDQUFDO1FBRXRFLFNBQVMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1FBRW5ELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7SUE3TU0seUJBQUssR0FBRyxZQUFZLENBQUM7SUE4TTlCLDBCQUFDO0NBL01ELEFBK01DLElBQUE7QUFFRCxPQUFPO0tBQ0osTUFBTSxDQUFDLGlCQUFpQixDQUFDO0tBQ3pCLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsbUJBQW1CLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyIsImZpbGUiOiJuZy13ZWVrbHktc2NoZWR1bGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZGVjbGFyZSB2YXIgbW9tZW50O1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2RlbW9BcHAnLCBbJ25nQW5pbWF0ZScsICd3ZWVrbHlTY2hlZHVsZXInLCAnd2Vla2x5U2NoZWR1bGVySTE4TiddKVxyXG5cclxuICAuY29uZmlnKFsnd2Vla2x5U2NoZWR1bGVyTG9jYWxlU2VydmljZVByb3ZpZGVyJywgZnVuY3Rpb24gKGxvY2FsZVNlcnZpY2VQcm92aWRlcikge1xyXG4gICAgbG9jYWxlU2VydmljZVByb3ZpZGVyLmNvbmZpZ3VyZSh7XHJcbiAgICAgIGRveXM6IHsgJ2VzLWVzJzogNCB9LFxyXG4gICAgICBsYW5nOiB7ICdlcy1lcyc6IHsgd2Vla05iOiAnbsO6bWVybyBkZSBsYSBzZW1hbmEnLCBhZGROZXc6ICdBw7FhZGlyJyB9IH0sXHJcbiAgICAgIGxvY2FsZUxvY2F0aW9uUGF0dGVybjogJy9hbmd1bGFyLWxvY2FsZV97e2xvY2FsZX19LmpzJ1xyXG4gICAgfSk7XHJcbiAgfV0pXHJcblxyXG4gIC5jb250cm9sbGVyKCdEZW1vQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyR0aW1lb3V0JywgJ3dlZWtseVNjaGVkdWxlckxvY2FsZVNlcnZpY2UnLCAnJGxvZycsXHJcbiAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdGltZW91dCwgbG9jYWxlU2VydmljZSwgJGxvZykge1xyXG5cclxuICAgICAgJHNjb3BlLm1vZGVsID0ge1xyXG4gICAgICAgIGxvY2FsZTogbG9jYWxlU2VydmljZS4kbG9jYWxlLmlkLFxyXG4gICAgICAgIG9wdGlvbnM6IHsvKm1vbm9TY2hlZHVsZTogdHJ1ZSovIH0sXHJcbiAgICAgICAgaXRlbXM6IFt7XHJcbiAgICAgICAgICBsYWJlbDogJ0l0ZW0gMScsXHJcbiAgICAgICAgICBlZGl0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICBzY2hlZHVsZXM6IFtcclxuICAgICAgICAgICAgeyBzdGFydDogbW9tZW50KCcyMDE1LTEyLTI3JykudG9EYXRlKCksIGVuZDogbW9tZW50KCcyMDE2LTAxLTAyJykudG9EYXRlKCkgfVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgbGFiZWw6ICdJdGVtIDInLFxyXG4gICAgICAgICAgc2NoZWR1bGVzOiBbXHJcbiAgICAgICAgICAgIHsgc3RhcnQ6IG1vbWVudCgnMjAxNS0xMi0yNScpLnRvRGF0ZSgpLCBlbmQ6IG1vbWVudCgnMjAxNi0wMS0wMScpLnRvRGF0ZSgpIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICBsYWJlbDogJ0l0ZW0gMycsXHJcbiAgICAgICAgICBzY2hlZHVsZXM6IFtcclxuICAgICAgICAgICAgeyBzdGFydDogbW9tZW50KCcyMDE1LTEyLTI2JykudG9EYXRlKCksIGVuZDogbW9tZW50KCcyMDE1LTEyLTMxJykudG9EYXRlKCkgfVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH1dXHJcbiAgICAgIH07XHJcblxyXG4gICAgICB0aGlzLmRvU29tZXRoaW5nID0gZnVuY3Rpb24gKGl0ZW1JbmRleCwgc2NoZWR1bGVJbmRleCwgc2NoZWR1bGVWYWx1ZSkge1xyXG4gICAgICAgICRsb2cuZGVidWcoJ1RoZSBtb2RlbCBoYXMgY2hhbmdlZCEnLCBpdGVtSW5kZXgsIHNjaGVkdWxlSW5kZXgsIHNjaGVkdWxlVmFsdWUpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgdGhpcy5vbkxvY2FsZUNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkbG9nLmRlYnVnKCdUaGUgbG9jYWxlIGlzIGNoYW5naW5nIHRvJywgJHNjb3BlLm1vZGVsLmxvY2FsZSk7XHJcbiAgICAgICAgbG9jYWxlU2VydmljZS5zZXQoJHNjb3BlLm1vZGVsLmxvY2FsZSkudGhlbihmdW5jdGlvbiAoJGxvY2FsZSkge1xyXG4gICAgICAgICAgJGxvZy5kZWJ1ZygnVGhlIGxvY2FsZSBjaGFuZ2VkIHRvJywgJGxvY2FsZS5pZCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH07XHJcbiAgICB9XSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCd3ZWVrbHlTY2hlZHVsZXInLCBbJ25nV2Vla2x5U2NoZWR1bGVyVGVtcGxhdGVzJ10pO1xyXG5cclxudmFyIEdSSURfVEVNUExBVEUgPSBhbmd1bGFyLmVsZW1lbnQoJzxkaXYgY2xhc3M9XCJncmlkLWl0ZW1cIj48L2Rpdj4nKTtcclxudmFyIENMSUNLX09OX0FfQ0VMTCA9ICdjbGlja09uQUNlbGwnO1xyXG5cclxudmFyIGlzQ3RybDtcclxuXHJcbmZ1bmN0aW9uIGN0cmxDaGVjayhlKSB7XHJcbiAgaWYgKGUud2hpY2ggPT09IDE3KSB7XHJcbiAgICBpc0N0cmwgPSBlLnR5cGUgPT09ICdrZXlkb3duJztcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdXNlU2Nyb2xsKGVsLCBkZWx0YSkge1xyXG5cclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGN0cmxDaGVjayk7XHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgY3RybENoZWNrKTtcclxuXHJcbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgIGlmIChpc0N0cmwpIHtcclxuICAgICAgdmFyIHN0eWxlID0gZWwuZmlyc3RDaGlsZC5zdHlsZSwgY3VycmVudFdpZHRoID0gcGFyc2VJbnQoc3R5bGUud2lkdGgpO1xyXG4gICAgICBpZiAoKGUud2hlZWxEZWx0YSB8fCBlLmRldGFpbCkgPiAwKSB7XHJcbiAgICAgICAgc3R5bGUud2lkdGggPSAoY3VycmVudFdpZHRoICsgMiAqIGRlbHRhKSArICclJztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgd2lkdGggPSBjdXJyZW50V2lkdGggLSAyICogZGVsdGE7XHJcbiAgICAgICAgc3R5bGUud2lkdGggPSAod2lkdGggPiAxMDAgPyB3aWR0aCA6IDEwMCkgKyAnJSc7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICgoZS53aGVlbERlbHRhIHx8IGUuZGV0YWlsKSA+IDApIHtcclxuICAgICAgICBlbC5zY3JvbGxMZWZ0IC09IGRlbHRhO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsLnNjcm9sbExlZnQgKz0gZGVsdGE7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gem9vbUluQUNlbGwoZWwsIGV2ZW50LCBkYXRhKSB7XHJcblxyXG4gIHZhciBuYkVsZW1lbnRzID0gZGF0YS5uYkVsZW1lbnRzO1xyXG4gIHZhciBpZHggPSBkYXRhLmlkeDtcclxuICAvLyBwZXJjZW50V2lkdGhGcm9tQmVnaW5uaW5nIGlzIHVzZWQgd2hlbiB0aGUgZmlyc3QgZWxlbWVudCBvZiB0aGUgZ3JpZCBpcyBub3QgZnVsbFxyXG4gIC8vIEZvciBpbnN0YW5jZSwgaW4gdGhlIGV4YW1wbGUgYmVsb3cgYGZlYiAxN2AgaXMgbm90IGZ1bGxcclxuICAvLyBmZWIgMTcgICAgICAgICAgbWFyY2ggMTdcclxuICAvLyAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAgdmFyIHBlcmNlbnRXaWR0aEZyb21CZWdpbm5pbmcgPSBkYXRhLnBlcmNlbnRXaWR0aEZyb21CZWdpbm5pbmc7XHJcblxyXG4gIHZhciBjb250YWluZXJXaWR0aCA9IGVsLm9mZnNldFdpZHRoO1xyXG5cclxuICAvLyBsZWF2ZSAoMS8zKSBlYWNoIHNpZGVcclxuICAvLyAxLzMgfCAgICAzLzMgICB8IDEvM1xyXG4gIHZhciBib3hXaWR0aCA9IGNvbnRhaW5lcldpZHRoIC8gKDUgLyAzKTtcclxuICB2YXIgZ3V0dGVyU2l6ZSA9IGJveFdpZHRoIC8gMztcclxuXHJcbiAgdmFyIHNjaGVkdWxlQXJlYVdpZHRoUHggPSBuYkVsZW1lbnRzICogYm94V2lkdGg7XHJcbiAgdmFyIHNjaGVkdWxlQXJlYVdpZHRoUGVyY2VudCA9IChzY2hlZHVsZUFyZWFXaWR0aFB4IC8gY29udGFpbmVyV2lkdGgpICogMTAwO1xyXG5cclxuICBlbC5maXJzdENoaWxkLnN0eWxlLndpZHRoID0gc2NoZWR1bGVBcmVhV2lkdGhQZXJjZW50ICsgJyUnO1xyXG5cclxuICBpZiAocGVyY2VudFdpZHRoRnJvbUJlZ2lubmluZyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBBbGwgY2VsbHMgb2YgYSBsaW5lIGhhdmUgdGhlIHNhbWUgc2l6ZVxyXG4gICAgZWwuc2Nyb2xsTGVmdCA9IGlkeCAqIGJveFdpZHRoIC0gZ3V0dGVyU2l6ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gU2l6ZXMgb2YgY2VsbHMgaW4gYSBsaW5lIGNvdWxkIGRpZmZlcmVudCAoZXNwZWNpYWxseSB0aGUgZmlyc3Qgb25lKVxyXG4gICAgZWwuc2Nyb2xsTGVmdCA9IHNjaGVkdWxlQXJlYVdpZHRoUHggKiAocGVyY2VudFdpZHRoRnJvbUJlZ2lubmluZyAvIDEwMCkgLSBndXR0ZXJTaXplO1xyXG4gIH1cclxufVxyXG4iLCJjbGFzcyBIYW5kbGVEaXJlY3RpdmUgaW1wbGVtZW50cyBhbmd1bGFyLklEaXJlY3RpdmUge1xyXG4gIHN0YXRpYyAkbmFtZSA9ICdoYW5kbGUnO1xyXG4gIHJlc3RyaWN0ID0gJ0EnO1xyXG5cclxuICBzY29wZSA9IHtcclxuICAgIG9uZHJhZzogJz0nLFxyXG4gICAgb25kcmFnc3RvcDogJz0nLFxyXG4gICAgb25kcmFnc3RhcnQ6ICc9J1xyXG4gIH07XHJcblxyXG4gIGxpbmsgPSAoc2NvcGUsIGVsZW1lbnQ6IGFuZ3VsYXIuSUF1Z21lbnRlZEpRdWVyeSkgPT4ge1xyXG4gICAgdmFyICRkb2N1bWVudCA9IHRoaXMuJGRvY3VtZW50O1xyXG4gICAgdmFyIHggPSAwO1xyXG4gICAgXHJcbiAgICBlbGVtZW50Lm9uKCdtb3VzZWRvd24nLCAoZXZlbnQpID0+IHtcclxuICAgICAgLy8gUHJldmVudCBkZWZhdWx0IGRyYWdnaW5nIG9mIHNlbGVjdGVkIGNvbnRlbnRcclxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgIHggPSBldmVudC5wYWdlWDtcclxuXHJcbiAgICAgICRkb2N1bWVudC5vbignbW91c2Vtb3ZlJywgbW91c2Vtb3ZlKTtcclxuICAgICAgJGRvY3VtZW50Lm9uKCdtb3VzZXVwJywgbW91c2V1cCk7XHJcblxyXG4gICAgICBpZiAoc2NvcGUub25kcmFnc3RhcnQpIHtcclxuICAgICAgICBzY29wZS5vbmRyYWdzdGFydCgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBtb3VzZW1vdmUoZXZlbnQpIHtcclxuICAgICAgdmFyIGRlbHRhID0gZXZlbnQucGFnZVggLSB4O1xyXG4gICAgICBpZiAoc2NvcGUub25kcmFnKSB7XHJcbiAgICAgICAgc2NvcGUub25kcmFnKGRlbHRhKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG1vdXNldXAoKSB7XHJcbiAgICAgICRkb2N1bWVudC51bmJpbmQoJ21vdXNlbW92ZScsIG1vdXNlbW92ZSk7XHJcbiAgICAgICRkb2N1bWVudC51bmJpbmQoJ21vdXNldXAnLCBtb3VzZXVwKTtcclxuXHJcbiAgICAgIGlmIChzY29wZS5vbmRyYWdzdG9wKSB7XHJcbiAgICAgICAgc2NvcGUub25kcmFnc3RvcCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgJGRvY3VtZW50OiBhbmd1bGFyLklEb2N1bWVudFNlcnZpY2VcclxuICApIHtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBGYWN0b3J5KCkge1xyXG4gICAgbGV0IGRpcmVjdGl2ZSA9ICgkZG9jdW1lbnQpID0+IG5ldyBIYW5kbGVEaXJlY3RpdmUoJGRvY3VtZW50KTtcclxuXHJcbiAgICBkaXJlY3RpdmUuJGluamVjdCA9IFsnJGRvY3VtZW50J107XHJcblxyXG4gICAgcmV0dXJuIGRpcmVjdGl2ZTtcclxuICB9XHJcbn1cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd3ZWVrbHlTY2hlZHVsZXInKVxyXG4gIC5kaXJlY3RpdmUoSGFuZGxlRGlyZWN0aXZlLiRuYW1lLCBIYW5kbGVEaXJlY3RpdmUuRmFjdG9yeSgpKTtcclxuIiwiY2xhc3MgSW5qZWN0RGlyZWN0aXZlIGltcGxlbWVudHMgYW5ndWxhci5JRGlyZWN0aXZlIHtcclxuICBzdGF0aWMgJG5hbWUgPSAnaW5qZWN0JztcclxuXHJcbiAgbGluayA9ICgkc2NvcGU6IGFuZ3VsYXIuSVNjb3BlLCAkZWxlbWVudDogYW5ndWxhci5JQXVnbWVudGVkSlF1ZXJ5LCAkYXR0cnM6IGFuZ3VsYXIuSUF0dHJpYnV0ZXMsIGNvbnRyb2xsZXIsICR0cmFuc2NsdWRlOiBhbmd1bGFyLklUcmFuc2NsdWRlRnVuY3Rpb24pID0+IHtcclxuICAgIGlmICghJHRyYW5zY2x1ZGUpIHtcclxuICAgICAgdGhyb3cgJ0lsbGVnYWwgdXNlIG9mIG5nVHJhbnNjbHVkZSBkaXJlY3RpdmUgaW4gdGhlIHRlbXBsYXRlISBObyBwYXJlbnQgZGlyZWN0aXZlIHRoYXQgcmVxdWlyZXMgYSB0cmFuc2NsdXNpb24gZm91bmQuJztcclxuICAgIH1cclxuXHJcbiAgICB2YXIgaW5uZXJTY29wZSA9ICRzY29wZS4kbmV3KCk7XHJcblxyXG4gICAgJHRyYW5zY2x1ZGUoaW5uZXJTY29wZSwgZnVuY3Rpb24gKGNsb25lKSB7XHJcbiAgICAgICRlbGVtZW50LmVtcHR5KCk7XHJcbiAgICAgICRlbGVtZW50LmFwcGVuZChjbG9uZSk7XHJcbiAgICAgICRlbGVtZW50Lm9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpbm5lclNjb3BlLiRkZXN0cm95KCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgRmFjdG9yeSgpIHtcclxuICAgIGxldCBkaXJlY3RpdmUgPSAoKSA9PiBuZXcgSW5qZWN0RGlyZWN0aXZlKCk7XHJcbiAgICBcclxuICAgIHJldHVybiBkaXJlY3RpdmU7XHJcbiAgfVxyXG59XHJcblxyXG5hbmd1bGFyXHJcbiAgLm1vZHVsZSgnd2Vla2x5U2NoZWR1bGVyJylcclxuICAuZGlyZWN0aXZlKEluamVjdERpcmVjdGl2ZS4kbmFtZSwgSW5qZWN0RGlyZWN0aXZlLkZhY3RvcnkoKSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCd3ZWVrbHlTY2hlZHVsZXJJMThOJywgWyd0bWguZHluYW1pY0xvY2FsZSddKTtcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCd3ZWVrbHlTY2hlZHVsZXJJMThOJylcclxuICAucHJvdmlkZXIoJ3dlZWtseVNjaGVkdWxlckxvY2FsZVNlcnZpY2UnLCBbJ3RtaER5bmFtaWNMb2NhbGVQcm92aWRlcicsIGZ1bmN0aW9uICh0bWhEeW5hbWljTG9jYWxlUHJvdmlkZXIpIHtcclxuXHJcbiAgICB2YXIgZGVmYXVsdENvbmZpZzogYW55IC8qIFRPRE8gdHlwZSAqLyA9IHtcclxuICAgICAgZG95czogeydkZS1kZSc6IDQsICdlbi1nYic6IDQsICdlbi11cyc6IDYsICdmci1mcic6IDR9LFxyXG4gICAgICBsYW5nOiB7XHJcbiAgICAgICAgJ2RlLWRlJzoge3dlZWtOYjogJ1dvY2hlbnVtbWVyJywgYWRkTmV3OiAnSGluenVmw7xnZW4nfSxcclxuICAgICAgICAnZW4tZ2InOiB7d2Vla05iOiAnV2VlayAjJywgYWRkTmV3OiAnQWRkJ30sXHJcbiAgICAgICAgJ2VuLXVzJzoge3dlZWtOYjogJ1dlZWsgIycsIGFkZE5ldzogJ0FkZCd9LFxyXG4gICAgICAgICdmci1mcic6IHt3ZWVrTmI6ICdOwrAgZGUgc2VtYWluZScsIGFkZE5ldzogJ0Fqb3V0ZXInfVxyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuY29uZmlndXJlID0gZnVuY3Rpb24gKGNvbmZpZykge1xyXG5cclxuICAgICAgaWYgKGNvbmZpZyAmJiBhbmd1bGFyLmlzT2JqZWN0KGNvbmZpZykpIHtcclxuICAgICAgICBhbmd1bGFyLm1lcmdlKGRlZmF1bHRDb25maWcsIGNvbmZpZyk7XHJcblxyXG4gICAgICAgIGlmIChkZWZhdWx0Q29uZmlnLmxvY2FsZUxvY2F0aW9uUGF0dGVybikge1xyXG4gICAgICAgICAgdG1oRHluYW1pY0xvY2FsZVByb3ZpZGVyLmxvY2FsZUxvY2F0aW9uUGF0dGVybihkZWZhdWx0Q29uZmlnLmxvY2FsZUxvY2F0aW9uUGF0dGVybik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuJGdldCA9IFsnJHJvb3RTY29wZScsICckbG9jYWxlJywgJ3RtaER5bmFtaWNMb2NhbGUnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJGxvY2FsZSwgdG1oRHluYW1pY0xvY2FsZSkge1xyXG5cclxuICAgICAgdmFyIG1vbWVudExvY2FsZUNhY2hlID0ge307XHJcblxyXG4gICAgICBmdW5jdGlvbiBnZXRMYW5nKCkge1xyXG4gICAgICAgIHZhciBrZXkgPSAkbG9jYWxlLmlkO1xyXG4gICAgICAgIGlmICghbW9tZW50TG9jYWxlQ2FjaGVba2V5XSkge1xyXG4gICAgICAgICAgbW9tZW50TG9jYWxlQ2FjaGVba2V5XSA9IGdldE1vbWVudExvY2FsZShrZXkpO1xyXG4gICAgICAgICAgbW9tZW50LmxvY2FsZShtb21lbnRMb2NhbGVDYWNoZVtrZXldLmlkLCBtb21lbnRMb2NhbGVDYWNoZVtrZXldLmxvY2FsZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG1vbWVudC5sb2NhbGUobW9tZW50TG9jYWxlQ2FjaGVba2V5XS5pZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkZWZhdWx0Q29uZmlnLmxhbmdba2V5XTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gV2UganVzdCBuZWVkIGZldyBtb21lbnQgbG9jYWwgaW5mb3JtYXRpb25cclxuICAgICAgZnVuY3Rpb24gZ2V0TW9tZW50TG9jYWxlKGtleSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBpZDoga2V5LFxyXG4gICAgICAgICAgbG9jYWxlOiB7XHJcbiAgICAgICAgICAgIHdlZWs6IHtcclxuICAgICAgICAgICAgICAvLyBBbmd1bGFyIG1vbmRheSA9IDAgd2hlcmVhcyBNb21lbnQgbW9uZGF5ID0gMVxyXG4gICAgICAgICAgICAgIGRvdzogKCRsb2NhbGUuREFURVRJTUVfRk9STUFUUy5GSVJTVERBWU9GV0VFSyArIDEpICUgNyxcclxuICAgICAgICAgICAgICBkb3k6IGRlZmF1bHRDb25maWcuZG95c1trZXldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAkcm9vdFNjb3BlLiRvbignJGxvY2FsZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCd3ZWVrbHlTY2hlZHVsZXJMb2NhbGVDaGFuZ2VkJywgZ2V0TGFuZygpKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgICRsb2NhbGU6ICRsb2NhbGUsXHJcbiAgICAgICAgZ2V0TGFuZzogZ2V0TGFuZyxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgIHJldHVybiB0bWhEeW5hbWljTG9jYWxlLnNldChrZXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgIH1dO1xyXG4gIH1dKTsiLCJjbGFzcyBNdWx0aVNsaWRlckRpcmVjdGl2ZSBpbXBsZW1lbnRzIGFuZ3VsYXIuSURpcmVjdGl2ZSB7XHJcbiAgc3RhdGljICRuYW1lID0gJ211bHRpU2xpZGVyJztcclxuXHJcbiAgcmVzdHJpY3QgPSAnRSc7XHJcbiAgcmVxdWlyZSA9ICded2Vla2x5U2NoZWR1bGVyJztcclxuICB0ZW1wbGF0ZVVybCA9ICduZy13ZWVrbHktc2NoZWR1bGVyL211bHRpc2xpZGVyL211bHRpc2xpZGVyLmh0bWwnO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgdGltZVNlcnZpY2VcclxuICApIHtcclxuICB9XHJcblxyXG4gIGxpbmsgPSAoc2NvcGUsIGVsZW1lbnQ6IGFuZ3VsYXIuSUF1Z21lbnRlZEpRdWVyeSwgYXR0cnM6IGFuZ3VsYXIuSUF0dHJpYnV0ZXMsIHNjaGVkdWxlckN0cmwpID0+IHtcclxuICAgIHZhciBjb25mID0gc2NoZWR1bGVyQ3RybC5jb25maWc7XHJcblxyXG4gICAgLy8gVGhlIGRlZmF1bHQgc2NoZWR1bGVyIGJsb2NrIHNpemUgd2hlbiBhZGRpbmcgYSBuZXcgaXRlbVxyXG4gICAgdmFyIGRlZmF1bHROZXdTY2hlZHVsZVNpemUgPSBwYXJzZUludChhdHRycy5zaXplKSB8fCA4O1xyXG5cclxuICAgIHZhciB2YWxUb1BpeGVsID0gZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICB2YXIgcGVyY2VudCA9IHZhbCAvIChjb25mLm5iV2Vla3MpO1xyXG4gICAgICByZXR1cm4gTWF0aC5mbG9vcihwZXJjZW50ICogZWxlbWVudFswXS5jbGllbnRXaWR0aCArIDAuNSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBwaXhlbFRvVmFsID0gZnVuY3Rpb24gKHBpeGVsKSB7XHJcbiAgICAgIHZhciBwZXJjZW50ID0gcGl4ZWwgLyBlbGVtZW50WzBdLmNsaWVudFdpZHRoO1xyXG4gICAgICByZXR1cm4gTWF0aC5mbG9vcihwZXJjZW50ICogKGNvbmYubmJXZWVrcykgKyAwLjUpO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgYWRkU2xvdCA9IChzdGFydCwgZW5kKSA9PiB7XHJcbiAgICAgIHN0YXJ0ID0gc3RhcnQgPj0gMCA/IHN0YXJ0IDogMDtcclxuICAgICAgZW5kID0gZW5kIDw9IGNvbmYubmJXZWVrcyA/IGVuZCA6IGNvbmYubmJXZWVrcztcclxuXHJcbiAgICAgIHZhciBzdGFydERhdGUgPSB0aGlzLnRpbWVTZXJ2aWNlLmFkZFdlZWsoY29uZi5taW5EYXRlLCBzdGFydCk7XHJcbiAgICAgIHZhciBlbmREYXRlID0gdGhpcy50aW1lU2VydmljZS5hZGRXZWVrKGNvbmYubWluRGF0ZSwgZW5kKTtcclxuXHJcbiAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGl0ZW0gPSBzY29wZS5pdGVtO1xyXG4gICAgICAgIGlmICghaXRlbS5zY2hlZHVsZXMpIHtcclxuICAgICAgICAgIGl0ZW0uc2NoZWR1bGVzID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGl0ZW0uc2NoZWR1bGVzLnB1c2goe3N0YXJ0OiBzdGFydERhdGUudG9EYXRlKCksIGVuZDogZW5kRGF0ZS50b0RhdGUoKX0pO1xyXG4gICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGhvdmVyRWxlbWVudCA9IGFuZ3VsYXIuZWxlbWVudChlbGVtZW50LmZpbmQoJ2RpdicpWzBdKTtcclxuICAgIHZhciBob3ZlckVsZW1lbnRXaWR0aCA9IHZhbFRvUGl4ZWwoZGVmYXVsdE5ld1NjaGVkdWxlU2l6ZSk7XHJcblxyXG4gICAgaG92ZXJFbGVtZW50LmNzcyh7XHJcbiAgICAgIHdpZHRoOiBob3ZlckVsZW1lbnRXaWR0aCArICdweCdcclxuICAgIH0pO1xyXG5cclxuICAgIGVsZW1lbnQub24oJ21vdXNlbW92ZScsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgIHZhciBlbE9mZlggPSBlbGVtZW50WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQ7XHJcblxyXG4gICAgICBob3ZlckVsZW1lbnQuY3NzKHtcclxuICAgICAgICBsZWZ0OiBlLnBhZ2VYIC0gZWxPZmZYIC0gaG92ZXJFbGVtZW50V2lkdGggLyAyICsgJ3B4J1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGhvdmVyRWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgaWYgKCFlbGVtZW50LmF0dHIoJ25vLWFkZCcpKSB7XHJcbiAgICAgICAgdmFyIGVsT2ZmWCA9IGVsZW1lbnRbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdDtcclxuICAgICAgICB2YXIgcGl4ZWxPbkNsaWNrID0gZXZlbnQucGFnZVggLSBlbE9mZlg7XHJcbiAgICAgICAgdmFyIHZhbE9uQ2xpY2sgPSBwaXhlbFRvVmFsKHBpeGVsT25DbGljayk7XHJcblxyXG4gICAgICAgIHZhciBzdGFydCA9IE1hdGgucm91bmQodmFsT25DbGljayAtIGRlZmF1bHROZXdTY2hlZHVsZVNpemUgLyAyKTtcclxuICAgICAgICB2YXIgZW5kID0gc3RhcnQgKyBkZWZhdWx0TmV3U2NoZWR1bGVTaXplO1xyXG5cclxuICAgICAgICBhZGRTbG90KHN0YXJ0LCBlbmQpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBGYWN0b3J5KCkge1xyXG4gICAgbGV0IGRpcmVjdGl2ZSA9ICh0aW1lU2VydmljZSkgPT4gbmV3IE11bHRpU2xpZGVyRGlyZWN0aXZlKHRpbWVTZXJ2aWNlKTtcclxuXHJcbiAgICBkaXJlY3RpdmUuJGluamVjdCA9IFtcclxuICAgICAgJ3dlZWtseVNjaGVkdWxlclRpbWVTZXJ2aWNlJ1xyXG4gICAgXTtcclxuXHJcbiAgICByZXR1cm4gZGlyZWN0aXZlO1xyXG4gIH1cclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3dlZWtseVNjaGVkdWxlcicpXHJcbiAgLmRpcmVjdGl2ZShNdWx0aVNsaWRlckRpcmVjdGl2ZS4kbmFtZSwgTXVsdGlTbGlkZXJEaXJlY3RpdmUuRmFjdG9yeSgpKTtcclxuIiwiY2xhc3MgV2Vla2x5U2NoZWR1bGVyVGltZVNlcnZpY2Uge1xyXG4gIHN0YXRpYyAkbmFtZSA9ICd3ZWVrbHlTY2hlZHVsZXJUaW1lU2VydmljZSc7XHJcblxyXG4gIHByaXZhdGUgV0VFSyA9ICd3ZWVrJztcclxuXHJcbiAgcHVibGljIGFkZFdlZWsobW9tZW50LCBuYldlZWspIHtcclxuICAgIHJldHVybiBtb21lbnQuY2xvbmUoKS5hZGQobmJXZWVrLCB0aGlzLldFRUspO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGNvbXBhcmUoZGF0ZSwgbWV0aG9kLCBsYXN0TWluKSB7XHJcbiAgICBpZiAoZGF0ZSkge1xyXG4gICAgICB2YXIgZGF0ZUFzTW9tZW50O1xyXG4gICAgICBpZiAoYW5ndWxhci5pc0RhdGUoZGF0ZSkpIHtcclxuICAgICAgICBkYXRlQXNNb21lbnQgPSBtb21lbnQoZGF0ZSk7XHJcbiAgICAgIH0gZWxzZSBpZiAoZGF0ZS5faXNBTW9tZW50T2JqZWN0KSB7XHJcbiAgICAgICAgZGF0ZUFzTW9tZW50ID0gZGF0ZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyAnQ291bGQgbm90IHBhcnNlIGRhdGUgWycgKyBkYXRlICsgJ10nO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBkYXRlQXNNb21lbnRbbWV0aG9kXShsYXN0TWluKSA/IGRhdGVBc01vbWVudCA6IGxhc3RNaW47XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgd2Vla1ByZWNpc2VEaWZmKHN0YXJ0LCBlbmQpIHtcclxuICAgIHJldHVybiBlbmQuY2xvbmUoKS5kaWZmKHN0YXJ0LmNsb25lKCksIHRoaXMuV0VFSywgdHJ1ZSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgd2Vla0RpZmYoc3RhcnQsIGVuZCkge1xyXG4gICAgcmV0dXJuIGVuZC5jbG9uZSgpLmVuZE9mKHRoaXMuV0VFSykuZGlmZihzdGFydC5jbG9uZSgpLnN0YXJ0T2YodGhpcy5XRUVLKSwgdGhpcy5XRUVLKSArIDE7XHJcbiAgfVxyXG59XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnd2Vla2x5U2NoZWR1bGVyJylcclxuICAuc2VydmljZShXZWVrbHlTY2hlZHVsZXJUaW1lU2VydmljZS4kbmFtZSwgV2Vla2x5U2NoZWR1bGVyVGltZVNlcnZpY2UpO1xyXG4iLCIvKiBnbG9iYWwgR1JJRF9URU1QTEFURSwgQ0xJQ0tfT05fQV9DRUxMICovXHJcbmFuZ3VsYXIubW9kdWxlKCd3ZWVrbHlTY2hlZHVsZXInKVxyXG4gIC5kaXJlY3RpdmUoJ3dlZWtseUdyaWQnLCBbZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIGZ1bmN0aW9uIGhhbmRsZUNsaWNrRXZlbnQoY2hpbGQsIG5iV2Vla3MsIGlkeCwgc2NvcGUpIHtcclxuICAgICAgY2hpbGQuYmluZCgnY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgc2NvcGUuJGJyb2FkY2FzdChDTElDS19PTl9BX0NFTEwsIHtcclxuICAgICAgICAgIG5iRWxlbWVudHM6IG5iV2Vla3MsXHJcbiAgICAgICAgICBpZHg6IGlkeFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkb0dyaWQoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBtb2RlbCkge1xyXG4gICAgICB2YXIgaTtcclxuICAgICAgLy8gQ2FsY3VsYXRlIHdlZWsgd2lkdGggZGlzdHJpYnV0aW9uXHJcbiAgICAgIHZhciB0aWNrY291bnQgPSBtb2RlbC5uYldlZWtzO1xyXG4gICAgICB2YXIgdGlja3NpemUgPSAxMDAgLyB0aWNrY291bnQ7XHJcbiAgICAgIHZhciBncmlkSXRlbUVsID0gR1JJRF9URU1QTEFURS5jc3Moe3dpZHRoOiB0aWNrc2l6ZSArICclJ30pO1xyXG4gICAgICB2YXIgbm93ID0gbW9kZWwubWluRGF0ZS5jbG9uZSgpLnN0YXJ0T2YoJ3dlZWsnKTtcclxuXHJcbiAgICAgIC8vIENsZWFuIGVsZW1lbnRcclxuICAgICAgZWxlbWVudC5lbXB0eSgpO1xyXG5cclxuICAgICAgZm9yIChpID0gMDsgaSA8IHRpY2tjb3VudDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIGNoaWxkID0gZ3JpZEl0ZW1FbC5jbG9uZSgpO1xyXG4gICAgICAgIGlmIChhbmd1bGFyLmlzVW5kZWZpbmVkKGF0dHJzLm5vVGV4dCkpIHtcclxuICAgICAgICAgIGhhbmRsZUNsaWNrRXZlbnQoY2hpbGQsIHRpY2tjb3VudCwgaSwgc2NvcGUpO1xyXG4gICAgICAgICAgY2hpbGQudGV4dChub3cuYWRkKGkgJiYgMSwgJ3dlZWsnKS53ZWVrKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbGVtZW50LmFwcGVuZChjaGlsZCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgcmVxdWlyZTogJ153ZWVrbHlTY2hlZHVsZXInLFxyXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBzY2hlZHVsZXJDdHJsOiBXZWVrbHlTY2hlZHVsZXJDb250cm9sbGVyKSB7XHJcbiAgICAgICAgaWYgKHNjaGVkdWxlckN0cmwuY29uZmlnKSB7XHJcbiAgICAgICAgICBkb0dyaWQoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBzY2hlZHVsZXJDdHJsLmNvbmZpZyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNjaGVkdWxlckN0cmwuJG1vZGVsQ2hhbmdlTGlzdGVuZXJzLnB1c2goZnVuY3Rpb24gKG5ld01vZGVsKSB7XHJcbiAgICAgICAgICBkb0dyaWQoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBuZXdNb2RlbCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfV0pO1xyXG4iLCJjbGFzcyBXZWVrbHlTY2hlZHVsZXJDb250cm9sbGVyIGltcGxlbWVudHMgYW5ndWxhci5JQ29udHJvbGxlciB7XHJcbiAgc3RhdGljICRjb250cm9sbGVyQXMgPSAnc2NoZWR1bGVyQ3RybCc7XHJcbiAgc3RhdGljICRuYW1lID0gJ3dlZWtseVNjaGVkdWxlckNvbnRyb2xsZXInO1xyXG5cclxuICBzdGF0aWMgJGluamVjdCA9IFtcclxuICAgICckaW5qZWN0b3InLFxyXG4gICAgJyRsb2cnXHJcbiAgXTtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlICRpbmplY3RvcjogYW5ndWxhci5hdXRvLklJbmplY3RvclNlcnZpY2UsXHJcbiAgICBwcml2YXRlICRsb2c6IGFuZ3VsYXIuSUxvZ1NlcnZpY2VcclxuICApIHtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBjb25maWc6IGFueTsgLyogVE9ETyB0eXBlICovXHJcbiAgcHVibGljIGl0ZW1zOiBhbnlbXTsgLyogVE9ETyB0eXBlICovXHJcblxyXG4gIHB1YmxpYyBkZWZhdWx0T3B0aW9uczogYW55IC8qIFRPRE8gdHlwZSAqLyA9IHtcclxuICAgIG1vbm9TY2hlZHVsZTogZmFsc2UsXHJcbiAgICBzZWxlY3RvcjogJy5zY2hlZHVsZS1hcmVhLWNvbnRhaW5lcidcclxuICB9O1xyXG5cclxuICBwdWJsaWMgb246IHtcclxuICAgIGNoYW5nZTogKGl0ZW1JbmRleCwgc2NoZWR1bGVJbmRleCwgc2NoZWR1bGVWYWx1ZSkgPT4gRnVuY3Rpb247XHJcbiAgfTtcclxuXHJcbiAgcHVibGljICRtb2RlbENoYW5nZUxpc3RlbmVyczogRnVuY3Rpb25bXTsgLyogVE9ETyB0eXBlICovXHJcblxyXG4gICRvbkluaXQoKSB7XHJcbiAgICAvLyBUcnkgdG8gZ2V0IHRoZSBpMThuIHNlcnZpY2VcclxuICAgIHZhciBuYW1lID0gJ3dlZWtseVNjaGVkdWxlckxvY2FsZVNlcnZpY2UnO1xyXG5cclxuICAgIGlmICh0aGlzLiRpbmplY3Rvci5oYXMobmFtZSkpIHtcclxuICAgICAgdGhpcy4kbG9nLmluZm8oJ1RoZSBJMThOIHNlcnZpY2UgaGFzIHN1Y2Nlc3NmdWxseSBiZWVuIGluaXRpYWxpemVkIScpO1xyXG5cclxuICAgICAgdmFyIGxvY2FsZVNlcnZpY2U6IGFueSA9IHRoaXMuJGluamVjdG9yLmdldChuYW1lKTsgLyogVE9ETyB0eXBlICovXHJcbiAgICAgIHRoaXMuZGVmYXVsdE9wdGlvbnMubGFiZWxzID0gbG9jYWxlU2VydmljZS5nZXRMYW5nKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLiRsb2cuaW5mbygnTm8gSTE4TiBmb3VuZCBmb3IgdGhpcyBtb2R1bGUsIGNoZWNrIHRoZSBuZyBtb2R1bGUgW3dlZWtseVNjaGVkdWxlckkxOE5dIGlmIHlvdSBuZWVkIGkxOG4uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gV2lsbCBoYW5nIG91ciBtb2RlbCBjaGFuZ2UgbGlzdGVuZXJzXHJcbiAgICB0aGlzLiRtb2RlbENoYW5nZUxpc3RlbmVycyA9IFtdO1xyXG4gIH1cclxufVxyXG5cclxuY2xhc3MgV2Vla2x5U2NoZWR1bGVyRGlyZWN0aXZlIGltcGxlbWVudHMgYW5ndWxhci5JRGlyZWN0aXZlIHtcclxuICBzdGF0aWMgJG5hbWUgPSAnd2Vla2x5U2NoZWR1bGVyJztcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlICRsb2c6IGFuZ3VsYXIuSUxvZ1NlcnZpY2UsXHJcbiAgICBwcml2YXRlICRwYXJzZTogYW5ndWxhci5JUGFyc2VTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSB0aW1lU2VydmljZVxyXG4gICkge1xyXG4gIH1cclxuXHJcbiAgcmVzdHJpY3QgPSAnRSc7XHJcbiAgcmVxdWlyZSA9ICd3ZWVrbHlTY2hlZHVsZXInO1xyXG4gIHRyYW5zY2x1ZGUgPSB0cnVlO1xyXG4gIHRlbXBsYXRlVXJsID0gJ25nLXdlZWtseS1zY2hlZHVsZXIvd2Vla2x5LXNjaGVkdWxlci93ZWVrbHktc2NoZWR1bGVyLmh0bWwnO1xyXG4gIGNvbnRyb2xsZXIgPSBXZWVrbHlTY2hlZHVsZXJDb250cm9sbGVyLiRuYW1lO1xyXG4gIGNvbnRyb2xsZXJBcyA9IFdlZWtseVNjaGVkdWxlckNvbnRyb2xsZXIuJGNvbnRyb2xsZXJBcztcclxuXHJcbiAgbGluayA9IChzY29wZSwgZWxlbWVudCwgYXR0cnMsIHNjaGVkdWxlckN0cmw6IFdlZWtseVNjaGVkdWxlckNvbnRyb2xsZXIpID0+IHtcclxuICAgIHZhciBvcHRpb25zRm4gPSB0aGlzLiRwYXJzZShhdHRycy5vcHRpb25zKSxcclxuICAgICAgb3B0aW9ucyA9IGFuZ3VsYXIuZXh0ZW5kKHNjaGVkdWxlckN0cmwuZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnNGbihzY29wZSkgfHwge30pO1xyXG5cclxuICAgIC8vIEdldCB0aGUgc2NoZWR1bGUgY29udGFpbmVyIGVsZW1lbnRcclxuICAgIHZhciBlbCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcihzY2hlZHVsZXJDdHJsLmRlZmF1bHRPcHRpb25zLnNlbGVjdG9yKTtcclxuICAgIHZhciBzZWxmOiBXZWVrbHlTY2hlZHVsZXJEaXJlY3RpdmUgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIG9uTW9kZWxDaGFuZ2UoaXRlbXMpIHtcclxuICAgICAgLy8gQ2hlY2sgaXRlbXMgYXJlIHByZXNlbnRcclxuICAgICAgaWYgKGl0ZW1zKSB7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGl0ZW1zIGFyZSBpbiBhbiBBcnJheVxyXG4gICAgICAgIGlmICghYW5ndWxhci5pc0FycmF5KGl0ZW1zKSkge1xyXG4gICAgICAgICAgdGhyb3cgJ1lvdSBzaG91bGQgdXNlIHdlZWtseS1zY2hlZHVsZXIgZGlyZWN0aXZlIHdpdGggYW4gQXJyYXkgb2YgaXRlbXMnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gS2VlcCB0cmFjayBvZiBvdXIgbW9kZWwgKHVzZSBpdCBpbiB0ZW1wbGF0ZSlcclxuICAgICAgICBzY2hlZHVsZXJDdHJsLml0ZW1zID0gaXRlbXM7XHJcblxyXG4gICAgICAgIC8vIEZpcnN0IGNhbGN1bGF0ZSBjb25maWd1cmF0aW9uXHJcbiAgICAgICAgc2NoZWR1bGVyQ3RybC5jb25maWcgPSBzZWxmLmNvbmZpZyhpdGVtcy5yZWR1Y2UoKHJlc3VsdCwgaXRlbSkgPT4ge1xyXG4gICAgICAgICAgdmFyIHNjaGVkdWxlcyA9IGl0ZW0uc2NoZWR1bGVzO1xyXG5cclxuICAgICAgICAgIHJldHVybiByZXN1bHQuY29uY2F0KHNjaGVkdWxlcyAmJiBzY2hlZHVsZXMubGVuZ3RoID9cclxuICAgICAgICAgICAgLy8gSWYgaW4gbXVsdGlTbGlkZXIgbW9kZSwgZW5zdXJlIGEgc2NoZWR1bGUgYXJyYXkgaXMgcHJlc2VudCBvbiBlYWNoIGl0ZW1cclxuICAgICAgICAgICAgLy8gRWxzZSBvbmx5IHVzZSBmaXJzdCBlbGVtZW50IG9mIHNjaGVkdWxlIGFycmF5XHJcbiAgICAgICAgICAgIChvcHRpb25zLm1vbm9TY2hlZHVsZSA/IGl0ZW0uc2NoZWR1bGVzID0gW3NjaGVkdWxlc1swXV0gOiBzY2hlZHVsZXMpIDpcclxuICAgICAgICAgICAgaXRlbS5zY2hlZHVsZXMgPSBbXVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9LCBbXSksIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvLyBGaW5hbGx5LCBydW4gdGhlIHN1YiBkaXJlY3RpdmVzIGxpc3RlbmVyc1xyXG4gICAgICAgIHNjaGVkdWxlckN0cmwuJG1vZGVsQ2hhbmdlTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24gKGxpc3RlbmVyKSB7XHJcbiAgICAgICAgICBsaXN0ZW5lcihzY2hlZHVsZXJDdHJsLmNvbmZpZyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoZWwpIHtcclxuICAgICAgLy8gSW5zdGFsbCBtb3VzZSBzY3JvbGxpbmcgZXZlbnQgbGlzdGVuZXIgZm9yIEggc2Nyb2xsaW5nXHJcbiAgICAgIG1vdXNlU2Nyb2xsKGVsLCAyMCk7XHJcblxyXG4gICAgICBzY29wZS4kb24oQ0xJQ0tfT05fQV9DRUxMLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xyXG4gICAgICAgIHpvb21JbkFDZWxsKGVsLCBlLCBkYXRhKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBzY2hlZHVsZXJDdHJsLm9uID0ge1xyXG4gICAgICAgIGNoYW5nZTogKGl0ZW1JbmRleCwgc2NoZWR1bGVJbmRleCwgc2NoZWR1bGVWYWx1ZSkgPT4ge1xyXG4gICAgICAgICAgdmFyIG9uQ2hhbmdlRnVuY3Rpb24gPSB0aGlzLiRwYXJzZShhdHRycy5vbkNoYW5nZSkoc2NvcGUpO1xyXG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNGdW5jdGlvbihvbkNoYW5nZUZ1bmN0aW9uKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gb25DaGFuZ2VGdW5jdGlvbihpdGVtSW5kZXgsIHNjaGVkdWxlSW5kZXgsIHNjaGVkdWxlVmFsdWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBXYXRjaCB0aGUgbW9kZWwgaXRlbXNcclxuICAgICAgICovXHJcbiAgICAgIHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oYXR0cnMuaXRlbXMsIG9uTW9kZWxDaGFuZ2UpO1xyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIExpc3RlbiB0byAkbG9jYWxlIGNoYW5nZSAoYnJvdWdodCBieSBleHRlcm5hbCBtb2R1bGUgd2Vla2x5U2NoZWR1bGVySTE4TilcclxuICAgICAgICovXHJcbiAgICAgIHNjb3BlLiRvbignd2Vla2x5U2NoZWR1bGVyTG9jYWxlQ2hhbmdlZCcsIGZ1bmN0aW9uIChlLCBsYWJlbHMpIHtcclxuICAgICAgICBpZiAoc2NoZWR1bGVyQ3RybC5jb25maWcpIHtcclxuICAgICAgICAgIHNjaGVkdWxlckN0cmwuY29uZmlnLmxhYmVscyA9IGxhYmVscztcclxuICAgICAgICB9XHJcbiAgICAgICAgb25Nb2RlbENoYW5nZShhbmd1bGFyLmNvcHkodGhpcy4kcGFyc2UoYXR0cnMuaXRlbXMpKHNjb3BlKSwgW10pKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25maWd1cmUgdGhlIHNjaGVkdWxlci5cclxuICAgKiBAcGFyYW0gc2NoZWR1bGVzXHJcbiAgICogQHBhcmFtIG9wdGlvbnNcclxuICAgKiBAcmV0dXJucyB7e21pbkRhdGU6ICosIG1heERhdGU6ICosIG5iV2Vla3M6ICp9fVxyXG4gICAqL1xyXG4gIHByaXZhdGUgY29uZmlnKHNjaGVkdWxlczogYW55W10sIG9wdGlvbnMpIHtcclxuICAgIHZhciBub3cgPSBtb21lbnQoKTtcclxuXHJcbiAgICAvLyBDYWxjdWxhdGUgbWluIGRhdGUgb2YgYWxsIHNjaGVkdWxlZCBldmVudHNcclxuICAgIHZhciBtaW5EYXRlID0gKHNjaGVkdWxlcyA/IHNjaGVkdWxlcy5yZWR1Y2UoKG1pbkRhdGUsIHNsb3QpID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMudGltZVNlcnZpY2UuY29tcGFyZShzbG90LnN0YXJ0LCAnaXNCZWZvcmUnLCBtaW5EYXRlKTtcclxuICAgIH0sIG5vdykgOiBub3cpLnN0YXJ0T2YoJ3dlZWsnKTtcclxuXHJcbiAgICAvLyBDYWxjdWxhdGUgbWF4IGRhdGUgb2YgYWxsIHNjaGVkdWxlZCBldmVudHNcclxuICAgIHZhciBtYXhEYXRlID0gKHNjaGVkdWxlcyA/IHNjaGVkdWxlcy5yZWR1Y2UoKG1heERhdGUsIHNsb3QpID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMudGltZVNlcnZpY2UuY29tcGFyZShzbG90LmVuZCwgJ2lzQWZ0ZXInLCBtYXhEYXRlKTtcclxuICAgIH0sIG1pbkRhdGUpIDogbm93KS5jbG9uZSgpLmFkZCgxLCAnZGF5JykuZW5kT2YoJ2RheScpO1xyXG5cclxuICAgIC8vIENhbGN1bGF0ZSBuYiBvZiB3ZWVrcyBjb3ZlcmVkIGJ5IG1pbkRhdGUgPT4gbWF4RGF0ZVxyXG4gICAgdmFyIG5iV2Vla3MgPSB0aGlzLnRpbWVTZXJ2aWNlLndlZWtEaWZmKG1pbkRhdGUsIG1heERhdGUpO1xyXG5cclxuICAgIHZhciByZXN1bHQgPSBhbmd1bGFyLmV4dGVuZChvcHRpb25zLCB7IG1pbkRhdGU6IG1pbkRhdGUsIG1heERhdGU6IG1heERhdGUsIG5iV2Vla3M6IG5iV2Vla3MgfSk7XHJcbiAgICAvLyBMb2cgY29uZmlndXJhdGlvblxyXG4gICAgdGhpcy4kbG9nLmRlYnVnKCdXZWVrbHkgU2NoZWR1bGVyIGNvbmZpZ3VyYXRpb246JywgcmVzdWx0KTtcclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIEZhY3RvcnkoKSB7XHJcbiAgICBsZXQgZGlyZWN0aXZlID0gKCRsb2csICRwYXJzZSwgdGltZVNlcnZpY2UpID0+IG5ldyBXZWVrbHlTY2hlZHVsZXJEaXJlY3RpdmUoJGxvZywgJHBhcnNlLCB0aW1lU2VydmljZSk7XHJcblxyXG4gICAgZGlyZWN0aXZlLiRpbmplY3QgPSBbXHJcbiAgICAgICckbG9nJyxcclxuICAgICAgJyRwYXJzZScsXHJcbiAgICAgICd3ZWVrbHlTY2hlZHVsZXJUaW1lU2VydmljZSdcclxuICAgIF07XHJcblxyXG4gICAgcmV0dXJuIGRpcmVjdGl2ZTtcclxuICB9XHJcbn1cclxuXHJcbi8qIGdsb2JhbCBtb3VzZVNjcm9sbCwgQ0xJQ0tfT05fQV9DRUxMLCB6b29tSW5BQ2VsbCAqL1xyXG5hbmd1bGFyLm1vZHVsZSgnd2Vla2x5U2NoZWR1bGVyJylcclxuICAuY29udHJvbGxlcihXZWVrbHlTY2hlZHVsZXJDb250cm9sbGVyLiRuYW1lLCBXZWVrbHlTY2hlZHVsZXJDb250cm9sbGVyKVxyXG4gIC5kaXJlY3RpdmUoV2Vla2x5U2NoZWR1bGVyRGlyZWN0aXZlLiRuYW1lLCBXZWVrbHlTY2hlZHVsZXJEaXJlY3RpdmUuRmFjdG9yeSgpKTtcclxuIiwiY2xhc3MgV2Vla2x5U2xvdERpcmVjdGl2ZSBpbXBsZW1lbnRzIGFuZ3VsYXIuSURpcmVjdGl2ZSB7XHJcbiAgc3RhdGljICRuYW1lID0gJ3dlZWtseVNsb3QnO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgdGltZVNlcnZpY2VcclxuICApIHtcclxuICB9XHJcblxyXG4gIHJlc3RyaWN0ID0gJ0UnO1xyXG4gIHJlcXVpcmUgPSBbJ153ZWVrbHlTY2hlZHVsZXInLCAnbmdNb2RlbCddO1xyXG4gIHRlbXBsYXRlVXJsID0gJ25nLXdlZWtseS1zY2hlZHVsZXIvd2Vla2x5LXNsb3Qvd2Vla2x5LXNsb3QuaHRtbCc7XHJcblxyXG4gIGxpbmsgPSAoc2NvcGUsIGVsZW1lbnQ6IGFuZ3VsYXIuSUF1Z21lbnRlZEpRdWVyeSwgYXR0cnM6IGFuZ3VsYXIuSUF0dHJpYnV0ZXMsIGN0cmxzKSA9PiB7XHJcbiAgICB2YXIgc2NoZWR1bGVyQ3RybDogV2Vla2x5U2NoZWR1bGVyQ29udHJvbGxlciA9IGN0cmxzWzBdLFxyXG4gICAgICAgIG5nTW9kZWxDdHJsOiBhbmd1bGFyLklOZ01vZGVsQ29udHJvbGxlciA9IGN0cmxzWzFdO1xyXG5cclxuICAgIHZhciBjb25mID0gc2NoZWR1bGVyQ3RybC5jb25maWc7XHJcbiAgICB2YXIgaW5kZXggPSBzY29wZS4kcGFyZW50LiRpbmRleDtcclxuICAgIHZhciBjb250YWluZXJFbCA9IGVsZW1lbnQucGFyZW50KCk7XHJcbiAgICB2YXIgcmVzaXplRGlyZWN0aW9uSXNTdGFydCA9IHRydWU7XHJcbiAgICB2YXIgdmFsdWVzT25EcmFnU3RhcnQgPSB7c3RhcnQ6IHNjb3BlLnNjaGVkdWxlLnN0YXJ0LCBlbmQ6IHNjb3BlLnNjaGVkdWxlLmVuZH07XHJcblxyXG4gICAgdmFyIHBpeGVsVG9WYWwgPSBmdW5jdGlvbiAocGl4ZWwpIHtcclxuICAgICAgdmFyIHBlcmNlbnQgPSBwaXhlbCAvIGNvbnRhaW5lckVsWzBdLmNsaWVudFdpZHRoO1xyXG4gICAgICByZXR1cm4gTWF0aC5mbG9vcihwZXJjZW50ICogY29uZi5uYldlZWtzICsgMC41KTtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIG1lcmdlT3ZlcmxhcHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBzY2hlZHVsZSA9IHNjb3BlLnNjaGVkdWxlO1xyXG4gICAgICB2YXIgc2NoZWR1bGVzID0gc2NvcGUuaXRlbS5zY2hlZHVsZXM7XHJcbiAgICAgIHNjaGVkdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xyXG4gICAgICAgIGlmIChlbCAhPT0gc2NoZWR1bGUpIHtcclxuICAgICAgICAgIC8vIG1vZGVsIGlzIGluc2lkZSBhbm90aGVyIHNsb3RcclxuICAgICAgICAgIGlmIChlbC5lbmQgPj0gc2NoZWR1bGUuZW5kICYmIGVsLnN0YXJ0IDw9IHNjaGVkdWxlLnN0YXJ0KSB7XHJcbiAgICAgICAgICAgIHNjaGVkdWxlcy5zcGxpY2Uoc2NoZWR1bGVzLmluZGV4T2YoZWwpLCAxKTtcclxuICAgICAgICAgICAgc2NoZWR1bGUuZW5kID0gZWwuZW5kO1xyXG4gICAgICAgICAgICBzY2hlZHVsZS5zdGFydCA9IGVsLnN0YXJ0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gbW9kZWwgY29tcGxldGVseSBjb3ZlcnMgYW5vdGhlciBzbG90XHJcbiAgICAgICAgICBlbHNlIGlmIChzY2hlZHVsZS5lbmQgPj0gZWwuZW5kICYmIHNjaGVkdWxlLnN0YXJ0IDw9IGVsLnN0YXJ0KSB7XHJcbiAgICAgICAgICAgIHNjaGVkdWxlcy5zcGxpY2Uoc2NoZWR1bGVzLmluZGV4T2YoZWwpLCAxKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIGFub3RoZXIgc2xvdCdzIGVuZCBpcyBpbnNpZGUgY3VycmVudCBtb2RlbFxyXG4gICAgICAgICAgZWxzZSBpZiAoZWwuZW5kID49IHNjaGVkdWxlLnN0YXJ0ICYmIGVsLmVuZCA8PSBzY2hlZHVsZS5lbmQpIHtcclxuICAgICAgICAgICAgc2NoZWR1bGVzLnNwbGljZShzY2hlZHVsZXMuaW5kZXhPZihlbCksIDEpO1xyXG4gICAgICAgICAgICBzY2hlZHVsZS5zdGFydCA9IGVsLnN0YXJ0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gYW5vdGhlciBzbG90J3Mgc3RhcnQgaXMgaW5zaWRlIGN1cnJlbnQgbW9kZWxcclxuICAgICAgICAgIGVsc2UgaWYgKGVsLnN0YXJ0ID49IHNjaGVkdWxlLnN0YXJ0ICYmIGVsLnN0YXJ0IDw9IHNjaGVkdWxlLmVuZCkge1xyXG4gICAgICAgICAgICBzY2hlZHVsZXMuc3BsaWNlKHNjaGVkdWxlcy5pbmRleE9mKGVsKSwgMSk7XHJcbiAgICAgICAgICAgIHNjaGVkdWxlLmVuZCA9IGVsLmVuZDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIERlbGV0ZSBvbiByaWdodCBjbGljayBvbiBzbG90XHJcbiAgICAgKi9cclxuICAgIHZhciBkZWxldGVTZWxmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb250YWluZXJFbC5yZW1vdmVDbGFzcygnZHJhZ2dpbmcnKTtcclxuICAgICAgY29udGFpbmVyRWwucmVtb3ZlQ2xhc3MoJ3Nsb3QtaG92ZXInKTtcclxuICAgICAgc2NvcGUuaXRlbS5zY2hlZHVsZXMuc3BsaWNlKHNjb3BlLml0ZW0uc2NoZWR1bGVzLmluZGV4T2Yoc2NvcGUuc2NoZWR1bGUpLCAxKTtcclxuICAgICAgY29udGFpbmVyRWwuZmluZCgnd2Vla2x5LXNsb3QnKS5yZW1vdmUoKTtcclxuICAgICAgc2NvcGUuJGFwcGx5KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGVsZW1lbnQuZmluZCgnc3BhbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgZGVsZXRlU2VsZigpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZWxlbWVudC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb250YWluZXJFbC5hZGRDbGFzcygnc2xvdC1ob3ZlcicpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZWxlbWVudC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgY29udGFpbmVyRWwucmVtb3ZlQ2xhc3MoJ3Nsb3QtaG92ZXInKTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICBpZiAoc2NvcGUuaXRlbS5lZGl0YWJsZSAhPT0gZmFsc2UpIHtcclxuICAgICAgc2NvcGUuc3RhcnRSZXNpemVTdGFydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXNpemVEaXJlY3Rpb25Jc1N0YXJ0ID0gdHJ1ZTtcclxuICAgICAgICBzY29wZS5zdGFydERyYWcoKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHNjb3BlLnN0YXJ0UmVzaXplRW5kID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJlc2l6ZURpcmVjdGlvbklzU3RhcnQgPSBmYWxzZTtcclxuICAgICAgICBzY29wZS5zdGFydERyYWcoKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHNjb3BlLnN0YXJ0RHJhZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBlbGVtZW50LmFkZENsYXNzKCdhY3RpdmUnKTtcclxuXHJcbiAgICAgICAgY29udGFpbmVyRWwuYWRkQ2xhc3MoJ2RyYWdnaW5nJyk7XHJcbiAgICAgICAgY29udGFpbmVyRWwuYXR0cignbm8tYWRkJywgJ3RydWUnKTtcclxuXHJcbiAgICAgICAgdmFsdWVzT25EcmFnU3RhcnQgPSB7c3RhcnQ6IG5nTW9kZWxDdHJsLiR2aWV3VmFsdWUuc3RhcnQsIGVuZDogbmdNb2RlbEN0cmwuJHZpZXdWYWx1ZS5lbmR9O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgc2NvcGUuZW5kRHJhZyA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgLy8gdGhpcyBwcmV2ZW50cyB1c2VyIGZyb20gYWNjaWRlbnRhbGx5XHJcbiAgICAgICAgLy8gYWRkaW5nIG5ldyBzbG90IGFmdGVyIHJlc2l6aW5nIG9yIGRyYWdnaW5nXHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBjb250YWluZXJFbC5yZW1vdmVBdHRyKCduby1hZGQnKTtcclxuICAgICAgICB9LCA1MDApO1xyXG5cclxuICAgICAgICBlbGVtZW50LnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICBjb250YWluZXJFbC5yZW1vdmVDbGFzcygnZHJhZ2dpbmcnKTtcclxuXHJcbiAgICAgICAgbWVyZ2VPdmVybGFwcygpO1xyXG4gICAgICAgIHNjb3BlLiRhcHBseSgpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgc2NvcGUucmVzaXplID0gZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICB2YXIgdWkgPSBuZ01vZGVsQ3RybC4kdmlld1ZhbHVlO1xyXG4gICAgICAgIHZhciBkZWx0YSA9IHBpeGVsVG9WYWwoZCk7XHJcblxyXG4gICAgICAgIGlmIChyZXNpemVEaXJlY3Rpb25Jc1N0YXJ0KSB7XHJcbiAgICAgICAgICB2YXIgbmV3U3RhcnQgPSBNYXRoLnJvdW5kKHZhbHVlc09uRHJhZ1N0YXJ0LnN0YXJ0ICsgZGVsdGEpO1xyXG5cclxuICAgICAgICAgIGlmICh1aS5zdGFydCAhPT0gbmV3U3RhcnQgJiYgbmV3U3RhcnQgPD0gdWkuZW5kIC0gMSAmJiBuZXdTdGFydCA+PSAwKSB7XHJcbiAgICAgICAgICAgIG5nTW9kZWxDdHJsLiRzZXRWaWV3VmFsdWUoe1xyXG4gICAgICAgICAgICAgIHN0YXJ0OiBuZXdTdGFydCxcclxuICAgICAgICAgICAgICBlbmQ6IHVpLmVuZFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgbmdNb2RlbEN0cmwuJHJlbmRlcigpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB2YXIgbmV3RW5kID0gTWF0aC5yb3VuZCh2YWx1ZXNPbkRyYWdTdGFydC5lbmQgKyBkZWx0YSk7XHJcblxyXG4gICAgICAgICAgaWYgKHVpLmVuZCAhPT0gbmV3RW5kICYmIG5ld0VuZCA+PSB1aS5zdGFydCArIDEgJiYgbmV3RW5kIDw9IGNvbmYubmJXZWVrcykge1xyXG4gICAgICAgICAgICBuZ01vZGVsQ3RybC4kc2V0Vmlld1ZhbHVlKHtcclxuICAgICAgICAgICAgICBzdGFydDogdWkuc3RhcnQsXHJcbiAgICAgICAgICAgICAgZW5kOiBuZXdFbmRcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIG5nTW9kZWxDdHJsLiRyZW5kZXIoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBzY29wZS5kcmFnID0gZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICB2YXIgdWkgPSBuZ01vZGVsQ3RybC4kdmlld1ZhbHVlO1xyXG4gICAgICAgIHZhciBkZWx0YSA9IHBpeGVsVG9WYWwoZCk7XHJcbiAgICAgICAgdmFyIGR1cmF0aW9uID0gdmFsdWVzT25EcmFnU3RhcnQuZW5kIC0gdmFsdWVzT25EcmFnU3RhcnQuc3RhcnQ7XHJcblxyXG4gICAgICAgIHZhciBuZXdTdGFydCA9IE1hdGgucm91bmQodmFsdWVzT25EcmFnU3RhcnQuc3RhcnQgKyBkZWx0YSk7XHJcbiAgICAgICAgdmFyIG5ld0VuZCA9IE1hdGgucm91bmQobmV3U3RhcnQgKyBkdXJhdGlvbik7XHJcblxyXG4gICAgICAgIGlmICh1aS5zdGFydCAhPT0gbmV3U3RhcnQgJiYgbmV3U3RhcnQgPj0gMCAmJiBuZXdFbmQgPD0gY29uZi5uYldlZWtzKSB7XHJcbiAgICAgICAgICBuZ01vZGVsQ3RybC4kc2V0Vmlld1ZhbHVlKHtcclxuICAgICAgICAgICAgc3RhcnQ6IG5ld1N0YXJ0LFxyXG4gICAgICAgICAgICBlbmQ6IG5ld0VuZFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBuZ01vZGVsQ3RybC4kcmVuZGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIG9uIGluaXQsIG1lcmdlIG92ZXJsYXBzXHJcbiAgICBtZXJnZU92ZXJsYXBzKCk7XHJcblxyXG4gICAgLy8vLyBVSSAtPiBtb2RlbCAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIG5nTW9kZWxDdHJsLiRwYXJzZXJzLnB1c2goKHVpKSA9PiB7XHJcbiAgICAgIG5nTW9kZWxDdHJsLiRtb2RlbFZhbHVlLnN0YXJ0ID0gdGhpcy50aW1lU2VydmljZS5hZGRXZWVrKGNvbmYubWluRGF0ZSwgdWkuc3RhcnQpLnRvRGF0ZSgpO1xyXG4gICAgICBuZ01vZGVsQ3RybC4kbW9kZWxWYWx1ZS5lbmQgPSB0aGlzLnRpbWVTZXJ2aWNlLmFkZFdlZWsoY29uZi5taW5EYXRlLCB1aS5lbmQpLnRvRGF0ZSgpO1xyXG4gICAgICAvLyRsb2cuZGVidWcoJ1BBUlNFUiA6JywgbmdNb2RlbEN0cmwuJG1vZGVsVmFsdWUuJCRoYXNoS2V5LCBpbmRleCwgc2NvcGUuJGluZGV4LCBuZ01vZGVsQ3RybC4kbW9kZWxWYWx1ZSk7XHJcbiAgICAgIHNjaGVkdWxlckN0cmwub24uY2hhbmdlKGluZGV4LCBzY29wZS4kaW5kZXgsIG5nTW9kZWxDdHJsLiRtb2RlbFZhbHVlKTtcclxuICAgICAgcmV0dXJuIG5nTW9kZWxDdHJsLiRtb2RlbFZhbHVlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8vLyBtb2RlbCAtPiBVSSAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAgIG5nTW9kZWxDdHJsLiRmb3JtYXR0ZXJzLnB1c2goKG1vZGVsKSA9PiB7XHJcbiAgICAgIHZhciB1aSA9IHtcclxuICAgICAgICBzdGFydDogdGhpcy50aW1lU2VydmljZS53ZWVrUHJlY2lzZURpZmYoY29uZi5taW5EYXRlLCBtb21lbnQobW9kZWwuc3RhcnQpLCB0cnVlKSxcclxuICAgICAgICBlbmQ6IHRoaXMudGltZVNlcnZpY2Uud2Vla1ByZWNpc2VEaWZmKGNvbmYubWluRGF0ZSwgbW9tZW50KG1vZGVsLmVuZCksIHRydWUpXHJcbiAgICAgIH07XHJcbiAgICAgIC8vJGxvZy5kZWJ1ZygnRk9STUFUVEVSIDonLCBpbmRleCwgc2NvcGUuJGluZGV4LCB1aSk7XHJcbiAgICAgIHJldHVybiB1aTtcclxuICAgIH0pO1xyXG5cclxuICAgIG5nTW9kZWxDdHJsLiRyZW5kZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciB1aSA9IG5nTW9kZWxDdHJsLiR2aWV3VmFsdWU7XHJcbiAgICAgIHZhciBjc3MgPSB7XHJcbiAgICAgICAgbGVmdDogdWkuc3RhcnQgLyBjb25mLm5iV2Vla3MgKiAxMDAgKyAnJScsXHJcbiAgICAgICAgd2lkdGg6ICh1aS5lbmQgLSB1aS5zdGFydCkgLyBjb25mLm5iV2Vla3MgKiAxMDAgKyAnJSdcclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8vJGxvZy5kZWJ1ZygnUkVOREVSIDonLCBpbmRleCwgc2NvcGUuJGluZGV4LCBjc3MpO1xyXG4gICAgICBlbGVtZW50LmNzcyhjc3MpO1xyXG4gICAgfTtcclxuXHJcbiAgICBzY29wZS4kb24oJ3dlZWtseVNjaGVkdWxlckxvY2FsZUNoYW5nZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIC8vIFNpbXBsZSBjaGFuZ2Ugb2JqZWN0IHJlZmVyZW5jZSBzbyB0aGF0IG5nTW9kZWwgdHJpZ2dlcnMgZm9ybWF0dGluZyAmIHJlbmRlcmluZ1xyXG4gICAgICBzY29wZS5zY2hlZHVsZSA9IGFuZ3VsYXIuY29weShzY29wZS5zY2hlZHVsZSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBGYWN0b3J5KCkge1xyXG4gICAgbGV0IGRpcmVjdGl2ZSA9ICh0aW1lU2VydmljZSkgPT4gbmV3IFdlZWtseVNsb3REaXJlY3RpdmUodGltZVNlcnZpY2UpO1xyXG5cclxuICAgIGRpcmVjdGl2ZS4kaW5qZWN0ID0gWyd3ZWVrbHlTY2hlZHVsZXJUaW1lU2VydmljZSddO1xyXG5cclxuICAgIHJldHVybiBkaXJlY3RpdmU7XHJcbiAgfVxyXG59XHJcblxyXG5hbmd1bGFyXHJcbiAgLm1vZHVsZSgnd2Vla2x5U2NoZWR1bGVyJylcclxuICAuZGlyZWN0aXZlKFdlZWtseVNsb3REaXJlY3RpdmUuJG5hbWUsIFdlZWtseVNsb3REaXJlY3RpdmUuRmFjdG9yeSgpKTtcclxuIl19

angular.module('ngWeeklySchedulerTemplates', []).run(['$templateCache', function($templateCache) {$templateCache.put('index.html','<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Angularjs weekly scheduler demo</title><link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-fork-ribbon-css/0.2.0/gh-fork-ribbon.min.css"><!--[if lt IE 9]>\r\n  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-fork-ribbon-css/0.2.0/gh-fork-ribbon.ie.min.css"/>\r\n  <![endif]--><link rel="stylesheet" href="testStyles.css"></head><body class="container-fluid" ng-app="demoApp"><a class="github-fork-ribbon" href="https://github.com/fmaturel/angular-weekly-scheduler" title="Fork me on GitHub">Fork me on GitHub</a><nav class="navbar navbar-default navbar-fixed-top"><div class="container-fluid"><div class="navbar-header"><button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false"><span class="sr-only">Toggle navigation</span> <span class="icon-bar"></span> <span class="icon-bar"></span> <span class="icon-bar"></span></button> <a class="navbar-brand" href="#">dijit</a></div><div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1"><ul class="nav navbar-nav"><li class="active"><a href="#demo">Demo <span class="sr-only">(current)</span></a></li><li><a href="#run">Run @ Home</a></li><li><a href="#install">Install</a></li><li><a href="#features">Features</a></li></ul></div></div></nav><div class="row" ng-controller="DemoController as demo"><div class="col-xs-10 col-xs-offset-1"><h1>Angularjs weekly scheduler</h1><h2 id="demo" class="page-header">1. Demo</h2><div><label for="language">Choose your language:</label><select id="language" ng-model="model.locale" ng-change="demo.onLocaleChange()"><option value="en-us" selected="selected">us</option><option value="en-gb" selected="selected">gb</option><option value="fr-fr">fr</option><option value="de-de">de</option><option value="es-es">es (lang customized in demo)</option></select></div><div><code>$scope.model</code><pre ng-bind="model | json" style="max-height: 200px"></pre></div><weekly-scheduler class="scheduler" items="model.items" on-change="demo.doSomething" on-delete="demo.doSomething" options="model.options"><div class="srow">{{::$index + 1}}. {{item.label}}</div></weekly-scheduler><div class="pull-right"><button class="btn btn-success" role="button" ng-click="model.items.push({label: \'New Item\'})">Add new item</button></div><h2 id="run" class="page-header">2. Run @ Home</h2><p>Run the demo @home with few steps (prerequisite git & node V0.10+ & npm installed):</p><pre>\r\ngit clone https://github.com/fmaturel/angular-weekly-scheduler.git && cd angular-weekly-scheduler\r\nnpm install\r\nnpm install -g grunt-cli</pre><p>Then run <code>grunt serve:dist</code></p><h2 id="install" class="page-header">3. Install</h2><p><code>bower install --save angular-weekly-scheduler</code></p><p>or</p><p><code>npm install --save angular-weekly-scheduler</code></p><p>Add the scripts and css to your index.html. The angular-locale_xx-xx.js file is your locale file</p><pre>\r\n&lt;link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css"&gt;\r\n&lt;script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.10/angular.min.js"&gt;&lt;/script&gt;\r\n&lt;script src="https://cdnjs.cloudflare.com/ajax/libs/angular-i18n/1.4.10/angular-locale_xx-xx.js"&gt;&lt;/script&gt;\r\n&lt;script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.13.0/moment.js"&gt;&lt;/script&gt;\r\n\r\n&lt;!-- The library to replace with your local copy of ng-weekly-scheduler --&gt;\r\n&lt;script src="https://github.com/fmaturel/angular-weekly-scheduler/blob/master/dist/js/ng-weekly-scheduler.js"&gt;&lt;/script&gt;</pre><p>Add dependency to timeline your angular module: weeklyScheduler.</p><p>Use the directive:</p><code>&lt;weekly-scheduler class="scheduler" ng-model="myScopeModel" options="options"&gt;&lt;/weekly-scheduler&gt;</code><h2 id="features" class="page-header">4. Features</h2><p>This directive displays a weekly item scheduler. You can see, add and modify items easily.</p><h3>Keyboard shortcuts</h3><ul><li>Use <kbd>mouse wheel</kbd> on schedule to scroll left and right</li><li>Use <kbd>ctrl + mouse wheel</kbd> to zoom in and out the schedule</li></ul><hr><h3>Schedules</h3><div class="alert alert-info alert-dismissible fade in" role="alert">This directive uses <a href="http://momentjs.com/"><strong>MomentJS</strong></a> to position items and calculate localized calendar weeks.</div><p>Drag the time bar start, end and body to quickly change your schedule period.</p><p>You can set an <code>editable</code> variable on each item, that will be used to disable item edition if <code>false</code>.<pre>\r\n"items": [{\r\n  "label": "Item 1",\r\n  "editable": false,\r\n  "schedules": [\r\n    {\r\n      "start": "2015-12-26T23:00:00.000Z",\r\n      "end": "2016-07-31T22:00:00.000Z"\r\n    }\r\n  ]\r\n}, ...]</pre></p><hr><h3>Transclusion</h3><p>This directive is using <code>ng-transclude</code> so that everything in <code>&lt;weekly-scheduler&gt;</code> element will be treated as the labelling object of one item.</p><pre>&lt;div class="srow"&gt;\\{\\{::$index + 1\\}\\}. \\{\\{ item.label \\}\\}&lt;/div&gt;</pre><p>On transcluded item label, the scope contains <code>item</code> attribute name containing each item model and regular <code>ng-repeat</code> scope attributes</p><h3>Internationalisation (i18n)</h3><p>I18N uses <a href="https://github.com/lgalfaso/angular-dynamic-locale">dynamic angular <code>$locale</code> change</a>.</p><p>An i18n module named <code>weeklySchedulerI18N</code> is optionally registered when using the core module :</p><pre>angular.module(\'demoApp\', [\'weeklyScheduler\', \'weeklySchedulerI18N\'])</pre><p>If present, core directive will retrieve current <code>$locale</code> and use it to translate labelling elements.</p><p>You can add more <code>$locale</code> translation using provider <code>weeklySchedulerLocaleServiceProvider</code>:</p><pre>\r\nangular.module(\'demoApp\', [\'weeklyScheduler\', \'weeklySchedulerI18N\'])\r\n  .config([\'weeklySchedulerLocaleServiceProvider\', function (localeServiceProvider) {\r\n    localeServiceProvider.configure({\r\n      doys: {\'es-es\': 4},\r\n      lang: {\'es-es\': {weekNb: \'n\xFAmero de la semana\', addNew: \'A\xF1adir\'}},\r\n      localeLocationPattern: \'/vendor/angular-i18n/angular-locale_{{locale}}.js\'\r\n    });\r\n  }])</pre><h3>Animation</h3><p>You can add animation to the weekly scheduler directive easily by importing angular module <code>ngAnimate</code>.<br>Your application could for instance use :</p><pre>angular.module(\'demoApp\', [\'ngAnimate\', \'weeklyScheduler\'])</pre><p>Don\'t forget to add the angular-animate javascript file to your Single Page App <code>index.html</code>.</p><pre>&lt;script src="/vendor/angular-animate/angular-animate.js"&gt;&lt;/script&gt;</pre><p>Styling can be changed to whatever you like. This is an example of fading-in items entering the DOM :</p><pre>.schedule-animate {\r\n  transition: opacity 200ms ease-out;\r\n}\r\n.schedule-animate.ng-enter, .schedule-animate.ng-hide-remove {\r\n  opacity: 0;\r\n}\r\n.schedule-animate.ng-leave, .schedule-animate.ng-hide-add {\r\n  display: none;\r\n  opacity: 1;\r\n}</pre><p>You should see your scheduler items fading in!</p></div></div><script src="testVendorScripts.js"></script><script src="testScripts.js"></script><script>(function (i, s, o, g, r, a, m) {\r\n    i[\'GoogleAnalyticsObject\'] = r;\r\n    i[r] = i[r] || function () {\r\n        (i[r].q = i[r].q || []).push(arguments)\r\n      }, i[r].l = 1 * new Date();\r\n    a = s.createElement(o),\r\n      m = s.getElementsByTagName(o)[0];\r\n    a.async = 1;\r\n    a.src = g;\r\n    m.parentNode.insertBefore(a, m)\r\n  })(window, document, \'script\', \'https://www.google-analytics.com/analytics.js\', \'ga\');\r\n\r\n  ga(\'create\', \'UA-22755333-1\', \'auto\');\r\n  ga(\'send\', \'pageview\');</script></body></html>');
$templateCache.put('ng-weekly-scheduler/multislider/multislider.html','<div class="slot ghost" ng-show="item.editable !== false && (!schedulerCtrl.config.monoSchedule || !item.schedules.length)">{{schedulerCtrl.config.labels.addNew || \'Add New\'}}</div><weekly-slot class="slot" ng-class="{disable: item.editable === false}" ng-repeat="schedule in item.schedules" ng-model="schedule" ng-model-options="{ updateOn: \'default blur\', debounce: { \'default\': 500, \'blur\': 0 } }"></weekly-slot>');
$templateCache.put('ng-weekly-scheduler/weekly-scheduler/weekly-scheduler.html','<div class="labels"><div class="srow text-right">{{schedulerCtrl.config.labels.weekNb || \'Week number\'}}</div><div class="schedule-animate" ng-repeat="item in schedulerCtrl.items" inject></div></div><div class="schedule-area-container"><div class="schedule-area"><div class="srow timestamps"><weekly-grid class="grid-container"></weekly-grid></div><div class="srow schedule-animate" ng-repeat="item in schedulerCtrl.items"><weekly-grid class="grid-container striped" no-text></weekly-grid><multi-slider index="{{$index}}"></multi-slider></div></div></div>');
$templateCache.put('ng-weekly-scheduler/weekly-slot/weekly-slot.html','<div title="{{schedule.start | date}} - {{schedule.end | date}}"><div class="handle left" ondrag="resize" ondragstart="startResizeStart" ondragstop="endDrag" handle></div><div ondrag="drag" ondragstart="startDrag" ondragstop="endDrag" handle>{{schedule.start | date}} - {{schedule.end | date}}</div><div class="handle right" ondrag="resize" ondragstart="startResizeEnd" ondragstop="endDrag" handle></div><div class="remove"><span class="glyphicon glyphicon-remove"></span></div></div>');}]);