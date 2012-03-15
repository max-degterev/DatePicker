var DatePicker = function(container, options) {
    this.container = (typeof container === 'string') ? $(container) : container;

    if (!this.container.length) {
        console.log('[DatePicker]: no container provided or found');
    }

    this.options = $.extend({
        selectors: {
            monthsHolder: '.dp-months-holder',
            calHolder: '.dp-cal-holder'
        },
        months: 16
    }, options);
    
    this.profiler = {
        start: +(new Date())
    }
};
DatePicker.prototype.locale = {
    month_labels: ['январь', 'февраль', 'март', 'апрель',
                   'май', 'июнь', 'июль', 'август', 'сентябрь',
                   'октябрь', 'ноябрь', 'декабрь']
};
DatePicker.prototype.init = function() {
    this.state = {};
    this.els = {};
    
    this.els.monthsHolder = this.container.find(this.options.selectors.monthsHolder);
    this.els.calHolder = this.container.find(this.options.selectors.calHolder);

    this.now = new Date();
    this.today = new Date(this.now.getFullYear(), this.now.getMonth(), this.now.getDate());
    this.start = new Date(this.now.getFullYear(), this.now.getMonth(), this.now.getDate());
    this.end = new Date(this.now.getFullYear(), this.now.getMonth() + this.options.months, this.now.getDate());
    
    console.log('init: ' + ((+(new Date()) - this.profiler.start)));
    
    this.generateLabels();
    
    console.log('labels: ' + ((+(new Date()) - this.profiler.start)));
    this.generateCalendar();
    console.log('calendar: ' + ((+(new Date()) - this.profiler.start)));
    
    this.els.cells = this.els.calHolder.find('.calendar-day');

    this.logic();
};
DatePicker.prototype.generateLabels = function() {
    var monthLabels = '<table class="calendar-month-labels"><tr>',
        curr = this.start.getMonth();
    
    for (var i = 0; i < this.options.months; i++) {
        monthLabels += '<td>' + this.locale.month_labels[curr] + '<\/td>';
        curr = (curr === 11) ? 0 : (curr + 1);
    }
    
    monthLabels += '</tr></table>';
    
    this.els.monthsHolder.append(monthLabels);
};
DatePicker.prototype.generateCalendar = function() {
    this.calendar = $(Calendar.generate({
        start: {
            year: this.start.getFullYear(),
            month: this.start.getMonth() + 1,
            day: this.start.getDate()
        },
        end: {
            year: this.end.getFullYear(),
            month: this.end.getMonth() + 1
        },
        daylabels: true,
        monthlabels: true,
        type: 'list'
    }));
 
    this.els.calHolder.append(this.calendar);
};

DatePicker.prototype.logic = function() {
    this.state.checkin = '2012-03-28';
    this.state.checkout = '2012-04-02';
    this.selectCurrentDates();
};
DatePicker.prototype.selectCurrentDates = function() {
    this.els.cells.filter('[data-date="' + this.state.checkin + '"]').addClass('checkin');
    this.els.cells.filter('[data-date="' + this.state.checkout + '"]').addClass('checkout');
    this.selectRange(this.state.checkin, this.state.checkout, 'selected');
};
DatePicker.prototype.selectRange = function(ymd1, ymd2, selection_class) {
    var d1_arr = ymd1.split('-'),
        d2_arr = ymd2.split('-'),
        date1 = new Date(+d1_arr[0], +d1_arr[1] - 1, +d1_arr[2] - 1),// offset this so we can increment in while loop straight away
        date2 = +(new Date(+d2_arr[0], +d2_arr[1] - 1, +d2_arr[2]));

    this.els.cells.filter('.' + selection_class).removeClass(selection_class);
    while (+date1 < date2) {
        date1.setDate(date1.getDate() + 1);
        curr_cell = this.els.cells.filter('[data-date="' + this.dateToYMD(date1) + '"]').addClass(selection_class);
    };
};
DatePicker.prototype.dateToYMD = function(date) {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
};
DatePicker.prototype.YMDToDate = function(ymd) {
    var darr = ymd.split('-');
    return new Date(+darr[0], +darr[1] - 1, +darr[2]);
};
DatePicker.prototype.YMDToDateMonth = function(ymd) {
    var darr = ymd.split('-');
    return new Date(+darr[0], +darr[1] - 1, 1);
};
