import { DaddyStreamsProvider } from '../src/providers/DaddyStreamsProvider.js';

const provider = new DaddyStreamsProvider();

// Helper to call the internal parse function indirectly via normalizeCategories by crafting rawData
const makeRaw = (dateKey, events) => ({ [dateKey]: { Basketball: events } });

const runTest = (dateKey, timeStr) => {
  const raw = makeRaw(dateKey, [{ event: 'Test', time: timeStr, channels: [{ channel_name: 'c', channel_id: '1' }], poster: '', id: 'evt' }]);
  const normalized = provider.normalizeCategories(raw);
  const arr = Object.values(normalized).flat();
  console.log('Input:', dateKey, timeStr, '\nResult startsAt:', arr[0].startsAt, new Date(arr[0].startsAt * 1000).toISOString());
};

// Example: "Monday 06th Oct 2025 - Schedule Time UK GMT"
const rawDateKey = 'Monday 06th Oct 2025 - Schedule Time UK GMT';
runTest(rawDateKey, '00:30');
runTest(rawDateKey, '02:00');

// Also test when schedule key is ISO-like
runTest('2025-10-06', '00:30');
runTest('2025-10-06', '02:00');
