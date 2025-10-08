const zonedLocalToEpochSeconds = (yy, mm, dd, hh, min, sec, timeZone = 'Europe/London') => {
  const target = {
    year: String(yy).padStart(4, '0'),
    month: String(mm).padStart(2, '0'),
    day: String(dd).padStart(2, '0'),
    hour: String(hh).padStart(2, '0'),
    minute: String(min).padStart(2, '0'),
    second: String(sec).padStart(2, '0')
  };

  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const minOffset = -12 * 60;
  const maxOffset = 14 * 60;
  const baseMs = Date.UTC(yy, mm - 1, dd, hh, min, sec);

  for (let offsetMin = minOffset; offsetMin <= maxOffset; offsetMin++) {
    const candidateMs = baseMs - offsetMin * 60 * 1000;
    const parts = dtf.formatToParts(new Date(candidateMs));
    const map = {};
    parts.forEach(p => { if (p.type && p.value) map[p.type] = p.value; });

    if (
      map.year === target.year && map.month === target.month && map.day === target.day &&
      map.hour === target.hour && map.minute === target.minute && map.second === target.second
    ) {
      return Math.floor(candidateMs / 1000);
    }
  }
  return Math.floor(baseMs / 1000);
};

const tests = [
  { y: 2025, m:10, d:6, h:0, min:30 },
  { y: 2025, m:10, d:6, h:2, min:0 }
];

tests.forEach(t => {
  const sec = zonedLocalToEpochSeconds(t.y, t.m, t.d, t.h, t.min, 0, 'Europe/London');
  console.log(t, sec, new Date(sec*1000).toISOString());
});
