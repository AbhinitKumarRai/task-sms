const { validators } = require('../../../../managers/entities/_common/validators');
const mongoose = require('mongoose');

describe('Validation Tests', () => {
  describe('School Validation', () => {
    it('should validate valid school data', async () => {
      const validSchool = {
        name: 'Test School',
        address: '123 Test St'
      };
      
      const errors = await validators.school.create(validSchool);
      expect(errors).toBeNull();
    });

    it('should validate school name length', async () => {
      const invalidSchool = {
        name: 'Te', // too short
        address: '123 Test St'
      };
      
      const errors = await validators.school.create(invalidSchool);
      expect(errors).toBeDefined();
      expect(errors[0].message).toContain('name');
    });

    it('should validate school address length', async () => {
      const invalidSchool = {
        name: 'Test School',
        address: '1' // too short
      };
      
      const errors = await validators.school.create(invalidSchool);
      expect(errors).toBeDefined();
      expect(errors[0].message).toContain('address');
    });
  });

  describe('Classroom Validation', () => {
    it('should validate valid classroom data', async () => {
      const validClassroom = {
        name: 'Class 10-A',
        schoolID: '507f1f77bcf86cd799439011'
      };
      
      const errors = await validators.classroom.create(validClassroom);
      expect(errors).toBeNull();
    });

    it('should validate classroom name length', async () => {
      const invalidClassroom = {
        name: 'A', // too short
        schoolID: '507f1f77bcf86cd799439011'
      };
      
      const errors = await validators.classroom.create(invalidClassroom);
      expect(errors).toBeDefined();
      expect(errors[0].message).toContain('name');
    });

    it('should validate schoolID format', async () => {
      const invalidClassroom = {
        name: 'Class 10-A',
        schoolID: 'invalid-id'
      };
      
      const errors = await validators.classroom.create(invalidClassroom);
      expect(errors).toBeDefined();
      expect(errors[0].message).toContain('schoolID');
    });
  });

  describe('Student Validation', () => {
    it('should validate valid student data', async () => {
      const validStudent = {
        name: 'John Doe',
        age: 15,
        classroomID: '507f1f77bcf86cd799439011'
      };
      
      const errors = await validators.student.create(validStudent);
      expect(errors).toBeNull();
    });

    it('should validate student name length', async () => {
      const invalidStudent = {
        name: 'J', // too short
        age: 15,
        classroomID: '507f1f77bcf86cd799439011'
      };
      
      const errors = await validators.student.create(invalidStudent);
      expect(errors).toBeDefined();
      expect(errors[0].message).toContain('name');
    });

    it('should validate student age range', async () => {
      const invalidStudent = {
        name: 'John Doe',
        age: 25, // too old
        classroomID: '507f1f77bcf86cd799439011'
      };
      
      const errors = await validators.student.create(invalidStudent);
      expect(errors).toBeDefined();
      expect(errors[0].message).toContain('age');
    });

    it('should validate classroomID format', async () => {
      const invalidStudent = {
        name: 'John Doe',
        age: 15,
        classroomID: 'invalid-id'
      };
      
      const errors = await validators.student.create(invalidStudent);
      expect(errors).toBeDefined();
      expect(errors[0].message).toContain('classroomID');
    });
  });

  describe('User Validation', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'Test@123',
      role: 'super-admin',
      schoolId: new mongoose.Types.ObjectId().toString()
    };

    it('should validate valid user data', async () => {
      const errors = await validators.user.create(validUser);
      expect(errors).toBeNull();
    });

    it('should validate email format', async () => {
      const invalidUser = {
        ...validUser,
        email: 'invalid-email'
      };
      
      const errors = await validators.user.create(invalidUser);
      expect(errors).toBeDefined();
      expect(errors[0].message).toContain('email');
    });

    it('should validate password strength', async () => {
      const invalidUser = {
        ...validUser,
        password: 'weak'
      };
      
      const errors = await validators.user.create(invalidUser);
      expect(errors).toBeDefined();
      expect(errors[0].message).toContain('password');
    });

    it('should validate role values', async () => {
      const invalidUser = {
        ...validUser,
        role: 'invalid-role'
      };
      
      const errors = await validators.user.create(invalidUser);
      expect(errors).toBeDefined();
      expect(errors[0].message).toContain('role');
    });

    it('should validate schoolId format for admin users', async () => {
      const adminUser = {
        ...validUser,
        role: 'admin',
        schoolId: 'invalid-id'
      };
      
      const errors = await validators.user.create(adminUser);
      expect(errors).toBeDefined();
      expect(errors[0].message).toContain('schoolId');
    });

    it('should not require schoolId for super-admin', async () => {
      const superAdminUser = {
        email: 'super@admin.com',
        password: 'Test@123',
        role: 'super-admin'
      };
      
      const errors = await validators.user.create(superAdminUser);
      expect(errors).toBeNull();
    });

    it('should require schoolId for admin', async () => {
      const adminWithoutSchool = {
        email: 'admin@school.com',
        password: 'Test@123',
        role: 'admin'
      };
      
      const errors = await validators.user.create(adminWithoutSchool);
      expect(errors).toBeDefined();
      expect(errors[0].message).toContain('schoolId');
    });
  });
}); 