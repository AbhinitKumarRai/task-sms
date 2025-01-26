const create = async ({ name, schoolID }) => {
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

    if (!schoolID) {
        errors.push({
            label: 'schoolID',
            path: 'schoolID',
            message: 'schoolID is required',
            log: '_required',
            errors: []
        });
    }

    return errors.length ? errors : null;
};

module.exports = {
    create,
    update: async ({ id, name }) => {
        const errors = [];
        if (!name) {
            errors.push({
                label: 'name',
                path: 'name',
                message: 'name is required',
                log: '_required',
                errors: []
            });
        }
        return errors.length ? errors : null;
    },
    delete: async ({ id }) => {
        return null; // ID validation is handled by MongoDB
    }
}; 