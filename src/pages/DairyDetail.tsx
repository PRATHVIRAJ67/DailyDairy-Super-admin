import { ArrowLeft, Pause, Pencil, Phone, Play, UserMinus, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Button, Card, ErrorBox, Input, Modal, PageHeader, Spinner, Stat, TextArea, useToast } from '../components/ui';
import { errorText } from '../lib/api';
import { actionLabel, money } from '../lib/format';
import { useAddOwner, useDairy, useRemoveOwner, useSetDairyStatus, useUpdateDairy, type DairyDetail as Detail, type Person } from '../lib/queries';

export default function DairyDetail() {
  const { id = '' } = useParams();
  const dairy = useDairy(id);
  const [editing, setEditing] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [addingOwner, setAddingOwner] = useState(false);
  const [removing, setRemoving] = useState<Person | null>(null);
  const removeOwner = useRemoveOwner();
  const toast = useToast();

  if (dairy.isLoading) return <Spinner />;
  if (dairy.isError) return <ErrorBox message={errorText(dairy.error)} onRetry={() => dairy.refetch()} />;
  const d = dairy.data!;
  const suspended = d.status === 'suspended';

  const remove = async () => {
    if (!removing) return;
    try {
      await removeOwner.mutateAsync({ id: d.id, userId: removing.id });
      toast('success', `${removing.name} is no longer an owner of ${d.name}.`);
      setRemoving(null);
    } catch (e) {
      toast('error', errorText(e));
    }
  };

  return (
    <div>
      <Link to="/dairies" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline"><ArrowLeft className="size-4" />All dairies</Link>
      <PageHeader title={d.name} subtitle={[d.city, d.contactPhone, d.contactEmail].filter(Boolean).join(' · ') || undefined}
        actions={<>
          <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="size-4" />Edit</Button>
          <Button variant={suspended ? 'success' : 'danger'} onClick={() => setStatusOpen(true)}>
            {suspended ? <><Play className="size-4" />Reactivate</> : <><Pause className="size-4" />Suspend</>}
          </Button>
        </>} />
      {suspended ? (
        <p role="status" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <strong>Suspended:</strong> {d.statusReason}. The owner and suppliers cannot work, and new customers in its PIN codes cannot subscribe. Deliveries customers already paid for are kept.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Customers" value={d.customers} />
        <Stat label="Active plans" value={d.activeSubscriptions} />
        <Stat label="Collected, 30 days" value={money(d.revenueMonthMinor)} tone="good" />
        <Stat label="Collected, all time" value={money(d.revenueTotalMinor)} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-xl">Owners</h2>
            <Button size="sm" variant="secondary" onClick={() => setAddingOwner(true)}><UserPlus className="size-4" />Add owner</Button>
          </div>
          <p className="mb-2 text-sm text-gray-600">Owners sign in to the partner dashboard and manage this dairy's areas, suppliers and products.</p>
          <ul className="divide-y divide-forest-100">
            {d.owners.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 py-2">
                <span><span className="font-semibold">{o.name}</span> <a href={`tel:${o.phone}`} className="ml-1 inline-flex items-center gap-1 text-sm text-forest-700"><Phone className="size-3.5" />{o.phone}</a></span>
                <Button size="sm" variant="ghost" aria-label={`Remove ${o.name}`} onClick={() => setRemoving(o)}><UserMinus className="size-4" /></Button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-gray-600">{d.suppliers} {d.suppliers === 1 ? 'supplier' : 'suppliers'} · {d.products} products for sale</p>
        </Card>

        <Card>
          <h2 className="mb-2 font-display text-xl">Areas and PIN codes</h2>
          {!d.areas.length ? <p className="text-gray-600">No areas yet. The owner adds them in the partner dashboard (Manage → Areas); customers in those PIN codes then see this dairy.</p> : (
            <ul className="divide-y divide-forest-100">
              {d.areas.map((a) => (
                <li key={a.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{a.name}{!a.isActive ? <span className="ml-2 text-xs font-normal text-gray-500">(paused)</span> : null}</span>
                    <span className="text-sm text-gray-500">{a.activeSubscriptions} active plans · {a.windowStart}–{a.windowEnd}</span>
                  </div>
                  <p className="mt-0.5 text-sm tabular-nums text-gray-600">{a.postalCodes.join(', ')}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="mb-2 font-display text-xl">Recent activity</h2>
        {!d.activity.length ? <p className="text-gray-600">Nothing yet.</p> : (
          <ul className="divide-y divide-forest-100 text-sm">
            {d.activity.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span><span className="font-semibold">{actionLabel(a.action)}</span>{a.actorName ? <span className="text-gray-500"> by {a.actorName}</span> : null}</span>
                <time className="text-gray-500" dateTime={a.createdAt}>{new Date(a.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</time>
              </li>
            ))}
          </ul>
        )}
        <Link to={`/audit?dairy=${d.id}`} className="mt-2 inline-block text-sm font-semibold text-forest-700 hover:underline">See all activity</Link>
      </Card>

      {d.notes ? <Card className="mt-4"><h2 className="mb-1 font-display text-xl">Notes</h2><p className="whitespace-pre-wrap text-gray-700">{d.notes}</p></Card> : null}

      {editing ? <EditDairy dairy={d} onClose={() => setEditing(false)} /> : null}
      {statusOpen ? <StatusDialog dairy={d} onClose={() => setStatusOpen(false)} /> : null}
      {addingOwner ? <AddOwner dairy={d} onClose={() => setAddingOwner(false)} /> : null}
      <Modal open={!!removing} title="Remove owner?" onClose={() => setRemoving(null)}
        footer={<><Button variant="secondary" onClick={() => setRemoving(null)}>Cancel</Button><Button variant="danger" loading={removeOwner.isPending} onClick={remove}>Remove</Button></>}>
        <p>{removing?.name} loses access to {d.name}'s dashboard immediately. Their account stays as a customer account. A dairy always keeps at least one owner.</p>
      </Modal>
    </div>
  );
}

function EditDairy({ dairy, onClose }: { dairy: Detail; onClose: () => void }) {
  const [name, setName] = useState(dairy.name);
  const [city, setCity] = useState(dairy.city);
  const [phone, setPhone] = useState(dairy.contactPhone?.replace('+91', '') ?? '');
  const [email, setEmail] = useState(dairy.contactEmail ?? '');
  const [notes, setNotes] = useState(dairy.notes);
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateDairy();
  const toast = useToast();
  const submit = async () => {
    if (name.trim().length < 2) return setError('Enter the dairy name');
    if (phone && !/^[6-9]\d{9}$/.test(phone)) return setError('Enter a valid 10-digit contact number or leave it empty');
    try {
      await update.mutateAsync({ id: dairy.id, name: name.trim(), city: city.trim(), contactPhone: phone ? `+91${phone}` : '', contactEmail: email.trim(), notes: notes.trim() });
      toast('success', 'Dairy updated');
      onClose();
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <Modal open title={`Edit ${dairy.name}`} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={update.isPending} onClick={submit}>Save</Button></>}>
      {error ? <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-red-800">{error}</p> : null}
      <Input label="Dairy name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} />
      <Input label="Contact number" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} />
      <Input label="Contact email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} />
      <TextArea label="Notes (only you see these)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
    </Modal>
  );
}

function StatusDialog({ dairy, onClose }: { dairy: Detail; onClose: () => void }) {
  const suspending = dairy.status === 'active';
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const set = useSetDairyStatus();
  const toast = useToast();
  const submit = async () => {
    if (suspending && reason.trim().length < 3) return setError('Give a reason. The owner sees it when they contact you.');
    try {
      await set.mutateAsync({ id: dairy.id, status: suspending ? 'suspended' : 'active', reason: reason.trim() || undefined });
      toast('success', suspending ? `${dairy.name} suspended` : `${dairy.name} is active again`);
      onClose();
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <Modal open title={suspending ? `Suspend ${dairy.name}?` : `Reactivate ${dairy.name}?`} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant={suspending ? 'danger' : 'success'} loading={set.isPending} onClick={submit}>{suspending ? 'Suspend' : 'Reactivate'}</Button></>}>
      {suspending ? (
        <>
          <p className="mb-3">The owner and suppliers lose access to their dashboard, and customers in this dairy's PIN codes cannot start new plans. Deliveries that customers already paid for continue.</p>
          <TextArea label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} error={error ?? undefined} maxLength={300} placeholder="e.g. Platform fee unpaid for October" />
        </>
      ) : (
        <>
          <p>The owner and suppliers can work again, and new customers can subscribe.</p>
          {error ? <p role="alert" className="mt-2 text-red-700">{error}</p> : null}
        </>
      )}
    </Modal>
  );
}

function AddOwner({ dairy, onClose }: { dairy: Detail; onClose: () => void }) {
  const [fullName, setName] = useState('');
  const [digits, setDigits] = useState('');
  const [error, setError] = useState<string | null>(null);
  const add = useAddOwner();
  const toast = useToast();
  const submit = async () => {
    if (fullName.trim().length < 2) return setError('Enter their name');
    if (!/^[6-9]\d{9}$/.test(digits)) return setError('Enter a valid 10-digit mobile number');
    try {
      await add.mutateAsync({ id: dairy.id, fullName: fullName.trim(), phone: `+91${digits}` });
      toast('success', `${fullName.trim()} can now sign in as an owner of ${dairy.name}.`);
      onClose();
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <Modal open title={`Add an owner to ${dairy.name}`} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={add.isPending} onClick={submit}>Add owner</Button></>}>
      {error ? <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-red-800">{error}</p> : null}
      <Input label="Name" value={fullName} onChange={(e) => setName(e.target.value)} maxLength={80} />
      <Input label="Mobile number" inputMode="numeric" maxLength={10} value={digits} onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
        hint="A person can work for only one dairy." />
    </Modal>
  );
}
