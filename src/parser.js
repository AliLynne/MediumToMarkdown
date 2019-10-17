const fs = require('fs')
const parser = require('xml2json')

const options = {
  sanitize: true
}

fs.readFile('./posts_1_to_10.xml', function(err, data) {
  const json = parser.toJson(data, options)
  fs.appendFile('posts.json', json, function(err) {
    if (err) throw err
    console.log('The data was appended to file!')
  })
})