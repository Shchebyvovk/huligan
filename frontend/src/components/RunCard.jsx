const STATUS_STYLES = {
  running:   'bg-blue-500/20 text-blue-300',
  completed: 'bg-green-500/20 text-green-300',
  failed:    'bg-red-500/20 text-red-300',
  pending:   'bg-gray-500/20 text-gray-400',
}

export default function RunCard({ run }) {
  const badge = STATUS_STYLES[run.status] ?? STATUS_STYLES.pending
  const scenarioName = run.scenario?.name ?? run.scenario ?? '—'
  const time = new Date(run.createdAt ?? run.started_at).toLocaleString('uk-UA')

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="font-medium text-sm">{scenarioName}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>
            {run.status}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {run.concurrency} юзерів · {time}
        </div>
      </div>
      <span className="text-xs text-gray-600">#{run.id}</span>
    </div>
  )
}
