import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import NewDairy from '../components/NewDairy';
import { Button, Card, Empty, ErrorBox, PageHeader, Spinner, Stat, StatusBadge } from '../components/ui';
import { errorText } from '../lib/api';
import { money } from '../lib/format';
import { useOverview } from '../lib/queries';

export default function Overview() {
  const o = useOverview();
  const [adding, setAdding] = useState(false);
  if (o.isLoading) return <Spinner />;
  if (o.isError) return <ErrorBox message={errorText(o.error)} onRetry={() => o.refetch()} />;
  const { totals: t, dairies, unservedPincodes } = o.data!;
  return (
    <div>
      <PageHeader title="Platform overview" subtitle="Every dairy on DailyDairy at a glance."
        actions={<Button onClick={() => setAdding(true)}><Plus className="size-4" />Add dairy</Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active dairies" value={t.activeDairies} tone="good" />
        <Stat label="Customers" value={t.customers} />
        <Stat label="Active plans" value={t.activeSubscriptions} />
        <Stat label="Collected, 30 days" value={money(t.revenueMonthMinor)} tone="good" />
        <Stat label="Suppliers" value={t.suppliers} />
        <Stat label="Suspended dairies" value={t.suspendedDairies} tone={t.suspendedDairies ? 'bad' : undefined} />
        <Link to="/leads" className="block"><Stat label="New leads" value={t.newLeads} tone={t.newLeads ? 'warn' : undefined} /></Link>
        <Stat label="Addresses nobody serves" value={t.unservedAddresses} tone={t.unservedAddresses ? 'warn' : undefined} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="mb-3 font-display text-xl">Dairies by money collected (30 days)</h2>
          {!dairies.length ? (
            <Empty title="No dairies yet" message="Add the first dairy and its owner. The owner then sets up areas, suppliers and products." action={<Button onClick={() => setAdding(true)}>Add dairy</Button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-gray-500">
                  <tr><th className="py-2">Dairy</th><th>Status</th><th className="text-right">Customers</th><th className="text-right">Active plans</th><th className="text-right">30 days</th></tr>
                </thead>
                <tbody>
                  {dairies.map((d) => (
                    <tr key={d.id} className="border-t border-forest-100">
                      <td className="py-2.5"><Link to={`/dairies/${d.id}`} className="font-semibold text-forest-800 hover:underline">{d.name}</Link><span className="block text-xs text-gray-500">{d.city || 'City not set'}</span></td>
                      <td><StatusBadge status={d.status} /></td>
                      <td className="text-right tabular-nums">{d.customers}</td>
                      <td className="text-right tabular-nums">{d.activeSubscriptions}</td>
                      <td className="text-right tabular-nums font-semibold">{money(d.revenueMonthMinor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card>
          <h2 className="font-display text-xl">Where customers are waiting</h2>
          <p className="mb-3 text-sm text-gray-600">PIN codes with saved addresses that no dairy serves yet.</p>
          {!unservedPincodes.length ? <p className="text-sm text-gray-500">Every saved address is served.</p> : (
            <ul className="divide-y divide-forest-100">
              {unservedPincodes.map((p) => (
                <li key={p.postalCode} className="flex items-center justify-between py-2">
                  <span><span className="font-semibold tabular-nums">{p.postalCode}</span> <span className="text-sm text-gray-500">{p.city}</span></span>
                  <span className="text-sm">{p.customers} {p.customers === 1 ? 'customer' : 'customers'}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {adding ? <NewDairy onClose={() => setAdding(false)} /> : null}
    </div>
  );
}
