import { Building2, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import NewDairy from '../components/NewDairy';
import { Button, Card, Empty, ErrorBox, PageHeader, Select, Spinner, StatusBadge, TextArea, useToast } from '../components/ui';
import { errorText } from '../lib/api';
import { useLeads, useUpdateLead, type Lead, type LeadStatus } from '../lib/queries';

const STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'onboarded', label: 'Onboarded' },
  { value: 'rejected', label: 'Not a fit' },
];

export default function Leads() {
  const [filter, setFilter] = useState<LeadStatus | ''>('');
  const leads = useLeads(filter || undefined);
  const [onboarding, setOnboarding] = useState<Lead | null>(null);

  return (
    <div>
      <PageHeader title="Leads" subtitle={'Dairies that filled in "Partner with us" on the website. Call them, then add them as a dairy.'} />
      <Select aria-label="Show" className="mb-4 w-auto" value={filter} onChange={(e) => setFilter(e.target.value as LeadStatus | '')}>
        <option value="">All leads</option>
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </Select>
      {leads.isLoading ? <Spinner /> : leads.isError ? <ErrorBox message={errorText(leads.error)} onRetry={() => leads.refetch()} /> : !leads.data!.length ? (
        <Empty title="No leads here" message="New requests from the website appear here as soon as they are sent." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {leads.data!.map((l) => <LeadCard key={l.id} lead={l} onOnboard={() => setOnboarding(l)} />)}
        </div>
      )}
      {onboarding ? <NewDairy lead={onboarding} onClose={() => setOnboarding(null)} /> : null}
    </div>
  );
}

function LeadCard({ lead, onOnboard }: { lead: Lead; onOnboard: () => void }) {
  const [note, setNote] = useState(lead.adminNote);
  const update = useUpdateLead();
  const toast = useToast();
  const save = async (patch: { status?: LeadStatus; adminNote?: string }) => {
    try {
      await update.mutateAsync({ id: lead.id, ...patch });
      toast('success', 'Lead updated');
    } catch (e) {
      toast('error', errorText(e));
    }
  };
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-xl">{lead.dairyName}</p>
          <p className="text-sm text-gray-600">{lead.contactName}{lead.city ? ` · ${lead.city}` : ''} · {new Date(lead.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
        </div>
        <StatusBadge status={lead.status} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 font-semibold text-forest-700"><Phone className="size-4" />{lead.phone}</a>
        {lead.email ? <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 text-forest-700"><Mail className="size-4" />{lead.email}</a> : null}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div><dt className="text-gray-500">PIN codes</dt><dd>{lead.pincodes || '—'}</dd></div>
        <div><dt className="text-gray-500">Litres a day</dt><dd>{lead.dailyLitres || '—'}</dd></div>
      </dl>
      {lead.message ? <p className="mt-2 rounded-xl bg-forest-50 px-3 py-2 text-sm whitespace-pre-wrap">{lead.message}</p> : null}
      <div className="mt-3">
        <TextArea label="Your note" value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== lead.adminNote && save({ adminNote: note })} maxLength={1000} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label="Lead status" className="w-auto" value={lead.status} onChange={(e) => save({ status: e.target.value as LeadStatus })}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
        {lead.dairyId ? (
          <Link to={`/dairies/${lead.dairyId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline"><Building2 className="size-4" />Open {lead.dairyNameLinked ?? 'dairy'}</Link>
        ) : (
          <Button size="sm" onClick={onOnboard}><Building2 className="size-4" />Add as dairy</Button>
        )}
      </div>
    </Card>
  );
}
