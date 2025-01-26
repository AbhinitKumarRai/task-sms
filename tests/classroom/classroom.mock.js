const mongoose = require('mongoose');

const mockSchool = {
    name: 'Test School',
    address: '123 Test St'
};

const mockClassroom = {
    single: (schoolId) => ({
        name: 'Test Class',
        schoolId: schoolId
    }),
    multiple: (schoolId) => [
        { name: 'Class 5A', schoolId: schoolId },
        { name: 'Class 5B', schoolId: schoolId },
        { name: 'Class 6A', schoolId: schoolId }
    ]
};

const mockToken = {
    admin: (schoolId) => ({
        role: 'admin',
        schoolId: schoolId,
        userId: new mongoose.Types.ObjectId()
    }),
    superAdmin: () => ({
        role: 'super-admin',
        userId: new mongoose.Types.ObjectId()
    })
};

module.exports = {
    mockSchool,
    mockClassroom,
    mockToken
}; 