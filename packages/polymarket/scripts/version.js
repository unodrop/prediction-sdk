#!/usr/bin/env bun

/**
 * Version management script
 * Usage: bun scripts/version.js [patch|minor|major]
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Bun supports import.meta.dir directly
const __dirname = import.meta.dir

const versionType = process.argv[2] || 'patch'

if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error('Invalid version type. Use: patch, minor, or major')
  process.exit(1)
}

try {
  // Read current version
  const packagePath = join(__dirname, '..', 'package.json')
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
  const currentVersion = packageJson.version

  // Parse version
  const [major, minor, patch] = currentVersion.split('.').map(Number)
  let newVersion

  if (versionType === 'major') {
    newVersion = `${major + 1}.0.0`
  } else if (versionType === 'minor') {
    newVersion = `${major}.${minor + 1}.0`
  } else {
    newVersion = `${major}.${minor}.${patch + 1}`
  }

  // Update version in package.json
  packageJson.version = newVersion
  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n')

  console.log(`\n✅ Version bumped from ${currentVersion} to ${newVersion}`)
  console.log('\nNext steps:')
  console.log('1. bun run build')
  console.log('2. git add .')
  console.log(`3. git commit -m "chore: bump version to ${newVersion}"`)
  console.log(`4. git tag v${newVersion}`)
  console.log('5. git push && git push --tags')
  console.log('6. npm publish')
} catch (error) {
  console.error('Error bumping version:', error instanceof Error ? error.message : String(error))
  process.exit(1)
}
