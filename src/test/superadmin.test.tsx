import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App, Providers, queryClient } from '../main';

vi.mock('../config', () => ({ config: { apiUrl: 'https://api.test/api/v1', supabaseUrl: '', supabaseAnonKey: '', testLogin: true } }));

const dairy = {
  id: '11111111-1111-4111-8111-111111111111', name: 'Nandini Farms', city: 'Mysuru', contactPhone: '+919822200001', contactEmail: null,
  status: 'active', statusReason: null, notes: '', createdAt: '2026-11-01T00:00:00Z', areas: 1, pincodes: 2, suppliers: 1, products: 3,
  customers: 12, activeSubscriptions: 10, revenueMonthMinor: 4560000, revenueTotalMinor: 9000000, owners: [{ id: 'o1', name: 'Meena', phone: '+919822200001' }],
};

function fakeApi(role: string) {
  const calls: { method: string; url: string; body?: unknown }[] = [];
  globalThis.fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const ok = (data: unknown, status = 200) => new Response(JSON.stringify({ data }), { status });
    if (url.endsWith('/me')) return ok({ id: 'me', fullName: 'Prathviraj', phone: '+919800000001', role });
    if (url.includes('/platform/overview')) {
      return ok({
        totals: { activeDairies: 1, suspendedDairies: 0, customers: 12, activeSubscriptions: 10, suppliers: 1, newLeads: 2, revenueMonthMinor: 4560000, unservedAddresses: 3 },
        unservedPincodes: [{ postalCode: '635109', customers: 3, city: 'Hosur' }],
        dairies: [dairy],
      });
    }
    if (url.includes('/platform/dairies') && method === 'POST') return ok({ id: dairy.id }, 201);
    if (url.includes(`/platform/dairies/${dairy.id}`)) return ok({ ...dairy, areas: [], activity: [] });
    return ok([]);
  }) as never;
  return calls;
}

describe('super admin console', () => {
  beforeEach(() => {
    localStorage.clear();
    queryClient.clear();
    window.history.pushState({}, '', '/');
  });

  it('refuses anyone who is not a platform admin', async () => {
    fakeApi('admin');
    localStorage.setItem('dd-super-admin-session', JSON.stringify({ accessToken: 'test.x.y', expiresAt: Date.now() + 3600_000, phone: '+919800000001' }));
    render(<Providers><App /></Providers>);
    expect(await screen.findByText('No platform access')).toBeInTheDocument();
  });

  it('shows platform totals and adds a dairy with its owner', async () => {
    const calls = fakeApi('super_admin');
    localStorage.setItem('dd-super-admin-session', JSON.stringify({ accessToken: 'test.x.y', expiresAt: Date.now() + 3600_000, phone: '+919800000001' }));
    render(<Providers><App /></Providers>);
    expect(await screen.findByText('Platform overview')).toBeInTheDocument();
    expect(screen.getByText('Nandini Farms')).toBeInTheDocument();
    expect(screen.getByText('635109')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Add dairy/ }));
    // jsdom has no <dialog> modal support, so the dialog's contents count as hidden.
    const dialog = await screen.findByRole('dialog', { hidden: true });
    const submit = within(dialog).getByRole('button', { name: 'Add dairy', hidden: true });
    fireEvent.click(submit);
    expect(await within(dialog).findByText('Enter the dairy name')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText('Dairy name'), { target: { value: 'Hosur Milk Co' } });
    fireEvent.change(within(dialog).getByLabelText("Owner's name"), { target: { value: 'Prakash' } });
    fireEvent.change(within(dialog).getByLabelText("Owner's mobile number"), { target: { value: '9844400001' } });
    fireEvent.click(submit);
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/platform/dairies'))).toBe(true));
    const post = calls.find((c) => c.method === 'POST' && c.url.endsWith('/platform/dairies'))!;
    expect(post.body).toMatchObject({ name: 'Hosur Milk Co', ownerName: 'Prakash', ownerPhone: '+919844400001' });
    expect(await screen.findByRole('heading', { name: 'Nandini Farms' })).toBeInTheDocument(); // opened the new dairy's page
  });
});
