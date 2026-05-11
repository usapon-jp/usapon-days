const STORAGE_KEY = 'usapondays_data';

const defaultData = {
  todos: [], // ひとやすみ中、または未配置のTODO
  schedule: {}, // { 'YYYY-MM-DD': [ { id, title, category, durationMin, startTime, status } ] }
  routines: [],
  records: {}, // 日記や記録
  points: 0,
  settings: {
    startHour: 6,
    endHour: 24
  }
};

export const defaultNoteDetails = {
  memo: '',
  checklist: [],
  tags: [],
  dueDate: null,
  plannedStartAt: null,
  alarmAt: null
};

export const normalizeNote = (note = {}) => ({
  ...defaultNoteDetails,
  ...note,
  memo: typeof note.memo === 'string' ? note.memo : '',
  checklist: Array.isArray(note.checklist) ? note.checklist : [],
  tags: Array.isArray(note.tags) ? note.tags : [],
  dueDate: note.dueDate || null,
  plannedStartAt: note.plannedStartAt || null,
  alarmAt: note.alarmAt || null
});

const normalizeSchedule = (schedule = {}) => Object.fromEntries(
  Object.entries(schedule).map(([date, notes]) => [
    date,
    Array.isArray(notes) ? notes.map(normalizeNote) : []
  ])
);

const normalizeAppData = (data = {}) => ({
  ...defaultData,
  ...data,
  todos: Array.isArray(data.todos) ? data.todos.map(normalizeNote) : [],
  schedule: normalizeSchedule(data.schedule),
  routines: Array.isArray(data.routines) ? data.routines.map(normalizeNote) : [],
  settings: {
    ...defaultData.settings,
    ...(data.settings || {})
  }
});

export const loadAppData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeAppData(defaultData);
    const parsed = JSON.parse(raw);
    return normalizeAppData(parsed);
  } catch (err) {
    console.error('Failed to load app data', err);
    return normalizeAppData(defaultData);
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
    saveAppData(normalizeAppData(parsed));
    return true;
  } catch (err) {
    console.error('Failed to import app data', err);
    return false;
  }
};
