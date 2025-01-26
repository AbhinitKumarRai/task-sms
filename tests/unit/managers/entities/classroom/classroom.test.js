require('../../../mocks/app.mock');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../../../app');
const ClassroomModel = require('../../../../../managers/entities/classroom/classroom.mongoModel');
const SchoolModel = require('../../../../../managers/entities/school/school.mongoModel');
const UserModel = require('../../../../../managers/entities/user/user.mongoModel');
const { roles } = require('../../../../../managers/entities/_common/roles');

describe('Classroom Manager', () => {
  let superAdminToken;
  let adminToken;
  let schoolId;
  let classroomId;
  let adminUserId;

  beforeEach(async () => {
    // Create a test school
    const school = await SchoolModel.create({
      name: 'Test School',
      address: 'Test Address'
    });
    schoolId = school._id;

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

  describe('GET /api/classroom/getAll', () => {
    beforeEach(async () => {
      // Create test classrooms
      await ClassroomModel.create([
        { name: 'Class 1', school: schoolId },
        { name: 'Class 2', school: schoolId }
      ]);
    });

    it('should return all classrooms for super admin', async () => {
      const response = await request(app)
        .get('/api/classroom/getAll')
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should return only school classrooms for admin', async () => {
      // Create classroom in another school
      const otherSchool = await SchoolModel.create({
        name: 'Other School',
        address: 'Other Address'
      });
      await ClassroomModel.create({
        name: 'Other Class',
        school: otherSchool._id
      });

      const response = await request(app)
        .get('/api/classroom/getAll')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2); // Only classrooms from admin's school
    });
  });

  describe('POST /api/classroom/create', () => {
    const validClassroom = {
      name: 'New Classroom',
      schoolID: null // Will be set in beforeEach
    };

    beforeEach(() => {
      validClassroom.schoolID = schoolId;
    });

    it('should create a new classroom as super admin', async () => {
      const response = await request(app)
        .post('/api/classroom/create')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validClassroom);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe(validClassroom.name);
      
      classroomId = response.body.data._id;
    });

    it('should create a new classroom as school admin', async () => {
      const response = await request(app)
        .post('/api/classroom/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validClassroom);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should prevent admin from creating classroom in different school', async () => {
      const otherSchool = await SchoolModel.create({
        name: 'Other School',
        address: 'Other Address'
      });

      const response = await request(app)
        .post('/api/classroom/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Classroom',
          schoolID: otherSchool._id
        });
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('PUT /api/classroom/update/:id', () => {
    beforeEach(async () => {
      // Create a test classroom
      const classroom = await ClassroomModel.create({
        name: 'Classroom to Update',
        school: schoolId
      });
      classroomId = classroom._id;
    });

    it('should update classroom as super admin', async () => {
      const updateData = {
        name: 'Updated Classroom'
      };

      const response = await request(app)
        .put(`/api/classroom/update/${classroomId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      
      // Verify update
      const updatedClassroom = await ClassroomModel.findById(classroomId);
      expect(updatedClassroom.name).toBe(updateData.name);
    });

    it('should allow admin to update classroom in their school', async () => {
      const response = await request(app)
        .put(`/api/classroom/update/${classroomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Updated' });
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should prevent admin from updating classroom in different school', async () => {
      // Create classroom in different school
      const otherSchool = await SchoolModel.create({
        name: 'Other School',
        address: 'Other Address'
      });
      const otherClassroom = await ClassroomModel.create({
        name: 'Other Classroom',
        school: otherSchool._id
      });

      const response = await request(app)
        .put(`/api/classroom/update/${otherClassroom._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Unauthorized Update' });
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('DELETE /api/classroom/delete/:id', () => {
    beforeEach(async () => {
      // Create a test classroom
      const classroom = await ClassroomModel.create({
        name: 'Classroom to Delete',
        school: schoolId
      });
      classroomId = classroom._id;
    });

    it('should delete classroom as super admin', async () => {
      const response = await request(app)
        .delete(`/api/classroom/delete/${classroomId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      
      // Verify deletion
      const deletedClassroom = await ClassroomModel.findById(classroomId);
      expect(deletedClassroom).toBeNull();
    });

    it('should prevent deletion if classroom has students', async () => {
      // Create a student in the classroom
      await request(app)
        .post('/api/student/create')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Test Student',
          age: 15,
          classroomID: classroomId
        });

      const response = await request(app)
        .delete(`/api/classroom/delete/${classroomId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(409);
      expect(response.body.ok).toBe(false);
    });

    it('should prevent admin from deleting classroom in different school', async () => {
      // Create classroom in different school
      const otherSchool = await SchoolModel.create({
        name: 'Other School',
        address: 'Other Address'
      });
      const otherClassroom = await ClassroomModel.create({
        name: 'Other Classroom',
        school: otherSchool._id
      });

      const response = await request(app)
        .delete(`/api/classroom/delete/${otherClassroom._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
    });
  });
}); 