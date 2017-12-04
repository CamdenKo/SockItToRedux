import configureStore from 'redux-mock-store'
import io from 'socket.io'
import clientIO from 'socket.io-client'
import thunk from 'redux-thunk'


import {
  serverReducer,
  defaultState,
} from './backEnd'
import {
  actionCreatorNamer,
  socketSubscriber,
} from '../utilities/utilities'

jest.setTimeout(2000)

const newConnection = () => clientIO.connect('http://localhost:5002')

const mockStore = configureStore([
  thunk,
])
const shortTimeout = func => setTimeout(func, 10)


describe('socketReducerBackEnd', () => {
  const mockServer = io.listen(5002)
  afterAll((done) => {
    mockServer.close(done)
  })
  const result = serverReducer({ on: () => {} }, 'joinRoom')
  it('should return an object', () => {
    expect(typeof result).toEqual('object')
  })
  it('should return an object with actionCreators, reducer, success, error, and socketSubscriber', () => {
    expect(Object.keys(result)).toContain(...[
      'success',
      'error',
      'socketSubscriber',
      'reducer',
      'actionCreators',
    ])
  })
  describe('actionCreators', () => {
    it('should contain only functions', () => {
      Object.values(result.actionCreators).forEach((actionCreator) => {
        expect(typeof actionCreator).toEqual('function')
      })
    })
    it('should have functions that all resolve to objects with the key type', () => {
      Object.values(result.actionCreators).forEach((actionCreator) => {
        const action = actionCreator()
        expect(typeof action).toEqual('object')
        expect(Object.keys(action)).toContain('type')
      })
    })
  })
  describe('reducer', () => {
    const reducer = result.reducer
    it('should resolve to default state', () => {
      expect(reducer(undefined, {})).toEqual(defaultState)
    })
    it('should take in REQUEST, setting pending to true and applying data', () => {
      const data = {
        users: 3,
      }
      expect(reducer(undefined,
        result.actionCreators[actionCreatorNamer('request', 'joinRoom')](data),
      )).toEqual({ ...defaultState, pending: true, data })
    })
    it('should take in REQUEST_FULFILLED, setting pending to false and setting data to null', () => {
      expect(reducer(
        {
          ...defaultState,
          pending: true,
          data: 333,
        },
        {
          type: 'REQUEST_FULFILLED_JOIN_ROOM',
        },
      )).toEqual({ ...defaultState })
    })
  })
  describe('socketSubscriber', () => {
    const back = serverReducer(mockServer, 'joinRoom')
    const store = mockStore(defaultState)
    socketSubscriber(store)(back)
    const socket = newConnection()

    it('should now subscribe to requestJoinRoom', (done) => {
      socket.on('connect', () => {
        socket.emit('requestJoinRoom')
        shortTimeout(() => {
          expect(store.getActions()).toEqual([
            { type: 'REQUEST_JOIN_ROOM' },
          ])
          socket.disconnect()
          done()
        })
      })
    })
  })
  describe('success', () => {
    const back = serverReducer(mockServer, 'joinaRoom')
    const store = mockStore(defaultState)
    socketSubscriber(store)(back)
    const socket = newConnection()
    it('should emit successJoinRoom', (done) => {
      socket.on('connect', () => {
        console.log('connect')
        done()
        store.dispatch(back.actionCreators[actionCreatorNamer('request', 'joinaRoom')]())
        store.dispatch(back.success(socket, ('a')))
        socket.on('successJoinaRoom', () => {
          done()
        })
      })
    })
  })
})
