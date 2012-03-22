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
            viewport: '.dp-viewport',

            calCrop: '.dp-cal-crop',
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
    
    console.log('select: ' + ((+(new Date()) - this.profiler.start)));

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
    
    for (var i = 0; i <= this.options.months; i++) {
        monthLabels += '<li>' + this.locale.month_labels[curr] + '<\/li>';
        curr = (curr === 11) ? 0 : (curr + 1);
    }

    monthLabels += '<\/ul>';
    
    this.els.monthsLabels = $(monthLabels);
    this.els.monthsHolder.prepend(this.els.monthsLabels);
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

    this.sizes.offset = this.els.calCrop.offset().left;
    
    this.sizes.wrap = this.els.calCrop.outerWidth();
    this.sizes.shift = parseInt(this.els.calWrap.css('left'), 10);
    
    this.sizes.monthLabel = (this.sizes.wrap / (this.options.months + 1)) | 0;
    this.sizes.voffset = (this.sizes.monthLabel * (Calendar.getDaysNum(this.start.getFullYear(), this.start.getMonth()) - this.start.getDate()) / 30) | 0;
    this.sizes.viewport = this.sizes.wrap * (this.sizes.wrap - this.sizes.voffset) / this.sizes.calendar;//or this.sizes.monthLabel;

    this.els.calendar.css({ width: this.sizes.calendar });
    this.els.viewport.css({ width: this.sizes.viewport, left: this.sizes.voffset });
    this.els.monthsLabels.children('li').css({ width: this.sizes.monthLabel });
};
// ==================================================================
// LOGYK SECTION
// ==================================================================
DatePicker.prototype.logic = function() {
    this.mainLogic();
    this.labelsLogic();
    this.calendarLogic();
    this.controlsLogic();
};
DatePicker.prototype.mainLogic = function() {
    var that = this;
    var resetOffset = function() {
        that.sizes.offset = that.els.calCrop.offset().left;
    };
    $(window).on('resize', resetOffset);
};
DatePicker.prototype.labelsLogic = function() {
    var that = this,
        doc = $(document),
        renderT = +(new Date()),
        q = (this.sizes.calendar - this.sizes.wrap) / (this.sizes.wrap - this.sizes.viewport - that.sizes.voffset);
        
    var getOffsetByPos = function(pageX) {
        return Math.min(that.sizes.wrap - that.sizes.viewport - that.sizes.voffset, Math.max(0, pageX - that.sizes.offset - that.sizes.viewport / 2))
    };
    
    var vpDragStart = function(e) {
        doc.on('mousemove.datepicker', vpDragMove);
        doc.on('mouseup.datepicker', vpDragEnd);
    };
    var vpDragMove = function(e) {
        var now = +(new Date());
        if (now - renderT < 30) {
            return;
        }

        renderT = now;
        var x = getOffsetByPos(e.pageX);
        
        that.sizes.shift = -x * q;
        that.setCalShift(x + that.sizes.voffset);
    };
    var vpDragEnd = function(e) {
        doc.off('mousemove.datepicker', vpDragMove);
        doc.off('mouseup.datepicker', vpDragEnd);
    };
    
    var vpMoveByClick = function(e) {
        var x = getOffsetByPos(e.pageX);
        that.sizes.shift = -x * q;
        that.setCalShift(x + that.sizes.voffset);
    };

    this.els.viewport.on('mousedown', vpDragStart);
    this.els.monthsHolder.on('click', vpMoveByClick);
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
        
        that.els.calendar.off('click', '.calendar-day', handleCellsClick);
    };
    this.els.calendar.on('click', '.calendar-day', handleCellsClick);
};

DatePicker.prototype.controlsLogic = function() {
    var that = this,
        doc = $(document),
        renderT = +(new Date()),
        len = that.els.cells.length,
        
        // handles specific
        left,
        
        //areas specific
        mWidth,
        mLeft,
        startP;

    var handleDragStart = function(e) {
        var el = $(this);
        
        left = el.hasClass('dp-cal-left-handle');
        that.els.calWrap.addClass('dragging');

        doc.on('mousemove.datepicker', handleDragMove);
        doc.on('mouseup.datepicker', handleDragEnd);
    };
    var handleDragMove = function(e) {
        var now = +(new Date());
        if (now - renderT < 30) {
            return;
        }

        renderT = now;

        var x = e.pageX - that.sizes.offset - that.sizes.shift,
            i;
        
        if (left) {
            i = Math.min(that.state.rHandle - 1, Math.max(0, Math.ceil(x / that.sizes.cell) - 1));
        }
        else {
            i = Math.min(len - 1, Math.max(that.state.lHandle + 1, Math.ceil(x / that.sizes.cell) - 1));
        }

        if (left) {
            that.state.lHandle = i;
        }
        else {
            that.state.rHandle = i;
        }

        that.setHandlePos();
    };
    var handleDragEnd = function(e) {
        doc.off('mousemove.datepicker', handleDragMove);
        doc.off('mouseup.datepicker', handleDragEnd);
        
        that.setMiddlePos();
        that.setDatesFromPos();
        
        that.els.calWrap.removeClass('dragging');
    };
    
    var areaDragStart = function(e) {
        e.stopPropagation();
        
        mWidth = that.els.mArea.width();
        mLeft = that.els.mArea.offset().left;
        startP = e.pageX;

        doc.on('mousemove.datepicker', areaDragMove);
        doc.on('mouseup.datepicker', areaDragEnd);
    };
    var areaDragMove = function(e) {
        var now = +(new Date());
        if (now - renderT < 30) {
            return;
        }

        renderT = now;

        var diff = e.pageX - startP - that.sizes.offset - that.sizes.shift,
            idiff = that.state.rHandle - that.state.lHandle,
            x, i;
        
        if (diff > 0) {
            x = mLeft + mWidth + diff;
            i = Math.min(len - 1, Math.ceil(x / that.sizes.cell) - 1);
            that.state.lHandle = i - idiff;
            that.state.rHandle = i;
        }
        else {
            x = mLeft + diff;
            i = Math.max(0, Math.ceil(x / that.sizes.cell) - 1);
            that.state.lHandle = i;
            that.state.rHandle = i + idiff;
        }
        
        // FIXME: shift controls holder instead of moving the handles
        that.setHandlePos();
        that.setMiddlePos();
    };
    var areaDragEnd = function(e) {
        doc.off('mousemove.datepicker', areaDragMove);
        doc.off('mouseup.datepicker', areaDragEnd);
        
        that.setDatesFromPos();
    };


    this.els.calHandles.on('mousedown', handleDragStart);
    this.els.mArea.on('mousedown', areaDragStart);
};
// ==================================================================
// UTILITY SECTION
// ==================================================================
DatePicker.prototype.setPosFromDates = function() {
    var lDate = this.els.cells.filter('[data-date="' + this.state.lDate + '"]'),
        rDate = this.els.cells.filter('[data-date="' + this.state.rDate + '"]');
        
    this.state.lHandle = lDate.index();
    this.state.rHandle = rDate.index();

    this.setHandlePos();
    this.setMiddlePos();
};
DatePicker.prototype.setDatesFromPos = function() {
    this.state.lDate = this.els.cells.eq(this.state.lHandle).data('date');
    this.state.rDate = this.els.cells.eq(this.state.rHandle).data('date');
};
DatePicker.prototype.setHandlePos = function() {
    this.els.lArea.css({ left: this.sizes.cell * this.state.lHandle + this.sizes.cell / 2 - this.sizes.calendar });
    this.els.rArea.css({ left: this.sizes.cell * this.state.rHandle + this.sizes.cell / 2 });
};
DatePicker.prototype.setMiddlePos = function() {
    this.els.mArea.css({
        width: this.sizes.cell * (this.state.rHandle - this.state.lHandle),
        left: this.sizes.cell * this.state.lHandle + this.sizes.cell / 2
    });
};
DatePicker.prototype.setCalShift = function(x) {
    this.els.viewport.css({ left: x });
    this.els.calWrap.css({ left: this.sizes.shift });
};
DatePicker.prototype.dateToYMD = function(date) {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
};
DatePicker.prototype.YMDToDate = function(ymd) {
    var darr = ymd.split('-');
    return new Date(+darr[0], +darr[1] - 1, +darr[2]);
};
