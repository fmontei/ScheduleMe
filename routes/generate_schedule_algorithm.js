"use strict";

let sqlite3 = require('sqlite3').verbose();
let async = require('async');
let util = require('util');

let db = new sqlite3.Database('scheduleme.db');

let sample_input = {
    'class_groups': [
        {
            'class_group_id': 1,
            'classes': [
                611, // CS 3312 Project Implementation
            ]
        },
        {
            'class_group_id': 2,
            'classes': [
                1313, // LMC 3431 Tech Comm Approaches
            ]
        },
        {
            'class_group_id': 3,
            'classes': [
                623, // CS 4235 Intro to Info Security
                625, // CS 4261 Mobile Apps and Services
                628, // CS 4420 Database Systems Implementation
            ]
        },
        {
            'class_group_id': 4,
            'classes': [
                607, // CS 3210 Design of Operating Systems
            ]
        },
        {
            'class_group_id': 5,
            'classes': [
                619, // CS 4001 Computing & Society
                620, // CS 4002 Robots & Society
            ]
        },
        {
            'class_group_id': 6,
            'classes': [
                654, // CS 6241 Compiler Design
            ]
        }
    ],
    'locked_class_groups': [
        1, 2, 3, 4, 5
    ],
    'locked_sections': [
        28749, 28736
    ],
    'criteria': [
        {
            'type': 'credits',
            'parameters': [ 12, 12 ],
            'priority': 'required'
        },
        {
            'type': 'timeslot',
            'parameters': { 'day_of_week': 'M', 'start_time': '14:05', 'end_time': '14:55' },
            'priority': 'required'
        },
        {
            'type': 'timeofday',
            'parameters': { 'start_time': '09:35', 'end_time': '17:55' },
            'priority': 'required'
        }
    ]
};

function to_map(array, key) {
    let map = new Map();
    array.forEach(function(obj) {
        map.set(obj[key], obj);
    });

    return map;
}

/*
 * retrieve class data, sections, timeslots
 */
function get_all_class_data(input, callback) {
    async.map(
        input.class_groups,
        function(class_group, class_group_callback) {
            async.map(
                class_group.classes,
                function(class_id, class_callback) {
                    async.waterfall([
                        function(class_data_callback) {
                            db.get(
                                'SELECT * FROM CLASS WHERE class_id = ?',
                                [ class_id ],
                                class_data_callback);
                        },
                        function(class_data, section_data_callback) {
                            db.all(
                                'SELECT * FROM SECTION WHERE class_id = ?',
                                [ class_data.class_id ],
                                function(err, sections) {
                                    if (err != null) {
                                        section_data_callback(err, null);
                                    } else {
                                        async.map(
                                            sections,
                                            function(section, timeslot_callback) {
                                                db.all(
                                                    'SELECT * FROM TIMESLOT WHERE section_id = ?',
                                                    [ section.section_id ],
                                                    function(err, timeslots) {
                                                        if (err != null) {
                                                            timeslot_callback(err, null);
                                                        } else {
                                                            section.timeslots = timeslots;
                                                            section.packed_timeslots = create_packed_timeslots(timeslots);
                                                            timeslot_callback(null, timeslots);
                                                        }
                                                    });
                                            },
                                            function(err, sections_with_timeslots) {
                                                if (err != null) {
                                                    section_data_callback(err, null);
                                                } else {
                                                    class_data.sections = sections;
                                                    section_data_callback(null, class_data);
                                                }
                                            });
                                    }
                                });
                        }],
                        class_callback);
                },
                function(err, classes) {
                    if (err != null) {
                        class_group_callback(err, null);
                    } else {
                        class_group_callback(null, {
                            'class_group_id': class_group.class_group_id,
                            'classes': classes
                        });
                    }
                });
        },
        callback);
}

// class Graph {
//     constructor() {
//         this.nodes = new Map();
//         this.weights = new Map();
//     }

//     add_node(id, weight) {
//         console.assert(!nodes.has(id) && !weights.has(id),
//                 "duplicate id '%s' in graph", id);

//         nodes.set(id, new Set());
//         weights.set(id, weight);
//     }

//     remove_node(id) {
//         console.assert(nodes.has(id) && weights.has(id),
//                 "tried to remove nonexistent id '%s'", id);

//         nodes.get(id).forEach(function(value1, value2, set) {
//             remove_edge(id, value1);
//         });

//         nodes.delete(id);
//         weights.delete(id);
//     }

//     contains_node(id) {
//         return nodes.has(id);
//     }

//     // get_weight(id) {
//     //     if (nodes)
//     // }

//     get_neighbors(id) {
//         console.assert(nodes.has(id),
//                 "tried to get_neighbors nonexistent id '%s'", id);

//         return nodes.get(id);
//     }

//     add_edge(id1, id2) {
//         console.assert(id1 !== id2, "tried to add_edge self edge '%s'", id1);
//         console.assert(nodes.has(id1),
//                 "tried to add_edge nonexistent id '%s'", id1);
//         console.assert(nodes.has(id2),
//                 "tried to add_edge nonexistent id '%s'", id2);
//         console.assert(!nodes.get(id1).contains(id2) && !nodes.get(id2).contains(id1),
//                 "already existing edge between '%s' and '%s'", id1, id2);
        
//         nodes.get(id1).add(id2);
//         nodes.get(id2).add(id1);
//     }

//     remove_edge(id1, id2) {
//         console.assert(nodes.has(id1) && nodes.has(id2)
//                 && nodes.get(id1).contains(id2)
//                 && nodes.get(id2).contains(id1),
//                 "no edge between '%s' and '%s'", id1, id2);

//         nodes.get(id1).delete(id2);
//         nodes.get(id2).delete(id1);
//     }

//     contains_edge(id1, id2) {
//         return nodes.contains(id1) && nodes.get(id1).has(id2)
//             && nodes.contains(id2) && nodes.get(id2).has(id1);
//     }
// }

let days_map = new Map([
    [ 'M', 0 ],
    [ 'T', 1 ],
    [ 'W', 2 ],
    [ 'R', 3 ],
    [ 'F', 4 ],
    [ 'S', 5 ],
    [ 'U', 6 ]
]);

let time_adjust_map = {
    // start minutes
    '05': +0,
    '35': +1,

    // end minutes
    '25': +0,
    '55': +1
};

/*
 * Takes a "HH:MM" format string
 * Expects HH to be 24-hour time
 * Expects MM to be 05, 25, 25, or 55
 * Must be between 00:05 and 23:55
 * 00:05 => 0, 23:35 => 47
 * 00:25 => 0, 23:55 => 47
 */
function time_to_slot_num(time) {
    let base = Number.parseInt(time.substring(0, 2), 10) * 2;
    let off = time_adjust_map[time.substring(3, 5)];
    console.assert(!Number.isNaN(base + off), 'bad time_to_slot %s', time);
    return base + off;
}

/*
 * 1's in range [start, end] (inclusive!!)
 * bit_range(2, 4) => 00000000 00000000 00000000 00011100
 */
function bit_range(start, end) {
    console.assert(start >= 0 && start < 32, 'start %s out of range', start);
    console.assert(end >= 0 && end < 32, 'end %s out of range', end);

    let len = end - start + 1;
    return ((1 << len) - 1) << start;
}

function create_packed_timeslots(timeslots) {
    // need two ints for each day since we have a theoretical max
    // of 48 time slots/day and js can't do 64bit bitwise ops
    //    
    //    v 31                              v 0
    // 0: 00000000 00000000 00000000 00000000
    //                      v 47            v 32
    // 1: xxxxxxxx xxxxxxxx 00000000 00000000
    let arr = new Uint32Array(14);
    timeslots.forEach(function(timeslot) {
        console.assert(timeslot.start_time !== undefined, "undef " + util.inspect(timeslot));
        let idx = 2 * days_map.get(timeslot.day_of_week);
        let start_slot = time_to_slot_num(timeslot.start_time)
        let end_slot = time_to_slot_num(timeslot.end_time);
        if (start_slot > 31) {
            // entirely in upper slots
            arr[idx + 1] |= bit_range(start_slot - 32, end_slot - 32);
        } else if (end_slot < 32) {
            // entirely in lower slots
            arr[idx] |= bit_range(start_slot, end_slot);
        } else {
            // crosses int boundary
            arr[idx] |= bit_range(start_slot, 31);
            arr[idx + 1] |= bit_range(0, end_slot - 32);
        }
    });

    return arr;
}

function to_padded_bin(num) {
    if (num < 0) {
        num += 0x100000000;
    }

    return ('0000000000000000000000000000000' + num.toString(2)).substr(-32);
}

function print_packed_timeslots(pts) {
    let timeslots = new Array();
    for (let entry of days_map) {
        let day = entry[0];
        let idx = entry[1] * 2;

        let lo = pts[idx];
        let hi = pts[idx + 1];

        console.log(day + ': ' + to_padded_bin(hi) + to_padded_bin(lo));
    }
}

function do_packed_timeslots_conflict(pt1, pt2) {
    for (let i = 0; i < 14; i++) {
        if ((pt1[i] & pt2[i]) != 0)  {
            return true;
        }
    }

    return false;
}

function create_section_map(class_groups) {
    let map = new Map();
    class_groups.forEach(function(class_group) {
        class_group.classes.forEach(function(clazz) {
            clazz.sections.forEach(function(section) {
                map.set(section.section_id, { 'class_group': class_group, 'class': clazz, 'section': section });
            });
        });
    });

    return map;
}

function create_daily_range_timeslots(start_time, end_time) {
    let timeslots = new Array();
    for (let day of days_map.keys()) {
        timeslots.push({
            'day_of_week': day,
            'start_time': start_time,
            'end_time': end_time
        });
    }

    return timeslots;
}

function invert_packed_timeslots(pts) {
    let arr = new Uint32Array(14);
    for (let i = 0; i < 14; i += 2) {
        arr[i] = pts[i] ^ 0xFFFFFFFF;
        arr[i + 1] = pts[i + 1] ^ 0x0000FFFF;
    }

    return arr;
}

function merge_packed_timeslots(pts1, pts2) {
    let arr = new Uint32Array(14);
    for (let i = 0; i < 14; i++) {
        arr[i] = pts1[i] | pts2[i];
    }

    return arr;
}

/*
 * Returns value between 0-1, or -1 if section should be disqualified
 */
function calculate_criteria_weight(section, criteria) {
    for (let criterion of criteria) {
        // TODO: support priorities...
        console.assert(criterion.priority === 'required', 'criterion priorities not yet supported');
        switch (criterion.type) {
            case 'timeslot':
                if (!criterion.hasOwnProperty('packed_timeslots')) {
                    criterion.packed_timeslots = create_packed_timeslots([criterion.parameters]);
                }

                if (do_packed_timeslots_conflict(criterion.packed_timeslots, section.packed_timeslots)) {
                    return -1;
                }
                break;
            case 'timeofday':
                if (!criterion.hasOwnProperty('packed_timeslots')) {
                    let daily_range = create_daily_range_timeslots(
                        criterion.parameters.start_time,
                        criterion.parameters.end_time);
                    let daily_packed = create_packed_timeslots(daily_range);
                    criterion.packed_timeslots = invert_packed_timeslots(daily_packed);
                }

                if (do_packed_timeslots_conflict(criterion.packed_timeslots, section.packed_timeslots)) {
                    return -1;
                }
                break;
        }
    }

    return 1;
}

function find_best_schedules(input, count, callback) {
    get_all_class_data(input,
        function(err, class_groups) {
            if (err != null) {
                callback(err, null);
                return;
            } else try {
                let locked_class_group_set = new Set(sample_input.locked_class_groups);
                let locked_sections_set = new Set(sample_input.locked_sections);
                let section_map = create_section_map(class_groups);

                let credits = input.criteria.filter(function(criterion) { return criterion.type === 'credits'; })[0].parameters;

                // Assign individual section weights and filter sections that
                // violate required criteria
                for (let entry of section_map) {
                    let section_id = entry[0];
                    let val = entry[1];
                    let weight = calculate_criteria_weight(val.section, input.criteria);
                    if (weight === -1) {
                        section_map.delete(section_id);
                    } else {
                        // TODO: rename weight to score
                        section_map.get(section_id).score = weight;
                    }
                }

                let locked_class_groups = [];
                let unlocked_class_groups = [];

                class_groups.forEach(function(class_group) {
                    if (locked_class_group_set.has(class_group.class_group_id)) {
                        locked_class_groups.push(class_group);
                    } else {
                        unlocked_class_groups.push(class_group);
                    }
                });

                let section_buckets = [];
                let lock_count = 0;

                // section_buckets is an array of arrays
                // each sub-array represents a set of mutually exclusive sections
                // the first lock_count groups are groups from which a section
                // must be included in all schedules
                for (let class_group of class_groups) {
                    let all_sections = class_group.classes
                        .map(function(clazz) { return clazz.sections; })
                        .reduce(function(acc, sections) { return acc.concat(sections); });

                    let locked_sections = all_sections.filter(function(section) {
                        return section_map.has(section.section_id)
                            && locked_sections_set.has(section.section_id);
                    });
                    
                    if (locked_class_group_set.has(class_group.class_group_id) && locked_sections.length > 0) {
                        callback('Cannot lock both class and section', null);
                        return;
                    }
                    if (locked_sections.length > 1) {
                        callback('Conflicting locked sections: ' + locked_sections.join(', '), null);
                        return;
                    }

                    if (locked_sections.length > 0) {
                        section_buckets.unshift(locked_sections);
                        lock_count++;
                        continue;
                    }

                    if (locked_class_group_set.has(class_group.class_group_id)) {
                        section_buckets.unshift(all_sections);
                        lock_count++;
                    } else {
                        section_buckets.push(all_sections);
                    }
                }

                let all_schedules = find_schedules_within_credit_range(
                        section_buckets, lock_count, 0,
                        new Uint32Array(14), credits[0], credits[1]);

                // let top_n = Array.from(all_schedules).sort(function(sched1, sched2) {
                //     // sort descending by score
                //     return sched2.score - sched2.score;
                // }).splice(0, count);

                callback(null, Array.from(all_schedules).map(function(sched) { return sched.sections.map(function(sec) { return sec.section_id; }); }));
            } catch (e) {
                throw e;
                callback(e, null);
            }
        });
}

function* find_schedules_within_credit_range(section_buckets, lock_count, start_ind, packed_timeslots, credit_min, credit_max) {
    if (start_ind == section_buckets.length
            || credit_max <= 0) {
        yield { 'credits': 0, 'score': 0, 'sections': [] };
        return;
    }

    // Not locked so search schedules without current section(s)
    if (lock_count <= 0) {
        let with_skip = find_schedules_within_credit_range(
                section_buckets, lock_count - 1, start_ind + 1,
                packed_timeslots, credit_min, credit_max);
        for (let schedule of with_skip) {
            yield schedule;
        }
    }

    // search schedules including current section
    for (let section of section_buckets[start_ind]) {
        if (section.credits > credit_max) continue;
        if (do_packed_timeslots_conflict(packed_timeslots, section.packed_timeslots)) continue;

        let with_take = find_schedules_within_credit_range(
                section_buckets, lock_count - 1, start_ind + 1,
                merge_packed_timeslots(packed_timeslots, section.packed_timeslots),
                credit_min - section.credits, credit_max - section.credits);
        for (let schedule of with_take) {
            let total_credits = schedule.credits + section.credits;
            // TODO: better combining function than +
            let total_score = schedule.score + section.score;
            if (total_credits >= credit_min && total_credits <= credit_max) {
                yield { 'credits': total_credits, 'score': total_score, 'sections': [section].concat(schedule.sections) };
            }
        }
    }
}

// This should be commented out so it doesn't run every time you run node
/*find_best_schedules(sample_input, 5, function(err, schedules) {
    if (err != null) {
        console.dir(err, { depth: null, colors: true });
    } else {
        //console.log(JSON.stringify(schedules, null, 2));
        console.dir(schedules, { depth: null, colors: true });
    }
});*/

module.exports.find_best_schedules = find_best_schedules;
