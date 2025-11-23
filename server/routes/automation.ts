// server/routes/automation.ts
import express from 'express';
import * as db from '../db';
import { discoveryQueue, scheduleAutomation, removeAutomationSchedule, queuesReady } from '../queues';

export const router = express.Router();

// GET /api/automation/status
router.get('/status', (_req, res) => {
    res.json(db.getAutomationState());
});

// GET /api/automation/logs
router.get('/logs', (_req, res) => {
    res.json(db.getAutomationState().logs);
});

// POST /api/automation/start
router.post('/start', async (_req, res) => {
    if (!queuesReady) {
        return res.status(503).json({ error: 'Queue system is not available. Please ensure Redis is running and configured.' });
    }

    const state = db.getAutomationState();
    if (state.isRunning) {
        return res.status(400).json({ error: 'Automation is already running.' });
    }
    
    db.setAutomationRunning(true);
    db.addAutomationLog('Automation engine started by user.', 'success');
    
    const settings = db.getSettings();
    try {
        await scheduleAutomation(settings.automationInterval);
    } catch (e) {
        db.setAutomationRunning(false); // Rollback state on failure
        const message = e instanceof Error ? e.message : "An unknown error occurred";
        db.addAutomationLog(`Failed to schedule automation job: ${message}`, 'error');
        return res.status(500).json({ error: `Failed to schedule automation job: ${message}. Is Redis running?`});
    }

    // Trigger an immediate run without waiting for the schedule
    await discoveryQueue.add('on-demand-discovery', {});

    res.json({ message: 'Automation started.' });
});

// POST /api/automation/stop
router.post('/stop', async (_req, res) => {
    if (!queuesReady) {
        return res.status(503).json({ error: 'Queue system is not available. Please ensure Redis is running and configured.' });
    }

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
router.get('/settings', (_req, res) => {
    res.json(db.getSettings());
});

// POST /api/automation/settings
router.post('/settings', (req, res) => {
    const newSettings = req.body;
    const updatedSettings = db.updateSettings(newSettings);
    
    // If automation is running and queues are ready, reschedule it with the new interval
    if (queuesReady && db.getAutomationState().isRunning) {
        scheduleAutomation(updatedSettings.automationInterval).catch(console.error);
    }

    res.json(updatedSettings);
});