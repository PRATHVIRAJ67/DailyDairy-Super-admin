import { useState } from 'react';
import { useNavigate } from 'react-router';
import { errorText } from '../lib/api';
import { useCreateDairy, type Lead } from '../lib/queries';
import { Button, Input, Modal, TextArea, useToast } from './ui';

/**
 * Adds a dairy and its first owner in one step. The owner signs in to the partner dashboard with this mobile
 * number and then adds their own areas (PIN codes), suppliers and products. Opened from a lead, it is prefilled
 * and marks the lead as onboarded.
 */
export default function NewDairy({ lead, onClose }: { lead?: Lead; onClose: () => void }) {
  const [name, setName] = useState(lead?.dairyName ?? '');
  const [city, setCity] = useState(lead?.city ?? '');
  const [ownerName, setOwnerName] = useState(lead?.contactName ?? '');
  const [digits, setDigits] = useState(lead?.phone.replace('+91', '') ?? '');
  const [email, setEmail] = useState(lead?.email ?? '');
  const [notes, setNotes] = useState(lead ? [lead.pincodes && `PIN codes: ${lead.pincodes}`, lead.dailyLitres && `Litres a day: ${lead.dailyLitres}`, lead.message].filter(Boolean).join('\n') : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useCreateDairy();
  const toast = useToast();
  const navigate = useNavigate();

  const submit = async () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Enter the dairy name';
    if (ownerName.trim().length < 2) e.ownerName = "Enter the owner's name";
    if (!/^[6-9]\d{9}$/.test(digits)) e.phone = 'Enter a valid 10-digit mobile number';
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email = 'Enter a valid email or leave it empty';
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      const { id } = await create.mutateAsync({
        name: name.trim(), city: city.trim(), ownerName: ownerName.trim(), ownerPhone: `+91${digits}`,
        contactEmail: email.trim() || undefined, notes: notes.trim(), leadId: lead?.id,
      });
      toast('success', `${name.trim()} added. ${ownerName.trim()} can sign in to the partner dashboard with +91${digits}.`);
      onClose();
      navigate(`/dairies/${id}`);
    } catch (err) {
      setErrors({ form: errorText(err) });
    }
  };

  return (
    <Modal open title="Add a dairy" onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={create.isPending} onClick={submit}>Add dairy</Button></>}>
      {errors.form ? <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-red-800">{errors.form}</p> : null}
      <Input label="Dairy name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={80} placeholder="e.g. Nandini Farms" />
      <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} placeholder="e.g. Mysuru" />
      <fieldset className="mb-2 rounded-2xl border border-forest-100 p-3">
        <legend className="px-1 text-sm font-semibold">Owner</legend>
        <Input label="Owner's name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} error={errors.ownerName} maxLength={80} />
        <Input label="Owner's mobile number" inputMode="numeric" maxLength={10} value={digits} onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
          error={errors.phone} placeholder="98765 43210" hint="They sign in to the partner dashboard with this number." />
        <Input label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} maxLength={254} />
      </fieldset>
      <TextArea label="Notes (only you see these)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
    </Modal>
  );
}
