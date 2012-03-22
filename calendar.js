Calendar = function() {
	var cal_days_labels = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'],
		cal_months_labels = ['январь', 'февраль', 'март', 'апрель',
		                   'май', 'июнь', 'июль', 'август', 'сентябрь',
		                   'октябрь', 'ноябрь', 'декабрь'],
   		cal_short_months_labels = ['янв.', 'фев.', 'мар.', 'апр.',
   		                   'май', 'июн.', 'июл.', 'авг.', 'сен.',
   		                   'окт.', 'ноя.', 'дек.'],
		now = new Date();

	return {
		generateTable: function(start, s) {
			var month = start.getMonth(),
				year = start.getFullYear(),
				starting_day = start.getDay() ? (start.getDay() - 1) : 6, // Hacking this to make Monday the first day
				month_length = this.getDaysNum(year, month),
				month_name = cal_months_labels[month],
				now_time = +now;

			var html = '<table class="calendar-table'
			    + (s.classes ? (' ' + s.classes) : '')
			    + '" cellspacing="0" cellpadding="0" data-month="'
				+ (month + 1)
				+ '" data-year="'
				+ year
				+ '">';

			if (s.daylabels) {
			    html += '<thead><tr><th colspan="4">'
			 	+ month_name + '<\/th><th class="calendar-year-label" colspan="3">' + year
				+ '<\/th><\/tr><tr>';
			
    			for(var i = 0; i <= 6; i++ ){
    				html += '<td class="calendar-day-label' + ((i > 4) ? ' calendar-weekend' : '') + '">'
    				+ cal_days_labels[i]
    				+ '<\/td>';
    			}
    			html += '<\/tr><\/thead><tbody><tr>';
			}
			else {
			    html += '<tbody><tr>';
			}

			var day = start.getDate(),
                len = Math.ceil((month_length + starting_day) / 7),
                date_time = +start;

			for (var i = 0; i < len; i++) {
				// this loop is for weekdays (cells)
				for (var j = 0; j <= 6; j++) { 
					var valid = (day <= month_length && (i > 0 || j >= starting_day));

					html += '<td class="calendar-day'
					+ ((now_time > date_time) ? ' past' : '') + '"'

					+ (valid ? ('data-date="'
					+ year
					+ '-'
					+ ('0' + (month + 1)).slice(-2)
					+ '-'
					+ ('0' + day).slice(-2) + '"') : '')

					+ '><span>';

					if (valid) {
						html += day;
						day++;
					}
					else {
						html += '&nbsp;';
					}
					html += '<\/span><\/td>';
					
					date_time += 86400000;
				}
				// stop making rows if we've run out of days
				if (day > month_length) {
					break;
				} else {
					html += '<\/tr><tr>';
				}
			}
			html += '<\/tr><\/tbody><\/table>';

			return html;
		},
		generateList: function(start, s) {
			var month = start.getMonth(),
				year = start.getFullYear(),
				month_length = this.getDaysNum(year, month),
				now_time = +now;

			var html = '';

			// fill in the days
			var day = start.getDate(),
			    date_day = start.getDay(),
			    date_time = +start;

			for (; day <= month_length; day++) {
				var firstweek = (day <= 7);

				html += '<li class="calendar-day'
				+ (firstweek && !s.first_month ? ' firstweek' : '')
				+ ((day === 1 && s.first_month) ? ' firstday' : '')
				+ ((s.monthlabels && !s.mlabels_firstday && (date_day === 0) && firstweek) ? ' monthlabel' : '')
                + ((s.monthlabels && s.mlabels_firstday && (day === 1)) ? ' monthlabel' : '')
				+ ((date_day === 1) ? ' monday' : '')
				+ ((date_day === 0 || date_day === 6) ? ' weekend' : '')
				+ ((now_time > date_time) ? ' past' : '') + '"'
				
				+ ((day === 1) ? (' data-started="'
				+ year
				+ '-'
				+ ('0' + (month + 1)).slice(-2) + '"') : '')
				
				+ ' data-date="'
				+ year
				+ '-'
				+ ('0' + (month + 1)).slice(-2)
				+ '-'
				+ ('0' + day).slice(-2) + '"'
				
				+ '><span>'
				+ day
                + ((s.daylabels) ? '<em>' + cal_days_labels[date_day ? date_day - 1 : 6] + '<\/em>' : '')
				+ '<\/span>'
                + ((s.monthlabels && !s.mlabels_firstday && (date_day === 0) && firstweek) ? '<strong>' + cal_months_labels[month] + '<\/strong>' : '')
                + ((s.monthlabels && s.mlabels_firstday && (day === 1)) ? '<strong>' + cal_months_labels[month] + '<\/strong>' : '')
				+ '<\/li>';

				date_time += 86400000; // 1000*60*60*24

				date_day++;
				(date_day > 6) && (date_day = 0);
			}

			return html;
		},
		generate: function(s) {
		    var e,
    		    t,
    		    i,
    		    fill_cells,
    		    html ='';

            t = new Date(s.start.year, s.start.month - 1, s.start.day || 1);
            e = new Date(s.end.year, s.end.month);
            
            s.first_month = true;
            
            if (s.type === 'list') {
    		    html = '<ul class="calendar-list'
    		    + (s.classes ? (' ' + s.classes) : '')
    		    + '">';
    		    
                if (s.nogaps) {
                    fill_cells = (t.getDay() ? t.getDay() : 7)  - 1;
        		    for(i = 0; i < fill_cells; i++ ){
                        html += '<li class="empty"><\/li>';
        			}
                }
    		}

            do {
                if (s.type === 'list') {
                    html += this.generateList(t, s);
                }
                else {
                    html += this.generateTable(t, s);
                }
                t = new Date(t.getFullYear(), t.getMonth() + 1);
                s.first_month = false;
            } while (+t !== +e)

            if (s.type === 'list') {
                if (s.nogaps) {
                    fill_cells = 7 - (new Date(e - 86400000)).getDay();
                    if (fill_cells < 7) {
                        for(i = 0; i < fill_cells; i++ ){
                            html += '<li class="empty"><\/li>';
        			    }
    		        }
                }
		        html += '<\/ul>';
    	    }
		    
            return html;
		},
		getDaysNum: function(year, month) { // nMonth is 0 thru 11
			return 32 - new Date(year, month, 32).getDate();
		}
	};
}();
