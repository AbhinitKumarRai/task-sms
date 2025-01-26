const { roles } = require('./roles');

const validators = {
  school: {
    create: (data) => {
      const errors = [];
      if (!data.name || data.name.length < 3 || data.name.length > 50) {
        errors.push({ message: 'School name must be between 3 and 50 characters' });
      }
      if (!data.address || data.address.length < 3 || data.address.length > 100) {
        errors.push({ message: 'School address must be between 3 and 100 characters' });
      }
      return errors.length > 0 ? errors : null;
    }
  },
  
  classroom: {
    create: (data) => {
      const errors = [];
      
      if (!data.name || data.name.length < 3 || data.name.length > 50) {
        errors.push({ message: 'Classroom name must be between 3 and 50 characters' });
      }
      
      if (!data.schoolID || !/^[0-9a-fA-F]{24}$/.test(data.schoolID)) {
        errors.push({ message: 'Invalid schoolID format' });
      }
      
      return errors.length > 0 ? errors : null;
    }
  },
  
  student: {
    create: (data) => {
      const errors = [];
      
      if (!data.name || data.name.length < 3 || data.name.length > 50) {
        errors.push({ message: 'Student name must be between 3 and 50 characters' });
      }
      
      if (!data.age || data.age < 4 || data.age > 20) {
        errors.push({ message: 'Student age must be between 4 and 20' });
      }
      
      if (!data.classroomID || !/^[0-9a-fA-F]{24}$/.test(data.classroomID)) {
        errors.push({ message: 'Invalid classroomID format' });
      }
      
      return errors.length > 0 ? errors : null;
    }
  },
  
  user: {
    create: (data) => {
      const errors = [];
      
      // Check role first
      if (!data.role || !Object.values(roles).includes(data.role)) {
        errors.push({ message: 'role must be one of: super_admin, admin, teacher, student' });
        return errors;
      }

      // Check schoolID for admin role
      if (data.role === roles.ADMIN && (!data.schoolID || !data.schoolID.match(/^[0-9a-fA-F]{24}$/))) {
        errors.push({ message: 'schoolID must be a valid ID for admin users' });
        return errors;
      }

      // Check email format
      if (!data.email || !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors.push({ message: 'email must be a valid email address' });
      }

      // Check password strength
      if (!data.password || !data.password.match(/^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/)) {
        errors.push({ message: 'password must be at least 8 characters long and contain at least one uppercase letter and one number' });
      }

      return errors.length > 0 ? errors : null;
    }
  }
};

module.exports = { validators }; 