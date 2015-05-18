function one (files, fieldname) {
  var i, len = files.length

  for (i = 0; i < len; i++) {
    if (files[i].fieldname === fieldname) return files[i]
  }

  return null
}

function many (files, fieldname) {
  var i, len = files.length, result = []

  for (i = 0; i < len; i++) {
    if (files[i].fieldname === fieldname) result.push(files[i])
  }

  return result
}

exports.one = one
exports.many = many
