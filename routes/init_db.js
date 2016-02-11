var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var request = require('request');
var Q = require('q');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

router.use(function(req, res, next) {
    db.serialize(function() {
        console.log('Serializing DB.');
        
        db.run("CREATE TABLE if not exists USER(" + 
            "user_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL," +
            "username VARCHAR(30));")
          .run("CREATE TABLE if not exists SCHEDULE(" +
            "schedule_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL," +
            "user_id INTEGER," +
            "date VARCHAR(30)," +
            "foreign key (user_id) references USER(user_id));")
          .run("CREATE TABLE if not exists SEMESTER(" +
            "semester_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL," +
            "year INTEGER NOT NULL," +
            "term VARCHAR(8) NOT NULL);")
          .run("CREATE TABLE if not exists CLASS(" +
            "class_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL," +
            "name VARCHAR(255)," +
            "department VARCHAR(10)," +
            "course_number INTEGER," +
            "credits INTEGER," +
            "semester_id INTEGER," +
            "foreign key (semester_id) references SEMESTER(semeter_id));")
          .run("CREATE TABLE if not exists SECTION(" +
            "section_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL," +
            "crn INTEGER," +
            "professor VARCHAR(255)," +
            "schedule_id INTEGER," +
            "class_id INTEGER," +
            "foreign key (schedule_id) references SCHEDULE(schedule_id)," + 
            "foreign key (class_id) references CLASS(class_id));")
          .run("CREATE TABLE if not exists TIMESLOT(" +
            "timeslot_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL," +
            "location VARCHAR(255)," +
            "start_time VARCHAR(30)," +
            "end_time VARCHAR(30)," +
            "day_of_week VARCHAR(10)," +
            "section_id INTEGER," +
            "foreign key (section_id) references SECTION(section_id));");
    });
    
    var semesters = [];
    var courses = [];
    var sections;
    var timeslots;

    getSemesters(true).then(function(semestersResponse) {
        semesters = semestersResponse;
        console.log('Retrieved semesters.');
        getCourses(semesters).then(function(coursesResponse) {
            courses = coursesResponse;
            console.log('Retrieved courses.');
            var sectionsAndTimeslots = extractSectionsAndTimeslotsFromCourses(courses);
            console.log('Retrieved sections/timeslots.');
            sections = sectionsAndTimeslots[0];
            timeslots = sectionsAndTimeslots[1];
            insertIntoDB(semesters, courses, sections, timeslots);
            cleanUp();
        });
    });
});

module.exports = router;

function insertIntoDB(semesters, courses, sections, timeslots) {    
    var query = db.prepare("INSERT INTO semester(year, term) values(?, ?);");
    for (var i = 0; i < semesters.length; i++) {
        var semester = semesters[i];
        query.run([semester['year'], semester['term']]);
    }
    query.finalize();
    
    query = db.prepare("INSERT INTO class(name, department, course_number, " + 
        "credits, semester_id) VALUES(?, ?, ?, ?, ?);");
    var innerQuery = "";
    for (var i = 0; i < courses.length; i++) {
        var course = courses[i];
        var innerQuery = "SELECT semester_id FROM semester WHERE year = '" +
            course["semester"]["year"] + "' AND term = '" + 
            course["semester"]["term"] + "' LIMIT 1;";
    
        var semesterID = "null";
        db.each(innerQuery, function(err, row) {
            if (row.semester_id !== undefined) semesterID = row.semester_id;
        });
        
        query.run([
            course['name'], course['major'], course['number'], course['credits'],
            semesterID
        ]);
    }
    query.finalize();
    
    query = db.prepare("INSERT INTO section(crn, professor, class_id) VALUES(?, ?, ?);");
    for (var i = 0; i < sections.length; i++) {
        var section = sections[i];
        var innerQuery = "SELECT class_id FROM class where course_number = '" +
            section['course_number'] + "' LIMIT 1;";
    
        var classID = "null";
        db.each(innerQuery, function(err, row) {
            if (row.class_id !== undefined) classID = row.class_id;
        });
        
        query.run([
            section['crn'], section['professor'], classID
        ]);
    }
    query.finalize();
    
    query = db.prepare("INSERT INTO timeslot(location, start_time, end_time, day_of_week, " +
        "section_id) VALUES(?, ?, ?, ?, ?);");
    for (var i = 0; i < timeslots.length; i++) {
        var timeslot = timeslots[i];
        var innerQuery = "SELECT section_id FROM section where crn = '" +
            timeslot['section_crn'] + "' LIMIT 1;";

        var sectionID = "null";
        db.each(innerQuery, function(err, row) {
            if (row.section_id !== undefined) sectionID = row.section_id;
            console.log(row);
        });
        console.log(sectionID);
        
        var location = timeslot['location'];
        var startTime = timeslot['start_time'];
        var endTime = timeslot['end_time'];
        var dayOfWeek = timeslot['day_of_week'];
        
        query.run(location, startTime, endTime, dayOfWeek, sectionID);
    }
    query.finalize();
}

function cleanUp() {
    db.close();
    console.log('Done');
    res.redirect(req.header('Referer') || '/');
}

function getSemesters(useCurrentTerm) {
	var CURRENT_TERM = "201601";
	var url = "https://soc.courseoff.com/gatech/terms/";
	if (useCurrentTerm) {
		url += CURRENT_TERM;
	}
    
    var defer = Q.defer();
    var finalSemesters = [];
    var finalMajors = [];
    
    httpGet(url).then(function(jsonResponse) {
        finalSemesters = getSemestersCallback(jsonResponse);
        getMajorsCallback(finalSemesters).then(function(majorsResponse) {
            finalMajors = majorsResponse;
            combineCoursesWithSemestersCallback(finalSemesters, finalMajors).then(function() {
                defer.resolve(finalSemesters, finalMajors);
            });
        });
    });
    
    function getSemestersCallback(jsonResponse) {
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
        
        return semesters;
    }
    
    function getMajorsCallback(semesters) {
        var innerDefer = Q.defer();
        var majors = [];
        var majorPromises = [];
        
        for (var i = 0; i < semesters.length; i++) {
            var courseOffTerm = semesters[i]['courseOffTerm'];
            var promise = getMajorsByTerm(courseOffTerm).then(function(termMajors) {
                majors = majors.concat(termMajors);
            });
            majorPromises.push(promise);
        }
        
        Q.all(majorPromises).then(function() {
           innerDefer.resolve(majors); 
        });
        
        return innerDefer.promise;
    }
    
    function combineCoursesWithSemestersCallback(semesters, majors) {
        var innerDefer = Q.defer();
        var coursesbySemesterPromises = [];
        
        for (var i = 0; i < semesters.length; i++) {
            var semester = semesters[i];
            var promise = getCoursesCallbackInner(semester, majors).then(function(coursesBySemester) {
                semester['courses'] = coursesBySemester;
            });
            coursesbySemesterPromises.push(promise);
        }
        
        Q.all(coursesbySemesterPromises).then(function() {
           innerDefer.resolve(); 
        });
        
        function getCoursesCallbackInner(semester, majors) { 
            var subDefer = Q.defer();
            var coursesByMajor = [];
            var coursesByMajorPromises = [];
            
            for (var j = 0; j < majors.length; j++) {
                var major = majors[j];
                var term = semester['courseOffTerm'];
                var subPromise = getCoursesByTermAndMajor(term, major).then(
                    function(coursesByMajorResponse) {
                    coursesByMajor = coursesByMajor.concat(coursesByMajorResponse);
                });
                coursesByMajorPromises.push(subPromise);
            }
            
            Q.all(coursesByMajorPromises).then(function() {
               subDefer.resolve(coursesByMajor); 
            });
            
            return subDefer.promise;
        }
        
        return innerDefer.promise;
    }
    
    return defer.promise;
};

/* Get all course information for each course contained in each semester. */
function getCourses(semesters) {
    var defer = Q.defer();
    var finalCourses = [];
    var coursePromises = [];
    
    for (var i = 0; i < semesters.length; i++) {
        var promise = courseCallback(semesters[i]).then(
            function(courseResponse) {
            finalCourses.push(courseResponse);
        });
        coursePromises.push(promise);
        delete semesters[i]['courses'];
    }
    
    function courseCallback(semester) {
        var innerDiffer = Q.defer();
        var coursesBySemester = semester['courses'];
        var term = semester['courseOffTerm'];
        var innerCourses = [];
        var innerPromises = [];
        
        for (var j = 0; j < coursesBySemester.length; j++) {
            var course = coursesBySemester[j];
            var innerPromise = getCourseSectionsForCourse(term, course).then(
                function(courseWithSections) {
                courseWithSections['semester'] = semester;
                innerCourses.push(courseWithSections);
            });
            innerPromises.push(innerPromise);
        }
        
        Q.all(innerPromises).then(function() {
           defer.resolve(innerCourses); 
        });
        
        return innerDiffer.promise;
    }
    
    Q.all(coursePromises).then(function() {
        defer.resolve(finalCourses); 
    });
    
    return defer.promise;
};

function extractSectionsAndTimeslotsFromCourses(courses) {
    var finalSections = [];
    var finalTimeslots = [];
    
    for (var i = 0; i < courses.length; i++) {
        var sections = courses[i]['sections'];
        for (var j = 0; j < sections.length; j++) {
            var section = sections[j];
            section['course_number'] = courses[i]['number'];
            if (finalSections.indexOf(section) === -1) {
                finalSections.push(section);
            }
        }
    }
    
    for (var i = 0; i < finalSections.length; i++) {
        var timeslots = finalSections[i]['timeslots'];
        for (var j = 0; j < timeslots.length; j++) {
            var timeslot = timeslots[j];
            timeslot['section_crn'] = finalSections[j]['crn'];
            if (finalTimeslots.indexOf(timeslot) === -1) {
                finalTimeslots.push(timeslot);
            }
        }
        delete finalSections[i]['timeslots'];
    }
    
    return [finalSections, finalTimeslots];
};

/* Helper function for getSemesters().
 * Gets all majors by term. 
 * Accepted terms are of form "201601" for example.
 */
function getMajorsByTerm(term) {
    var defer = Q.defer();
	var url = "https://soc.courseoff.com/gatech/terms/" + term + "/majors/"; 
    
    httpGet(url).then(function(jsonResponse) {
        var majors = [];
        for (var i = 0; i < jsonResponse.length; i++) {
            var major = jsonResponse[i];
            var majorAbbreviation = major['ident'];
            majors.push(majorAbbreviation);
        }
        defer.resolve(majors);
    });
    
    return defer.promise;
};

/* Helper function for getSemesters().
 * Get all courses by term and major. 
 * Accepted terms are of form "201601" for example.
 * Accepted majors are of form "CS" or "ACC" for example.
 */
function getCoursesByTermAndMajor(term, major) {
    var defer = Q.defer();
	var url = "https://soc.courseoff.com/gatech/terms/" + term + "/majors/" 
		+ major + "/courses";
    var courses = [];
  
    httpGet(url).then(function(jsonResponse) {
        for (var i = 0; i < jsonResponse.length; i++) {
            var course = {};
            course['number'] = jsonResponse[i]['ident'];
            course['name'] = jsonResponse[i]['name'];
            course['major'] = major; 
            courses.push(course);
        }
        defer.resolve(courses);
    });
    
    return defer.promise;
};

/* Grabs all specific course info per course, including timeslots
 * associated with each course.
 */
function getCourseSectionsForCourse(term, course) {
    var defer = Q.defer();
    var major = course['major'];
    var number = course['number'];
    var url = "https://soc.courseoff.com/gatech/terms/" + term + 
        "/majors/" + major + "/courses/" + number + "/sections";    
    var sections = [];
    
    httpGet(url).then(function(jsonResponse) {
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
        course['sections'] = sections;
        defer.resolve(course);
    });
    
    return defer.promise;
};

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
};

function httpGet(theUrl) {
    var defer = Q.defer();
    
    request(theUrl, function(error, response, body) {
        defer.resolve(JSON.parse(body));
    });
    
    return defer.promise;
};
