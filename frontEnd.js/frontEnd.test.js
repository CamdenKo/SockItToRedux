const {
  createAjaxReducer,
  uppify,
  isUppercase,
  actionCreatorNamer,
  defaultState,
} = require('./frontEnd')

describe('createAjaxReducer', () => {
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
  // const dummyFunc = jest.fn()
  const result = createAjaxReducer('dummyFunc')
  it('should return an Object with the keys reducer and actionCreators', () => {
    expect(Object.keys(result)).toContain(...[
      'actionCreators',
      'reducer',
    ])
  })
  it('actionCreators should have four functions with the appropriate names', () => {
    expect(Object.keys(result.actionCreators)).toEqual([
      'loadingDummyFunc',
      'doneLoadingDummyFunc',
      'errorDummyFunc',
      'removeErrorDummyFunc',
      'dataDummyFunc',
    ])
  })
  it('action creators should have four functions', () => {
    Object.values(result.actionCreators).forEach(fn => expect(typeof fn).toEqual('function'))
  })
  it('action creator functions should resolve to objects that all have type', () => {
    Object.values(result.actionCreators).forEach(fn => expect(typeof fn()).toEqual('object'))
    Object.values(result.actionCreators).forEach(fn => expect(Object.keys(fn())).toContain('type'))
  })
  it('reducer should be a function', () => {
    expect(typeof result.reducer).toEqual('function')
  })
  describe('reducer', () => {
    const reducer = result.reducer
    const alternativeState = {
      ...defaultState,
      error: new Error('oops'),
      loading: true,
    }
    it('should resolve to default state', () => {
      expect(reducer(undefined, {})).toEqual(defaultState)
    })
    it('should set loading to true with lOADING', () => {
      expect(reducer(undefined,
        result.actionCreators[actionCreatorNamer('loading', 'dummyFunc')](),
      )).toEqual({ ...defaultState, loading: true })
    })
    it('should set loading to false with DONE_LOADING', () => {
      expect(reducer(alternativeState,
        result.actionCreators[actionCreatorNamer('doneLoading', 'dummyFunc')](),
      )).toEqual({ ...alternativeState, loading: false })
    })
    it('should set error with ERROR', () => {
      const err = new Error('ow!')
      expect(reducer(undefined,
        result.actionCreators[actionCreatorNamer('error', 'dummyFunc')](err),
      )).toEqual({ ...defaultState, error: err })
    })
    it('should clear error with REMOVE_ERROR', () => {
      expect(reducer(alternativeState,
        result.actionCreators[actionCreatorNamer('removeError', 'dummyFunc')](),
      )).toEqual({ ...alternativeState, error: null })
    })
  })
})
