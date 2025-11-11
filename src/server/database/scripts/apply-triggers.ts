#!/usr/bin/env bun
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const TRIGGERS_DIR = join(import.meta.dirname, '../triggers')
const DRIZZLE_DIR = join(import.meta.dirname, '../drizzle')

const triggerFiles = readdirSync(TRIGGERS_DIR).filter((file) =>
  file.endsWith('.sql')
)

if (triggerFiles.length === 0) {
  console.log('No trigger files found in triggers directory')
  process.exit(0)
}

const migrationFiles = readdirSync(DRIZZLE_DIR)
  .filter((file) => file.endsWith('.sql') && !file.includes('meta'))
  .sort()

if (migrationFiles.length === 0) {
  console.error('No migration files found in drizzle directory')
  process.exit(1)
}

const latestMigration = migrationFiles[migrationFiles.length - 1]
const latestMigrationPath = join(DRIZZLE_DIR, latestMigration)

console.log(`Found ${triggerFiles.length} trigger file(s)`)
console.log(`Latest migration file: ${latestMigration}`)

let migrationContent = readFileSync(latestMigrationPath, 'utf-8')

if (migrationContent.includes('-- Triggers Start')) {
  console.log('Triggers have already been applied to this migration')
  process.exit(0)
}

const triggerContents: string[] = []

for (const triggerFile of triggerFiles) {
  const triggerPath = join(TRIGGERS_DIR, triggerFile)
  const triggerContent = readFileSync(triggerPath, 'utf-8')

  console.log(`Reading trigger: ${triggerFile}`)
  triggerContents.push(`-- Trigger from: ${triggerFile}\n${triggerContent}`)
}

const triggersSection = `
-- Triggers Start
${triggerContents.join('\n-- statement-breakpoint\n')}
-- Triggers End`

migrationContent += triggersSection

writeFileSync(latestMigrationPath, migrationContent, 'utf-8')

console.log(
  `✅ Successfully applied ${triggerFiles.length} trigger(s) to ${latestMigration}`
)
