var semesters = getSemesters(true);
var courses = getCourses(semesters);

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
		majors[i] = majorAbbreviation;
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
        courses[i] = course;
    }
    
    return courses;
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
            timeslots[j] = timeslotFinal;
        }
        sectionFinal['timeslots'] = timeslots;
        sections[i] = sectionFinal;
    }
    
    return sections;
}

function formatTime(time) {
    formatted = "";
    if (time.length == 3) {
        formatted = time.substring(0, 1) + ":" + time.substring(1, 3);
    } else if (time.length == 4) {
        formatted = time.substring(0, 2) + ":" + time.substring(2, 4);
    }
    return formatted;
}

function httpGet(theUrl) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", theUrl, false); 
	xmlHttp.send(null);
	return JSON.parse(xmlHttp.responseText);
}



