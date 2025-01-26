require('../../../mocks/app.mock');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../../../app');
const UserModel = require('../../../../../managers/entities/user/user.mongoModel');
const SchoolModel = require('../../../../../managers/entities/school/school.mongoModel');
const { roles } = require('../../../../../managers/entities/_common/roles');
const bcrypt = require('bcrypt');

describe('User Manager', () => {
  let superAdminToken;
  let schoolId;

  beforeEach(async () => {
    // Create a test school
    const school = await SchoolModel.create({
      name: 'Test School',
      address: 'Test Address'
    });
    schoolId = school._id;

    // Create super admin
    const superAdmin = await UserModel.create({
      email: 'superadmin@test.com',
      password: await bcrypt.hash('password123', 10),
      role: roles.SUPER_ADMIN
    });

    superAdminToken = global.generateAuthToken(roles.SUPER_ADMIN, superAdmin._id);
  });

  describe('POST /api/user/createAdmin', () => {
    const validAdmin = {
      email: 'newadmin@test.com',
      password: 'password123',
      schoolID: null // Will be set in beforeEach
    };

    beforeEach(() => {
      validAdmin.schoolID = schoolId;
    });

    it('should create a new admin as super admin', async () => {
      const response = await request(app)
        .post('/api/user/createAdmin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validAdmin);
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.email).toBe(validAdmin.email);
      expect(response.body.data.role).toBe(roles.ADMIN);
      expect(response.body.data.school.toString()).toBe(schoolId.toString());
    });

    it('should prevent creating admin with duplicate email', async () => {
      // Create first admin
      await request(app)
        .post('/api/user/createAdmin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validAdmin);

      // Try to create admin with same email
      const response = await request(app)
        .post('/api/user/createAdmin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validAdmin);
      
      expect(response.status).toBe(409);
      expect(response.body.ok).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/user/createAdmin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'newadmin@test.com',
          // missing password and schoolID
        });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/user/createAdmin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          ...validAdmin,
          email: 'invalid-email'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/user/createAdmin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          ...validAdmin,
          password: '123' // too short
        });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/user/login', () => {
    beforeEach(async () => {
      // Create a test admin
      await UserModel.create({
        email: 'admin@test.com',
        password: await bcrypt.hash('password123', 10),
        role: roles.ADMIN,
        school: schoolId
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.ok).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(404);
      expect(response.body.ok).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'admin@test.com'
          // missing password
        });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });
}); 