(function ($) {
  Drupal.behaviors.commerce_add_to_cart_confirmation_overlay = {
    attach:function (context, settings) {
      var overlayClass = 'commerce_add_to_cart_confirmation_overlay';
      var overlayParentSelector = 'body';

      // Determine the appropriate overlay class and parent selector based on the settings array.
      if (typeof settings.commerceAddToCartConfirmation != 'undefined') {
        if (typeof settings.commerceAddToCartConfirmation.overlayClass != 'undefined') {
          overlayClass = settings.commerceAddToCartConfirmation.overlayClass;
        }

        if (typeof settings.commerceAddToCartConfirmation.overlayParentSelector != 'undefined') {
          overlayParentSelector = settings.commerceAddToCartConfirmation.overlayParentSelector;
        }
      }

      if ($('.commerce-add-to-cart-confirmation').length > 0) {
        // Add the background overlay.
        $(overlayParentSelector).append('<div class="' + overlayClass + '"></div>');

        // Enable the close link.
        $('.commerce-add-to-cart-confirmation-close').bind('click touchend', function(e) {
          e.preventDefault();
          $('.commerce-add-to-cart-confirmation').remove();
          $('.' + overlayClass).remove();
        });
      }
    }
  }
})(jQuery);
;
(function ($) {
  Drupal.behaviors.ga_push_browser = {
    attach: function (context, settings) {
      Drupal.settings.ga_push_browser = Drupal.settings.ga_push_browser || {};
      $.each(Drupal.settings.ga_push_browser, function(index, value) {
        $(value['selector'], context).once('ga_push_browser_listener', function () {
          $elem = $(this);
          $elem.bind(value['bind'], function() {
            // Make sure the fourth argument is numeric and if not set it to 0.
            value['push'][3] = Number(value['push'][3]) || 0;
            // @TODO: {'nonInteraction': value['push'][4]};

            // Universal analytics:
            if (typeof(ga) == 'function') {
              ga('send', 'event', value['push'][0], value['push'][1], value['push'][2], value['push'][3]);
            }
            // Classic analytics:
            else if (typeof(_gaq) == 'object') {
              _gaq.push(['_trackEvent', value['push'][0], value['push'][1], value['push'][2] , value['push'][3]]);
            }
          });
        });
      });
    }
  };
})(jQuery);;
(function ($) {

	$(document).ready(function() {

		$('#edit-terms-conditions-newsletter').click(function(e) {
			var email = $('#edit-account-login-mail').val() !== undefined ? $('#edit-account-login-mail').val() : userMail;
			console.log(email);
			if(!$(this).is(':checked')) {
				$.ajax({
					type: "POST",
					url: "/ajax/newsletter",
					data: {email: email, action: 'unsubscribe'}
				});
			}
			else {
				$.ajax({
					type: "POST",
					url: "/ajax/newsletter",
					data: {email: email, action: 'subscribe'}
				});
			}
		});

	});

})(jQuery);
;
(function ($) {
  	// All your code here
	//Drupal.attachBehaviors();
	$.get("/ajax/mode_switcher_get", function (data) {
		//alert(data);
		if(data=="list"){
			$("#views-exposed-form-proizvodi-page").parent().parent().removeClass("product-grid");
			$("#views-exposed-form-proizvodi-page").parent().parent().addClass("product-list");
		}
		else{
			$("#views-exposed-form-proizvodi-page").parent().parent().removeClass("product-list");
			$("#views-exposed-form-proizvodi-page").parent().parent().addClass("product-grid");
		}
	});
		
	$(document).ready(function() {						
		// Handler for .ready() called.
		$( "#switch-list" ).click(function(e) {
			$("#views-exposed-form-proizvodi-page").parent().parent().removeClass("product-grid");
			$("#views-exposed-form-proizvodi-page").parent().parent().addClass("product-list");
			$.ajax({
				type: "POST",
				url: "/ajax/mode_switcher_set",
				data: { mode: "list" }
			});
			
			e.preventDefault();
		});
		
		$( "#switch-grid" ).click(function(e) {
			$("#views-exposed-form-proizvodi-page").parent().parent().removeClass("product-list");
			$("#views-exposed-form-proizvodi-page").parent().parent().addClass("product-grid");
			$.ajax({
				type: "POST",
				url: "/ajax/mode_switcher_set",
				data: { mode: "grid" }
			});
			
			e.preventDefault();
		});					
	});
	
})(jQuery);;
(function ($) {
  	// All your code here
	//Drupal.attachBehaviors();
	
		
	$(document).ready(function() {
	// Handler for .ready() called.
		$(".cart-contents-block").slideToggle("fast");
		$(".cart-contents-block").css('display', 'none');
		
		$(".l-main").click(function () {
			$(".cart-contents-block:visible").slideToggle("fast");
		});
		
		$(".cart-block-title .cart-icon").click(function () {
			$(".cart-contents-block").slideToggle("fast");
		});	
						
	});
	
})(jQuery);;
(function($) {
  Drupal.behaviors.simple_cookie_compliance = {
    attach: function () {
      // Show cookie compliance message if the cookie is not set.
      if (document.cookie.indexOf('simple_cookie_compliance_dismissed=') == -1) {
        $('#cookie-compliance').show();
      }
    }
  }
}(jQuery));
;
