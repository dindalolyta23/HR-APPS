// MSW handlers — aggregates all feature handlers
import { authHandlers } from './authHandlers';
import { employeeHandlers } from './employeeHandlers';
import { qrHandlers } from './qrHandlers';
import { attendanceHandlers } from './attendanceHandlers';
import { scheduleHandlers } from './scheduleHandlers';
import { leaveHandlers } from './leaveHandlers';

export const handlers = [
  ...authHandlers,
  ...employeeHandlers,
  ...qrHandlers,
  ...attendanceHandlers,
  ...scheduleHandlers,
  ...leaveHandlers,
];
