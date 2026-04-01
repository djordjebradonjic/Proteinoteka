/* global Drupal */
/* global jQuery */

;(function ($, window, document, undefined) {
    var pluginName = 'presentcommerce_jquery_catalog',
        defaults = {
            open: false,
			mobile: false
        };
 
    function Plugin(element, options) {
        this.element = $(element);
		
        this.options = $.extend( {}, defaults, Drupal.settings[pluginName]);
 
        this._defaults = defaults;
        this._name = pluginName;
 
        this.init();
    }
 
    Plugin.prototype.init = function () {
		var self = this;
		$.each(this.element.find('ul'), function () {
			var el = $(this);
			var elShow = $(this);
			el.after('<span class="caret"></span>');
			
			if(el.parent().hasClass('active')) return;
				
			el.children().hide();	
					
			el.prev().bind('click', $.proxy(self.toggle, self));
		});
		
		this.open(self.element.find('li.active'));
    };
	
	Plugin.prototype.toggle = function (e) {
		// return if menu contains submenus without it expanding
		if (e !== undefined) return ;

		var el = $(e.currentTarget).next();
		
		this.toggleEl(el);
		e.preventDefault();
	}
	
	Plugin.prototype.toggleEl = function (el) {
		el.children().toggle();
		el.next().toggleClass('caretopen');
	}
	
	Plugin.prototype.open = function (el) {
		if (el.hasClass('vsmenu')) return;
		
		this.toggleEl(el.parents('.menu').not('.vsmenu'));
	}
 
    $.fn[pluginName] = function () {
		var options = Drupal.settings[pluginName];
		
		if (options.mobile || options.open) return;
		
        return this.each(function () {
            if ( !$.data(this, "plugin_" + pluginName )) {
                $.data( this, "plugin_" + pluginName,
                new Plugin(this, options));
            }
        });
    }
 
})(jQuery, window, document);

;(function ($) {
	$(function () {
		$('.vsmenu').presentcommerce_jquery_catalog();
	});
})(jQuery);

;
