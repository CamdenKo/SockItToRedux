import configureStore from 'redux-mock-store'
import sinon from 'sinon'
import io from 'socket.io'
import clientIO from 'socket.io-client'
import {
  SocketIO,
  Server,
} from 'mock-socket'
import thunk from 'redux-thunk'

jest.setTimeout(2000)

import * as frontEnd from './frontEnd'

const {
  createAjaxReducer,
  uppify,
  isUppercase,
  actionCreatorNamer,
  defaultState,
  socketAjaxReducer,
  socketSubscriber,
} = frontEnd

const newConnection = () => clientIO.connect('http://localhost:5001')

const mockStore = configureStore([
  thunk,
])
const shortTimeout = func => setTimeout(func, 10)
// window.io = SocketIO

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

describe('socketSubscriber', () => {
  it('should invoke each reducer\'s socketSubscriber', () => {
    const mockSocket = {
      on: () => {},
    }

    const firstSocket = socketAjaxReducer(mockSocket, 'test')
    const secondSocket = socketAjaxReducer(mockSocket, 'test2')
    const store = mockStore({})

    sinon.spy(firstSocket, 'socketSubscriber')
    sinon.spy(secondSocket, 'socketSubscriber')

    socketSubscriber(store)(firstSocket, secondSocket)

    expect(firstSocket.socketSubscriber.calledOnce).toBeTruthy()
    expect(secondSocket.socketSubscriber.calledOnce).toBeTruthy()
  })
})

describe('socketAjaxReducer', () => {
  const mockServer = io.listen(5001)
  afterAll((done) => {
    mockServer.close(done)
  })

  it('should return an object with the same keys as createAjaxReducer and have thunk and socketSubscriber', () => {
    const ajax = createAjaxReducer('longPull')
    const result = socketAjaxReducer({ on: () => {} }, 'pull')
    expect(Object.keys(result)).toContain(...[
      ...Object.keys(ajax),
      'thunk',
      'socketSubscriber',
    ])
  })
  it('should return a thunk that emits the appropriate socket and dispatches the right action', (done) => {
    const socket = newConnection()
    const result = socketAjaxReducer(socket, 'joinRoom')
    const store = mockStore(defaultState)
    mockServer.on('connection', (sock) => {
      sock.on('requestJoinRoom', () => {
        done()
      })
    })
    socket.on('connect', () => {
      socketSubscriber(store)(result)
      store.dispatch(result.thunk())
      expect(store.getActions()).toEqual([{ type: 'LOADING_JOIN_ROOM' }])
      socket.disconnect()
    })
  })
  it('should dispatch DATA_JOIN_ROOM when successJoinRoom is emitted', (done) => {
    const store = mockStore(defaultState)
    const socket = newConnection()
    const result = socketAjaxReducer(socket, 'joinRoom')
    mockServer.on('connection', (sock) => {
      sock.on('requestJoinRoom', () => {
        sock.emit('successJoinRoom', 'data')
      })
    })

    socket.on('connect', () => {
      socketSubscriber(store)(result)
      store.dispatch(result.thunk())
    })

    socket.on('successJoinRoom', () => {
      shortTimeout(() => {
        expect(store.getActions()).toEqual([
          {
            type: 'LOADING_JOIN_ROOM',
          },
          {
            type: 'DATA_JOIN_ROOM',
            data: 'data',
          },
        ])
        done()
        socket.disconnect()
      })
    })
  })
  it('should dispatch ERROR_JOIN_ROOM when errorJoinRoom is emitted', (done) => {
    const store = mockStore(defaultState)
    const socket = newConnection()
    const result = socketAjaxReducer(socket, 'joinRoom')
    mockServer.on('connection', (sock) => {
      sock.removeAllListeners('requestJoinRoom')
      sock.on('requestJoinRoom', () => {
        sock.emit('errorJoinRoom', 'ouch')
      })
    })
    socket.on('connect', () => {
      socketSubscriber(store)(result)
      store.dispatch(result.thunk())
    })

    socket.on('errorJoinRoom', () => {
      shortTimeout(() => {
        expect(store.getActions()).toEqual([
          {
            type: 'LOADING_JOIN_ROOM',
          },
          {
            type: 'ERROR_JOIN_ROOM',
            err: 'ouch',
          },
        ])
        done()
        socket.disconnect()
      })
    })
  })
})
