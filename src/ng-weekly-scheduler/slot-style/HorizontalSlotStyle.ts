import { ISlotStyle } from './ISlotStyle';
import { IWeeklySchedulerRange } from '../weekly-scheduler-range/IWeeklySchedulerRange';
import { IWeeklySchedulerConfig } from '../weekly-scheduler-config/IWeeklySchedulerConfig';
import { EndAdjusterService } from '../end-adjuster/EndAdjusterService';
import { ValueNormalizationService } from '../value-normalization/ValueNormalizationService';
import { SlotStyleService } from './SlotStyleService';

export class HorizontalSlotStyle implements ISlotStyle {
  private element: Element;

  constructor(
    private config: IWeeklySchedulerConfig<any>,
    private $element: angular.IAugmentedJQuery,
    private nullEndWidth: number,
    private endAdjusterService: EndAdjusterService,
    private slotStyleService: SlotStyleService,
    private valueNormalizationService: ValueNormalizationService
  ) {
    this.element = this.$element[0];
  }

  getCss(schedule: IWeeklySchedulerRange<any>) {
    return {
      left: this.getSlotLeft(schedule.start),
      right: this.getSlotRight(schedule.start, schedule.end)
    };
  }

  private getSlotLeft(start: number) {
    let underlyingInterval: HTMLElement = this.getUnderlyingInterval(start);

    return underlyingInterval.offsetLeft + 'px';
  }

  private getSlotRight(start: number, end: number) {
    // If there is a null end, place the end of the slot two hours away from the beginning.
    if (this.config.nullEnds && end === null) {
      end = start + this.nullEndWidth;
    }

    // An end of 0 should display allll the way to the right, up to the edge
    end = this.endAdjusterService.adjustEndForView(this.config, end);

    // We want the right side to go /up to/ the interval it represents, not cover it, so we must substract 1 interval
    let underlyingInterval = this.getUnderlyingInterval(end - this.config.interval);

    let offsetRight = underlyingInterval.offsetLeft + underlyingInterval.offsetWidth;

    let result = this.element.clientWidth - offsetRight;

    return result + 'px';
  }

  private getUnderlyingInterval(val: number): HTMLElement {
    return this.slotStyleService.getUnderlyingInterval(this.config, this.element, val);
  }
}
