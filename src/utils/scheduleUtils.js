const DAY_MS = 24 * 60 * 60 * 1000;

const toLocalDate = (value) => {
  if (!value || typeof value !== 'string') return null;
  const datePart = value.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isDateLike = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value);

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const getCurrentWeekDates = (date = new Date()) => {
  const base = startOfDay(date);
  return Array.from({ length: 7 }, (_, index) => {
    const weekDate = new Date(base);
    weekDate.setDate(base.getDate() + index);
    return weekDate;
  });
};

export const getTaskScheduleRange = (task = {}) => {
  const rangePairs = [
    [task.scheduleStartDate, task.scheduleEndDate],
    [task.startDate, task.dueDate],
    [task.plannedStartAt, task.dueDate],
    [task.startTime, task.endTime]
  ];

  for (const [startValue, endValue] of rangePairs) {
    if (!isDateLike(startValue) || !isDateLike(endValue)) continue;
    const start = toLocalDate(startValue);
    const end = toLocalDate(endValue);
    if (start && end) {
      return start <= end ? { start, end } : { start: end, end: start };
    }
  }

  const singleDateValue = [task.plannedStartAt, task.dueDate, task.scheduleStartDate, task.startDate, task.scheduleEndDate].find(isDateLike);
  const singleDate = toLocalDate(singleDateValue);
  return singleDate ? { start: singleDate, end: singleDate } : null;
};

export const isTaskInWeek = (task, weekStart, weekEnd) => {
  const range = getTaskScheduleRange(task);
  if (!range) return false;
  return range.start <= weekEnd && range.end >= weekStart;
};

export const clipTaskRangeToWeek = (taskRange, weekStart, weekEnd) => {
  if (!taskRange) return null;
  const start = taskRange.start < weekStart ? weekStart : taskRange.start;
  const end = taskRange.end > weekEnd ? weekEnd : taskRange.end;
  if (start > end) return null;
  return { start, end };
};

export const getMarkerPosition = (clippedRange, weekDates) => {
  if (!clippedRange || weekDates.length === 0) return null;
  const weekStart = startOfDay(weekDates[0]);
  const startIndex = Math.round((startOfDay(clippedRange.start) - weekStart) / DAY_MS);
  const endIndex = Math.round((startOfDay(clippedRange.end) - weekStart) / DAY_MS);
  return {
    startIndex: Math.max(0, Math.min(6, startIndex)),
    span: Math.max(1, Math.min(7, endIndex - startIndex + 1))
  };
};

const attachSource = (note, sourceType, sourceDateKey = null) => ({
  ...note,
  _scheduleSource: {
    id: note.id,
    sourceType,
    sourceDateKey
  }
});

export const collectScheduledNotes = (appData = {}) => {
  const todos = (appData.todos || []).map(note => attachSource(note, 'todos'));
  const routines = (appData.routines || []).map(note => attachSource(note, 'routines'));
  const scheduleNotes = Object.entries(appData.schedule || {}).flatMap(([dateKey, notes]) => (
    Array.isArray(notes) ? notes.map(note => attachSource(note, 'schedule', dateKey)) : []
  ));

  return [...todos, ...scheduleNotes, ...routines];
};

export const getWeeklyMarkers = (appData = {}, anchorDate = new Date()) => {
  const weekDates = getCurrentWeekDates(anchorDate);
  const weekStart = startOfDay(weekDates[0]);
  const weekEnd = startOfDay(weekDates[6]);

  const markers = collectScheduledNotes(appData)
    .filter(note => isTaskInWeek(note, weekStart, weekEnd))
    .map(note => {
      const range = getTaskScheduleRange(note);
      const clippedRange = clipTaskRangeToWeek(range, weekStart, weekEnd);
      const position = getMarkerPosition(clippedRange, weekDates);
      if (!position) return null;
      return {
        note,
        range,
        clippedRange,
        position,
        source: note._scheduleSource
      };
    })
    .filter(Boolean);

  return {
    weekDates,
    markers
  };
};

export const formatWeekDateLabel = (date) => `${date.getMonth() + 1}/${date.getDate()}`;

export const isSameDate = (a, b) => formatDateKey(a) === formatDateKey(b);
