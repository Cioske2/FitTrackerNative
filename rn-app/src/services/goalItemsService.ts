import { supabase } from './supabaseClient';

export interface GoalItem {
  id: string;
  // user_id removed (single-user instance)
  type: 'weight' | 'fitness' | 'diet' | 'other';
  title: string;
  description?: string;
  target_value?: number;
  start_value?: number;
  current_value?: number;
  unit?: string;
  direction: 'increase' | 'decrease' | 'maintain';
  status: 'active' | 'completed' | 'cancelled';
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export const goalItemsService = {
  async list(): Promise<GoalItem[]> {
    const { data, error } = await supabase.from('goal_items').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data as GoalItem[];
  },
  async add(payload: Partial<GoalItem>): Promise<GoalItem> {
    const insertObj: any = {
      type: payload.type || 'other',
      title: payload.title,
      description: payload.description || '',
      target_value: payload.target_value ?? null,
      start_value: payload.start_value ?? null,
      current_value: payload.current_value ?? payload.start_value ?? null,
      unit: payload.unit || null,
      direction: payload.direction || 'increase',
      status: 'active',
      due_date: payload.due_date || null,
    };
    const { data, error } = await supabase.from('goal_items').insert([insertObj]).select().single();
    if (error) throw error;
    return data as GoalItem;
  },
  async update(id: string, patch: Partial<GoalItem>): Promise<GoalItem> {
    const allowed = { ...patch };
    delete (allowed as any).id; delete (allowed as any).user_id; // protect
    const { data, error } = await supabase.from('goal_items').update(allowed).eq('id', id).select().single();
    if (error) throw error;
    return data as GoalItem;
  },
  async complete(id: string): Promise<GoalItem> {
    const { data, error } = await supabase.from('goal_items').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data as GoalItem;
  },
  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from('goal_items').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

export default goalItemsService;