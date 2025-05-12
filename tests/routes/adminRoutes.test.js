const { getUsersCount, isValidEmailNoSpecialChars } = require('../../routes/adminRoutes');
const User = require('../../models/User');

describe('getUsersCount', () => {

  it('should return the correct number of users', () => {
    const users = [{}, {}, {}];
    const count = getUsersCount(users);
    expect(count).toBe(3);
  });

  it('should return 0 for an empty array', () => {
    const users = [];
    const count = getUsersCount(users);
    expect(count).toBe(0);
  });

  it('should throw an error if input is not an array', () => {
    expect(() => getUsersCount(null)).toThrow('Input must be an array');
    expect(() => getUsersCount({})).toThrow('Input must be an array');
    expect(() => getUsersCount('string')).toThrow('Input must be an array');
  });

});

describe('isValidEmailNoSpecialChars', () => {
  it('should return the email if it contains only allowed characters', () => {
    expect(isValidEmailNoSpecialChars('test.email-123@gmail.com')).toBe('test.email-123@gmail.com');
    expect(isValidEmailNoSpecialChars('user_name@domain.co')).toBe('user_name@domain.co');
    expect(isValidEmailNoSpecialChars('user123@domain.com')).toBe('user123@domain.com');
  });

  it('should throw an error if email contains invalid special characters', () => {
    expect(() => isValidEmailNoSpecialChars('test!email@gmail.com')).toThrow('Email contains invalid special characters');
    expect(() => isValidEmailNoSpecialChars('user#name@domain.com')).toThrow('Email contains invalid special characters');
    expect(() => isValidEmailNoSpecialChars('user$name@domain.com')).toThrow('Email contains invalid special characters');
    expect(() => isValidEmailNoSpecialChars('user@domain.com!')).toThrow('Email contains invalid special characters');
  });

  it('should throw an error if input is not a string', () => {
    expect(() => isValidEmailNoSpecialChars(null)).toThrow('Email must be a string');
    expect(() => isValidEmailNoSpecialChars(123)).toThrow('Email must be a string');
    expect(() => isValidEmailNoSpecialChars({})).toThrow('Email must be a string');
  });
}); 