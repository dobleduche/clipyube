// server/jobs/scheduler.ts
import { scheduleAutomation, removeAutomationSchedule } from "../queues";
import * as db from "../db";

/**
 * Initializes the global scheduler using the user's automationInterval.
 * This runs once at server boot.
 */
export const initScheduler = async () => {
  try {
    const settings = db.getSettings();

    if (!settings.automationInterval || settings.automationInterval < 10000) {
      db.addAutomationLog(
        `Scheduler skipped: invalid automationInterval (${settings.automationInterval})`,
        "error"
      );
      return;
    }

    await scheduleAutomation(settings.automationInterval);

    db.addAutomationLog(
      `Scheduler initialized. Interval: ${settings.automationInterval}ms`,
      "success"
    );
  } catch (err) {
    db.addAutomationLog(
      `Scheduler init failed: ${err instanceof Error ? err.message : err}`,
      "error"
    );
  }
};

/**
 * Manually trigger a scheduler refresh (used when settings are updated)
 */
export const refreshScheduler = async () => {
  try {
    const settings = db.getSettings();

    await removeAutomationSchedule();
    await scheduleAutomation(settings.automationInterval);

    db.addAutomationLog(
      `Scheduler refreshed. New interval: ${settings.automationInterval}ms`,
      "success"
    );
  } catch (err) {
    db.addAutomationLog(
      `Scheduler refresh error: ${err instanceof Error ? err.message : err}`,
      "error"
    );
  }
};
