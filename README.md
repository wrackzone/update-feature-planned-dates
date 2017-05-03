Feature Iteration Planned Dates
===============================

## Overview

Barry Mullan / Eric Willeke (CA Technologies)

This tool will be useful for reviewing your plan for a Program Increment (SAFE) or release. It helps answer the questions ...

* How well planned are the features ?
* Did I miss any features ?
* What features are fully planned ?
* For features that are not fully planned, how many stories remain to be planned ?

In addition it allows you to conveniently update the features Plannded Start/End dates based on the planned dates of it's stories. 

![screenshot](https://github.com/wrackzone/update-feature-planned-dates/blob/master/screenshot-2.png?raw=true)

**Important** Install this app on a Release filtered page.

Column | Description
------ | -----------
**Planned / Unplanned Count** | The first number is the total number of stories that have been planned into an iteration. The second is the total number of unplanned stories. **Red** means that no stories for this feature have been planned into an iteration. **Green** means that all stories for this feature have been planned.
**% Planned** | The percentage of total stories that have been planned.
**Earliest Planned** | The start date of the earliest iteration that stories have been planned into.
**Latest Planned** | The end date of the latest iteration that stories have been planned into.
**Leaf Story Count** | This column will be highlighted in **Red** if this feature has unplanned stories which have successors
**Arrow Action Button** | Clicking this will set the Features planned start and end dates to be that of the earliest and latest planned dates.


![screenshot](https://github.com/wrackzone/update-feature-planned-dates/blob/master/screenshot.png?raw=true)

## License

This app is released under the MIT license.  See the file [LICENSE](./LICENSE) for the full text.
