const {
  isUppercase,
  uppify,
  actionCreatorNamer,
  requestSocketNamer,
} = require('../utilities/utilities')

const defaultState = {
  requestPending: false,
  requestData: null,
}

const socketReducerBackEnd = (socket, socketName) => {
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
          return { ...state, requestPending: true, data: action.data }
        case REQUEST_FULFILLED:
          return { ...state, requestPending: false, data: null }
        default:
          return state
      }
    },
    success: data =>
      (dispatch) => {
        socket.emit(actionCreatorNamer('success', socketName), data)
        dispatch(this.actionCreators[actionCreatorNamer('requestFulfilled', socketName)]())
      },
    error: err =>
      (dispatch) => {
        socket.emit(actionCreatorNamer('error', socketName), err)
        dispatch(this.actionCreators[actionCreatorNamer('requestFulfilled', socketName)]())
      },
    socketSubscriber: (store) => {
      const { dispatch } = store
      socket.on(requestSocketNamer(socketName), (data) => {
        dispatch(this.actionCreators[actionCreatorNamer('request')](data))
      })
    },
  }
}

module.exports = {
  socketReducerBackEnd,
}
