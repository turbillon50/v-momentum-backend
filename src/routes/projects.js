'use strict';

const express = require('express');
const store = require('../services/store');
const { requireFields, pick } = require('../middleware/validate');
const { HttpError } = require('../middleware/error');

const router = express.Router();

const PROJECT_FIELDS = [
  'cliente',
  'plan',
  'fase',
  'integraciones',
  'demoUrl',
  'productionUrl',
  'status',
  'notas',
  'leadId',
];

const VALID_PHASES = [
  'descubrimiento',
  'diseno',
  'desarrollo',
  'integraciones',
  'qa',
  'lanzamiento',
  'soporte',
];

const VALID_STATUS = ['activo', 'pausado', 'entregado', 'cancelado'];

router.get('/', (req, res) => {
  const { status, plan, fase } = req.query;
  const filter = {};
  if (status) filter.status = String(status);
  if (plan) filter.plan = String(plan);
  if (fase) filter.fase = String(fase);
  const items = store.list('projects', Object.keys(filter).length ? filter : undefined);
  res.json({ data: items, count: items.length });
});

router.get('/:id', (req, res) => {
  const project = store.get('projects', req.params.id);
  if (!project) throw new HttpError(404, 'Project not found');
  res.json({ data: project });
});

router.post('/', (req, res) => {
  requireFields(req.body, ['cliente', 'plan']);
  const data = pick(req.body, PROJECT_FIELDS);
  if (data.fase && !VALID_PHASES.includes(data.fase)) {
    throw new HttpError(400, 'Invalid fase', { allowed: VALID_PHASES });
  }
  if (data.status && !VALID_STATUS.includes(data.status)) {
    throw new HttpError(400, 'Invalid status', { allowed: VALID_STATUS });
  }
  const project = store.create(
    'projects',
    {
      fase: data.fase || 'descubrimiento',
      status: data.status || 'activo',
      integraciones: Array.isArray(data.integraciones) ? data.integraciones : [],
      ...data,
    },
    'proj',
  );
  res.status(201).json({ data: project });
});

router.patch('/:id', (req, res) => {
  const patch = pick(req.body, PROJECT_FIELDS);
  if (patch.fase && !VALID_PHASES.includes(patch.fase)) {
    throw new HttpError(400, 'Invalid fase', { allowed: VALID_PHASES });
  }
  if (patch.status && !VALID_STATUS.includes(patch.status)) {
    throw new HttpError(400, 'Invalid status', { allowed: VALID_STATUS });
  }
  const updated = store.update('projects', req.params.id, patch);
  if (!updated) throw new HttpError(404, 'Project not found');
  res.json({ data: updated });
});

module.exports = router;
