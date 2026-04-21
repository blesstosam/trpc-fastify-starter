import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const distDir = resolve(import.meta.dirname, '../dist')

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory())
      files.push(...walk(full))
    else if (entry.name.endsWith('.js'))
      files.push(full)
  }
  return files
}

function resolveExtension(importPath, fromFile) {
  const dir = dirname(fromFile)
  const target = resolve(dir, importPath)

  if (existsSync(target) && statSync(target).isFile())
    return importPath

  if (existsSync(`${target}.js`))
    return `${importPath}.js`

  if (existsSync(target) && statSync(target).isDirectory()) {
    if (existsSync(join(target, 'index.js')))
      return `${importPath}/index.js`
  }

  return importPath
}

const importRe = /(from\s+['"])(\.[^'"]+)(['"])/g
const dynamicRe = /(import\(\s*['"])(\.[^'"]+)(['"]\s*\))/g

for (const file of walk(distDir)) {
  let content = readFileSync(file, 'utf8')
  let changed = false

  content = content.replace(importRe, (match, pre, specifier, post) => {
    const fixed = resolveExtension(specifier, file)
    if (fixed !== specifier)
      changed = true
    return `${pre}${fixed}${post}`
  })

  content = content.replace(dynamicRe, (match, pre, specifier, post) => {
    const fixed = resolveExtension(specifier, file)
    if (fixed !== specifier)
      changed = true
    return `${pre}${fixed}${post}`
  })

  if (changed)
    writeFileSync(file, content)
}
