const fs = require('fs')
const request = require('request')
const file = require('../posts.json')
const TurndownService = require('turndown')
const turndownService = new TurndownService()
const moment = require('moment')


const posts = file.rss.channel.item

const createFolder = async (date) => {
  fs.mkdir(`posts/${date}`, (err) => {
    if (err) {
      if (err.code === 'EEXIST') {
        return
      } else {
        throw err
      }
    }
    console.log('Created folder: ' + date)
  })
}

const createFile = (filename, date, content) => {
  createFolder(date).then(() => {
    fs.appendFile(`./posts/${date}/${filename}.md`, content, (err) => {
      if (err) throw err
      console.log('created file: ' + filename)
    })
  })
}

// const download = (uri, filename, callback) => {
//   request.head(uri, (err, res, body) => {
//     console.log(res)

//     request(uri).pipe(fs.createWriteStream(filename)).on('close', callback)
//   })
// }

const fetchImage = async (URI, filename, callback) => {
  request.head(uri, (err, res, body) => {
    console.log(res)

    request(URI).pipe(fs.createWriteStream(filename)).on('close', callback)
  })
}

posts.forEach(post => {

  const content = turndownService.turndown(post["content:encoded"])
  const linkBegIndex = content.search(/(https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?*^=%&:/~+#-]*[\w@?^=%&/~+#-])?/)
  const linkEndIndex = content.search(/\)/)
  const link = content.slice(linkBegIndex, linkEndIndex)

  let filename = post.title.replace(/\s+/g, '')
  const date = moment(post.pubDate).format('YYYY-MM-DD')
  let categories = JSON.stringify(post.category)
  filename = filename.replace(/\/+/g, '-')
  filename = filename.replace(/,/g, '')
  const content = turndownService.turndown(post["content:encoded"])

  const string = `---
  title: ${post.title}
  categories: ${categories}
  author: ${post["dc:creator"]}
  published: ${date}
  lastUpdated: ${post["atom:updated"]}
  ---
  ${content}`

  createFile(filename, date, string)
})

