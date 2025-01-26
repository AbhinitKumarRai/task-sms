require('../../../mocks/app.mock');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../../../app');
const StudentModel = require('../../../../../managers/entities/student/student.mongoModel');
const ClassroomModel = require('../../../../../managers/entities/classroom/classroom.mongoModel');
const SchoolModel = require('../../../../../managers/entities/school/school.mongoModel');
const UserModel = require('../../../../../managers/entities/user/user.mongoModel');
const { roles } = require('../../../../../managers/entities/_common/roles');

describe('Student Manager', () => {
  let superAdminToken;
  let adminToken;
  let schoolId;
  let classroomId;
  let studentId;
  let adminUserId;

  beforeEach(async () => {
    // Create a test school
    const school = await SchoolModel.create({
      name: 'Test School',
      address: 'Test Address'
    });
    schoolId = school._id;

    // Create a test classroom
    const classroom = await ClassroomModel.create({
      name: 'Test Classroom',
      school: schoolId
    });
    classroomId = classroom._id;

    // Create an admin user for the school
    const admin = await UserModel.create({
      email: 'admin@test.com',
      password: 'password123',
      role: roles.ADMIN,
      school: schoolId
    });
    adminUserId = admin._id;

    superAdminToken = global.generateAuthToken(roles.SUPER_ADMIN);
    adminToken = global.generateAuthToken(roles.ADMIN, adminUserId);
  });

  describe('GET /api/student/getAll', () => {
    beforeEach(async () => {
      // Create test students
      await StudentModel.create([
        { name: 'Student 1', age: 15, classroom: classroomId },
        { name: 'Student 2', age: 16, classroom: classroomId }
      ]);
    });

    it('should return all students for super admin', async () => {
      const response = await request(app)
        .get('/api/student/getAll')
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should return only school students for admin', async () => {
      // Create student in another school
      const otherSchool = await SchoolModel.create({
        name: 'Other School',
        address: 'Other Address'
      });
      const otherClassroom = await ClassroomModel.create({
        name: 'Other Classroom',
        school: otherSchool._id
      });
      await StudentModel.create({
        name: 'Other Student',
        age: 15,
        classroom: otherClassroom._id
      });

      const response = await request(app)
        .get('/api/student/getAll')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2); // Only students from admin's school
    });

    it('should filter students by classroom', async () => {
      const response = await request(app)
        .get(`/api/student/getAll?classroomID=${classroomId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every(student => student.classroom === classroomId)).toBe(true);
    });
  });

  describe('POST /api/student/create', () => {
    const validStudent = {
      name: 'New Student',
      age: 15,
      classroomID: null // Will be set in beforeEach
    };

    beforeEach(() => {
      validStudent.classroomID = classroomId;
    });

    it('should create a new student as super admin', async () => {
      const response = await request(app)
        .post('/api/student/create')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validStudent);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe(validStudent.name);
      
      studentId = response.body.data._id;
    });

    it('should create a new student as school admin', async () => {
      const response = await request(app)
        .post('/api/student/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validStudent);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should validate age range', async () => {
      const response = await request(app)
        .post('/api/student/create')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          ...validStudent,
          age: 5 // too young
        });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should prevent admin from creating student in different school', async () => {
      const otherSchool = await SchoolModel.create({
        name: 'Other School',
        address: 'Other Address'
      });
      const otherClassroom = await ClassroomModel.create({
        name: 'Other Classroom',
        school: otherSchool._id
      });

      const response = await request(app)
        .post('/api/student/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Student',
          age: 15,
          classroomID: otherClassroom._id
        });
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('PUT /api/student/update/:id', () => {
    beforeEach(async () => {
      // Create a test student
      const student = await StudentModel.create({
        name: 'Student to Update',
        age: 15,
        classroom: classroomId
      });
      studentId = student._id;
    });

    it('should update student as super admin', async () => {
      const updateData = {
        name: 'Updated Student',
        age: 16
      };

      const response = await request(app)
        .put(`/api/student/update/${studentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      
      // Verify update
      const updatedStudent = await StudentModel.findById(studentId);
      expect(updatedStudent.name).toBe(updateData.name);
      expect(updatedStudent.age).toBe(updateData.age);
    });

    it('should allow admin to update student in their school', async () => {
      const response = await request(app)
        .put(`/api/student/update/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Updated',
          age: 17
        });
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should prevent admin from updating student in different school', async () => {
      // Create student in different school
      const otherSchool = await SchoolModel.create({
        name: 'Other School',
        address: 'Other Address'
      });
      const otherClassroom = await ClassroomModel.create({
        name: 'Other Classroom',
        school: otherSchool._id
      });
      const otherStudent = await StudentModel.create({
        name: 'Other Student',
        age: 15,
        classroom: otherClassroom._id
      });

      const response = await request(app)
        .put(`/api/student/update/${otherStudent._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Unauthorized Update',
          age: 16
        });
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('DELETE /api/student/delete/:id', () => {
    beforeEach(async () => {
      // Create a test student
      const student = await StudentModel.create({
        name: 'Student to Delete',
        age: 15,
        classroom: classroomId
      });
      studentId = student._id;
    });

    it('should delete student as super admin', async () => {
      const response = await request(app)
        .delete(`/api/student/delete/${studentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      
      // Verify deletion
      const deletedStudent = await StudentModel.findById(studentId);
      expect(deletedStudent).toBeNull();
    });

    it('should allow admin to delete student in their school', async () => {
      const response = await request(app)
        .delete(`/api/student/delete/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should prevent admin from deleting student in different school', async () => {
      // Create student in different school
      const otherSchool = await SchoolModel.create({
        name: 'Other School',
        address: 'Other Address'
      });
      const otherClassroom = await ClassroomModel.create({
        name: 'Other Classroom',
        school: otherSchool._id
      });
      const otherStudent = await StudentModel.create({
        name: 'Other Student',
        age: 15,
        classroom: otherClassroom._id
      });

      const response = await request(app)
        .delete(`/api/student/delete/${otherStudent._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
    });
  });
}); 