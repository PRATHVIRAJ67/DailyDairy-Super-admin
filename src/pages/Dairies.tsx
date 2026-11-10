import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import NewDairy from '../components/NewDairy';
import { Button, Card, Empty, ErrorBox, Input, PageHeader, Select, Spinner, StatusBadge } from '../components/ui';
import { errorText } from '../lib/api';
import { money } from '../lib/format';
import { lookupPin, useDairies, type PinOwner } from '../lib/queries';

export default function Dairies() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const dairies = useDairies({ status: status || undefined, q: q.trim() || undefined });
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <PageHeader title="Dairies" subtitle="Each dairy runs its own areas, suppliers and products. A PIN code belongs to one dairy."
        actions={<Button onClick={() => setAdding(true)}><Plus className="size-4" />Add dairy</Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative">
          <span className="sr-only">Search dairies</span>
          <Search className="pointer-events-none absolute top-3 left-3 size-5 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or city" className="h-11 w-64 max-w-full rounded-xl border border-forest-200 bg-white pr-3 pl-10" />
        </label>
        <Select aria-label="Status" className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>
      {dairies.isLoading ? <Spinner /> : dairies.isError ? <ErrorBox message={errorText(dairies.error)} onRetry={() => dairies.refetch()} /> : !dairies.data!.length ? (
        <Empty title={q || status ? 'No dairies match' : 'No dairies yet'} message={q || status ? undefined : 'Add a dairy and its owner to get started.'}
          action={q || status ? undefined : <Button onClick={() => setAdding(true)}>Add dairy</Button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dairies.data!.map((d) => (
            <Link key={d.id} to={`/dairies/${d.id}`} className="block rounded-2xl focus-visible:outline-3">
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-xl">{d.name}</p>
                    <p className="text-sm text-gray-500">{d.city || 'City not set'} · {d.owners.map((o) => o.name).join(', ') || 'No owner'}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-xl bg-forest-50 py-2"><dt className="text-xs text-gray-500">Areas</dt><dd className="font-semibold">{d.areas} <span className="text-xs font-normal text-gray-500">({d.pincodes} PIN)</span></dd></div>
                  <div className="rounded-xl bg-forest-50 py-2"><dt className="text-xs text-gray-500">Customers</dt><dd className="font-semibold">{d.customers}</dd></div>
                  <div className="rounded-xl bg-forest-50 py-2"><dt className="text-xs text-gray-500">30 days</dt><dd className="font-semibold">{money(d.revenueMonthMinor)}</dd></div>
                </dl>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <PinLookup />
      {adding ? <NewDairy onClose={() => setAdding(false)} /> : null}
    </div>
  );
}

/** Answers "who delivers to this PIN code?" with the same rule the customer app uses. */
function PinLookup() {
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<PinOwner[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const check = async () => {
    if (!/^[1-9]\d{5}$/.test(pin)) return setError('Enter a 6-digit PIN code');
    setBusy(true);
    setError(null);
    try {
      setResult(await lookupPin(pin));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const active = result?.find((r) => r.isActive && r.dairyStatus === 'active');
  return (
    <Card className="mt-6 max-w-xl">
      <h2 className="font-display text-xl">Who delivers to a PIN code?</h2>
      <form className="mt-2 flex items-start gap-2" onSubmit={(e) => { e.preventDefault(); void check(); }}>
        <div className="flex-1"><Input label="PIN code" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setResult(null); }} error={error ?? undefined} /></div>
        <Button type="submit" loading={busy} className="mt-7">Check</Button>
      </form>
      {result ? (
        active ? <p><Link to={`/dairies/${active.dairyId}`} className="font-semibold text-forest-800 hover:underline">{active.dairyName}</Link> delivers here (area {active.zoneName}).</p>
          : result.length ? <p className="text-amber-800">Listed in {result.map((r) => `${r.dairyName} / ${r.zoneName}`).join(', ')}, but that area or dairy is not active, so customers cannot subscribe.</p>
            : <p className="text-gray-600">No dairy serves {pin} yet.</p>
      ) : null}
    </Card>
  );
}
