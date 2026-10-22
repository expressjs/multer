/* eslint-env mocha */

var assert = require('assert')
var stream = require('stream')
var multer = require('../')

// @see https://github.com/expressjs/multer/security/advisories/GHSA-q7qp-rjg7-q26m

describe('async fileFilter late resume after teardown', function () {
  it('does not crash the process when a pending fileFilter resumes a parked stream after teardown', function (done) {
    var req = new stream.PassThrough()
    var filterError = new Error('file rejected')
    var resumeFilter
    var busboy
    var nextCalls = 0
    var boundary = 'TeardownBoundary'
    var body = [
      '--' + boundary,
      'Content-Disposition: form-data; name="first"; filename="first.txt"',
      'Content-Type: text/plain',
      '',
      'a',
      '--' + boundary,
      'Content-Disposition: form-data; name="second"; filename="second.txt"',
      'Content-Type: text/plain',
      '',
      'b'
      // No closing boundary: busboy will fail when its pending write completes.
    ].join('\r\n')

    var upload = multer({
      fileHwm: 1,
      streamHandler: function (req, parser) {
        busboy = parser
        req.pipe(parser)
      },
      fileFilter: function (req, file, cb) {
        if (file.fieldname === 'first') {
          resumeFilter = cb
        } else {
          // Let req end and queue busboy's finalization behind the parked write.
          req.once('end', function () {
            setImmediate(function () { cb(filterError) })
          })
        }
      }
    }).any()

    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + boundary,
      'content-length': Buffer.byteLength(body)
    }

    upload(req, null, function (err) {
      nextCalls++
      assert.strictEqual(err, filterError)
      assert.strictEqual(typeof resumeFilter, 'function')

      // done() queued listener removal before next(), so this runs after teardown.
      setImmediate(function () {
        // Observe completion without adding an error listener that masks the bug.
        busboy.once('close', function () {
          assert.strictEqual(nextCalls, 1)
          assert.deepStrictEqual(req.files, [])
          done()
        })

        // Resuming the real file stream lets busboy report the truncated form.
        resumeFilter(null, true)
      })
    })

    // One write ensures both file headers are parsed while the first is parked.
    req.end(body)
  })
})
