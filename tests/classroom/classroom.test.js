const mongoose = require('mongoose');
const Classroom = require('../../managers/entities/classroom/classroom.manager');
const TokenManager = require('../mocks/token.manager.mock');
const { SchoolModel, ClassroomModel } = require('../mocks/mongoose.mock');
const { mockSchool, mockClassroom, mockToken } = require('./classroom.mock');

describe('Classroom Manager', () => {
    let classroomManager;
    let schoolId;

    beforeEach(async () => {
        classroomManager = new Classroom({
            mongomodels: {
                SchoolModel,
                ClassroomModel
            },
            managers: {
                token: new TokenManager()
            }
        });

        // Create test school
        const school = await SchoolModel.create(mockSchool);
        schoolId = school._id;
    });

    describe('create', () => {
        it('should create a classroom successfully', async () => {
            const result = await classroomManager.create({
                __longToken: mockToken.admin(schoolId),
                name: 'Test Class',
                schoolId: schoolId
            });

            expect(result.ok).toBe(true);
            expect(result.data.name).toBe('Test Class');
            expect(result.data.schoolId.toString()).toBe(schoolId.toString());
        });

        it('should fail when creating classroom for different school', async () => {
            const result = await classroomManager.create({
                __longToken: mockToken.admin(schoolId),
                name: 'Test Class',
                schoolId: new mongoose.Types.ObjectId()
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(403);
        });
    });

    describe('getAll', () => {
        beforeEach(async () => {
            // Create multiple test classrooms
            await Promise.all(mockClassroom.multiple(schoolId).map(c => 
                ClassroomModel.create({
                    ...c,
                    schoolId: schoolId
                })
            ));
        });

        it('should get all classrooms for admin', async () => {
            const result = await classroomManager.getAll({
                __longToken: mockToken.admin(schoolId)
            });

            expect(result.ok).toBe(true);
            expect(result.data.length).toBe(3);
        });

        it('should filter classrooms by school for admin', async () => {
            const otherSchool = await SchoolModel.create({ ...mockSchool, name: 'Other School' });
            await ClassroomModel.create({
                ...mockClassroom.single(otherSchool._id),
                schoolId: otherSchool._id
            });

            const result = await classroomManager.getAll({
                __longToken: mockToken.admin(schoolId)
            });

            expect(result.ok).toBe(true);
            expect(result.data.length).toBe(3);
            expect(result.data.every(c => c.schoolId.toString() === schoolId.toString())).toBe(true);
        });
    });

    // Add more test cases...
}); 