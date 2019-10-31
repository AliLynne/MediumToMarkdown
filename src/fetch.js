const myUri = 'https://cdn-images-1.medium.com/max/1024/0*qWCHMS6v-snsiNPG'

const fs = require('fs')
const request = require('request')

const download = (uri, filename, callback) => {
  request.head(uri, (err, res, body) => {
    console.log(res)

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback)
  })
}

download(myUri, './posts/image.jpg', () => console.log('done'))