use schedulemedb;
create table SCHEDULES(
schedule_id int auto_increment primary key,
user_id int,
foreign key (user_id) references USERS(user_id),
schedule_date date
);
create table SEMESTERS(
semester_id int auto_increment primary key,
year int,
term enum('Spring', 'Summer', 'Fall', 'Winter')
);
create table CLASSES(
class_id int auto_increment primary key,
semester_id int,
foreign key (semester_id) references SEMESTERS(semester_id),
department varchar(255),
course_number int,
credits int
);
create table SECTIONS(
section_id int auto_increment primary key,
schedule_id int,
class_id int,
foreign key (schedule_id) references SCHEDULES(schedule_id),
foreign key (class_id) references CLASSES(class_id),
crn int,
professor varchar(255)
);
create table TIMESLOTS(
timeslot_id int auto_increment primary key,
section_id int,
foreign key (section_id) references SECTIONS(section_id),
location varchar(255),
end_time time,
start_time time,
day_of_week enum('M', 'T', 'W', 'TH', 'F', 'S', 'SN')
);