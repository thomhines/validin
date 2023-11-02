/*
* validin
* Elegant form validation
* Copyright (c) 2017-2023 Thom Hines
* Licensed under MIT.
* @author Thom Hines
* https://github.com/thomhines/validin
* @version 0.2.3
*/

let vn_vars = {
	this_form: ''
}

let validin_default_options = {
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
			'regex': /-?[\d]*/,
			'error_message': "This needs to be a valid whole number"
		},
		'decimal': {
			'regex': /-?(\d*\.?\d*)/,
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
		'securepassword': {
			'regex': /(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&_-])[A-Za-z\d@$!%*#?&_-]{8,}/,
			'error_message': "Passwords must contain at least 8 characters, one letter, one number and one special character"
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
			'regex': /.*/i,
			'error_message': "This is not a valid value"
		},
		'min': {
			'regex': /.*/i,
			'error_message': "This number needs to be at least %i"
		},
		'max': {
			'regex': /.*/i,
			'error_message': "This number needs to be %i or less"
		},
		'min_length': {
			'regex': /.*/i,
			'error_message': "This needs to be at least %i characters long"
		},
		'max_length': {
			'regex': /.*/i,
			'error_message': "This needs to be no more than %i characters long"
		},
		'contain': {
			'regex': /.*/i,
			'error_message': "Must contain at least 1 %i"
		},
		'match': {
			'regex': /.*/i,
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
	let $ = jQuery;
	$(this).each(function() {
		if($(this).is('form')) $(this).applyValidation(user_options);
		else $(this).find('form').applyValidation(user_options);
	});
}



jQuery.fn.applyValidation = function(user_options) {
	let $ = jQuery;
	vn_vars.this_form = $(this);
	
	// Load options, and fallback to defaults set above
	if(vn_vars.this_form.data('vn_options')) options = vn_vars.this_form.data('vn_options');
	else {
		options = jQuery.extend(validin_default_options, user_options);
		vn_vars.this_form.data('vn_options', options);
	}

	vn_vars.this_form.addClass('validin')
	$form_inputs = $(this).find(':input:visible');

	$('[validate*="required"]').attr('required', true);
	
	$(':input[required]').attr('aria-required', true);

	vnDisableForm($(this));

	$form_inputs.off('input blur submit')

	// Validate input when it is changed or blurred
	$form_inputs.on('input blur', function(e) {
		if($(this).attr('aria-invalid') == "true" || e.type == 'blur') vnValidateInput($(this), true);
		else vnValidateInput($(this), false);
	});



	// Prevent form from being submitted until it has been checked one last time.
	$(this).on('submit', function(e) {
		$form = $(this);

		if(vnIsFormValid($form)) return;

		e.preventDefault();
		e.stopPropagation();
		$form.find(':input[aria-invalid="true"]').first().focus();
	});

	// Do same when user hits enter key
	$form_inputs.keypress(function(e) {
		$form = $(this).closest('form');
		$inputs = $form.find(':input:visible');
		if(e.keyCode == 13) {
			if(vnIsFormValid($form)) return
			if($(this).is('textarea')) return // Don't submit form on Enter inside of textareas

			e.preventDefault();
			e.stopPropagation();
			$form.find(':input[aria-invalid="true"]').first().focus();
		}
	});

}

// Return a usable value for any kind of input element
vnGetValue = function($input) {
	let $ = jQuery;
	if($input.is(':checkbox') && $input.is(':checked')) return true;
	else if($input.is(':checkbox') && !$input.is(':checked')) return false;
	else if($input.is(':radio') && $('input[name="'+$input.attr('name')+'"]').filter(':checked').val()) return $('input[name="'+$input.attr('name')+'"]').filter(':checked').val();
	else if($input.is(':radio') && !$('input[name="'+$input.attr('name')+'"]').filter(':checked').val()) return false;
	else if($input.val()) return $input.val();
	return false;	
}
// jQuery version
jQuery.fn.getValue = function() {
	return vnGetValue(this)
}

// Attach an error to an element without validation
vnAddError = function($input, error_id, error_message) {
	$input.attr('validation-error-'+error_id, error_message)
}
// jQuery version
jQuery.fn.addError = function(error_id, error_message) {
	vnAddError(this, error_id, error_message)
}

// Remove an error from an element that was created via addError()
vnRemoveError = function($input, error_id) {
	$input.removeAttr('validation-error-'+error_id)
}
// jQuery version
jQuery.fn.removeError = function(error_id) {
	vnRemoveError(this, error_id)
}


var validation_debounce_timeout;
function vnValidateInput($input, run_immediately) {
	let $ = jQuery;
	let has_error = false;
	let error_message = '';
	let options = vn_vars.this_form.data('vn_options');

	clearTimeout(validation_debounce_timeout);

	if($input.is(':radio')) $input = $('input[name="'+$input.attr('name')+'"]').last(); // Only apply validation to last radio button

	// Check to see if error was manually applied via vnAddError()
	for(attr of $input[0].attributes) {
		if(attr.name.includes('validation-error')) {
			has_error = true;
			error_message = attr.value;	
		}
	}

	// Check if field is required and filled in
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
		let reqs = $input.attr('validate').split('|');

		for(x = 0; x < reqs.length; x++) {
			let req_values = reqs[x].split(':');

			if(options.custom_tests && options.custom_tests[req_values[0]]) validation_exp = options.custom_tests[req_values[0]];
			else validation_exp = options.validation_tests[req_values[0]];

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
			
			else if(req_values[0] == 'contain' && req_values[1] == 'special character' && !(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/).test($input.val())) {
				has_error = true;
				error_message = validation_exp.error_message.replace('%i', req_values[1]);
			}
			
			else if(req_values[0] == 'contain' && req_values[1] == 'capital letter' && !(/[A-Z]+/).test($input.val())) {
				has_error = true;
				error_message = validation_exp.error_message.replace('%i', req_values[1]);
			}
			
			else if(req_values[0] == 'contain' && req_values[1] == 'number' && !(/[0-9]+/).test($input.val())) {
				has_error = true;
				error_message = validation_exp.error_message.replace('%i', req_values[1]);
			}
			
			// Must contain a character from a given list (eg. contain:ASDF)
			else if(req_values[0] == 'contain' && req_values[1] != 'special character' && req_values[1] != 'capital letter' && req_values[1] != 'number' && !(new RegExp("["+req_values[1]+"]+")).test($input.val())) {
				has_error = true;
				error_message = validation_exp.error_message.replace('%i', "of the following: " + req_values[1]);
			}

			else if(req_values[0] == 'match' && $input.val() != $(req_values[1]).val()) {
				has_error = true;
				$(req_values[1]).addClass('match_error');
				error_message = validation_exp.error_message.replace('%i', req_values[1]);
			}
			
			
			else if($input.val() && $input.val().replace(validation_exp.regex, '') != '') {
				has_error = true;
				error_message = validation_exp.error_message;
			}


			if(req_values[0] == 'match' && $input.val() == $(req_values[1]).val()) {
				$(req_values[1]).removeClass('match_error');
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
		vnDisableForm($input.closest('form'));
	}, options.feedback_delay);

	vnDisableForm($input.closest('form'));

	// User callback function
	if(options.onValidateInput) options.onValidateInput({
		input: $input[0],
		has_error: error_message.length > 0,
		error_message: error_message
	});

	return !has_error;
}
// jQuery version
jQuery.fn.validateInput = function(run_immediately) {
	return vnValidateInput(this, run_immediately)
}


function vnIsFormValid($form) {
	let $ = jQuery;
	let options = vn_vars.this_form.data('vn_options');
	let is_valid = true;
	let $inputs = $form.find(':input:visible');
	$inputs.each(function() {
		if(vnValidateInput($(this), true) == false) is_valid = false;
	});

	return is_valid;
}
// jQuery version
jQuery.fn.isFormValid = function() {
	return isFormValid(this)
}

// Attaches message to input field
function vnAttachMessage($input, message) {
	let options = vn_vars.this_form.data('vn_options');
	
	let $anchor = $input;
	// Attach message to label tag instead if input is inside a label
	if($input.parent().is('label')) $anchor = $input.parent();
	
	let $error_message = $anchor.next('.' + options.error_message_class);

	// Don't refresh message if the message is the same
	if($error_message.html() == message) {
		$error_message.stop().fadeIn()
		return;
	}

	// Remove error message if no message is present
	if(message == '' && $error_message.length) {
		$error_message.fadeOut(400, function() {
			$error_message.remove();
		});
		return;
	}
	else if(message == '') return;

	if($error_message.length < 1) $anchor.after('<div class="' + options.error_message_class + '"></div>');
	$error_message = $anchor.next('.' + options.error_message_class)

	if(options.override_input_margins) {
		message_margin_top = parseInt($error_message.css('margin-top'));
		message_margin_bottom = parseInt($error_message.css('margin-bottom'));
		input_margin = parseInt($anchor.css('margin-bottom'));
		$error_message.css('margin-top', -input_margin + 5 + "px").css('margin-bottom', input_margin - 5 + "px");
	}

	$error_message.hide().html(message).fadeIn(400);
}
// jQuery version
jQuery.fn.attachMessage = function(message) {
	attachMessage(this, message)
}



// Disables form from being submitted
function vnDisableForm($form) {
	let options = vn_vars.this_form.data('vn_options');
	let $button = $form.find(options.submit_button_selector);

	if($form.find(':input[aria-invalid="true"]').length) {
		setTimeout(function() {
			vnAttachMessage($button, options.form_error_message);
		}, 100);
		$button.prop('disabled', true);
		return;
	}
	
	// Check to see if all required fields have values, even if they haven't been touched yet
	if($form.find(':input[required]:visible').filter(function() { return !jQuery(this).getValue(); }).length) {
		vnAttachMessage($button, options.required_fields_initial_error_message);
		$button.prop('disabled', true);
		return;
	}

	vnAttachMessage($button, '');
	$button.prop('disabled', false);
}
// jQuery version
jQuery.fn.disableForm = function() {
	vnDisableForm(this)
}
