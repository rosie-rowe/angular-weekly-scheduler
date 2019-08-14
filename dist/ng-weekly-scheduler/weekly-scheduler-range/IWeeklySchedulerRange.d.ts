import { Days } from '../weekly-scheduler-config/Days';
import { IRange } from '../range/IRange';
export interface IWeeklySchedulerRange<T> extends IRange {
    /** A css class to apply */
    $class?: string;
    /** This will indicate whether the item is currently considered active to the UI */
    $isActive?: boolean;
    /** If this is set to true while the user is editing an existing item, it will be removed when the edit promise is resolved */
    $isDeleting?: boolean;
    /** This will indicate whether the item is currently being edited by the user */
    $isEditing?: boolean;
    /** Not strictly necessary but makes things a whooole lot easier */
    day: Days;
    value: T;
    editable?: boolean;
}
