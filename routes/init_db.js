var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var request = require('request');
var Q = require('q');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

router.use(function(req, res, next) {
    db.serialize(function() {
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
            insertIntoDB(semesters, courses, sections, timeslots).then(function() {
                cleanUp(res);
            });
        });
    });
});

module.exports = router;

function insertIntoDB(semesters, courses, sections, timeslots) {    
    var mainDefer = Q.defer();
    
    db.parallelize(function() {
        var query = db.prepare("INSERT INTO semester(year, term) values(?, ?);");
        for (var i = 0; i < semesters.length; i++) {
            var semester = semesters[i];
            query.run([semester['year'], semester['term']]);
        }
        query.finalize();
        
        coursesInner().then(function(finalCourses) {
            console.log(finalCourses[0]);
            var query = db.prepare("INSERT INTO class(name, department, course_number, " + 
                "credits, semester_id) VALUES(?, ?, ?, ?, ?);");
            for (var i = 0; i < finalCourses.length; i++) {
                var course = finalCourses[i];
                query.run([
                    course['name'], course['major'], course['number'], 
                    course['credits'], course['semester_id']
                ]);
            }
            query.finalize();
        }).then(function() {
            var defer = Q.defer();
            sectionsInner().then(function(finalSections) {
                var query = db.prepare("INSERT INTO section(crn, professor, class_id) VALUES(?, ?, ?);");
                for (var i = 0; i < finalSections.length; i++) {
                    var section = finalSections[i];
                    query.run(section['crn'], section['professor'], section['class_id']);
                }
                query.finalize();
                defer.resolve();
            });
            return defer.promise;
        }).then(function() {
            var defer = Q.defer();
            timeSlotsInner().then(function(finalTimeslots) {
                console.log(finalTimeslots[0]);
                var query = db.prepare("INSERT INTO timeslot(location, start_time, end_time, " +
                    "day_of_week, section_id) VALUES(?, ?, ?, ?, ?);");
                for (var i = 0; i < finalTimeslots.length; i++) {
                    var timeslot = finalTimeslots[i];
                    var location = timeslot['location'];
                    var startTime = timeslot['start_time'];
                    var endTime = timeslot['end_time'];
                    var dayOfWeek = timeslot['day_of_week'];
                    var sectionID = timeslot['section_id'];
                    query.run(location, startTime, endTime, dayOfWeek, sectionID);
                }
                query.finalize();
                defer.resolve();
            });
            return defer.promise;
        }).then(function() {
           mainDefer.resolve(); 
        });
    });
    
    function coursesInner() {
        var defer = Q.defer();
        var coursesWithSemesterIDs = [];
        var coursePromises = [];
        
        for (var i = 0; i < courses.length; i++) {
            var course = courses[i];
            var innerQuery = "SELECT semester_id FROM semester WHERE year = '" +
                course["semester"]["year"] + "' AND term = '" + 
                course["semester"]["term"] + "' LIMIT 1;";
            var promise = executeInnerQuery(innerQuery, course, 'semester_id', 
                'semester').then(function(finalCourse) {
                coursesWithSemesterIDs.push(finalCourse);
            });
            coursePromises.push(promise);
        }
        
        Q.all(coursePromises).then(function() {
            console.log(coursesWithSemesterIDs[0]);
            defer.resolve(coursesWithSemesterIDs);
        });
        
        return defer.promise;
    }
    
    function sectionsInner() {
        var defer = Q.defer();
        var sectionsWithClassIDs = [];
        var sectionPromises = [];
        
        for (var i = 0; i < sections.length; i++) {
            var section = sections[i];
            var innerQuery = "SELECT class_id FROM class where course_number = '" +
                section['course_number'] + "' LIMIT 1;";
            var promise = executeInnerQuery(innerQuery, section, 'class_id', 
                'course_number', true).then(function(finalSection) {
                sectionsWithClassIDs.push(finalSection);
            });
            sectionPromises.push(promise);
        }
        
        Q.all(sectionPromises).then(function() {
            defer.resolve(sectionsWithClassIDs);
        });
        
        return defer.promise;
    }
    
    function timeSlotsInner() {
        console.log('in time slots inner');
        var defer = Q.defer();
        var timeSlotsWithSelectionIDs = [];
        var timeSlotPromises = [];
        
        for (var i = 0; i < timeslots.length; i++) {
            var timeslot = timeslots[i];
            var innerQuery = "SELECT section_id FROM section where crn = '" +
                timeslot['section_crn'] + "' LIMIT 1;";
            var promise = executeInnerQuery(innerQuery, timeslot, 'section_id', 
                'section_crn').then(function(finalTimeslot) {
                timeSlotsWithSelectionIDs.push(finalTimeslot);
            });
            timeSlotPromises.push(promise);
        }
        
        Q.all(timeSlotPromises).then(function() {
            console.log('resolve');
            defer.resolve(timeSlotsWithSelectionIDs);
        });
        
        return defer.promise;
    }

    return mainDefer.promise;
}

function executeInnerQuery(innerQuery, obj, key, deleteKey, print) {
    var defer = Q.defer();
    var finalObj = JSON.parse(JSON.stringify(obj));
    
    db.all(innerQuery, function(err, rows) {
        if (rows.length > 0) {
            var row = rows[0];
            if (row[key] !== undefined) {
                finalObj[key] = row[key];
            } else {
                finalObj[key] = "null";
            }
            if (deleteKey) { 
                delete finalObj[deleteKey];
            }
        }
        defer.resolve(finalObj);
    });
    
    return defer.promise;
}

function cleanUp(res) {
    console.log('Done');
    res.writeHead(302, {'Location': '/courseoff'});
    res.end();
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
            courses[i]['credits'] = sections[j]['credits']; 
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
                section['instructor']['lname'].trim() + ', ' + 
                section['instructor']['fname'].trim() : null;
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
