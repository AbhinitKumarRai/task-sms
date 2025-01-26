const mongoose = require('mongoose');

const mockModel = (name) => {
    const documents = new Map();
    
    return {
        create: jest.fn().mockImplementation(async (data) => {
            if (Array.isArray(data)) {
                return data.map(item => {
                    const _id = new mongoose.Types.ObjectId();
                    const doc = { _id, ...item };
                    documents.set(_id.toString(), doc);
                    return doc;
                });
            }
            const _id = new mongoose.Types.ObjectId();
            const doc = { _id, ...data };
            documents.set(_id.toString(), doc);
            return doc;
        }),
        find: jest.fn().mockImplementation(() => ({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(Array.from(documents.values()))
        })),
        findById: jest.fn().mockImplementation((id) => ({
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(documents.get(id?.toString()))
        })),
        findOne: jest.fn().mockImplementation((query) => ({
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(Array.from(documents.values())[0])
        })),
        findByIdAndUpdate: jest.fn().mockImplementation((id, update) => {
            const doc = documents.get(id?.toString());
            if (doc) {
                const updated = { ...doc, ...update.$set };
                documents.set(id.toString(), updated);
                return {
                    exec: jest.fn().mockResolvedValue(updated)
                };
            }
            return {
                exec: jest.fn().mockResolvedValue(null)
            };
        }),
        findByIdAndDelete: jest.fn().mockImplementation((id) => {
            const doc = documents.get(id?.toString());
            documents.delete(id?.toString());
            return {
                exec: jest.fn().mockResolvedValue(doc)
            };
        }),
        deleteMany: jest.fn().mockImplementation(() => {
            documents.clear();
            return {
                exec: jest.fn().mockResolvedValue({ deletedCount: documents.size })
            };
        })
    };
};

const SchoolModel = mockModel('School');
const ClassroomModel = mockModel('Classroom');
const StudentModel = mockModel('Student');
const UserModel = mockModel('User');

module.exports = {
    SchoolModel,
    ClassroomModel,
    StudentModel,
    UserModel
}; 