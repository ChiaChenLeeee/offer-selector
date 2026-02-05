import { supabase } from './supabase';
import { Dimension, Offer } from '../types';

export const saveDimensionsToCloud = async (userId: string, dimensions: Dimension[]) => {
  const { error } = await supabase
    .from('user_dimensions')
    .upsert(
      {
        user_id: userId,
        dimensions: dimensions,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: false
      }
    );

  if (error) {
    throw new Error(`保存维度失败: ${error.message}`);
  }
};

export const loadDimensionsFromCloud = async (userId: string): Promise<Dimension[] | null> => {
  const { data, error } = await supabase
    .from('user_dimensions')
    .select('dimensions')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`加载维度失败: ${error.message}`);
  }

  return data?.dimensions || null;
};

export const saveOffersToCloud = async (userId: string, offers: Offer[]) => {
  const { error } = await supabase
    .from('user_offers')
    .upsert(
      {
        user_id: userId,
        offers: offers,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: false
      }
    );

  if (error) {
    throw new Error(`保存 Offers 失败: ${error.message}`);
  }
};

export const loadOffersFromCloud = async (userId: string): Promise<Offer[] | null> => {
  const { data, error } = await supabase
    .from('user_offers')
    .select('offers')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`加载 Offers 失败: ${error.message}`);
  }

  return data?.offers || null;
};

export const syncToCloud = async (userId: string, dimensions: Dimension[], offers: Offer[]) => {
  await Promise.all([
    saveDimensionsToCloud(userId, dimensions),
    saveOffersToCloud(userId, offers),
  ]);
};

export const syncFromCloud = async (userId: string) => {
  const [dimensions, offers] = await Promise.all([
    loadDimensionsFromCloud(userId),
    loadOffersFromCloud(userId),
  ]);

  return { dimensions, offers };
};
