#!/usr/bin/env node

const fs = require('fs')
const commander = require('commander')
const program = new commander.Command()
const pckg = require('./../package.json')
const toMarkdown = require('./toMarkdown')

program.version(pckg.version)

function isDir(path) {
  try {
    const stats = fs.lstatSync(path)
    return stats.isDirectory()
  } catch (e) {
    console.log(e)
    return e
  }
}

function markAllDown(dir) {
  const files = fs.readdirSync(dir)
  files.forEach(file => toMarkdown(`${dir}/${file}`))
}

function markItDown(path) {
  isDir(path) ? markAllDown(path) : toMarkdown(path)
}

program
  .command('process <path>')
  .alias('p')
  .description('Process a file or directory to markdown')
  .action(path => {
    console.log(path)
    markItDown(path)
  })

program.parse(process.argv)