import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button, Card, Empty, ErrorBox, PageHeader, Select, Spinner } from '../components/ui';
import { errorText } from '../lib/api';
import { actionLabel } from '../lib/format';
import { useAudit, useDairies } from '../lib/queries';

export default function Audit() {
  const [params, setParams] = useSearchParams();
  const dairyId = params.get('dairy') ?? undefined;
  const [page, setPage] = useState(1);
  const audit = useAudit(page, dairyId);
  const dairies = useDairies();
  const total = Number(audit.data?.meta?.total ?? 0);
  const pages = Math.max(1, Math.ceil(total / 50));

  return (
    <div>
      <PageHeader title="Activity" subtitle="Every change made by owners, suppliers and platform admins." />
      <Select aria-label="Dairy" className="mb-4 w-auto" value={dairyId ?? ''} onChange={(e) => { setPage(1); setParams(e.target.value ? { dairy: e.target.value } : {}); }}>
        <option value="">All dairies and platform</option>
        {dairies.data?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </Select>
      {audit.isLoading ? <Spinner /> : audit.isError ? <ErrorBox message={errorText(audit.error)} onRetry={() => audit.refetch()} /> : !audit.data!.data.length ? (
        <Empty title="No activity yet" />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-forest-100 text-sm">
            {audit.data!.data.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5">
                <span>
                  <span className="font-semibold">{actionLabel(a.action)}</span>
                  {a.dairyName ? <span className="ml-2 rounded-lg bg-forest-50 px-2 py-0.5 text-xs font-medium text-forest-800">{a.dairyName}</span> : null}
                  {a.actorName ? <span className="text-gray-500"> by {a.actorName}</span> : null}
                </span>
                <time className="text-gray-500" dateTime={a.createdAt}>{new Date(a.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</time>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Newer</Button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Older</Button>
        </div>
      ) : null}
    </div>
  );
}
