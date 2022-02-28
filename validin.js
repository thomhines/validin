/*
* validin
* Elegant form validation
* Copyright (c) 2017-2022 Thom Hines
* Licensed under MIT.
* @author Thom Hines
* https://github.com/thomhines/validin
* @version 0.1.4
*/

var validin_default_options = {
	validation_tests: {
		'alpha': {
			'regex': /[a-zA-Z]*/,
			'error_message': "This can only contain only letters"
		},
		'alpha_num': {
			'regex':  /[A-Z0-9]*/i,
			'error_message': "This can only contain letters and numbers"
		},
		'alpha_space': {
			'regex': /[A-Z ]*/i,
			'error_message': "This can only contain letters"
		},
		'alpha_dash': {
			'regex': /[A-Z\.\-_]*/i,
			'error_message': "This can only contain letters, underscores and hyphens"
		},
		'alpha_num_dash': {
			'regex': /[A-Z0-9\.\-_]*/i,
			'error_message': "This can only contain letters, numbers, underscores and hyphens"
		},
		'number': {
			'regex': /[\d]*/,
			'error_message': "This needs to be a valid whole number"
		},
		'decimal': {
			'regex': /(\d*\.?\d*)/,
			'error_message': "This needs to be a valid number"
		},
		'name': {
			'regex': /[A-Z\.\-'\s]*/i,
			'error_message': "This needs to be a valid name"
		},
		'email': {
			'regex': /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/i,
			'error_message': "This needs to be a valid email address"
		},
		'url': {
			'regex': /(https?|ftp):\/\/[^\s\/$.?#].[^\s]*/i,
			'error_message': "This needs to be a valid URL"
		},
		'phone': {
			'regex': /(?=.*?\d{3}( |-|.)?\d{4})((?:\+?(?:1)(?:\1|\s*?))?(?:(?:\d{3}\s*?)|(?:\((?:\d{3})\)\s*?))\1?(?:\d{3})\1?(?:\d{4})(?:\s*?(?:#|(?:ext\.?))(?:\d{1,5}))?)\b/i,
			'error_message': "This needs to be a valid phone number"
		},
		'zip': {
			'regex': /\d{5}(?:-?\d{4})?/i,
			'error_message': "This needs to be a valid zip code"
		},
		'creditcard': {
			'regex': /(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})/i,
			'error_message': "This needs to be a valid credit card number"
		},
		'regex': {
			'regex': null,
			'error_message': "This is not a valid value"
		},
		'min': {
			'regex': null,
			'error_message': "This number needs to be at least %i"
		},
		'max': {
			'regex': null,
			'error_message': "This number needs to no more than %i"
		},
		'min_length': {
			'regex': null,
			'error_message': "This needs to be at least %i characters long"
		},
		'max_length': {
			'regex': null, // /.*/i,
			'error_message': "This needs to be no more than %i characters long"
		},
		'match': {
			'regex': null,
			'error_message': "These values have to match"
		}
	},
	feedback_delay: 1500,
	invalid_input_class: "invalid",
	error_message_class: "validation_error",
	submit_button_selector: "input[type='submit']",
	form_error_message: "Please fix any errors in the form",
	required_fields_initial_error_message: "Please fill in all required fields",
	required_field_error_message: "This field is required",
	override_input_margins: true,
	custom_tests: {},
	onValidateInput: function() {}
}




jQuery.fn.validin = function(user_options) {
	jQuery(this).each(function() {
		if(jQuery(this).is('form')) jQuery(this).applyValidation(user_options);
		else jQuery(this).find('form').applyValidation(user_options);
	});
}



jQuery.fn.applyValidation = function(user_options) {

	$this_form = jQuery(this);

	// Load options, and fallback to defaults set above
	if($this_form.data('vn_options')) options = $this_form.data('vn_options');
	else {
		options = jQuery.extend(validin_default_options, user_options);
		$this_form.data('vn_options', options);
	}

	$this_form.addClass('validin')
	$form_inputs = jQuery(this).find(':input');

	jQuery('[validate*="required"]').attr('required', true);

	vnDisableParentForm(jQuery(this));

	$form_inputs.off('input blur submit')

	// Validate input when it is changed or blurred
	$form_inputs.on('input blur', function(e) {
		if(jQuery(this).attr('aria-invalid') == "true" || e.type == 'blur') vnValidateInput(jQuery(this), true);
		else vnValidateInput(jQuery(this), false);
	});



	// Prevent form from being submitted until it has been checked one last time.
	jQuery(this).on('submit', function(e) {
		$form = jQuery(this);

		if(vnIsFormValid($form)) return;

		e.preventDefault();
		e.stopPropagation();
		$form.find(':input[aria-invalid="true"]').first().focus();
	});

	// Do same when user hits enter key
	$form_inputs.keypress(function(e) {
		var $input = jQuery(this)
		var $form = jQuery(this).closest('form');
		var $inputs = $form.find(':input');
		if(e.keyCode == 13) {
			if(vnIsFormValid($form)) return
			if($input.is('textarea')) return

			e.preventDefault();
			e.stopPropagation();
			$form.find(':input[aria-invalid="true"]').first().focus();
		}
	});

}

jQuery.fn.getValue = function() {
	if(this.is(':checkbox') && this.is(':checked')) return true;
	else if(this.is(':checkbox') && !this.is(':checked')) return false;
	else if(this.is(':radio') && jQuery('input[name="'+this.attr('name')+'"]').filter(':checked').val()) return jQuery('input[name="'+this.attr('name')+'"]').filter(':checked').val();
	else if(this.is(':radio') && !jQuery('input[name="'+this.attr('name')+'"]').filter(':checked').val()) return false;
	else if(this.val()) return this.val();
	return false;
}




var validation_debounce_timeout;
function vnValidateInput($input, run_immediately) {
	var has_error = false;
	var error_message = '';
	var options = $this_form.data('vn_options');

	clearTimeout(validation_debounce_timeout);

	if($input.is(':radio')) $input = jQuery('input[name="'+$input.attr('name')+'"]').last(); // Only apply validation to last radio button

	// First check if field is required and filled in
	if($input.attr('required') && !$input.getValue()) {
		has_error = true;
		error_message = options.required_field_error_message;
	}

	// Clear error if previously flagged non-required input is empty
	else if(!$input.attr('required') && $input.val() == ""
		&& $input.attr('validate') && $input.attr('validate').indexOf('match') < 0) { // Ignore 'match' elements in case the element in question is matching a non-blank input
			has_error = false;
			error_message = '';
	}

	// If there is no validation test, set it back to valid
	else if(!$input.attr('validate')) {
		has_error = false;
		error_message = '';
	}

	// Check against validation test regular expression
	else {
		var reqs = $input.attr('validate').split('|');

		for(x = 0; x < reqs.length; x++) {
			req_values = reqs[x].split(':');

			var validation_exp = options.validation_tests[req_values[0]];
			if(options.custom_tests && options.custom_tests[req_values[0]]) validation_exp = options.custom_tests[req_values[0]];

			if(error_message) {} // Stop validation checking if there's an error
			else if(req_values[0] == 'required') {} // Already handled by code above referring to 'required' attribute

			else if(req_values[0] == 'function') {
				result = window[req_values[1]]($input.val())

				if(result !== true) {
					has_error = true;
					error_message = result;
				}
			}

			else if(req_values[0] == 'regex') {
				var regex_modifiers = "";

				regex_array = req_values;

				regex_array.splice(0, 1); // splicing and rejoing values in case there were any : characters in the regex string
				regex = regex_array.join(":");
				if(regex.substr(0, 1) == "/") regex = regex.substr(1);
				if(regex.lastIndexOf("/") >= regex.length - 3) {
					regex_modifiers = regex.substr(regex.lastIndexOf("/")+1);
					regex = regex.substr(0, regex.lastIndexOf("/"));
				}

				regex = new RegExp(regex, regex_modifiers);
				if($input.val().replace(regex, '') != '') {
					has_error = true;
					error_message = validation_exp.error_message;
				}
			}

			else if(req_values[0] == 'min' && (parseFloat($input.val()) < parseFloat(req_values[1]) || parseFloat($input.val()) != $input.val())) {
				has_error = true;
				error_message = validation_exp.error_message.replace('%i', req_values[1]);
			}

			else if(req_values[0] == 'max' && (parseFloat($input.val()) > parseFloat(req_values[1]) || parseFloat($input.val()) != $input.val())) {
				has_error = true;
				error_message = validation_exp.error_message.replace('%i', req_values[1]);
			}

			else if(req_values[0] == 'min_length' && $input.val().length < req_values[1]) {
				has_error = true;
				error_message = validation_exp.error_message.replace('%i', req_values[1]);
			}

			else if(req_values[0] == 'max_length' && $input.val().length > req_values[1]) {
				has_error = true;
				error_message = validation_exp.error_message.replace('%i', req_values[1]);
			}

			else if(req_values[0] == 'match' && $input.val() != jQuery(req_values[1]).val()) {
				has_error = true;
				jQuery(req_values[1]).addClass('match_error');
				error_message = validation_exp.error_message.replace('%i', req_values[1]);
			}

			else if(validation_exp.regex && $input.val().replace(validation_exp.regex, '') != '') {
				has_error = true;
				error_message = validation_exp.error_message;
			}


			if(req_values[0] == 'match' && $input.val() == jQuery(req_values[1]).val()) {
				jQuery(req_values[1]).removeClass('match_error');
			}
		}
	}

	var attach_message = function() {
		vnAttachMessage($input, error_message);
		if(has_error) $input.attr('aria-invalid', "true").addClass(options.invalid_input_class);
		else $input.attr('aria-invalid', "false").removeClass(options.invalid_input_class);
	}

	if(run_immediately) attach_message();
	else validation_debounce_timeout = setTimeout(function() {
		attach_message();
	}, options.feedback_delay);

	vnDisableParentForm($input.closest('form'));

	// User callback function
	if(options.onValidateInput) options.onValidateInput({
		input: $input[0],
		has_error: error_message.length > 0,
		error_message: error_message
	});

	return !has_error;
}


function vnIsFormValid($form) {
	options = $this_form.data('vn_options');
	is_valid = true;
	$inputs = $form.find(':input');
	$inputs.each(function() {
		if(vnValidateInput(jQuery(this), true) == false) is_valid = false;
	});

	return is_valid;
}


// Attaches message to input field
function vnAttachMessage($input, message) {
	options = $this_form.data('vn_options');

	// Don't refresh message if the message is the same
	if($input.next().html() == message) {
		$input.next('.validation_error').stop().fadeIn()
		return;
	}

	// Remove error message if no message is present
	if(message == '' && $input.next().hasClass('validation_error')) {
		$input.next('.validation_error').fadeOut(400, function() {
			$input.next('.validation_error').remove();
		});
		return;
	}
	else if(message == '') return;

	if(!$input.next().hasClass('validation_error')) $input.after('<div class="' + options.error_message_class + '"></div>');

	if(options.override_input_margins) {
		message_margin_top = parseInt($input.next().css('margin-top'));
		message_margin_bottom = parseInt($input.next().css('margin-bottom'));
		input_margin = parseInt($input.css('margin-bottom'));
		$input.next().css('margin-top', -input_margin + 5 + "px").css('margin-bottom', input_margin - 5 + "px");
	}

	$input.next().hide().html(message).fadeIn(400);
}



// Disables form from being submitted
function vnDisableParentForm($form) {
	options = $this_form.data('vn_options');
	$button = $form.find(options.submit_button_selector);

	if($form.find(':input[aria-invalid="true"]').length) {
		setTimeout(function() {
			vnAttachMessage($button, options.form_error_message);
		}, 100);
		$button.prop('disabled', true);
		return;
	}

	// Check to see if all required fields have values
	if($form.find(':input[required]').filter(function() { return !jQuery(this).getValue(); }).length) {
		vnAttachMessage($button, options.required_fields_initial_error_message);
		$button.prop('disabled', true);
		return;
	}

	vnAttachMessage($button, '');
	$button.prop('disabled', false);
}