var EventEmitter = require('events').EventEmitter

/**
 * A counter class that can be incremented or decremented.
 * Emits a 'zero' event when the counter reaches zero.
 * @extends EventEmitter
 */
function Counter () {
  EventEmitter.call(this)
  /** @type {number} The current value of the counter. */
  this.value = 0
}

Counter.prototype = Object.create(EventEmitter.prototype)

/**
 * Increments the counter by 1.
 */
Counter.prototype.increment = function increment () {
  this.value++
}

/**
 * Decrements the counter by 1. 
 * If the counter reaches zero, emits a 'zero' event.
 */
Counter.prototype.decrement = function decrement () {
  if (--this.value === 0) this.emit('zero')
}

/**
 * Checks if the counter value is zero.
 * @returns {boolean} True if the counter is zero, false otherwise.
 */
Counter.prototype.isZero = function isZero () {
  return (this.value === 0)
}

/**
 * Calls a function when the counter reaches zero.
 * If the counter is already zero, calls the function immediately.
 * @param {Function} fn - The function to call when the counter reaches zero.
 */
Counter.prototype.onceZero = function onceZero (fn) {
  if (this.isZero()) return fn()

  this.once('zero', fn)
}

module.exports = Counter
