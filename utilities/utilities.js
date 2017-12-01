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

module.exports = {
  isUppercase,
  uppify,
  actionCreatorNamer,
  requestSocketNamer,
}
