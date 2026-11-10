import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export type Role = 'customer' | 'supplier' | 'admin' | 'super_admin';
export interface Me { id: string; fullName: string; phone: string | null; role: Role }

export interface Person { id: string; name: string; phone: string | null }
export interface Dairy {
  id: string; name: string; city: string; contactPhone: string | null; contactEmail: string | null;
  status: 'active' | 'suspended'; statusReason: string | null; notes: string; createdAt: string;
  areas: number; pincodes: number; suppliers: number; products: number; customers: number; activeSubscriptions: number;
  revenueMonthMinor: number; revenueTotalMinor: number; owners: Person[];
}
export interface AuditRow {
  id: string; action: string; entity: string; entityId: string | null; metadata: Record<string, unknown>; createdAt: string;
  dairyId?: string | null; dairyName?: string | null; actorName: string | null; actorRole?: Role | null;
}
export interface DairyDetail extends Omit<Dairy, 'areas'> {
  areas: { id: string; name: string; postalCodes: string[]; isActive: boolean; windowStart: string; windowEnd: string; activeSubscriptions: number }[];
  activity: AuditRow[];
}
export interface Overview {
  totals: {
    activeDairies: number; suspendedDairies: number; customers: number; activeSubscriptions: number; suppliers: number;
    newLeads: number; revenueMonthMinor: number; unservedAddresses: number;
  };
  unservedPincodes: { postalCode: string; customers: number; city: string }[];
  dairies: Dairy[];
}
export type LeadStatus = 'new' | 'contacted' | 'onboarded' | 'rejected';
export interface Lead {
  id: string; dairyName: string; contactName: string; phone: string; email: string | null; city: string; pincodes: string;
  dailyLitres: string; message: string; status: LeadStatus; adminNote: string; dairyId: string | null; dairyNameLinked: string | null; createdAt: string;
}
export interface PinOwner { zoneId: string; zoneName: string; isActive: boolean; dairyId: string; dairyName: string; dairyStatus: string }

const qs = (o: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const useMe = (enabled: boolean) => useQuery({ queryKey: ['me'], queryFn: () => api.get<Me>('/me'), enabled, retry: false });
export const useOverview = () => useQuery({ queryKey: ['overview'], queryFn: () => api.get<Overview>('/platform/overview') });
export const useDairies = (f: { status?: string; q?: string } = {}) =>
  useQuery({ queryKey: ['dairies', f], queryFn: () => api.get<Dairy[]>(`/platform/dairies${qs(f)}`) });
export const useDairy = (id: string) => useQuery({ queryKey: ['dairy', id], queryFn: () => api.get<DairyDetail>(`/platform/dairies/${id}`) });
export const useLeads = (status?: LeadStatus) => useQuery({ queryKey: ['leads', status ?? 'all'], queryFn: () => api.get<Lead[]>(`/platform/leads${qs({ status })}`) });
export const useAudit = (page: number, dairyId?: string) =>
  useQuery({
    queryKey: ['audit', page, dairyId ?? 'all'],
    queryFn: () => api.page<AuditRow[]>(`/platform/audit${qs({ page, pageSize: 50, dairyId })}`),
    placeholderData: (prev) => prev,
  });
export const lookupPin = (pin: string) => api.get<PinOwner[]>(`/platform/pincodes/${pin}`);

/** Every change refreshes the lists it can affect. */
function useInvalidating<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const k of ['overview', 'dairies', 'dairy', 'leads', 'audit']) qc.invalidateQueries({ queryKey: [k] });
    },
  });
}

export interface NewDairy {
  name: string; city: string; contactEmail?: string; notes: string; ownerPhone: string; ownerName: string; leadId?: string;
}
export const useCreateDairy = () => useInvalidating((v: NewDairy) => api.post<{ id: string }>('/platform/dairies', { ...v }));
export const useUpdateDairy = () =>
  useInvalidating(({ id, ...v }: { id: string; name?: string; city?: string; contactPhone?: string; contactEmail?: string; notes?: string }) =>
    api.patch<{ id: string }>(`/platform/dairies/${id}`, v));
export const useSetDairyStatus = () =>
  useInvalidating(({ id, ...v }: { id: string; status: 'active' | 'suspended'; reason?: string }) => api.post<{ id: string }>(`/platform/dairies/${id}/status`, v));
export const useAddOwner = () =>
  useInvalidating(({ id, ...v }: { id: string; phone: string; fullName: string }) => api.post<{ id: string }>(`/platform/dairies/${id}/owners`, v));
export const useRemoveOwner = () =>
  useInvalidating(({ id, userId }: { id: string; userId: string }) => api.delete<{ id: string }>(`/platform/dairies/${id}/owners/${userId}`));
export const useUpdateLead = () =>
  useInvalidating(({ id, ...v }: { id: string; status?: LeadStatus; adminNote?: string }) => api.patch<{ id: string }>(`/platform/leads/${id}`, v));
