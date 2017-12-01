const {
  uppify,
  isUppercase,
  actionCreatorNamer,
} = require('./utilities')

describe('helpers', () => {
  describe('uppify', () => {
    it('works with empty string', () => {
      expect(uppify('')).toEqual('')
    })
    it('works with a string without camelCase', () => {
      expect(uppify('asdf')).toEqual('ASDF')
    })
    it('works with a string with camelCase', () => {
      expect(uppify('helloWorld')).toEqual('HELLO_WORLD')
    })
  })
  describe('isUppercase', () => {
    it('returns true for uppercase', () => {
      expect(isUppercase('A')).toEqual(true)
    })
    it('returns false for lowercase', () => {
      expect(isUppercase('a')).toEqual(false)
    })
    it('returns false for numbers and special chars', () => {
      expect(isUppercase('_')).toEqual(false)
      expect(isUppercase('2')).toEqual(false)
    })
  })
  describe('actionCreatorNamer', () => {
    it('combines the actionName to the functionName appropriately', () => {
      expect(actionCreatorNamer('error', 'changeName')).toEqual('errorChangeName')
      expect(actionCreatorNamer('successChange', 'eatSocks')).toEqual('successChangeEatSocks')
    })
  })
})
