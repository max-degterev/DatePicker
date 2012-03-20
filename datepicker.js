var DatePicker = function(container, options) {
    this.container = (typeof container === 'string') ? $(container) : container;

    if (!this.container.length) {
        console.log('[DatePicker]: no container provided or found');
    }

    this.options = $.extend({
        selectors: {
            monthsHolder: '.dp-months-holder',
            calHolder: '.dp-cal-holder',
            calHandles: '.dp-cal-handle',
            arrivalBlock: '.dp-cal-arrival-area',
            departureBlock: '.dp-cal-departure-area',
            arrivalHandle: '.dp-cal-arrival-handle',
            departureHandle: '.dp-cal-departure-handle'
        },
        months: 16,
        defaultNights: 4
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
    this.sizes = {};
    
    for (var prop in this.options.selectors) {
        this.els[prop] = this.container.find(this.options.selectors[prop]);
    }

    this.now = new Date();
    this.today = new Date(this.now.getFullYear(), this.now.getMonth(), this.now.getDate());
    this.start = new Date(this.now.getFullYear(), this.now.getMonth(), this.now.getDate());
    this.end = new Date(this.now.getFullYear(), this.now.getMonth() + this.options.months, this.now.getDate());
    
    console.log('init: ' + ((+(new Date()) - this.profiler.start)));
    
    this.generateLabels();
    
    console.log('labels: ' + ((+(new Date()) - this.profiler.start)));
    this.generateCalendar();
    console.log('calendar: ' + ((+(new Date()) - this.profiler.start)));
    
    this.els.cells = this.els.calendar.children('.calendar-day');
    
    this.resetHolder();

    this.logic();
};
DatePicker.prototype.generateLabels = function() {
    var monthLabels = '<table class="calendar-month-labels"><tr>',
        curr = this.start.getMonth();
    
    for (var i = 0; i < this.options.months; i++) {
        monthLabels += '<td>' + this.locale.month_labels[curr] + '<\/td>';
        curr = (curr === 11) ? 0 : (curr + 1);
    }
    
    monthLabels += '<\/tr><\/table>';
    
    this.els.monthsHolder.append(monthLabels);
};
DatePicker.prototype.generateCalendar = function() {
    this.els.calendar = $(Calendar.generate({
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
 
    this.els.calHolder.prepend(this.els.calendar);
};
DatePicker.prototype.resetHolder = function() {
    this.sizes.cell = this.els.cells.eq(0).outerWidth();
    this.sizes.calendar = this.sizes.cell * this.els.cells.length;
    
    this.sizes.offset = this.els.calHolder.offset().left;

    this.els.calendar.css({ width: this.sizes.calendar });
    this.els.arrivalBlock.css({ width: this.sizes.calendar });
    this.els.departureBlock.css({ width: this.sizes.calendar });
};

DatePicker.prototype.logic = function() {
    this.els.calendar.on('click', '.calendar-day', $.proxy(this.handleCellsClick, this));
    this.els.calHandles.on('mousedown', $.proxy(this.handleDragBlock, this));
};
DatePicker.prototype.handleCellsClick = function(e) {
    var el = $(e.currentTarget),
        date = el.data('date');

    if (!this.state.checkin && !this.state.checkout) {
        var dateO = this.YMDToDate(date),
            checkout = this.dateToYMD(new Date(dateO.getFullYear(), dateO.getMonth(), dateO.getDate() + this.options.defaultNights));
        
        // First click
        this.state.checkin = date;
        this.state.checkout = checkout;

        this.els.calHolder.addClass('controls');
        this.selectCurrentDates();
    }
    else {
        // n-th click
        
    }
};
DatePicker.prototype.handleDragBlock = function(e) {
    var that = this,
        doc = $(document),
        el = $(e.currentTarget),
        left = el.hasClass('dp-cal-arrival-handle');
    
    var handleBlockMove = function(e) {
        var x = e.pageX - that.sizes.offset;

        if (left) {
            that.els.arrivalBlock.css({ left: x - that.sizes.calendar });
        }
        else {
            that.els.departureBlock.css({ left: x });
        }
    };
    
    var resetHandlers = function() {
        doc.off('.datepicker');
    };
    
    doc.on('mousemove.datepicker', handleBlockMove);
    doc.on('mouseup.datepicker', resetHandlers);
};
DatePicker.prototype.selectCurrentDates = function() {
    var checkin = this.els.cells.filter('[data-date="' + this.state.checkin + '"]'),
        checkout = this.els.cells.filter('[data-date="' + this.state.checkout + '"]');

    this.els.arrivalBlock.css({ left: checkin.position().left + this.sizes.cell / 2 - this.sizes.calendar });
    this.els.departureBlock.css({ left: checkout.position().left + this.sizes.cell / 2 });
};
DatePicker.prototype.dateToYMD = function(date) {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
};
DatePicker.prototype.YMDToDate = function(ymd) {
    var darr = ymd.split('-');
    return new Date(+darr[0], +darr[1] - 1, +darr[2]);
};
