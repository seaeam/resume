import { ChangelogEntry } from './components/changelog-entry'
import { loadChangelogEntries } from './utils'

const entries = loadChangelogEntries()

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="max-w-5xl mx-auto px-6 lg:px-10 pt-10">
        <div className="relative">
          {entries.map(entry => (
            <ChangelogEntry
              key={entry.frontmatter.date}
              entry={entry}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
