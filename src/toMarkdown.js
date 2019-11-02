const fs = require('fs')
const request = require('request')
const file = require('../posts.json')
const TurndownService = require('turndown')
const turndownService = new TurndownService()
const moment = require('moment')


const posts = file.rss.channel.item

const createFolder = (date) => {
  fs.mkdir(`posts/${date}`, (err) => {
    if (err) {
      if (err.code === 'EEXIST') {
        return
      } else {
        throw err
      }
    }
    console.log('Created folder: ' + date)
    return
  })
}

const createFile = (filename, date, content) => {
  createFolder(date)
    .then(() => {
      fs.appendFile(`./posts/${date}/${filename}.md`, content, (err) => {
        if (err) throw err
        console.log('created file: ' + filename)
      })
    })
}


const fetchImage = (URI, filename, callback) => {
  request.head(URI, (err, res, body) => {
    if (err) throw err
    request(URI).pipe(fs.createWriteStream(filename)).on('close', callback)
  })
}

const createContent = (post) => {
  const content = turndownService.turndown(post["content:encoded"])
  const linkBegIndex = content.search(/(https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?*^=%&:/~+#-]*[\w@?^=%&/~+#-])?/)
  const linkEndIndex = content.search(/\)/)
  const imageURL = content.slice(linkBegIndex, linkEndIndex)

  let filename = post.title.replace(/\s+/g, '')
  const date = moment(post.pubDate).format('YYYY-MM-DD')
  let categories = JSON.stringify(post.category)
  filename = filename.replace(/\/+/g, '-')
  filename = filename.replace(/,/g, '')


  const string = `---
  title: ${post.title}
  categories: ${categories}
  author: ${post["dc:creator"]}
  published: ${date}
  lastUpdated: ${post["atom:updated"]}
  ---
  ${content}`

  return { string, imageURL, filename, date }
}

posts.forEach(post => {



})

