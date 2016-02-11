//var semesters = getSemesters(true);
//var courses = getCourses(semesters);
//var sectionsAndTimeslots = extractSectionsAndTimeslotsFromCourses(courses);
//var sections = sectionsAndTimeslots[0];
//var timeslots = sectionsAndTimeslots[1];

/* Get array of semesters. 
 * Each semester includes: year, term (Spring/Summer/Fall), and all course ids
 * for that semester. 
 * 
 * @param useCurrentTerm If true, only grabs data for current semester; 
 * otherwise grabs data for all available semesters.
 */
function getSemesters(useCurrentTerm) {
	var CURRENT_TERM = "201601";
	var url = "https://soc.courseoff.com/gatech/terms/";
	if (useCurrentTerm) {
		url += CURRENT_TERM;
	}
	var jsonResponse = httpGet(url);
	var semesters = [];
	if (typeof jsonResponse == 'array') {
		for (var i = 0; i < jsonResponse.length; i++) {
			var semester = jsonResponse[i];
			var courseOffTerm = semester['ident'].toString();
			var year = courseOffTerm.substring(0, 4);
			year = parseInt(year);
			var term = semester['semester'];
			semesters[i] = {'year': year, 'term': term, 'courseOffTerm': courseOffTerm};
		}
	} else if (typeof jsonResponse == 'object') {
        var courseOffTerm = jsonResponse['ident'].toString();
        var year = courseOffTerm.substring(0, 4);
        year = parseInt(year);
        var term = jsonResponse['semester'];
        semesters[0] = {'year': year, 'term': term, 'courseOffTerm': courseOffTerm};
	}
	for (var i = 0; i < semesters.length; i++) {
		var courseOffTerm = semesters[i]['courseOffTerm'];
		var majors = getMajorsByTerm(courseOffTerm);
	}
	for (var i = 0; i < semesters.length; i++) {
		var semester = semesters[i];
		var coursesBySemester = [];
		for (var j = 0; j < majors.length; j++) {
			var major = majors[j];
			var coursesByMajor = getCoursesByTermAndMajor(semester['courseOffTerm'], major);
			coursesBySemester = coursesBySemester.concat(coursesByMajor);
		}
		semester['courses'] = coursesBySemester;
	}
	return semesters;
}

/* Get all course information for each course contained in each semester. */
function getCourses(semesters) {
    courses = [];
    
    for (var i = 0; i < semesters.length; i++) {
        var courses = semesters[i]['courses'];
        for (var j = 0; j < courses.length; j++) {
            var term = semesters[i]['courseOffTerm'];
            var sections = getCourseSectionsForCourse(term, courses[j]);
            courses[j]['sections'] = sections;
        }
    }
    
    return courses;
}

function extractSectionsAndTimeslotsFromCourses(courses) {
    var sections = [];
    var timeslots = [];
    
    for (var i = 0; i < courses.length; i++) {
        var sections = courses[i]['sections'];
        for (var j = 0; j < sections.length; j++) {
            var section = sections[j];
            if (sections.indexOf(section) === -1) {
                sections.push(section);
            }
        }
    }
    
    for (var i = 0; i < sections.length; i++) {
        var section = sections[i];
        for (var j = 0; j < section['timeslots'].length; j++) {
            var timeslot = section['timeslots'][j];
            if (timeslots.indexOf(timeslot) === -1) {
                timeslots.push(timeslot);
            }
        }
        delete section['timeslots'];
    }
    
    return [sections, timeslots];
}

/* Helper function for getSemesters().
 * Gets all majors by term. 
 * Accepted terms are of form "201601" for example.
 */
function getMajorsByTerm(term) {
	var url = "https://soc.courseoff.com/gatech/terms/" + term + "/majors/"; 
	var jsonResponse = httpGet(url);
	var majors = [];
	for (var i = 0; i < jsonResponse.length; i++) {
		var major = jsonResponse[i];
		var majorAbbreviation = major['ident'];
		majors.push(majorAbbreviation);
	}
	return majors;
}

/* Helper function for getSemesters().
 * Get all courses by term and major. 
 * Accepted terms are of form "201601" for example.
 * Accepted majors are of form "CS" or "ACC" for example.
 */
function getCoursesByTermAndMajor(term, major) {
	var url = "https://soc.courseoff.com/gatech/terms/" + term + "/majors/" 
		+ major + "/courses";
	var jsonResponse = httpGet(url);
  
    courses = [];
	for (var i = 0; i < jsonResponse.length; i++) {
        var course = {};
        course['number'] = jsonResponse[i]['ident'];
        course['name'] = jsonResponse[i]['name'];
        course['major'] = major; 
        courses.push(course);
    }
    
    return courses;
}

/* Grabs all specific course info per course, including timeslots
 * associated with each course.
 */
function getCourseSectionsForCourse(term, course) {
    var major = course['major'];
    var courseId = course['number'];
    var url = "https://soc.courseoff.com/gatech/terms/" + term + 
        "/majors/" + major + "/courses/" + courseId + "/sections";
    var jsonResponse = httpGet(url);
    
    sections = [];
    for (var i = 0; i < jsonResponse.length; i++) {
        var section = jsonResponse[i];
        var sectionFinal = {};
        sectionFinal['credits'] = section['credits'];
        sectionFinal['crn'] = section['call_number'];
        sectionFinal['professor'] = (section['instructor']) ?
            section['instructor']['lname'] + ', ' + 
            section['instructor']['fname'] : null;
        sectionFinal['seat_capacity'] = (section['seats']) ? 
            section['seats']['capacity'] : null;
        sectionFinal['seat_actual'] = (section['seats']) ? 
            section['seats']['actual'] : null;
        sectionFinal['seat_remaining'] = (section['seats']) ? 
            section['seats']['remaining'] : null;
        var timeslots = [];
        for (var j = 0; j < section['timeslots'].length; j++) {
            var timeslot = section['timeslots'][j];
            var timeslotFinal = {};
            timeslotFinal['location'] = timeslot['location'];
            timeslotFinal['start_time'] = formatTime(timeslot['start_time']);
            timeslotFinal['end_time'] = formatTime(timeslot['end_time']);
            timeslotFinal['day_of_week'] = timeslot['day']; 
            timeslots.push(timeslotFinal);
        }
        sectionFinal['timeslots'] = timeslots;
        sections.push(sectionFinal);
    }
    
    return sections;
}

/* Helper method that converts time from minutes to 24-hour formatted
 * time. (CourseOff stores time in minutes.)
 */
function formatTime(time) {
    formatted = "";
    
    var hours = Math.floor(time / 60);
    var minutes = time % 60;
    hours = hours.toString();
    minutes = minutes.toString();
    
    if (hours.length == 1) {
        hours = "0" + hours; 
    }
    
    if (minutes.length == 1) {
        minutes = "0" + minutes;
    }
    
    formatted = hours + ":" + minutes;
    
    return formatted;
}

function httpGet(theUrl) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", theUrl, false); 
	xmlHttp.send(null);
	return JSON.parse(xmlHttp.responseText);
}



