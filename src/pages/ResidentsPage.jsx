import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, LogOut, Upload } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatCurrency } from '@/lib/utils';

const initialForm = {
  bedId: '', firstName: '', lastName: '', email: '', phone: '', gender: 'MALE',
  dateOfBirth: '', bloodGroup: '', foodPreference: '',
  occupation: '', company: '', college: '',
  idProofType: '', idProofNumber: '',
  emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
  parentName: '', parentPhone: '',
  vehicleNumber: '', parkingSlot: '',
  depositAmount: '0', advanceRent: '0', notes: '',
};

function DetailField({ label, value }) {
  return (
    <div>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <p className="text-sm font-medium text-slate-800 dark:text-white">{value || '-'}</p>
    </div>
  );
}

function getInitials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}

function getAvatarColor(name) {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500',
    'bg-amber-500', 'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500',
  ];
  const hash = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function ResidentsPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [proofFiles, setProofFiles] = useState([]);
  const fileRef = useRef(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['residents', search],
    queryFn: async () => (await api.get('/tenant/residents', { params: { search, limit: 50 } })).data,
  });

  const { data: availableBeds } = useQuery({
    queryKey: ['available-beds'],
    queryFn: async () => (await api.get('/tenant/beds', { params: { status: 'AVAILABLE', limit: 100 } })).data.data,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['resident-detail', selectedId],
    queryFn: async () => (await api.get(`/tenant/residents/${selectedId}`)).data.data,
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/tenant/residents', payload),
    onSuccess: (response) => { 
      queryClient.invalidateQueries({ queryKey: ['residents'] }); 
      queryClient.invalidateQueries({ queryKey: ['available-beds'] });
      if (proofFiles.length > 0 && response.data?.data?.id) {
        proofFiles.forEach(file => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('name', `${form.idProofType || 'ID Proof'} - ${form.firstName} ${form.lastName}`);
          formData.append('entityType', 'RESIDENT');
          formData.append('residentId', response.data.data.id);
          api.post('/tenant/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        });
      }
      setOpen(false);
      setForm(initialForm);
      setProofFiles([]);
      setErrors({});
    },
    onError: (error) => {
      if (error.response?.data?.errors) {
        const fieldErrors = {};
        error.response.data.errors.forEach(err => { fieldErrors[err.field] = err.message; });
        setErrors(fieldErrors);
      }
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: (id) => api.post(`/tenant/residents/${id}/checkout`, { checkOutDate: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['available-beds'] });
    },
  });

  const residents = data?.data || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    if (!form.firstName.trim()) { setErrors({ firstName: 'First name is required' }); return; }
    if (!form.lastName.trim()) { setErrors({ lastName: 'Last name is required' }); return; }
    if (!form.phone.trim() || form.phone.trim().length < 10) { setErrors({ phone: 'Valid phone (10 digits) required' }); return; }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      gender: form.gender,
      depositAmount: parseFloat(form.depositAmount) || 0,
      advanceRent: parseFloat(form.advanceRent) || 0,
    };

    if (form.bedId) payload.bedId = form.bedId;
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.dateOfBirth) payload.dateOfBirth = new Date(form.dateOfBirth).toISOString();
    if (form.bloodGroup) payload.bloodGroup = form.bloodGroup;
    if (form.foodPreference) payload.foodPreference = form.foodPreference;
    if (form.occupation.trim()) payload.occupation = form.occupation.trim();
    if (form.company.trim()) payload.company = form.company.trim();
    if (form.college.trim()) payload.college = form.college.trim();
    if (form.idProofType) payload.idProofType = form.idProofType;
    if (form.idProofNumber.trim()) payload.idProofNumber = form.idProofNumber.trim();
    if (form.parkingSlot.trim()) payload.parkingSlot = form.parkingSlot.trim();
    if (form.notes.trim()) payload.notes = form.notes.trim();

    if (form.emergencyContactName.trim() || form.emergencyContactPhone.trim()) {
      payload.emergencyContact = {
        name: form.emergencyContactName.trim(),
        phone: form.emergencyContactPhone.trim(),
        relation: form.emergencyContactRelation.trim(),
      };
    }
    if (form.parentName.trim() || form.parentPhone.trim()) {
      payload.parentDetails = { name: form.parentName.trim(), phone: form.parentPhone.trim() };
    }
    if (form.vehicleNumber.trim()) {
      payload.vehicleDetails = [{ number: form.vehicleNumber.trim() }];
    }
    createMutation.mutate(payload);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setProofFiles(files);
  };

  const handleCardClick = (id) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <div>
      <PageHeader title="Residents" description="Manage check-ins, transfers, and check-outs" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Resident</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Check-in Resident</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider">Bed Assignment</Label>
                <Select value={form.bedId} onValueChange={(value) => setForm({ ...form, bedId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select available bed (optional)" /></SelectTrigger>
                  <SelectContent>
                    {availableBeds?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.room?.floor?.building?.name || ''} → {b.room?.floor?.name} → {b.room?.name} ({b.label}) - ₹{b.rentAmount}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Personal Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>First Name *</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />{errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}</div>
                  <div className="space-y-1"><Label>Last Name *</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />{errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}</div>
                  <div className="space-y-1"><Label>Phone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="9876543210" />{errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}</div>
                  <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Gender</Label>
                    <select className="flex h-10 w-full rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Blood Group</Label>
                    <select className="flex h-10 w-full rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                      <option value="">Select</option>
                      {['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','AB_POSITIVE','AB_NEGATIVE','O_POSITIVE','O_NEGATIVE'].map(bg => <option key={bg} value={bg}>{bg.replace('_',' ')}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1"><Label>Food Preference</Label>
                    <select className="flex h-10 w-full rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40" value={form.foodPreference} onChange={(e) => setForm({ ...form, foodPreference: e.target.value })}>
                      <option value="">Select</option>
                      {['VEGETARIAN','NON_VEGETARIAN','VEGAN','JAIN'].map(fp => <option key={fp} value={fp}>{fp.replace('_',' ')}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Occupation</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>Occupation</Label><Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="Student / Working" /></div>
                  <div className="space-y-1"><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
                  <div className="space-y-1"><Label>College</Label><Input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} /></div>
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">ID Proof & Documents</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>ID Proof Type</Label>
                    <select className="flex h-10 w-full rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40" value={form.idProofType} onChange={(e) => setForm({ ...form, idProofType: e.target.value })}>
                      <option value="">Select</option>
                      <option value="AADHAR">Aadhar Card</option><option value="PAN">PAN Card</option><option value="PASSPORT">Passport</option><option value="DRIVING_LICENSE">Driving License</option><option value="VOTER_ID">Voter ID</option><option value="COLLEGE_ID">College ID</option><option value="OFFICE_ID">Office ID</option>
                    </select>
                  </div>
                  <div className="space-y-1"><Label>ID Number</Label><Input value={form.idProofNumber} onChange={(e) => setForm({ ...form, idProofNumber: e.target.value })} placeholder="ID proof number" /></div>
                  <div className="space-y-1 col-span-2">
                    <Label>Upload Proof Documents (Photos/PDFs)</Label>
                    <Input type="file" ref={fileRef} multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                    {proofFiles.length > 0 && <p className="text-xs text-blue-600">{proofFiles.length} file(s) selected — will be uploaded to Cloudinary</p>}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Emergency & Parent Details</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>Emergency Name</Label><Input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Emergency Phone</Label><Input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></div>
                  <div className="space-y-1"><Label>Relation</Label><Input value={form.emergencyContactRelation} onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })} placeholder="Father, Mother..." /></div>
                  <div className="space-y-1"><Label>Parent Name</Label><Input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Parent Phone</Label><Input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></div>
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Vehicle & Payment</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Vehicle Number</Label><Input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} placeholder="KA-01-AB-1234" /></div>
                  <div className="space-y-1"><Label>Parking Slot</Label><Input value={form.parkingSlot} onChange={(e) => setForm({ ...form, parkingSlot: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Deposit Amount (₹)</Label><Input type="number" min="0" value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Advance Rent (₹)</Label><Input type="number" min="0" value={form.advanceRent} onChange={(e) => setForm({ ...form, advanceRent: e.target.value })} /></div>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <textarea className="flex min-h-[60px] w-full rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." />
              </div>
              {createMutation.error && Object.keys(errors).length === 0 && <p className="text-sm text-red-500">{createMutation.error.response?.data?.message || 'Failed to check in resident'}</p>}
              <DialogFooter><Button type="submit" disabled={createMutation.isPending}>Check In Resident</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      } />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input className="pl-9" placeholder="Search residents..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Photo + Name Card Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : residents.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No residents yet</div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {residents.map((r) => (
            <div
              key={r.id}
              onClick={() => handleCardClick(r.id)}
              className="glass-card p-4 cursor-pointer hover:scale-[1.02] transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 flex flex-col items-center text-center relative"
            >
              {/* Checkout button for active residents */}
              {r.status === 'ACTIVE' && (
                <button
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  onClick={(e) => { e.stopPropagation(); checkoutMutation.mutate(r.id); }}
                  title="Check-out"
                >
                  <LogOut className="h-3.5 w-3.5 text-red-400 hover:text-red-600" />
                </button>
              )}

              {/* Avatar */}
              {r.profilePhoto ? (
                <img
                  src={r.profilePhoto}
                  alt={`${r.firstName} ${r.lastName}`}
                  className="w-16 h-16 rounded-full object-cover mb-3 ring-2 ring-white dark:ring-slate-700 shadow-sm"
                />
              ) : (
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 text-white font-semibold text-lg ring-2 ring-white dark:ring-slate-700 shadow-sm ${getAvatarColor(r.firstName + r.lastName)}`}>
                  {getInitials(r.firstName, r.lastName)}
                </div>
              )}

              {/* Name */}
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">{r.firstName}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">{r.lastName}</p>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(v) => { setDetailOpen(v); if (!v) setSelectedId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Resident Details</DialogTitle></DialogHeader>
          {detailLoading ? (
            <div className="py-8 text-center text-slate-400">Loading details...</div>
          ) : detailData ? (
            <div className="space-y-5">
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Personal Information</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Full Name" value={`${detailData.firstName} ${detailData.lastName}`} />
                  <DetailField label="Phone" value={detailData.phone} />
                  <DetailField label="Email" value={detailData.email} />
                  <DetailField label="Gender" value={detailData.gender} />
                  <DetailField label="Date of Birth" value={formatDate(detailData.dateOfBirth)} />
                  <DetailField label="Blood Group" value={detailData.bloodGroup?.replace('_', ' ')} />
                  <DetailField label="Food Preference" value={detailData.foodPreference?.replace('_', ' ')} />
                  <DetailField label="Status" value={detailData.status} />
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Location</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Building" value={detailData.bed?.room?.floor?.building?.name} />
                  <DetailField label="Floor" value={detailData.bed?.room?.floor?.name} />
                  <DetailField label="Room" value={detailData.bed?.room?.name} />
                  <DetailField label="Bed" value={detailData.bed?.label} />
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Occupation</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Occupation" value={detailData.occupation} />
                  <DetailField label="Company" value={detailData.company} />
                  <DetailField label="College" value={detailData.college} />
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">ID Proof</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="ID Proof Type" value={detailData.idProofType} />
                  <DetailField label="ID Number" value={detailData.idProofNumber} />
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Emergency & Parent</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Emergency Contact" value={detailData.emergencyContact?.name} />
                  <DetailField label="Emergency Phone" value={detailData.emergencyContact?.phone} />
                  <DetailField label="Relation" value={detailData.emergencyContact?.relation} />
                  <DetailField label="Parent Name" value={detailData.parentDetails?.name} />
                  <DetailField label="Parent Phone" value={detailData.parentDetails?.phone} />
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Vehicle & Payment</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Vehicle Number" value={detailData.vehicleDetails?.[0]?.number} />
                  <DetailField label="Parking Slot" value={detailData.parkingSlot} />
                  <DetailField label="Deposit" value={formatCurrency(detailData.depositAmount)} />
                  <DetailField label="Advance Rent" value={formatCurrency(detailData.advanceRent)} />
                  <DetailField label="Check-in Date" value={formatDate(detailData.checkInDate)} />
                </div>
              </div>
              {detailData.notes && (
                <div>
                  <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Notes</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{detailData.notes}</p>
                </div>
              )}
              {detailData.documents && detailData.documents.length > 0 && (
                <div>
                  <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Documents</p>
                  <div className="space-y-1">
                    {detailData.documents.map((doc) => (
                      <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-600 hover:underline">{doc.name || 'Document'}</a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
