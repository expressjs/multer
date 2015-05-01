function hasOwnProperty (obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function appendField (store, key, value) {
  if (hasOwnProperty(store, key)) {
    if (Array.isArray(store[key])) {
      store[key].push(value)
    } else {
      store[key] = [store[key], value]
    }
  } else {
    store[key] = value
  }
}

module.exports = appendField
