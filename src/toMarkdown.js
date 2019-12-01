const fs = require('fs')
const request = require('request')
const TurndownService = require('turndown')
const turndownService = new TurndownService()
const moment = require('moment')
const Parser = require('rss-parser')
const parser = new Parser()



const getPosts = async (path) => {
  const XMLString = fs.readFileSync(path, 'utf8')
  const feed = await parser.parseString(XMLString)
  return feed.items
}

const createFolder = (date) => {
  console.log(`./posts/${date}`)
  fs.mkdirSync(`./posts/${date}`, { recursive: true })
}

const createFile = async (filename, date, content) => {
  createFolder(date)
  fs.writeFile(`./posts/${date}/${filename}.md`, content, (err) => {
    if (err) throw err
    console.log('created file: ' + filename)
  })

}


const fetchImage = (URI, filename, callback) => {
  if (fs.existsSync(filename)) {
    return
  }

  request(URI)
    .on('error', function (err) {
      console.error(err)
    })
    .pipe(fs.createWriteStream(filename))
    .on('close', callback)

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

  // need to content.replace(urlString, '')
  // not sure how to form the urlString


  const text = `---
title: ${post.title}
categories: ${categories}
author: ${post["dc:creator"]}
published: ${date}
lastUpdated: ${post["atom:updated"]}
headerImage: ${filename}.jpg
---
${content}`

  return { text, imageURL, filename, date }
}



module.exports = async function (file) {
  console.log(file)
  getPosts(file)
    .then(posts => {
      posts.forEach(post => {
        const content = createContent(post)
        createFile(content.filename, content.date, content.text)
        fetchImage(content.imageURL, `./posts/${content.date}/${content.filename}.jpg`, () => console.log('done'))
      })
    })
}


