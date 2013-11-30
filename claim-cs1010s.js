// REQUIRED CONSTANTS - DO NOT MODIFY 
var ASSIGNMENT_MARKING = 'Assignment Marking';
var COURSE_MATERIAL_PREPARATION = 'Course Material Preparation';
var TUTORIAL = 'Tutorial';
var POST_URL = '/~tssclaim/tutor/teach_claim.php';
var END_REDIRECT_URL = '/~tssclaim/tutor/teach_claim.php?page=list';

// ***********************************************************
// READ THE FOLLOWING BEFORE STARTING
// ***********************************************************
// 1. **IMPORTANT STEP** Change the properties in the config object in the next section.

// 2. Login to the portal at: https://mysoc.nus.edu.sg/~tssclaim/. Fill in your bank account information if you haven't.

// 3. Access the page titled 'Student Claim Submission' (https://mysoc.nus.edu.sg/~tssclaim/tutor/teach_claim.php?page=1) and click on
//    the 'Claim' button under the module CS1010S. You should see the interface for you to enter details of the teaching claim activity.

// 4. Open the JS console (Ctrl/Cmd + Shift/Option + J), paste all the code in this file in the JS console and press enter. You should
// 	  see the message 'Claim object successfully created. Run c.makeAllClaims() to start.'.

// 5. Run the function c.makeAllClaims() . Wait until the alert 'All claims made!' is shown, then press 'OK'.

// 6. You will be brought back to the previous page. Click on the button 'Claim' again and verify that you have 80 hours in total.

// To delete all claims on the page, run the function c.deleteAllClaims()

// ***********************************************************
// CONFIGURE THE FOLLOWING PARAMETERS
// ***********************************************************

var config = {
	// Format: YYYY/MM/DD
	// Note: Month is from 0-11, Date is from 1-31
	// This should be the semester's week 1. For AY13/14 Sem 1, it's Monday, Aug 12
	first_day_of_sem: new Date(2013,07,12),
	// the id you use to log in to the portal
	student_id : 'a0073063',
	// module you are claiming for
	module: 'CS1010S',
	// in case you want to customize the remarks field for each activity
	remarks: {
		'Assignment Marking': 'Graded students\' assignments',
		'Course Material Preparation': 'Prepared course materials',
		'Tutorial': 'Conducted tutorial'
	},
	// the following function should return a list of claim objects that you want to make
	claims_list_fn: function() {	
		var claims_list = [];
		// Course prep: 20 hours
		for (var week = 1; week <= 2; week++) {
			claims_list.push({
				activity_type: COURSE_MATERIAL_PREPARATION, 
				week: week, 
				day: "MONDAY", 
				start_time: '1200', 
				end_time: '1700'
			});
			claims_list.push({
				activity_type: COURSE_MATERIAL_PREPARATION, 
				week: week, 
				day: "TUESDAY", 
				start_time: '1200', 
				end_time: '1700'
			});
		}

		// Weekly stuff (Tutorials and Assignments Marking: 20 + 40 = 60 hours)
		for (var week = 3; week <= 13; week++) {
			if (week === 7) { // there was no tutorial in week 7
				continue;
			}
			claims_list.push({
				activity_type: TUTORIAL, 
				week: week, 
				day: "MONDAY", 
				start_time: '1200', 
				end_time: '1700'
			});
			claims_list.push({
				activity_type: TUTORIAL, 
				week: week, 
				day: "TUESDAY", 
				start_time: '1400', 
				end_time: '1500'
			});
			claims_list.push({
				activity_type: ASSIGNMENT_MARKING, 
				week: week, 
				day: "SATURDAY", 
				start_time: '1200', 
				end_time: '1600'
			});
		};

		return claims_list;
	}
}


// ***********************************************************
// DO NOT CHANGE THE BOTTOM UNLESS YOU KNOW WHAT YOU ARE DOING
// ***********************************************************

var ACTIVITY_DICT = {};
ACTIVITY_DICT[ASSIGNMENT_MARKING] = '003';
ACTIVITY_DICT[COURSE_MATERIAL_PREPARATION] = '006';
ACTIVITY_DICT[TUTORIAL] = 'T';

var DAY_DICT = { 'MONDAY': 0, 'TUESDAY': 1, 'WEDNESDAY': 2, 'THURSDAY': 3, 'FRIDAY': 4, 'SATURDAY': 5, 'SUNDAY': 6 };

function Claim(config) {
	this.student_id = config.student_id;
	this.module = config.module;
	this.remarks = config.remarks;
	this.first_day_of_sem = config.first_day_of_sem;
	this.error = false;
	var that = this;
	function createClaim(activity_type, week, day, start_time, end_time) {
		// obj has the properties: 
		var day_upper = day.toUpperCase();
		try {
			if (ACTIVITY_DICT[activity_type] == undefined || typeof activity_type != "string") {
				throw "Activity error: " + activity_type + ". Activity type not supported.";
			}
			if (typeof week != "number" || week <= 0) {
				throw "Week error: " + week + ". Week value has to be a positive number.";
			}
			if (DAY_DICT[day_upper] == undefined || typeof day_upper != "string") {
				throw "Day error: " + day + ". Day value has to be a valid day string.";
			}
			function checkTime(time) {
				var start_time_hour = time.slice(0,2);
				var start_time_min = time.slice(2);
				if (typeof time != "string" || 
					time.length != 4 ||
					!(parseInt(start_time_hour) >= 0 && parseInt(start_time_hour) <= 23) ||
					!(start_time_min == "00" || start_time_min == "30")) {
					throw "Time error: " + time + ". Time has to be string in 24-hr format at half-hour intervals.";
				}
			}
			checkTime(start_time);
			checkTime(end_time);
			var start_time_hour = parseInt(start_time.slice(0,2));
			var end_time_hour = parseInt(end_time.slice(0,2));
			if (start_time_hour > end_time_hour || start_time === end_time) {
				throw "Time error: end_time: " + end_time + " must be after start_time: " + start_time + ".";
			} else if (end_time_hour - start_time_hour > 8) {
				throw "Time error: " + start_time + " - " + end_time + ". Activity cannot be more than 8 hours.";
			}	
		} catch (err) {
			error = true;
			console.log(err);
		}
		return function() { 
			that.makeClaim(activity_type, week, day, start_time, end_time);
		};
	}
	var claims = config.claims_list_fn();
	this.claims_list = [];
	for (var i = 0; i < claims.length; i++) {
		var c = claims[i];
		this.claims_list.push(createClaim(c.activity_type, c.week, c.day, c.start_time, c.end_time));
	}

	this.ajax_index = 0; // index to keep track of the current ajax call
	console.log('Claim object successfully created. Run c.makeAllClaims() to start.');
}

Claim.prototype.makeClaim = function(activity_type, week, day, start_time, end_time) {
	var day_num = DAY_DICT[day];
	var number_of_days = (week < 7 ? week - 1 : week)*7 + day_num;
	var activity_date = new Date();
	activity_date.setTime(this.first_day_of_sem.getTime() + (number_of_days * 24 * 60 * 60 * 1000));
	var claim_date_array = activity_date.toDateString().split(' ');
	var claim_date_str = [claim_date_array[2], claim_date_array[1], claim_date_array[3].slice(2)].join('-');

	var post_data = {
		mod_c: this.module,
		action: 'ADD',
		std_id: this.student_id,
		activity_c: ACTIVITY_DICT[activity_type],
		remarks: this.remarks[activity_type],
		claim_date: claim_date_str,
		start_time_hr: start_time.slice(0,2),
		start_time_min: start_time.slice(2),
		end_time_hr: end_time.slice(0,2),
		end_time_min: end_time.slice(2),
		submit: 'ADD + Save as Draft'
	}

	var that = this;
	$.post(POST_URL, post_data, function(data) {
		console.log('Successfully added ' + activity_type + ' for ' + claim_date_str);
		that.ajax_index += 1;
		if (that.ajax_index < that.claims_list.length) {
			that.claims_list[that.ajax_index]();
		} else {
			alert('All claims made! Press OK to continue.');
			// redirect to previous page because a refresh of the page would trigger the last ajax call
			window.location.href = window.location.protocol +'//'+ window.location.host + END_REDIRECT_URL;
		}
	});
};

Claim.prototype.deleteAllClaims = function() {
	var that = this;
	function deleteClaim(claim_id) {
		$.post(POST_URL, { 
			mod_c: that.module,
			claim_id: claim_id,
			action: 'DELETE',
			std_id: that.student_id,
			submit: 'DELETE + Save as Draft'
		}, function(data) {
			console.log('Claim ' + claim_id + ' deleted');
			count += 1;
			if (count === $existing_claims.length) {
				alert('All claims deleted! Press OK to continue.');
				window.location.href = window.location.protocol +'//'+ window.location.host + END_REDIRECT_URL;
			}
		});
	}
	var count = 0;
	var $existing_claims = $('#claim-info-div table [name="claim_id"]');
	$existing_claims.each(function() {
		deleteClaim(this.value);
	});
}

Claim.prototype.makeAllClaims = function() {
	if (!this.error) {
		this.claims_list[this.ajax_index]();
	}
}

var c = new Claim(config);
// c.makeAllClaims();