import { KeyRound, Database, ScanEye, ShieldCheck } from 'lucide-react'

export default function NoMiddleman() {
  return (
    <section className="px-6 py-24 md:py-32" id="no-middleman">
      <div className="mx-auto max-w-[1080px]">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-wing-signal">No middleman</p>
        <h2 className="mb-14 font-display text-[clamp(1.6rem,3.5vw,2.2rem)] font-medium text-wing-text">
          Runs in your project. Not ours.
        </h2>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Architecture diagram */}
          <div className="rounded-2xl border border-wing-border bg-wing-raised p-6 md:p-8">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
              <Node label="Flutter app" sub="no keys in the binary" />
              <Wire />
              <Box>
                <p className="mb-3 text-center text-sm font-medium text-wing-text">Your Supabase project</p>
                <div className="grid grid-cols-3 gap-2">
                  <TinyNode>Auth</TinyNode>
                  <TinyNode>Postgres</TinyNode>
                  <TinyNode>Secrets</TinyNode>
                </div>
                <div className="mx-auto mt-3 w-fit rounded border border-wing-signal/40 px-3 py-1 text-xs text-wing-signal">
                  Wingport gateway
                </div>
              </Box>
              <Wire />
              <Node label="Anthropic · OpenAI · Gemini" sub="any model" accent="ai" />
            </div>
          </div>

          {/* Trust points */}
          <div className="space-y-6">
            <TrustRow icon={KeyRound}>
              Provider keys live in your Supabase secrets — never on our servers
            </TrustRow>
            <TrustRow icon={Database}>
              Usage data lives in your Postgres — query AI costs with plain SQL
            </TrustRow>
            <TrustRow icon={ScanEye}>
              The gateway is open source — read every line in your request path
            </TrustRow>
            <TrustRow icon={ShieldCheck}>
              If Wingport disappears tomorrow, your app keeps working
            </TrustRow>
          </div>
        </div>
      </div>
    </section>
  )
}

function Node({
  label,
  sub,
  accent = 'signal',
}: {
  label: string
  sub: string
  accent?: 'signal' | 'ai'
}) {
  const color = accent === 'signal' ? 'border-wing-signal' : 'border-wing-ai'
  const textColor = accent === 'signal' ? 'text-wing-signal' : 'text-wing-ai'
  return (
    <div className={`w-full rounded-xl border ${color} bg-wing-bg p-4 text-center md:w-[140px]`}>
      <p className="font-display text-sm font-medium text-wing-text">{label}</p>
      <p className={`text-xs ${textColor}`}>{sub}</p>
    </div>
  )
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full rounded-xl border border-wing-border bg-wing-bg p-4 md:w-[260px]">
      {children}
    </div>
  )
}

function TinyNode({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded border border-wing-border bg-wing-raised px-2 py-2 text-center text-[10px] text-wing-dim">
      {children}
    </div>
  )
}

function Wire() {
  return <div className="h-8 w-[2px] bg-wing-border md:h-[2px] md:w-10 md:flex-1" />
}

function TrustRow({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-wing-border bg-wing-raised">
        <Icon className="h-5 w-5 text-wing-signal" />
      </div>
      <p className="pt-2 text-base leading-[1.6] text-wing-dim">{children}</p>
    </div>
  )
}
