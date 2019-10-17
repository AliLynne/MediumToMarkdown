const fs = require('fs')
const file = require('../newPosts.json')
const TurndownService = require('turndown')
const turndownService = new TurndownService()


const posts = file.rss.channel.item


posts.forEach(post => {
  let filename = post.title.replace(/\s+/g, '')
  filename = filename.replace(/\/+/g, '-')
  filename = filename.replace(/,/g, '')
  const content = turndownService.turndown(post["content:encoded"])
  const string = `---
title: ${post.title}
categories: ${post.category}
author: ${post["dc:creator"]}
published: ${post.pubDate}
lastUpdated: ${post["atom:updated"]}
---
${content}`
  fs.appendFile(`./posts/${filename}.md`, string, (err) => {
    if (err) throw err
    console.log(`created ${filename}.md`)
  })
})

