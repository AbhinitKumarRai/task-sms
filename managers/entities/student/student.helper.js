const UserModel = require("../user/user.mongoModel");
const StudentModel = require("./student.mongoModel");
const isAllowedAdmin = async (userId, id) => {
  const {
    classroom: { school: studentSchoolID },
  } = await StudentModel.findById(id).populate("classroom");
  const { school: adminSchoolID } = await UserModel.findById(userId);
  return adminSchoolID.toString() === studentSchoolID.toString();
 
};

module.exports = { isAllowedAdmin };
