'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const router = express.Router();

const seedPath = path.join(config.paths.seed, 'pricing.json');
const pricing = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

router.get('/', (req, res) => {
  res.json(pricing);
});

module.exports = router;
