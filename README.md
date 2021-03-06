# angular-weekly-scheduler
A weekly scheduler for angularjs -- WORK IN PROGRESS, NOT PRODUCTION READY

This is useful for scheduling events to happen at the same time every day, every week.
This is a common use case for Building Management Systems.
Any overrides must be handled in your software.

## Run @ Home
Run the demo @home with few steps (prerequisite git & node V0.10+ & npm installed):

```
 git clone https://github.com/rosie-rowe/angular-weekly-scheduler.git && cd angular-weekly-scheduler
 npm install
 npm install -g gulp-cli
```

Then run

`gulp start`

## Install

> yarn add https://github.com/rosie-rowe/angular-weekly-scheduler

Add the scripts and css to your index.html.

Add dependency to timeline your angular module: `br.weeklyScheduler`.

Use the directive:

`<br-weekly-scheduler adapter="myAdapter" range-adapter="myRangeAdapter" options="myOptions"></weekly-scheduler>`

## Features

This directive displays a weekly item scheduler. You can see, add and modify items easily.

### Adapters

In order to use this you must implement adapters on the exported interfaces "IWeeklySchedulerAdapter" & "IWeeklySchedulerRangeAdapter"
Basic demo adapters can be found in the demo app.
This module itself only knows about one data format for the schedules, so you must provide instructions for converting to and from your custom format.

### Keyboard shortcuts

* Use <kbd>mouse wheel</kbd> on the calendar to scroll left and right</li>
* Use <kbd>ctrl + mouse wheel</kbd> to zoom in and out of the calendar</li>

### Schedules

Drag the time bar start, end and body to quickly change your schedule period.
You can set an `editable` variable on each item, that will be used to disable editing if `false`.
```javascript
"items": [{
  "label": "Item 1",
  "editable": false,
  "schedules": [
    {
      "start": "2015-12-26T23:00:00.000Z",
      "end": "2016-07-31T22:00:00.000Z"
    }
  ]
}, ...]
```

### Animation

You can add animation to the weekly scheduler directive easily by importing angular module `ngAnimate`.
Your application could for instance use :

```javascript
angular.module('demoApp', ['ngAnimate', 'weeklyScheduler'])
```

Don't forget to add the angular-animate javascript file to your Single Page App `index.html`.

```
<script src="/vendor/angular-animate/angular-animate.js"></script>
```

Styling can be changed to whatever you like. This is an example of fading-in items entering the DOM :

```css
.schedule-animate {
  transition: opacity 200ms ease-out;
}
.schedule-animate.ng-enter, .schedule-animate.ng-hide-remove {
  opacity: 0;
}
.schedule-animate.ng-leave, .schedule-animate.ng-hide-add {
  display: none;
  opacity: 1;
}
```

You should see your scheduler items fading in!
## License

Released under the MIT License. See the [LICENSE][license] file for further details.

[license]: https://github.com/rosie-rowe/angular-weekly-scheduler/blob/master/LICENSE
