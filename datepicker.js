/**
 * @require 'js/calendar.js'
 */

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
            vpsel: '.dp-viewport-sel',

            calCrop: '.dp-cal-crop',
            calWrap: '.dp-cal-wrap',

            calHolder: '.dp-cal-holder',
            calControls: '.dp-cal-controls',

            calHandles: '.dp-cal-handle',
            lArea: '.dp-cal-left-area',
            rArea: '.dp-cal-right-area',
            mArea: '.dp-cal-middle-area',
            
            trans: '.dp-translucency',

            lHandle: '.dp-cal-left-handle',
            rHandle: '.dp-cal-right-handle'
        },
        months: 11,
        defaultNights: 4,
        maxNights: 10
    }, options);

    this.ready = false;
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
    this.start = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    this.end = new Date(this.start.getFullYear(), this.start.getMonth() + this.options.months, this.start.getDate());

    this.generateCalendar();
    this.getSizes();    
    this.generateLabels();
    this.setSizes();

    this.logic();
    
    this.ready = true;
    
    $.pub('datepicker_ready');
};
// ==================================================================
// GENERATION SEKSHEN
// ==================================================================
DatePicker.prototype.generateCalendar = function() {
    this.els.calendar = $(Calendar.generate({
        start: {
            year: this.start.getFullYear(),
            month: this.start.getMonth() + 1
        },
        end: {
            year: this.end.getFullYear(),
            month: this.end.getMonth() + 1
        },
        daylabels: true,
        monthlabels: true,
        mlabels_firstday: true,
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
    
    this.sizes.minindex = this.today.getDate() - 1;
    this.sizes.minindexpos = this.sizes.minindex * this.sizes.cell;

    this.sizes.monthLabel = (this.sizes.wrap / (this.options.months + 1)) | 0;
    this.sizes.viewpos = 0;
    this.sizes.viewport = (this.sizes.wrap * this.sizes.wrap) / (this.sizes.wrap + this.sizes.calendar);

    this.sizes.monthq = this.sizes.cell / (this.sizes.calendar / this.sizes.wrap);
    this.sizes.calq = (this.sizes.calendar - this.sizes.wrap) / (this.sizes.wrap - this.sizes.viewport);
};
DatePicker.prototype.generateLabels = function() {
    var monthLabels = '<ul class="calendar-month-labels">',
        curr = this.start.getMonth(),
        year = this.start.getFullYear(),
        len = 0,
        
        width = 0,
        sum = 0;

    for (var i = 0; i <= this.options.months; i++) {
        len = Calendar.getDaysNum(year, curr);
        width = (this.sizes.monthq * len) | 0;
        sum += width;
        monthLabels += '<li style="width: ' + width + 'px;">' + this.locale.month_labels[curr] + '<\/li>';
        curr = (curr === 11) ? 0 : (curr + 1);
    }

    monthLabels += '<\/ul>';
    
    this.els.monthsLabels = $(monthLabels);
    this.els.monthsLabels.css({ width: sum });
    this.els.monthsHolder.prepend(this.els.monthsLabels);
};
DatePicker.prototype.setSizes = function() {
    this.els.calendar.css({ width: this.sizes.calendar });
    this.els.viewport.css({ width: this.sizes.viewport, left: 0 });

    this.setCalPos(this.sizes.minindexpos);
};
// ==================================================================
// LOGYK SECTION
// ==================================================================
DatePicker.prototype.logic = function() {
    this.mainLogic();
    this.labelsLogic();
    
    this.controlsLogic();
    
    if (this.options.lDate && this.options.rDate) {
        this.calendarLoadState();
    }
    else {
        this.calendarLogic();
    }
};
DatePicker.prototype.mainLogic = function() {
    var that = this;
    var resetOffset = function() {
        that.sizes.offset = that.els.calCrop.offset().left;
    };
    
    var handleMouseScroll = function(e, d) {
        e.preventDefault();
        
        (d > 0) ? that.moveCalRight() : that.moveCalLeft();
    };
    
    $(window).on('resize', resetOffset);
    
    if (/*@cc_on!@*/false) { // check for Internet Explorer
        var preventSelect = function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        this.container.on('selectstart', preventSelect);
    }
    
    this.container.bind('mousewheel', handleMouseScroll);
};
DatePicker.prototype.labelsLogic = function() {
    var that = this,
        doc = $(document),
        renderT = +(new Date());
        
    var compOffset = function(x) {
        return x - that.sizes.offset - that.sizes.viewport / 2;
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

        that.moveCal(compOffset(e.pageX));
    };
    var vpDragEnd = function(e) {
        doc.off('mousemove.datepicker', vpDragMove);
        doc.off('mouseup.datepicker', vpDragEnd);
    };
    
    var vpMoveByClick = function(e) {
        that.moveCal(compOffset(e.pageX));
    };

    this.els.viewport.on('mousedown', vpDragStart);
    this.els.monthsHolder.on('click', vpMoveByClick);
};
DatePicker.prototype.calendarLogic = function() {
    var that = this;
    var handleCellsClick = function(e) {
        var el = $(this),
            dateO = that.YMDToDate(el.data('date')),
            dates = that.sanitizeDates(
                dateO, 
                new Date(dateO.getFullYear(), dateO.getMonth(), dateO.getDate() + that.options.defaultNights)
            );
        
        that.setPosFromDates(dates[0], dates[1]);
        that.container.addClass('controls');

        that.els.calendar.off('click', '.calendar-day', handleCellsClick);
    };
    this.els.calendar.on('click', '.calendar-day', handleCellsClick);
};
DatePicker.prototype.calendarLoadState = function() {
    var dates = this.sanitizeDates(this.YMDToDate(this.options.lDate), this.YMDToDate(this.options.rDate)),
        lCell = this.els.cells.filter('[data-date="' + dates[0] + '"]');

    this.setPosFromDates(dates[0], dates[1]);
    
    this.setCalPos(lCell.index() * this.sizes.cell - (this.sizes.wrap / 2) + (this.state.rHandle - this.state.lHandle + 1) * (this.sizes.cell / 2));

    this.container.addClass('controls');
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
        
    var checkLeftPos = function(pos) {
        return ((that.sizes.shift !== 0) && (pos - that.sizes.offset - that.sizes.cell < 0));
    };
    
    var checkRightPos = function(pos) {
        return ((that.sizes.shift - that.sizes.wrap !== that.sizes.calendar) && (pos - that.sizes.offset - that.sizes.wrap + that.sizes.cell > 0));
    };
    
    var compOffset = function(x) {
        return x - that.sizes.offset - that.sizes.shift;
    };

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
        
        if (left) {
            var pos = Math.min(that.state.rHandle - 1, Math.max(that.sizes.minindex, Math.ceil(compOffset(e.pageX) / that.sizes.cell) - 1));        
            checkLeftPos(e.pageX) && that.moveCalLeft();
            that.setHandlesPos(pos, that.state.rHandle);
        }
        else {
            var pos = Math.min(len - 1, Math.max(that.state.lHandle + 1, Math.ceil(compOffset(e.pageX) / that.sizes.cell) - 1));
            checkRightPos(e.pageX) && that.moveCalRight();
            that.setHandlesPos(that.state.lHandle, pos);
        }
    };
    var handleDragEnd = function(e) {
        doc.off('mousemove.datepicker', handleDragMove);
        doc.off('mouseup.datepicker', handleDragEnd);

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

        var diff = compOffset(e.pageX) - startP,
            idiff = that.state.rHandle - that.state.lHandle,
            x, i;
        
        if (e.pageX - startP <= 0) {
            x = mLeft + diff;
            i = Math.min(len - 1 + idiff, Math.max(that.sizes.minindex, Math.ceil(x / that.sizes.cell) - 1));
            that.setHandlesPos(i, i + idiff);

            checkLeftPos(e.pageX - mWidth) && that.moveCalLeft();   
        }
        else {
            x = mLeft + mWidth + diff;
            i = Math.min(len - 1, Math.max(that.sizes.minindex + idiff, Math.ceil(x / that.sizes.cell) - 1));
            that.setHandlesPos(i - idiff, i);

            checkRightPos(e.pageX + mWidth) && that.moveCalRight();
        }
        
        // FIXME: shift controls holder instead of moving the handles. Though in introduces even another shifting layer
    };
    var areaDragEnd = function(e) {
        doc.off('mousemove.datepicker', areaDragMove);
        doc.off('mouseup.datepicker', areaDragEnd);
        
        that.setDatesFromPos();
    };

    var areaMoveByClick = function(e) {
        var pos = e.pageX - (that.els.mArea.width() / 2) - that.sizes.offset - that.sizes.shift,
            x = pos,
            idiff = that.state.rHandle - that.state.lHandle,
            i = Math.min(len - 1 - idiff, Math.max(that.sizes.minindex, Math.ceil(x / that.sizes.cell) - 1));

        that.setHandlesPos(i, i + idiff);
        that.setDatesFromPos();
    };

    this.els.calHandles.on('mousedown', handleDragStart);
    this.els.mArea.on('mousedown', areaDragStart);
    
    this.els.trans.on('click', areaMoveByClick);
};
// ==================================================================
// UTILITY SECTION
// ==================================================================
DatePicker.prototype.sanitizeDates = function(lDateO, rDateO) {
    var lim = new Date(this.end.getFullYear(), this.end.getMonth(), Calendar.getDaysNum(this.end.getFullYear(), this.end.getMonth())),
        lDate, rDate;

    if (+lDateO < +this.today) {
        lDate = this.dateToYMD(this.today);
        rDate = this.dateToYMD(new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() + this.options.defaultNights));
    }
    else if (+rDateO > +lim) {
        lDate = this.dateToYMD(new Date(lim.getFullYear(), lim.getMonth(), lim.getDate() - this.options.defaultNights));
        rDate = this.dateToYMD(lim);
    }
    else {
        lDate = this.dateToYMD(lDateO);
        rDate = this.dateToYMD(rDateO);
    }

    return [lDate, rDate];
};
DatePicker.prototype.setPosFromDates = function(lDate, rDate) {
    var lCell = this.els.cells.filter('[data-date="' + lDate + '"]'),
        rCell = this.els.cells.filter('[data-date="' + rDate + '"]');
        
    this.state.lDate = lDate;
    this.state.rDate = rDate;

    this.setHandlesPos(lCell.index(), rCell.index());
    
    $.pub('datepicker_dates_changed');
};
DatePicker.prototype.setDatesFromPos = function() {
    this.state.lDate = this.els.cells.eq(this.state.lHandle).data('date');
    this.state.rDate = this.els.cells.eq(this.state.rHandle).data('date');
    
    $.pub('datepicker_dates_changed');
};
DatePicker.prototype.setHandlesPos = function(l, r) {
    this.state.lHandle = l;
    this.state.rHandle = r;
    
    this.els.lArea.css({ left: this.sizes.cell * l + this.sizes.cell / 2 - this.sizes.calendar });
    this.els.rArea.css({ left: this.sizes.cell * r + this.sizes.cell / 2 });
    
    this.setMiddlePos();
    this.setVPSelPos();
    
    $.pub('datepicker_dates_moved');
};
DatePicker.prototype.setMiddlePos = function() {
    this.els.mArea.css({
        width: this.sizes.cell * (this.state.rHandle - this.state.lHandle),
        left: this.sizes.cell * this.state.lHandle + this.sizes.cell / 2
    });
};
DatePicker.prototype.setVPSelPos = function() {
    var diff = this.state.rHandle - this.state.lHandle;
    
    this.els.vpsel.css({ width: this.sizes.monthq * diff, left: this.sizes.monthq * this.state.lHandle });
};
DatePicker.prototype.moveCal = function(pos) {
    var x = Math.min(this.sizes.wrap - this.sizes.viewport, Math.max(0, pos));

    this.sizes.shift = -x * this.sizes.calq;
    this.sizes.viewpos = x;

    this.els.calWrap.css({ left: this.sizes.shift });
    this.els.viewport.css({ left: this.sizes.viewpos });
};
DatePicker.prototype.setCalPos = function(pos) {
    var x = Math.min(this.sizes.calendar - this.sizes.wrap, Math.max(0, pos));

    this.sizes.shift = -x;
    this.sizes.viewpos = x / this.sizes.calq;

    this.els.calWrap.css({ left: this.sizes.shift });
    this.els.viewport.css({ left: this.sizes.viewpos });
};
DatePicker.prototype.moveCalLeft = function() {
    this.moveCal(this.sizes.viewpos - 1);
};
DatePicker.prototype.moveCalRight = function() {
    this.moveCal(this.sizes.viewpos + 1);    
};
DatePicker.prototype.dateToYMD = function(date) {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
};
DatePicker.prototype.YMDToDate = function(ymd) {
    var darr = ymd.split('-');
    return new Date(+darr[0], +darr[1] - 1, +darr[2]);
};
