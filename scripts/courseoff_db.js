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
		semester.courses = coursesBySemester;
	}
	return semesters;
}

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

function getCoursesByTermAndMajor(term, major) {
	var url = "https://soc.courseoff.com/gatech/terms/" + term + "/majors/" 
		+ major + "/courses";
	var jsonResponse = httpGet(url);
	return jsonResponse;
}

function httpGet(theUrl) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", theUrl, false); 
	xmlHttp.send(null);
	return JSON.parse(xmlHttp.responseText);
}

var terms = getSemesters(true);

