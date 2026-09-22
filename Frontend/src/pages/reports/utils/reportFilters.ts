import { ReportPeriod } from '../components/ReportFilterBar';

export function isDateWithinPeriod(
  dateString: string | undefined | null,
  period: ReportPeriod,
  customStart?: string,
  customEnd?: string
): boolean {
  if (!dateString) return true;
  if (period === 'ALL_TIME') return true;

  const itemDate = new Date(dateString);
  if (isNaN(itemDate.getTime())) return true;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (period) {
    case 'TODAY':
      return itemDate >= startOfToday && itemDate <= endOfToday;

    case 'YESTERDAY': {
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const endOfYesterday = new Date(startOfYesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      return itemDate >= startOfYesterday && itemDate <= endOfYesterday;
    }

    case 'THIS_WEEK': {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return itemDate >= sevenDaysAgo && itemDate <= endOfToday;
    }

    case 'LAST_WEEK': {
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return itemDate >= fourteenDaysAgo && itemDate < sevenDaysAgo;
    }

    case 'THIS_MONTH': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return itemDate >= startOfMonth && itemDate <= endOfToday;
    }

    case 'LAST_MONTH': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return itemDate >= startOfLastMonth && itemDate <= endOfLastMonth;
    }

    case 'QUARTER_1': {
      const q1Start = new Date(now.getFullYear(), 0, 1);
      const q1End = new Date(now.getFullYear(), 2, 31, 23, 59, 59, 999);
      return itemDate >= q1Start && itemDate <= q1End;
    }

    case 'QUARTER_2': {
      const q2Start = new Date(now.getFullYear(), 3, 1);
      const q2End = new Date(now.getFullYear(), 5, 30, 23, 59, 59, 999);
      return itemDate >= q2Start && itemDate <= q2End;
    }

    case 'QUARTER_3': {
      const q3Start = new Date(now.getFullYear(), 6, 1);
      const q3End = new Date(now.getFullYear(), 8, 30, 23, 59, 59, 999);
      return itemDate >= q3Start && itemDate <= q3End;
    }

    case 'QUARTER_4': {
      const q4Start = new Date(now.getFullYear(), 9, 1);
      const q4End = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return itemDate >= q4Start && itemDate <= q4End;
    }

    case 'THIS_YEAR': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return itemDate >= startOfYear && itemDate <= endOfToday;
    }

    case 'CUSTOM': {
      if (!customStart && !customEnd) return true;
      const start = customStart ? new Date(customStart) : new Date(0);
      const end = customEnd ? new Date(customEnd + 'T23:59:59') : endOfToday;
      return itemDate >= start && itemDate <= end;
    }

    default:
      return true;
  }
}

export function downloadCSV(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const sanitize = (val: string | number) => {
    const str = String(val ?? '');
    return `"${str.replace(/"/g, '""')}"`;
  };

  const csvContent = [
    headers.map(sanitize).join(','),
    ...rows.map(row => row.map(sanitize).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
