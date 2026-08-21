import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, X } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEALS = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

export default function FoodMenuPage() {
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [editItem, setEditItem] = useState('');
  const [editDay, setEditDay] = useState(0);
  const [editMeal, setEditMeal] = useState('BREAKFAST');
  const queryClient = useQueryClient();

  const { data: buildings } = useQuery({
    queryKey: ['buildings-list'],
    queryFn: async () => (await api.get('/tenant/buildings', { params: { limit: 100 } })).data.data,
  });

  const { data: menu, isLoading } = useQuery({
    queryKey: ['food-menu', selectedBuilding],
    queryFn: async () => (await api.get(`/tenant/menu/${selectedBuilding}`)).data.data,
    enabled: !!selectedBuilding,
  });

  const saveMutation = useMutation({
    mutationFn: (body) => api.post('/tenant/menu', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['food-menu'] }); setEditItem(''); },
  });

  const handleAddItem = (dayOfWeek, mealType, currentItems) => {
    if (!editItem.trim()) return;
    const newItems = [...(currentItems || []), editItem.trim()];
    saveMutation.mutate({ buildingId: selectedBuilding, dayOfWeek, mealType, items: newItems });
  };

  const handleRemoveItem = (dayOfWeek, mealType, currentItems, idx) => {
    const newItems = currentItems.filter((_, i) => i !== idx);
    saveMutation.mutate({ buildingId: selectedBuilding, dayOfWeek, mealType, items: newItems });
  };

  return (
    <div>
      <PageHeader title="Food Menu" description="Manage weekly food menu per building" />

      <div className="mb-6">
        <Label className="mb-2 block">Select Building</Label>
        <select className="rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 px-3 py-2 text-sm w-full max-w-md" value={selectedBuilding} onChange={(e) => setSelectedBuilding(e.target.value)}>
          <option value="">Choose a building...</option>
          {(buildings || []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {selectedBuilding && (
        <div className="space-y-4">
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="glass-card p-4">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-3">{day}</h3>
              <div className="grid md:grid-cols-4 gap-3">
                {MEALS.map((meal) => {
                  const dayMenu = menu?.[day] || [];
                  const mealData = dayMenu.find((m) => m.mealType === meal);
                  const items = mealData?.items || [];

                  return (
                    <div key={meal} className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-2">{meal}</p>
                      <div className="space-y-1 mb-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                            <span>• {item}</span>
                            <button onClick={() => handleRemoveItem(dayIdx, meal, items, idx)} className="text-red-400 hover:text-red-600"><X className="h-3 w-3" /></button>
                          </div>
                        ))}
                        {items.length === 0 && <p className="text-xs text-slate-400 italic">No items</p>}
                      </div>
                      <div className="flex gap-1">
                        <Input className="h-7 text-xs" placeholder="Add item..." value={editDay === dayIdx && editMeal === meal ? editItem : ''} onChange={(e) => { setEditDay(dayIdx); setEditMeal(meal); setEditItem(e.target.value); }} onKeyDown={(e) => { if (e.key === 'Enter') { handleAddItem(dayIdx, meal, items); } }} />
                        <Button size="icon" className="h-7 w-7" onClick={() => { if (editDay === dayIdx && editMeal === meal) handleAddItem(dayIdx, meal, items); }}><Plus className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!selectedBuilding && <p className="text-center text-slate-400 py-12">Select a building to manage its food menu</p>}
    </div>
  );
}
