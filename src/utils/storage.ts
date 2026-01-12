import { StorageData } from '../types';

const STORAGE_KEY = 'job_selector_data';

/**
 * 当前存储数据版本号
 */
export const CURRENT_VERSION = 1;

/**
 * 保存数据到LocalStorage
 * @param data 要保存的数据
 */
export function saveData(data: StorageData): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
    throw error;
  }
}

/**
 * 从LocalStorage加载数据
 * @returns 存储的数据，如果不存在或损坏则返回null
 */
export function loadData(): StorageData | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized === null) {
      return null;
    }
    
    const data = JSON.parse(serialized) as StorageData;
    
    // 验证数据结构的基本完整性
    if (!isValidStorageData(data)) {
      console.warn('Invalid storage data structure, returning null');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return null;
  }
}

/**
 * 清空LocalStorage中的数据
 */
export function clearData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear data from localStorage:', error);
    throw error;
  }
}

/**
 * 验证存储数据结构是否有效
 * @param data 要验证的数据
 * @returns 数据是否有效
 */
function isValidStorageData(data: unknown): data is StorageData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.version === 'number' &&
    Array.isArray(obj.dimensions) &&
    Array.isArray(obj.offers) &&
    typeof obj.lastUpdated === 'number'
  );
}
