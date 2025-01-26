const mongoose = require('mongoose');
const Student = require('../../managers/entities/student/student.manager');
const TokenManager = require('../mocks/token.manager.mock');
const { SchoolModel, ClassroomModel, StudentModel } = require('../mocks/mongoose.mock');
const { mockSchool, mockClassroom, mockStudent, mockToken } = require('./student.mock');

describe('Student Manager', () => {
    let studentManager;
    let schoolId;
    let classroomId;

    beforeEach(async () => {
        studentManager = new Student({
            mongomodels: {
                ClassroomModel,
                SchoolModel,
                StudentModel
            },
            managers: {
                token: new TokenManager()
            }
        });

        // Create test school
        const school = await SchoolModel.create(mockSchool);
        schoolId = school._id;

        // Create test classroom
        const classroom = await ClassroomModel.create({
            ...mockClassroom.single(schoolId)
        });
        classroomId = classroom._id;
    });

    describe('create', () => {
        it('should create a student successfully', async () => {
            const result = await studentManager.create({
                __longToken: mockToken.admin(schoolId),
                ...mockStudent.single(classroomId)
            });

            expect(result.ok).toBe(true);
            expect(result.data.name).toBe('John Doe');
            expect(result.data.classroomId.toString()).toBe(classroomId.toString());
        });

        it('should fail when creating student in different school classroom', async () => {
            const otherSchool = await SchoolModel.create({ ...mockSchool, name: 'Other School' });
            const otherClassroom = await ClassroomModel.create({
                ...mockClassroom.single(otherSchool._id)
            });

            const result = await studentManager.create({
                __longToken: mockToken.admin(schoolId),
                ...mockStudent.single(otherClassroom._id)
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(403);
        });
    });

    describe('getAll', () => {
        beforeEach(async () => {
            // Create multiple test students
            await Promise.all(mockStudent.multiple(classroomId).map(s => 
                StudentModel.create({
                    ...s,
                    classroomId: classroomId
                })
            ));
        });

        it('should get all students for admin', async () => {
            const result = await studentManager.getAll({
                __longToken: mockToken.admin(schoolId)
            });

            expect(result.ok).toBe(true);
            expect(result.data.length).toBe(3);
        });

        it('should filter students by classroom', async () => {
            const result = await studentManager.getAll({
                __longToken: mockToken.admin(schoolId),
                classroomID: classroomId
            });

            expect(result.ok).toBe(true);
            expect(result.data.length).toBe(3);
            expect(result.data.every(s => s.classroomId.toString() === classroomId.toString())).toBe(true);
        });
    });
}); 