export const isSameLocalDay = (dateA, dateB) => {
  if (!(dateA instanceof Date) || Number.isNaN(dateA.getTime())) {
    return false;
  }

  if (!(dateB instanceof Date) || Number.isNaN(dateB.getTime())) {
    return false;
  }

  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
};

export const isTimestampOnCurrentDay = (timestampSeconds, now = new Date()) => {
  if (timestampSeconds === null || timestampSeconds === undefined) {
    // Streams without a start time are treated as always available
    return true;
  }

  const asNumber = Number(timestampSeconds);
  if (Number.isNaN(asNumber)) {
    return false;
  }

  const milliseconds = asNumber > 1e12 ? asNumber : asNumber * 1000;
  const targetDate = new Date(milliseconds);

  if (Number.isNaN(targetDate.getTime())) {
    return false;
  }

  return isSameLocalDay(targetDate, now);
};
