# validin
An simple and elegant form validator for jQuery

### [Demo](http://projects.thomhines.com/validin/)


### Usage


1. First, make sure you link to a version of jQuery and validin JS in your HTML (validin CSS optional).


2. Next, apply validin to a form in your scripts like so:

		$('.form1').validin(options);


	Or to every form on a page:

		$(document).validin(options);



3. Lastly, add a `validate` attribute on the input or add `required` to tell validin to test that field.

	##### Examples:

		<input name="email" validate="email">

		<input name="address" required>



### Validations


* **alpha** - letters only
* **alpha_num** - letters and numbers
* **alpha_space** - letters and white space
* **alpha_dash** - letters, hyphens, and underscores
* **alpha\_num_dash** - letters, numbers, hyphens and underscores
* **number** - whole numbers only
* **decimal** - any number, including decimals
* **name** - letters, spaces, and common naming punctuation such as hyphens, periods, apostrophes, etc.
* **email**
* **url**
* **phone** - including commong punctuation marks and formats
* **zip** - including both 5 digit and 5+4 formats
* **creditcard** - checks for basic credit card rules
* **regex** - javascript style regular expression

		<input validate="regex:/[0-9a-z]{1,3}-\d/i">

* **function** - javascript function name. Function argument is field value. return truthy for valid, return error message string if invalid

		<input validate="function:function_name">

* **min** - number, no smaller than the value given

		<input validate="min:5">

* **max** - number, no larger than the value given

		<input validate="max:5">

* **min_length** - any text, no shorter in length than the value given

		<input validate="min_length:5">

* **max_length** - any text, no longer in length than the value given)

		<input validate="max_length:5">

* **match** - Requires that the value of this input matches the element given (any CSS selector will work)

		<input validate="match:.other_input">



### Options

* **feedback\_delay** - The number of milliseconds before showing a validation error (default: 1500)
* **invalid\_input\_class** - The class name to apply to invalid inputs (default: 'invalid')
* **error\_message\_class** - The class name to apply to the validation error message elements (default: "validation\_error")
* **form\_error\_message** - The message that appears at the bottom of a form if there are any errors present (default: "Please fix any errors in the form")
* **required\_fields\_initial\_error\_message** - Initial message showing why form is disabled if there are required fields but no errors (default: "Please fill in all required fields")
* **required\_field\_error\_message** - Message shown next to required fields that are not filled in AFTER field has lost focus (default: "This field is required")
* **override\_input\_margins** - Setting to true will automatically adjust margins on the validation error message elements to position message close to input (default: true)
* **custom_tests** - A javascript object that follows this pattern. Any test on this object will be added to the list of included tests listed above. (default: {})

		'validation_test_name': {
			'regex': /.*/i,
			'error_message': "These values have to match"
		}

* **onValidateInput**: A callback function that will be run every time a validation test is executed (default: function(validation_info) {})

	NOTE: validation\_info contains an object with three values: input (the DOM element of the currently tested input), has\_error (boolean), and error\_message (string containing the error message of the current input, if any)



Adding custom settings might look something like this:

		$('form').validin({
			feedback_delay: 1200,
			override_input_margins: false,
			tests: {
				'state_abbreviation': {
					'regex': /[a-z]{2}/i,
					'error_message': "State abbreviations are two letters long (eg. OR)"
				}
			},
			onValidateInput: function(validation_info) {
				console.log(validation_info.input);
				console.log(validation_info.has_error);
				console.log(validation_info.error_message);
			}
		});
