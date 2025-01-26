const axios = require('axios');

const BASE_URL = 'http://localhost:5111/api';
let superAdminToken, schoolAdminToken, schoolId, classroomId;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

async function runTests() {
    try {
        console.log('Starting API Tests...');

        // 1. Login as Super Admin
        console.log('\n1. Login as Super Admin');
        const loginResponse = await api.post('/user/login', {
            email: 'super@admin.com',
            password: 'SuperAdmin@123'
        });
        superAdminToken = loginResponse.data.token;
        console.log('Super Admin Token:', superAdminToken);

        // 2. Create School
        console.log('\n2. Creating School');
        const schoolResponse = await api.post('/school/create', {
            name: 'Test School',
            address: '123 Test Street'
        }, {
            headers: { token: superAdminToken }
        });
        schoolId = schoolResponse.data.data._id;
        console.log('School created:', schoolId);

        // 3. Create School Admin
        console.log('\n3. Creating School Admin');
        await api.post('/user/createUser', {
            email: 'schooladmin@test.com',
            password: 'Admin@123',
            role: 'admin',
            schoolID: schoolId
        }, {
            headers: { token: superAdminToken }
        });

        // 4. Login as School Admin
        console.log('\n4. Login as School Admin');
        const adminLoginResponse = await api.post('/user/login', {
            email: 'schooladmin@test.com',
            password: 'Admin@123'
        });
        schoolAdminToken = adminLoginResponse.data.token;

        // 5. Create Classroom
        console.log('\n5. Creating Classroom');
        const classroomResponse = await api.post('/classroom/create', {
            name: 'Class 5A',
            schoolId: schoolId
        }, {
            headers: { token: schoolAdminToken }
        });
        classroomId = classroomResponse.data.data._id;

        // 6. Create Student
        console.log('\n6. Creating Student');
        await api.post('/student/create', {
            name: 'John Doe',
            age: 10,
            classroomID: classroomId
        }, {
            headers: { token: schoolAdminToken }
        });

        // 7. Get All Schools
        console.log('\n7. Getting All Schools');
        const schools = await api.get('/school/getAll', {
            headers: { token: superAdminToken }
        });
        console.log('Schools:', schools.data);

        // 8. Get All Classrooms
        console.log('\n8. Getting All Classrooms');
        const classrooms = await api.get('/classroom/getAll', {
            headers: { token: schoolAdminToken }
        });
        console.log('Classrooms:', classrooms.data);

        // 9. Get All Students
        console.log('\n9. Getting All Students');
        const students = await api.get('/student/getAll', {
            headers: { token: schoolAdminToken }
        });
        console.log('Students:', students.data);

        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('Error during tests:', error.response?.data || error.message);
    }
}

runTests(); 