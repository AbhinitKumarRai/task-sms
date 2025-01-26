require('../mocks/app.mock');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const { roles } = require('../../managers/entities/_common/roles');
const SchoolModel = require('../../managers/entities/school/school.mongoModel');
const { ClassroomModel } = require('../../managers/entities/classroom/classroom.mongoModel');
const StudentModel = require('../../managers/entities/student/student.mongoModel');
const UserModel = require('../../managers/entities/user/user.mongoModel');

describe('School-Classroom-Student Integration', () => {
  let superAdminToken;
  let adminToken;
  let schoolId;
  let classroomId;
  let studentId;
  let adminUserId;

  beforeEach(async () => {
    // Create super admin token
    superAdminToken = global.generateAuthToken(roles.SUPER_ADMIN);

    // Create a school
    const schoolResponse = await request(app)
      .post('/api/school/create')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Integration Test School',
        address: '123 Integration St'
      });
    
    schoolId = schoolResponse.body.data._id;

    // Create an admin for the school
    const adminResponse = await request(app)
      .post('/api/user/createAdmin')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: 'admin@integration.com',
        password: 'Password123!',
        schoolID: schoolId
      });
    
    adminUserId = adminResponse.body.data._id;
    adminToken = global.generateAuthToken(roles.ADMIN, adminUserId);
  });

  describe('Complete School Management Flow', () => {
    it('should handle complete school-classroom-student lifecycle', async () => {
      // 1. Create a classroom
      const classroomResponse = await request(app)
        .post('/api/classroom/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Integration Class',
          schoolID: schoolId
        });
      
      expect(classroomResponse.status).toBe(200);
      classroomId = classroomResponse.body.data._id;

      // 2. Create multiple students in the classroom
      const student1Response = await request(app)
        .post('/api/student/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Student 1',
          age: 15,
          classroomID: classroomId
        });
      
      expect(student1Response.status).toBe(200);

      const student2Response = await request(app)
        .post('/api/student/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Student 2',
          age: 16,
          classroomID: classroomId
        });
      
      expect(student2Response.status).toBe(200);

      // 3. Verify students were added
      const classroomStudentsResponse = await request(app)
        .get(`/api/classroom/getStudents/${classroomId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(classroomStudentsResponse.status).toBe(200);
      expect(classroomStudentsResponse.body.data.length).toBe(2);

      // 4. Try to delete classroom with students (should fail)
      const deleteClassroomResponse = await request(app)
        .delete(`/api/classroom/delete/${classroomId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(deleteClassroomResponse.status).toBe(409);

      // 5. Delete all students
      for (const student of classroomStudentsResponse.body.data) {
        const deleteStudentResponse = await request(app)
          .delete(`/api/student/delete/${student._id}`)
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(deleteStudentResponse.status).toBe(200);
      }

      // 6. Now classroom deletion should succeed
      const finalDeleteClassroomResponse = await request(app)
        .delete(`/api/classroom/delete/${classroomId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(finalDeleteClassroomResponse.status).toBe(200);

      // 7. Try to delete school with no classrooms (should succeed)
      const deleteSchoolResponse = await request(app)
        .delete(`/api/school/delete/${schoolId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(deleteSchoolResponse.status).toBe(200);
    });
  });

  describe('Admin Access Control Flow', () => {
    it('should properly restrict admin access across schools', async () => {
      // 1. Create another school
      const otherSchoolResponse = await request(app)
        .post('/api/school/create')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Other School',
          address: '456 Other St'
        });
      
      const otherSchoolId = otherSchoolResponse.body.data._id;

      // 2. Create classroom in first school
      const classroomResponse = await request(app)
        .post('/api/classroom/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Class',
          schoolID: schoolId
        });
      
      expect(classroomResponse.status).toBe(200);

      // 3. Try to create classroom in other school (should fail)
      const otherClassroomResponse = await request(app)
        .post('/api/classroom/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Other Class',
          schoolID: otherSchoolId
        });
      
      expect(otherClassroomResponse.status).toBe(403);

      // 4. Create classroom in other school using super admin
      const superAdminClassroomResponse = await request(app)
        .post('/api/classroom/create')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Super Admin Class',
          schoolID: otherSchoolId
        });
      
      expect(superAdminClassroomResponse.status).toBe(200);

      // 5. Verify admin can only see their school's classrooms
      const adminClassroomsResponse = await request(app)
        .get('/api/classroom/getAll')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(adminClassroomsResponse.status).toBe(200);
      expect(adminClassroomsResponse.body.data.length).toBe(1);
      expect(adminClassroomsResponse.body.data[0].schoolID).toBe(schoolId);
    });
  });

  describe('Data Integrity Flow', () => {
    it('should maintain referential integrity across entities', async () => {
      // 1. Create classroom
      const classroomResponse = await request(app)
        .post('/api/classroom/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Integrity Test Class',
          schoolID: schoolId
        });
      
      classroomId = classroomResponse.body.data._id;

      // 2. Create student
      const studentResponse = await request(app)
        .post('/api/student/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Student',
          age: 15,
          classroomID: classroomId
        });
      
      studentId = studentResponse.body.data._id;

      // 3. Verify classroom reference in student
      const student = await StudentModel.findById(studentId);
      expect(student.classroomID.toString()).toBe(classroomId.toString());

      // 4. Verify school reference in classroom
      const classroom = await ClassroomModel.findById(classroomId);
      expect(classroom.schoolID.toString()).toBe(schoolId.toString());

      // 5. Try to delete school (should fail due to classroom)
      const deleteSchoolResponse = await request(app)
        .delete(`/api/school/delete/${schoolId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(deleteSchoolResponse.status).toBe(409);

      // 6. Try to delete classroom (should fail due to student)
      const deleteClassroomResponse = await request(app)
        .delete(`/api/classroom/delete/${classroomId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(deleteClassroomResponse.status).toBe(409);

      // 7. Delete student
      const deleteStudentResponse = await request(app)
        .delete(`/api/student/delete/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(deleteStudentResponse.status).toBe(200);

      // 8. Now classroom deletion should succeed
      const finalDeleteClassroomResponse = await request(app)
        .delete(`/api/classroom/delete/${classroomId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(finalDeleteClassroomResponse.status).toBe(200);

      // 9. Finally school deletion should succeed
      const finalDeleteSchoolResponse = await request(app)
        .delete(`/api/school/delete/${schoolId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(finalDeleteSchoolResponse.status).toBe(200);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid data and duplicate entries', async () => {
      // 1. Try to create classroom with invalid school ID
      const invalidClassroomResponse = await request(app)
        .post('/api/classroom/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Class',
          schoolID: 'invalid-id'
        });
      
      expect(invalidClassroomResponse.status).toBe(400);

      // 2. Try to create duplicate classroom
      const classroom1Response = await request(app)
        .post('/api/classroom/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Class',
          schoolID: schoolId
        });
      
      expect(classroom1Response.status).toBe(200);

      const classroom2Response = await request(app)
        .post('/api/classroom/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Class',
          schoolID: schoolId
        });
      
      expect(classroom2Response.status).toBe(409);

      // 3. Try to create student with invalid classroom ID
      const invalidStudentResponse = await request(app)
        .post('/api/student/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Student',
          age: 15,
          classroomID: 'invalid-id'
        });
      
      expect(invalidStudentResponse.status).toBe(400);

      // 4. Try to create student with invalid age
      const invalidAgeStudentResponse = await request(app)
        .post('/api/student/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Age Student',
          age: 3,
          classroomID: classroom1Response.body.data._id
        });
      
      expect(invalidAgeStudentResponse.status).toBe(400);

      // 5. Try to access non-existent classroom
      const nonExistentClassroomResponse = await request(app)
        .get('/api/classroom/getStudents/000000000000000000000000')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(nonExistentClassroomResponse.status).toBe(404);

      // Cleanup
      const deleteClassroomResponse = await request(app)
        .delete(`/api/classroom/delete/${classroom1Response.body.data._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(deleteClassroomResponse.status).toBe(200);
    });

    it('should handle token validation and authorization', async () => {
      // 1. Try to access without token
      const noTokenResponse = await request(app)
        .get('/api/classroom/getAll');
      
      expect(noTokenResponse.status).toBe(401);

      // 2. Try to access with invalid token
      const invalidTokenResponse = await request(app)
        .get('/api/classroom/getAll')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(invalidTokenResponse.status).toBe(401);

      // 3. Try to access with malformed token
      const malformedTokenResponse = await request(app)
        .get('/api/classroom/getAll')
        .set('Authorization', 'InvalidBearer token');
      
      expect(malformedTokenResponse.status).toBe(401);
    });
  });
}); 