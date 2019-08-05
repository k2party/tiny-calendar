/**
 * tiny-calendar.js Tiny calendar view.
 * Copyright (c) 2019 Hasegawa "hasegaki" Akira.
 */
;(function($) {
	var TinyCalendar = function($target, options)
	{
		this._$target = $target;
		this._options = $.extend({
			startDate: moment.now(),
			endDate: null,
			viewDateMin: null,
			viewDateMax: null,
			minDate: null,
			maxDate: null,
			range: 'view',
			firstDay: 0,
			rows: 0,
			weekdays: ['日', '月', '火', '水', '木', '金', '土'],
			events: [],
			eventRender: null,
			eventMouseenter: null,
			eventMouseout: null,
			eventClick: null,
			dayClick: null,
			mouseenter: null,
			mouseout: null,
			rendered: null,
		}, options);
		this._weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
		
		this._options.startDate = this._date(this._options.startDate);
		this._options.minDate = this._date(this._options.minDate,
				moment().startOf('year'));
		this._options.maxDate = this._date(this._options.maxDate,
				moment().startOf('year').add(2, 'y').subtract(1, 'd'));
	}
	
	TinyCalendar.prototype = {
		/**
		 * 初期化
		 */
		_init: function() {
			// ヘッダ部を作成
			var $thead = $('<thead/>');
			$thead.append(this._createHeaderRow());
	
			// ボディ部を作成
			var $tbody = $('<tbody/>', $table);
			$tbody.append(this._createBodyRows(this._options.startDate));
	
			// コンテナ内にカレンダ(table)を構築
			var $table = $('<table class="tc-table"/>');
			$table.append($thead);
			$table.append($tbody);
			this._$target.addClass('tiny-calendar');
			this._$target.html($table);
	
			// イベントを描画
			this.events(this._options.events);
	
			// 描画完了
			this._invokeRendered();
		},
	
		_date: function(date, defaultDate)
		{
			if(date == null) {
				date = defaultDate;
			}
			else if(typeof date == "string" || typeof date == "number") {
				date = moment(date);
			}
			else {
				date = date.clone();
			}
			return date;
		},
	
		/**
		 * ヘッダ部を作成
		 */
		_createHeaderRow: function()
		{
			// ヘッダ部を作成
			var $row = $('<tr class="tc-header-row"/>');
			for(var i = 0;  i < this._weekdays.length; i++) {
				var week = (i + this._options.firstDay) % 7;
				var html = '<th class="tc-{weekday}">{weekday_label}</th>'
					.replace('{weekday}', this._weekdays[week])
					.replace('{weekday_label}', this._options.weekdays[week]);
				$(html).appendTo($row);
			}
			return $row;
		},
		
		/**
		 * ボディ部を作成
		 */
		_createBodyRows: function(startDate)
		{
			// 週の始まりの曜日
			var startWeekday = (this._options.firstDay % 7);
			
			// 週の終わりの曜日
			var endWeekday = (startWeekday == 0)? 6:(startWeekday - 1);
			
			// 月初日
			startDate = startDate.clone().startOf('month');
			
			// 最小日（カレンダーの表示開始日）
			var minDate = startDate.clone();
			while(minDate.day() !== startWeekday) {
				minDate.subtract(1, 'd');
			}
			
			// 月末日
			var endDate = startDate.clone().endOf('month');
			
			// 最大日（カレンダーの表示終了日）
			var maxDate = endDate.clone(); 
			if(this._options.rows == 0) {
				while(maxDate.day() !== endWeekday) {
					maxDate.add(1, 'd');
				}
			}
			else {
				// 表示する行数（週数）が指定されている場合、指定週数後の前日
				maxDate = minDate.clone().add(this._options.rows, 'w').subtract(1, 'd');
			}
	
			// 表示期間をオプションに保存（getViewDateMin、getViewDateMaxで取得可能）
			this._options.viewDateMin = minDate;
			this._options.viewDateMax = maxDate;
			this._options.startDate = startDate;
			this._options.endDate = endDate;
			
			// カレンダーのtbodyの内容を構築
			var rows = [];
			var $row = null;
			var date = minDate.clone();
			while(date.isSameOrBefore(maxDate)) {
				// 週の始まりの曜日の場合、行を開始
				if(date.day() == startWeekday) {
					$row = $('<tr class="tc-date-row"></tr>');
				}
	
				// 日付（セル）を構築
				var $cell = this._createBodyCell(date, startDate, endDate);
				
				// HTMLを取り出して連結
				$row.append($cell);
				
				// 週の終わりの曜日の場合、行を終了
				if(date.day() == endWeekday) {
					rows.push($row);
					$row = null;
				}
	
				// 翌日
				date = date.clone().add(1, 'day');
			}
			return rows;
		},
		
		_createBodyCell: function(date, startDate, endDate)
		{
			var options = this._options;
			var $target = this._$target;
			var regist_event_listener = true;
			
			// 日付（セル）を構築
			var $cell = $('<td class="tc-date"></td>');
			$cell.attr('data-date', date.format('YYYY-MM-DD'));
			$cell.addClass('tc-' + this._weekdays[date.day()]);
			
			// 日付
			var $date = $('<div class="tc-date-date"></div>');
			$date.text(date.date());
	
			// 開始日以前（前月分）の場合、"tc-date-before"クラスを追加
			if(date.isBefore(startDate)) {
				$cell.addClass('tc-date-before');
				if(options.before == 'hidden') {
					$date.html('&nbsp;');
					regist_event_listener = false;
				}
			}
	
			// 終了日以後（翌月分）の場合、"tc-date-after"クラスを追加
			if(date.isAfter(endDate)) {
				$cell.addClass('tc-date-after');
				if(options.after == 'hidden') {
					$date.html('&nbsp;');
					regist_event_listener = false;
				}
			}
			$cell.append($date);
			
			if(regist_event_listener) {
				if(options.dayClick != null && typeof options.dayClick == 'function') {
					$cell.on('click', function(jsEvent) {
						return options.dayClick.call(jsEvent.target, jsEvent, date, $target);
		            });
				}
				
				if(options.mouseenter != null && typeof options.mouseenter == 'function') {
					$cell.on('mouseenter', function(jsEvent) {
		                return options.mouseenter.call(jsEvent.target, jsEvent, date, $target);
		            });
				}
				
				if(options.mouseleave != null && typeof options.mouseleave == 'function') {
					$cell.on('mouseleave', function(jsEvent) {
		                return options.mouseleave.call(jsEvent.target, jsEvent, date, $target);
		            });
				}
			}
			
			return $cell;
		},
		
		_createEvent: function(event) {
	        var options = this._options;
			var $target = this._$target;
	
			// イベントの基本要素を作成
			var $event = $('<div class="tc-event"/>')
				.prop('event', event)
	            .attr('data-date', event.date.format('YYYY-MM-DD'))
	            .text(event.text);
	
			// styleが指定されている場合、style属性を設定。
			if(typeof event.style  == 'string' && event.style != '') {
				$event.attr('style', event.style);
			}
			
			// classが指定されている場合、class属性を設定。
			if(typeof event.class  == 'string' && event.class != '') {
				$event.addClass(event.class);
			}
			// tooltipが指定されている場合、title属性を設定。
	        if(typeof event.tooltip == 'string' && event.tooltip != '') {
	            $event.attr('title', event.tooltip);
	            
	            // tooltipメソッドがある場合、tooltip()を呼び出す
	            if(typeof $event.tooltip == "function") {
	            	$event.tooltip(options.tooltipOptions);
	        	}
			}
	
			// オプションにclick時の処理が設定されている場合、イベントリスナを登録する。			
			if(options.eventClick != null && typeof options.eventClick == 'function') {
				$event.on('click', function(jsEvent) {
	                return options.eventClick.call(jsEvent.target, jsEvent, event, $target);
	            });
			}
			
			// オプションにmouseenter時の処理が設定されている場合、イベントリスナを登録する。			
			if(options.eventMouseenter != null && typeof options.eventMouseenter == 'function') {
				$event.on('mouseenter', function(jsEvent) {
	                return options.eventMouseenter.call(jsEvent.target, jsEvent, event, $target);
	            });
			}
			
			// オプションにmouseleave時の処理が設定されている場合、イベントリスナを登録する。			
			if(options.eventMouseleave != null && typeof options.eventMouseleave == 'function') {
				$event.on('mouseleave', function(jsEvent) {
	                return options.eventMouseleave.call(jsEvent.target, jsEvent, event, $target);
	            });
			}
	
			// オプションにeventRenderが指定されている場合、レンダラ処理（UOC）をコールする。			
			if(options.eventRender != null && typeof options.eventRender == 'function') {
	            return options.eventRender.call($target, event, $event)
	        }
			
			return $event;
		},
		
		_ajax: function()
		{
			var _this = this;
			
			var startDate = this._options.viewDateMin;
			var endDate = this._options.viewDateMax;
			if(this._options.range == 'month') {
				startDate = this._options.startDate.clone().startOf('month');
				endDate = startDate.clone().endOf('month');
			}
	
			$.ajax({
				type: this._options.ajax.type,
				url: this._options.ajax.url,
				cache: false,
				dataType: "json",
				data: {
					start: startDate.format('YYYY-MM-DD'),
					end: endDate.format('YYYY-MM-DD'),
				}
			})
			.done(function (response) {
				_this.events(response.data);
			})
			.fail(function (error) {
				console.error('TinyCalendar: caught server error response', error);
			});
		},
		
		_invokeRendered: function()
		{
			var _rendered = this._options.rendered;
			
			// 描画完了時のイベント通知（コールバック）が未定義の場合は、そのままリターン
			if(_rendered == null) return;
			
			try {
				// イベント通知がfunction（コールバック）の場合は、Reflection.callする
				if(typeof _rendered == 'function') {
					return _rendered.call(this._$target);
				}
				// data-rendered属性で定義された文字列の場合、Functionでラップして実行
				return Function(_rendered)();
			}
			catch(e) {
				console.error('TinyCalendar: `rendered` caught exception', e);
			}
		},
		
		/**
		 * 表示するイベントを差し替える。
		 */
		events: function(events)
		{
			this._options.events = events;
			this._clearEvents();

			try {
				if(typeof events == 'function') {
					events = events(this._$target);
				}
				else if(typeof events == 'string') {
					events = $.parseJSON(events);
				}
				for(var index in events) {
					events[index].date = this._date(events[index].date);
				}
				this._drawEvents(events);
			}
			catch(e) {
				console.error('TinyCalendar: `events` caught exception', e);
			}
		},
		
		setStartDate: function(startDate)
		{
			startDate = this._date(startDate);
			if(startDate == null || startDate.isValid() == false
					|| startDate.isBefore(this._options.minDate)
					|| startDate.isAfter(this._options.maxDate)) {
				return;
			}
	
			// カレンダ（ボディ部）を再構築
			var $tbody = this._$target.find('tbody');
			$tbody.html(this._createBodyRows(startDate));
	
			// イベントを更新
			this.refetchEvents();
			
			// 描画完了
			this._invokeRendered();
		},
	
		next: function()
		{
			// 表示開始日を翌月に移動
			var startDate = this._options.startDate.clone();
			startDate.startOf('month').add(1, 'M');
	
			this.setStartDate(startDate);
		},
	
		prev: function()
		{
			// 表示開始日を前月に移動
			var startDate = this._options.startDate.clone();
			startDate.startOf('month').subtract(1, 'M');
			
			this.setStartDate(startDate);
		},
		
		/**
		 * 表示中のイベントをすべて削除する
		 */
		_clearEvents: function() {
			this._$target.find('tbody .tc-event').remove();
		},
	
		/**
		 * イベントを描画する
		 */
		_drawEvents: function(events)
		{
			var $tbody = this._$target.find('tbody');
			for(var event of events) {
				if(this._options.before == 'hidden'
					&& event.date.isBefore(this._options.startDate)) {
					continue;
				}
				if(this._options.after == 'hidden'
					&& event.date.isAfter(this._options.endDate)) {
					continue;
				}
				var date = event.date.format('YYYY-MM-DD');
				var $cell = $tbody.find('td[data-date="{date}"]'.replace('{date}', date));
				$cell.append(this._createEvent(event));
			}
		},
		
		/**
		 * イベントがajax型の場合、イベントを再ロードする
		 */
		refetchEvents: function()
		{
			if(this._options.ajax != null) {
				this._ajax();
			}
			else {
				this.events(this._options.events);
			}
		},
		
		__getStartDate: function()
		{
			return this._options.startDate.clone();
		},
		
		__getEndDate: function()
		{
			return this._options.endDate.clone();
		},
		
		__getViewDateMin: function()
		{
			return this._options.viewDateMin.clone();
		},
		
		__getViewDateMax: function()
		{
			return this._options.viewDateMax.clone();
		},
	
		__getMinDate: function()
		{
			return this._options.minDate.clone();
		},
		
		__getMaxDate: function()
		{
			return this._options.maxDate.clone();
		},
	};
	
	jQuery.fn.TinyCalendar = function() {
		var args = Array.prototype['slice'].call(arguments);
		if(args.length == 0 || typeof args[0] == 'object') {
			this.each(function(index, target) {
				target._tiny_calendar = new TinyCalendar($(target), args[0]);
				target._tiny_calendar._init();
				if(target._tiny_calendar._options.ajax != null) {
					target._tiny_calendar._ajax();
				}
			});
			return this;
		}
		
		var cmd = args.shift();
		if(cmd.charAt(0) != '_' && typeof TinyCalendar.prototype[cmd] == 'function') {
			this.each(function(index, target) {
				TinyCalendar.prototype[cmd].apply(target._tiny_calendar, args);
			});
			return this;
		}
	
		if(typeof TinyCalendar.prototype['__' + cmd] == 'function') {
			var results = this.map(function(index, target) {
				return TinyCalendar.prototype['__' + cmd].apply(target._tiny_calendar, args);
			});
			return (results.length > 1)? results:results[0];
		}
	
		console.error('TinyCalendar: command "{cmd}" does not exist.'.replace('{cmd}', cmd));
	};
})(jQuery);
