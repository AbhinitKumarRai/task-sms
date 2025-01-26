class TokenManager {
  constructor() {}
  
  verify() {
    return true;
  }

  decode(__longToken) {
    return __longToken; // Return the token as is since we're using mock tokens
  }

  generate() {
    return 'mock-token';
  }
}

module.exports = TokenManager; 