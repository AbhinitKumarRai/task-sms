const roles = {
    ADMIN: "admin",
    SUPER_ADMIN: "super-admin",
  };
  
  const hasScope =(scopes,role, functionName)=>{
    return scopes[functionName].includes(role);
  }
  module.exports = {roles , hasScope};