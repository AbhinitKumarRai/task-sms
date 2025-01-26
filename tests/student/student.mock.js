const mongoose = require('mongoose');

const mockSchool = {
    name: 'Test School',
    address: '123 Test St'
};

const mockClassroom = {
    single: (schoolId) => ({
        name: 'Test Class',
        schoolId: schoolId
    })
};

const mockStudent = {
    single: (classroomId) => ({
        name: 'John Doe',
        age: 10,
        classroomId: classroomId
    }),
    multiple: (classroomId) => [
        { name: 'John Doe', age: 10, classroomId: classroomId },
        { name: 'Jane Smith', age: 11, classroomId: classroomId },
        { name: 'Bob Wilson', age: 10, classroomId: classroomId }
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
    mockStudent,
    mockToken
}; 