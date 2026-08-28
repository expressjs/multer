/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

// @see https://github.com/expressjs/multer/security/advisories/GHSA-wc9g-mqfw-jrwm

describe('crafted multipart field names', function () {
  it('should not crash when a field name overflows the maximum array length', function (done) {
    var form = new FormData()
    // items[4294967294] creates a sparse array with length 4294967295 (JS max);
    // items[] then pushes past it, which throws RangeError inside appendField.
    form.append('items[4294967294]', 'x')
    form.append('items[]', 'y')

    util.submitForm(multer().none(), form, function (err) {
      // The overflow must be handled (surfaced as an error), not crash the process.
      assert.ok(err, 'expected the request to be rejected with an error')
      assert.strictEqual(err.code, 'INVALID_FIELD_NAME')
      done()
    })
  })
})
