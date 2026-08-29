// busboy compares most limits with strict equality, so a non-integer value
// never matches and silently disables the limit. Reject such values up front.
function validateLimits (limits) {
  Object.keys(limits).forEach(function (key) {
    var value = limits[key]

    if (value == null) return
    if ((Number.isInteger(value) && value >= 0) || value === Infinity) return

    throw new TypeError('Expected limits.' + key + ' to be a non-negative integer or Infinity')
  })
}

module.exports = validateLimits
