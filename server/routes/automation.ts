// server/routes/automation.ts
// FIX: Changed express import to default import to fix type resolution issues.
import express from 'express';
import * as db from '../db';
import { discoveryQueue, scheduleAutomation, removeAutomationSchedule } from '../queues';

export const router = express.Router();

// GET /api/automation/status
// FIX: Used express.Request and express.Response to correctly type the handler arguments.
router.get('/status', (_req: express.Request, res: express.Response) => {
    res.json(db.getAutomationState());
});

// GET /api/automation/logs
// FIX: Used express.Request and express.Response to correctly type the handler arguments.
router.get('/logs', (_req: express.Request, res: express.Response) => {
    res.json(db.getAutomationState().logs);
});

// POST /api/automation/start
// FIX: Used express.Request and express.Response to correctly type the handler arguments.
router.post('/start', async (_req: express.Request, res: express.Response) => {
    const state = db.getAutomationState();
    if (state.isRunning) {
        return res.status(400).json({ error: 'Automation is already running.' });
    }
    
    db.setAutomationRunning(true);
    db.addAutomationLog('Automation engine started by user.', 'success');
    
    const settings = db.getSettings();
    await scheduleAutomation(settings.automationInterval);

    // Trigger an immediate run without waiting for the schedule
    await discoveryQueue.add('on-demand-discovery', {});

    res.json({ message: 'Automation started.' });
});

// POST /api/automation/stop
// FIX: Used express.Request and express.Response to correctly type the handler arguments.
router.post('/stop', async (_req: express.Request, res: express.Response) => {
    const state = db.getAutomationState();
    if (!state.isRunning) {
        return res.status(400).json({ error: 'Automation is not running.' });
    }

    db.setAutomationRunning(false);
    db.addAutomationLog('Automation engine stopped by user.');
    await removeAutomationSchedule();
    
    res.json({ message: 'Automation stopped.' });
});

// GET /api/automation/settings
// FIX: Used express.Request and express.Response to correctly type the handler arguments.
router.get('/settings', (_req: express.Request, res: express.Response) => {
    res.json(db.getSettings());
});

// POST /api/automation/settings
// FIX: Used express.Request and express.Response to correctly type the handler arguments.
router.post('/settings', (req: express.Request, res: express.Response) => {
    const newSettings = req.body;
    const updatedSettings = db.updateSettings(newSettings);
    
    // If automation is running, reschedule it with the new interval
    if (db.getAutomationState().isRunning) {
        scheduleAutomation(updatedSettings.automationInterval).catch(console.error);
    }

    res.json(updatedSettings);
});
