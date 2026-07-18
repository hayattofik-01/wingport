'use client'

import { useState } from 'react'

export default function CodeBlockClient({
  gatewayHtml,
  flutterHtml,
}: {
  gatewayHtml: string
  flutterHtml: string
}) {
  const [tab, setTab] = useState<'gateway' | 'flutter'>('gateway')

  return (
    <div className="min-w-0 max-w-full rounded-2xl border border-wing-border bg-wing-raised overflow-hidden">
      <div
        className="flex items-center border-b border-wing-border"
        role="tablist"
        aria-label="Code example tabs"
      >
        <button
          role="tab"
          aria-selected={tab === 'gateway'}
          aria-controls="gateway-panel"
          id="gateway-tab"
          onClick={() => setTab('gateway')}
          className={`px-5 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-wing-signal ${
            tab === 'gateway'
              ? 'text-wing-signal border-b-2 border-wing-signal'
              : 'text-wing-dim hover:text-wing-text'
          }`}
        >
          gateway
        </button>
        <button
          role="tab"
          aria-selected={tab === 'flutter'}
          aria-controls="flutter-panel"
          id="flutter-tab"
          onClick={() => setTab('flutter')}
          className={`px-5 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-wing-signal ${
            tab === 'flutter'
              ? 'text-wing-signal border-b-2 border-wing-signal'
              : 'text-wing-dim hover:text-wing-text'
          }`}
        >
          flutter
        </button>
      </div>
      <div className="relative">
        <div
          id="gateway-panel"
          role="tabpanel"
          aria-labelledby="gateway-tab"
          hidden={tab !== 'gateway'}
          className={tab === 'gateway' ? 'block' : 'hidden'}
          dangerouslySetInnerHTML={{ __html: gatewayHtml }}
        />
        <div
          id="flutter-panel"
          role="tabpanel"
          aria-labelledby="flutter-tab"
          hidden={tab !== 'flutter'}
          className={tab === 'flutter' ? 'block' : 'hidden'}
          dangerouslySetInnerHTML={{ __html: flutterHtml }}
        />
      </div>
    </div>
  )
}
