const express = require('express');
const router = express.Router();
const Payload = require('../models/Payload');
const { generatePayloadScript } = require('../utils/payloadGenerator');
const { obfuscateScript } = require('../utils/obfuscator');

// Get all payloads for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const payloads = await Payload.find({ userId });
    res.json(payloads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific payload
router.get('/:id', async (req, res) => {
  try {
    const payload = await Payload.findById(req.params.id);
    if (!payload) {
      return res.status(404).json({ error: 'Payload not found' });
    }
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new payload
router.post('/', async (req, res) => {
  try {
    const { userId, name, config, tags, isPersistent, whitelistedDomains, blacklistedDomains } = req.body;
    
    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }
    
    // Generate the payload script
    const script = generatePayloadScript(config);
    
    // Obfuscate the script based on configuration
    const obfuscatedScript = obfuscateScript(script, config.obfuscationLevel || 2);
    
    const payload = new Payload({
      userId,
      name,
      script,
      obfuscatedScript,
      config,
      tags,
      isPersistent,
      whitelistedDomains,
      blacklistedDomains
    });
    
    await payload.save();
    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a payload
router.put('/:id', async (req, res) => {
  try {
    const payload = await Payload.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!payload) {
      return res.status(404).json({ error: 'Payload not found' });
    }
    
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a payload
router.delete('/:id', async (req, res) => {
  try {
    const payload = await Payload.findByIdAndDelete(req.params.id);
    
    if (!payload) {
      return res.status(404).json({ error: 'Payload not found' });
    }
    
    res.json({ message: 'Payload deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get the raw payload script
router.get('/:id/script', async (req, res) => {
  try {
    const payload = await Payload.findById(req.params.id);
    
    if (!payload) {
      return res.status(404).json({ error: 'Payload not found' });
    }
    
    // Return the obfuscated script by default, or the plain script if requested
    const script = req.query.plain === 'true' ? payload.script : payload.obfuscatedScript;
    
    res.set('Content-Type', 'application/javascript');
    res.send(script);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;