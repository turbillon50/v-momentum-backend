'use strict';

const express = require('express');
const store = require('../services/store');
const { requireFields, isEmail, pick } = require('../middleware/validate');
const { HttpError } = require('../middleware/error');

const router = express.Router();

const LEAD_FIELDS = [
  'nombre',
  'telefono',
  'email',
  'empresa',
  'tipoProyecto',
  'plan',
  'mensaje',
  'fecha',
  'estatus',
  'origen',
];

const VALID_STATUS = ['nuevo', 'contactado', 'calificado', 'descartado', 'cliente'];

router.get('/', (req, res) => {
  const { estatus, plan } = req.query;
  const filter = {};
  if (estatus) filter.estatus = String(estatus);
  if (plan) filter.plan = String(plan);
  const items = store.list('leads', Object.keys(filter).length ? filter : undefined);
  res.json({ data: items, count: items.length });
});

router.get('/:id', (req, res) => {
  const lead = store.get('leads', req.params.id);
  if (!lead) throw new HttpError(404, 'Lead not found');
  res.json({ data: lead });
});

router.post('/', (req, res) => {
  requireFields(req.body, ['nombre', 'email']);
  if (!isEmail(req.body.email)) {
    throw new HttpError(400, 'Invalid email format', { field: 'email' });
  }
  const data = pick(req.body, LEAD_FIELDS);
  const lead = store.create(
    'leads',
    {
      estatus: VALID_STATUS.includes(data.estatus) ? data.estatus : 'nuevo',
      fecha: data.fecha || new Date().toISOString(),
      origen: data.origen || 'pwa',
      ...data,
    },
    'lead',
  );
  res.status(201).json({ data: lead });
});

router.patch('/:id', (req, res) => {
  const patch = pick(req.body, LEAD_FIELDS);
  if (patch.estatus && !VALID_STATUS.includes(patch.estatus)) {
    throw new HttpError(400, 'Invalid estatus', { allowed: VALID_STATUS });
  }
  const updated = store.update('leads', req.params.id, patch);
  if (!updated) throw new HttpError(404, 'Lead not found');
  res.json({ data: updated });
});

module.exports = router;
