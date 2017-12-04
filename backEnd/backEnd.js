const {
  uppify,
  actionCreatorNamer,
  requestSocketNamer,
} = require('../utilities/utilities')

const defaultState = {
  pending: false,
  data: null,
}

const serverReducer = (server, socketName) => {
  const uppName = uppify(socketName)
  const REQUEST = `REQUEST_${uppName}`
  const REQUEST_FULFILLED = `REQUEST_FULFILLED_${uppName}`
  return {
    actionCreators: {
      [actionCreatorNamer('request', socketName)]: data => ({ type: REQUEST, data }),
      [actionCreatorNamer('requestFulfilled', socketName)]: () => ({ type: REQUEST_FULFILLED }),
    },
    reducer: (state = defaultState, action) => {
      switch (action.type) {
        case REQUEST:
          return { ...state, pending: true, data: action.data }
        case REQUEST_FULFILLED:
          return { ...state, pending: false, data: null }
        default:
          return state
      }
    },
    success: (socket, data) =>
      (dispatch) => {
        socket.emit(actionCreatorNamer('success', socketName), data)
        dispatch(this.actionCreators[actionCreatorNamer('requestFulfilled', socketName)]())
      },
    error: (socket, err) =>
      (dispatch) => {
        socket.emit(actionCreatorNamer('error', socketName), err)
        dispatch(this.actionCreators[actionCreatorNamer('requestFulfilled', socketName)]())
      },
    socketSubscriber(store) {
      const { dispatch } = store
      const outer = this
      server.on('connection', (socket) => {
        socket.on(requestSocketNamer(socketName), (data) => {
          dispatch(outer.actionCreators[actionCreatorNamer('request', socketName)](data))
        })
      })
    },
  }
}

module.exports = {
  defaultState,
  serverReducer,
}
