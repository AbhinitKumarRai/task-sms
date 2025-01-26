const create = async ({ name, age, classroomID }) => {
    const errors = [];
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push({
            label: 'name',
            path: 'name',
            message: 'Valid name is required',
            log: '_required',
            errors: []
        });
    }

    if (!age || typeof age !== 'number' || age < 3 || age > 100) {
        errors.push({
            label: 'age',
            path: 'age',
            message: 'Valid age between 3 and 100 is required',
            log: '_required',
            errors: []
        });
    }

    if (!classroomID) {
        errors.push({
            label: 'classroomID',
            path: 'classroomID',
            message: 'classroomID is required',
            log: '_required',
            errors: []
        });
    }

    return errors.length ? errors : null;
};

module.exports = {
    create
}; 