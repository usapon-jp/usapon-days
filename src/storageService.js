const STORAGE_KEY = 'usapondays_data';

const defaultData = {
  todos: [], // ひとやすみ中、または未配置のTODO
  schedule: {}, // { 'YYYY-MM-DD': [ { id, title, category, durationMin, startTime, status } ] }
  records: {}, // 日記や記録
  points: 0,
  settings: {
    startHour: 6,
    endHour: 24
  }
};

export const loadAppData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    return { ...defaultData, ...parsed };
  } catch (err) {
    console.error('Failed to load app data', err);
    return defaultData;
  }
};

export const saveAppData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save app data', err);
  }
};

export const exportAppData = () => {
  const data = loadAppData();
  return JSON.stringify(data, null, 2);
};

export const importAppData = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    saveAppData(parsed);
    return true;
  } catch (err) {
    console.error('Failed to import app data', err);
    return false;
  }
};
