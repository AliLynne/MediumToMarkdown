const fs = require('fs')
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

posts.forEach(post => {
  let filename = post.title.replace(/\s+/g, '')
  const date = moment(post.pubDate).format('YYYY-MM-DD')
  console.log(date)
  let categories = JSON.stringify(post.category)
  filename = filename.replace(/\/+/g, '-')
  filename = filename.replace(/,/g, '')
  const content = turndownService.turndown(post["content:encoded"])
  const string = `---
title: ${post.title}
categories: ${categories}
author: ${post["dc:creator"]}
published: ${post.pubDate}
lastUpdated: ${post["atom:updated"]}
---
${content}`

  createFile(filename, date, string)
})

