const isUppercase = char =>
  char === char.toUpperCase() && char !== char.toLowerCase()

const uppify = str =>
  str
    .split('')
    .map(letter => isUppercase(letter) ?
      `_${letter}` :
      letter.toUpperCase(),
    )
    .join('')

const actionCreatorNamer = (actionName, functionName) =>
  `${actionName}${functionName[0].toUpperCase()}${functionName.slice(1)}`

const requestSocketNamer = functionName =>
  actionCreatorNamer('request', functionName)

const defaultState = {
  loading: false,
  error: null,
  data: null,
}

/**
 * changeName
 * => requestChangeName
 * <= errorChangeName dispatch(ERROR)
 * <= successChangeName dispatch(DONE_LOADING)
 * @param {function} ajaxFunc
 * @param {String} funcName
 * @returns {Object}
 */

const createAjaxReducer = (funcName) => {
  const uppName = uppify(funcName)
  const LOADING = `LOADING_${uppName}`
  const DONE_LOADING = `DONE_LOADING_${uppName}`
  const ERROR = `ERROR_${uppName}`
  const REMOVE_ERROR = `REMOVE_ERROR_${uppName}`
  const DATA = `DATA_${uppName}`

  return {
    actionCreators: {
      [actionCreatorNamer('loading', funcName)]: () => ({ type: LOADING }),
      [actionCreatorNamer('doneLoading', funcName)]: () => ({ type: DONE_LOADING }),
      [actionCreatorNamer('error', funcName)]: err => ({ type: ERROR, err }),
      [actionCreatorNamer('removeError', funcName)]: () => ({ type: REMOVE_ERROR }),
      [actionCreatorNamer('data', funcName)]: data => ({ type: DATA, data }),
    },
    reducer: (state = defaultState, action) => {
      switch (action.type) {
        case LOADING:
          return { ...state, loading: true }
        case DONE_LOADING:
          return { ...state, loading: false }
        case ERROR:
          return { ...state, error: action.err }
        case REMOVE_ERROR:
          return { ...state, error: null }
        case DATA:
          return { ...state, data: action.data }
        default:
          return state
      }
    },
  }
}

const socketAjaxReducer = (socket, socketName) => {
  const ajaxReducer = createAjaxReducer(socketName)
  const socketThunk = {
    thunk: data =>
      (dispatch) => {
        socket.emit(requestSocketNamer(socketName), data)
        dispatch(ajaxReducer.actionCreators[actionCreatorNamer('loading', socketName)]())
      },
    socketSubscriber: (store) => {
      const { dispatch } = store
      socket.on(actionCreatorNamer('success', socketName), (data) => {
        dispatch(ajaxReducer.actionCreators[actionCreatorNamer('data', socketName)](data))
      })
      socket.on(actionCreatorNamer('error', socketName), (err) => {
        dispatch(ajaxReducer.actionCreators[actionCreatorNamer('error')](err))
      })
    },
  }
  return {
    ...ajaxReducer,
    ...socketThunk,
  }
}

const socketSubscriber = store =>
  (...socketReducers) =>
    socketReducers.forEach((reducer) => {
      reducer.socketSubscriber(store)
    })


module.exports = {
  createAjaxReducer,
  socketSubscriber,
  socketAjaxReducer,
  defaultState,
  requestSocketNamer,
  isUppercase,
  uppify,
  actionCreatorNamer,
}