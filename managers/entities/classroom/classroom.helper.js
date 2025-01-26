const UserModel = require("../user/user.mongoModel");
const { ClassroomModel } = require("./classroom.mongoModel");

const isAllowedAdminUpdate = async (userId, id) => {
  const { schoolID: classroomSchoolID } = await ClassroomModel.findById(id);
  const { schoolID: adminSchoolID } = await UserModel.findById(userId);
  return adminSchoolID.toString() === classroomSchoolID.toString();
};

const isAllowedAdminCreate = async (userId, id) => {
  const { schoolID: adminSchoolID } = await UserModel.findById(userId);
  return adminSchoolID.toString() === id.toString();
};

module.exports = { isAllowedAdminCreate, isAllowedAdminUpdate };
