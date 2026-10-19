import Stopwatch from '~/views/Stopwatch.vue';

// Mirrors the datastore's newest-first ordering and LIMIT semantics: the page
// only ever receives the newest `limit` events for the bucket.
const OLD_RUNNING = {
  id: 1,
  timestamp: '2026-01-01T08:00:00.000Z',
  data: { running: true, label: 'old running timer' },
};

const STOPPED = Array.from({ length: 100 }, (_, i) => ({
  id: 1000 + i,
  timestamp: new Date(Date.UTC(2026, 0, 2, 0, i)).toISOString(),
  data: { running: false, label: `stopped-${i}` },
}));

const datastore = [...STOPPED].reverse().concat(OLD_RUNNING);

function fakeAw() {
  return {
    getEvents: jest.fn(async (_bucket, opts = {}) => {
      const limit = opts.limit === undefined ? datastore.length : opts.limit;
      return datastore.slice(0, limit);
    }),
  };
}

describe('Stopwatch running-timer discovery', () => {
  test('a running timer older than the newest 100 events stays visible', async () => {
    const vm = {
      $aw: fakeAw(),
      bucket_id: 'aw-stopwatch',
      events: [],
      loading: true,
    };

    await Stopwatch.methods.getEvents.call(vm);

    const running = Stopwatch.computed.runningTimers.call(vm);
    expect(running.map(e => e.id)).toEqual([OLD_RUNNING.id]);
  });
});
