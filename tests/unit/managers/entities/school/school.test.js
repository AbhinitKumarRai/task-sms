require('../../../mocks/app.mock');
const mongoose = require('mongoose');
const School = require('../../../../managers/entities/school/school.manager');
const { SchoolModel } = require('../../../../managers/entities/school/school.mongoModel');
const TokenManager = require('../../../mocks/token.manager.mock');
const { mockSchool, mockToken } = require('../../../school/school.mock');
const request = require('supertest');
const { roles } = require('../../../../../managers/entities/_common/roles');

describe('School Manager', () => {
  let superAdminToken;
  let adminToken;
  let schoolId;
  let schoolManager;

  beforeEach(async () => {
    superAdminToken = global.generateAuthToken(roles.SUPER_ADMIN);
    adminToken = global.generateAuthToken(roles.ADMIN);
    schoolManager = new School({
      mongomodels: {
        SchoolModel
      },
      managers: {
        token: new TokenManager()
      }
    });
  });

  describe('GET /api/school/getAll', () => {
    beforeEach(async () => {
      // Create test schools
      await SchoolModel.create([
        { name: 'School 1', address: 'Address 1' },
        { name: 'School 2', address: 'Address 2' }
      ]);
    });

    it('should return all schools for super admin', async () => {
      const response = await request(app)
        .get('/api/school/getAll')
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should deny access for regular admin', async () => {
      const response = await request(app)
        .get('/api/school/getAll')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('POST /api/school/create', () => {
    const validSchool = {
      name: 'Test School',
      address: '123 Test St'
    };

    it('should create a new school as super admin', async () => {
      const response = await request(app)
        .post('/api/school/create')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validSchool);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe(validSchool.name);
      
      schoolId = response.body.data._id;
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/school/create')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Test School' }); // missing address
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should prevent duplicate school names', async () => {
      // Create first school
      await request(app)
        .post('/api/school/create')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validSchool);

      // Try to create school with same name
      const response = await request(app)
        .post('/api/school/create')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validSchool);
      
      expect(response.status).toBe(409);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('PUT /api/school/update/:id', () => {
    beforeEach(async () => {
      // Create a test school
      const school = await SchoolModel.create({
        name: 'School to Update',
        address: 'Old Address'
      });
      schoolId = school._id;
    });

    it('should update school as super admin', async () => {
      const updateData = {
        name: 'Updated School',
        address: 'New Address'
      };

      const response = await request(app)
        .put(`/api/school/update/${schoolId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      
      // Verify update in database
      const updatedSchool = await SchoolModel.findById(schoolId);
      expect(updatedSchool.name).toBe(updateData.name);
      expect(updatedSchool.address).toBe(updateData.address);
    });

    it('should return 404 for non-existent school', async () => {
      const response = await request(app)
        .put('/api/school/update/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Updated School',
          address: 'New Address'
        });
      
      expect(response.status).toBe(404);
      expect(response.body.ok).toBe(false);
    });
  });

  describe('DELETE /api/school/delete/:id', () => {
    beforeEach(async () => {
      // Create a test school
      const school = await SchoolModel.create({
        name: 'School to Delete',
        address: 'Delete Address'
      });
      schoolId = school._id;
    });

    it('should delete school as super admin', async () => {
      const response = await request(app)
        .delete(`/api/school/delete/${schoolId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      
      // Verify deletion
      const deletedSchool = await SchoolModel.findById(schoolId);
      expect(deletedSchool).toBeNull();
    });

    it('should prevent deletion if school has dependencies', async () => {
      // Create a classroom for the school
      await request(app)
        .post('/api/classroom/create')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Test Classroom',
          schoolID: schoolId
        });

      const response = await request(app)
        .delete(`/api/school/delete/${schoolId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(409);
      expect(response.body.ok).toBe(false);
    });
  });
}); 