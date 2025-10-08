const toDateInternal = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const milliseconds = value > 1e12 ? value : value * 1000;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    const milliseconds = numeric > 1e12 ? numeric : numeric * 1000;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const toDate = toDateInternal;

export const getStreamStatus = (stream, nowInput = Date.now()) => {
  const nowMs = nowInput instanceof Date ? nowInput.getTime() : Number(nowInput) || Date.now();
  const startDate = toDateInternal(stream?.startsAt ?? null);
  const endDate = toDateInternal(stream?.endsAt ?? null);
  const alwaysLive = Boolean(stream?.always_live);

  if (alwaysLive) {
    return {
      statusLabel: 'LIVE',
      statusCategory: 'live',
      statusColor: 'success',
      startDate,
      endDate
    };
  }

  if (!startDate) {
    return {
      statusLabel: 'Scheduled',
      statusCategory: 'upcoming',
      statusColor: 'default',
      startDate,
      endDate
    };
  }

  const startMs = startDate.getTime();
  const endMs = endDate?.getTime() ?? null;

  if (nowMs < startMs) {
    const diffMinutes = (startMs - nowMs) / 60000;
    return {
      statusLabel: diffMinutes <= 60 ? 'Starting Soon' : 'Upcoming',
      statusCategory: 'upcoming',
      statusColor: diffMinutes <= 60 ? 'warning' : 'info',
      startDate,
      endDate
    };
  }

  if (endMs) {
    if (nowMs > endMs) {
      return {
        statusLabel: 'Ended',
        statusCategory: 'ended',
        statusColor: 'warning',
        startDate,
        endDate
      };
    }

    return {
      statusLabel: 'LIVE',
      statusCategory: 'live',
      statusColor: 'success',
      startDate,
      endDate
    };
  }

  const elapsedMinutes = (nowMs - startMs) / 60000;
  if (elapsedMinutes > 180) {
    return {
      statusLabel: 'Ended',
      statusCategory: 'ended',
      statusColor: 'warning',
      startDate,
      endDate
    };
  }

  return {
    statusLabel: 'LIVE',
    statusCategory: 'live',
    statusColor: 'success',
    startDate,
    endDate
  };
};
