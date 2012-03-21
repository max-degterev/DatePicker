// ==================================================================
// INIT SECTION
// ==================================================================
var DatePicker = function(container, options) {
    this.container = (typeof container === 'string') ? $(container) : container;

    if (!this.container.length) {
        console.log('[DatePicker]: no container provided or found');
    }

    this.options = $.extend({
        selectors: {
            monthsHolder: '.dp-months-holder',

            calWrap: '.dp-cal-wrap',

            calHolder: '.dp-cal-holder',
            calControls: '.dp-cal-controls',

            calHandles: '.dp-cal-handle',
            lArea: '.dp-cal-left-area',
            rArea: '.dp-cal-right-area',
            mArea: '.dp-cal-middle-area',

            lHandle: '.dp-cal-left-handle',
            rHandle: '.dp-cal-right-handle'
        },
        months: 12,
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
    console.log('init: ' + ((+(new Date()) - this.profiler.start)));

    this.state = {};
    this.els = {};
    this.sizes = {};
    
    for (var prop in this.options.selectors) {
        this.els[prop] = this.container.find(this.options.selectors[prop]);
    }

    this.now = new Date();
    this.start = new Date(this.now.getFullYear(), this.now.getMonth(), this.now.getDate());
    this.end = new Date(this.now.getFullYear(), this.now.getMonth() + this.options.months, this.now.getDate());
    

    this.generateLabels();
    console.log('labels: ' + ((+(new Date()) - this.profiler.start)));

    this.generateCalendar();
    console.log('calendar: ' + ((+(new Date()) - this.profiler.start)));
    
    this.getSizes();

    this.logic();
};
// ==================================================================
// GENERATION SEKSHEN
// ==================================================================
DatePicker.prototype.generateLabels = function() {
    var monthLabels = '<ul class="calendar-month-labels">',
        curr = this.start.getMonth();
    
    for (var i = 0; i < this.options.months; i++) {
        monthLabels += '<li>' + this.locale.month_labels[curr] + '<\/li>';
        curr = (curr === 11) ? 0 : (curr + 1);
    }

    monthLabels += '<\/ul>';

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

    this.els.calHolder.html(this.els.calendar);
    this.els.cells = this.els.calendar.children('.calendar-day');
};
DatePicker.prototype.getSizes = function() {
    this.sizes.cell = this.els.cells.eq(0).outerWidth();
    this.sizes.calendar = this.sizes.cell * this.els.cells.length;
    
    this.sizes.offset = this.els.calHolder.offset().left;

    this.els.calendar.css({ width: this.sizes.calendar });
};
// ==================================================================
// LOGYK SECTION
// ==================================================================
DatePicker.prototype.logic = function() {
    this.mainLogic();
    this.calendarLogic();
    this.controlsLogic();
};
DatePicker.prototype.mainLogic = function() {
    var that = this;
    var resetOffset = function() {
        that.sizes.offset = that.els.calHolder.offset().left;
    };
    $(window).on('resize', resetOffset);
};
DatePicker.prototype.calendarLogic = function() {
    var that = this;
    var handleCellsClick = function(e) {
        var el = $(this),
            date = el.data('date'),
            dateO = that.YMDToDate(date),
            ndate = that.dateToYMD(new Date(dateO.getFullYear(), dateO.getMonth(), dateO.getDate() + that.options.defaultNights));

        that.state.lDate = date;
        that.state.rDate = ndate;

        that.els.calWrap.addClass('controls');
        that.setPosFromDates();
        
        this.els.calendar.off('click', '.calendar-day', handleCellsClick);
    };
    this.els.calendar.on('click', '.calendar-day', handleCellsClick);
};

DatePicker.prototype.controlsLogic = function() {
    var that = this,
        doc = $(document),
        renderT = +(new Date()),
        len = that.els.cells.length;

    var handleDragStart = function(e) {
        var el = $(this),
            left = el.hasClass('dp-cal-left-handle');
    
        var handleDragMove = function(e) {
            var now = +(new Date());
            if (now - renderT < 30) {
                return;
            }

            renderT = now;

            var x = e.pageX - that.sizes.offset,
                i, pos;
        
            if (left) {
                i = Math.min(that.state.rHandle - 1, Math.max(1, Math.ceil(x / that.sizes.cell)));
            }
            else {
                i = Math.min(len, Math.max(that.state.lHandle + 1, Math.ceil(x / that.sizes.cell)));
            }
            
            pos = that.sizes.cell * i - that.sizes.cell / 2;

            if (left) {
                that.state.lHandle = i;
            }
            else {
                that.state.rHandle = i;
            }

            that.setHandlePos();
        };
    
        var handleDragEnd = function() {
            doc.off('mousemove.datepicker', handleDragMove);
            doc.off('mouseup.datepicker', handleDragEnd);
        
            that.setDatesFromPos();
        
            that.els.calWrap.removeClass('dragging');
        };

        doc.on('mousemove.datepicker', handleDragMove);
        doc.on('mouseup.datepicker', handleDragEnd);

        that.els.calWrap.addClass('dragging');
    };

    this.els.calHandles.on('mousedown', handleDragStart);
};
// ==================================================================
// UTILITY SECTION
// ==================================================================
DatePicker.prototype.setPosFromDates = function() {
    var lDate = this.els.cells.filter('[data-date="' + this.state.lDate + '"]'),
        rDate = this.els.cells.filter('[data-date="' + this.state.rDate + '"]');
        
    this.state.lHandle = lDate.index() + 1;
    this.state.rHandle = rDate.index() + 1;

    this.setHandlePos();
};
DatePicker.prototype.setHandlePos = function() {
    this.els.lArea.css({ left: this.sizes.cell * this.state.lHandle - this.sizes.cell / 2 - this.sizes.calendar });
    this.els.rArea.css({ left: this.sizes.cell * this.state.rHandle - this.sizes.cell / 2 });
};
DatePicker.prototype.setDatesFromPos = function() {
    this.state.lDate = this.els.cells.eq(this.state.lHandle - 1).data('date');
    this.state.rDate = this.els.cells.eq(this.state.rHandle - 1).data('date');
};
DatePicker.prototype.dateToYMD = function(date) {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
};
DatePicker.prototype.YMDToDate = function(ymd) {
    var darr = ymd.split('-');
    return new Date(+darr[0], +darr[1] - 1, +darr[2]);
};
