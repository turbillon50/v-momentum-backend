'use strict';

const express = require('express');
const store = require('../services/store');
const { isEmail, pick } = require('../middleware/validate');
const { HttpError } = require('../middleware/error');

const router = express.Router();

// The PWA's contact form (components/sections/contact-section.tsx) posts these
// English keys. The original spec asked for Spanish keys. We accept BOTH on
// input and store BOTH on output, so neither side has to translate.
const ENGLISH_FIELDS = [
  'name',
  'whatsapp',
  'email',
  'company',
  'projectType',
  'plan',
  'storePublish',
  'urgency',
  'description',
  'consent',
];

const SPANISH_FIELDS = [
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
const VALID_PLAN = ['traditional', 'flexible', 'undecided'];
const VALID_STORE_PUBLISH = ['ios', 'android', 'both', 'pwa', 'undecided'];

function normalize(input) {
  // Either side of the bilingual contract can be partial. Build the canonical
  // record by preferring whatever the caller actually sent.
  const en = pick(input, ENGLISH_FIELDS);
  const es = pick(input, SPANISH_FIELDS);

  const nombre = es.nombre ?? en.name ?? null;
  const telefono = es.telefono ?? en.whatsapp ?? null;
  const email = (es.email ?? en.email ?? '').toString().trim();
  const empresa = es.empresa ?? en.company ?? null;
  const tipoProyecto = es.tipoProyecto ?? en.projectType ?? null;
  const plan = es.plan ?? en.plan ?? null;
  const mensaje = es.mensaje ?? en.description ?? null;

  return {
    // canonical (Spanish, per spec)
    nombre,
    telefono,
    email,
    empresa,
    tipoProyecto,
    plan,
    mensaje,
    fecha: es.fecha || new Date().toISOString(),
    estatus: VALID_STATUS.includes(es.estatus) ? es.estatus : 'nuevo',
    origen: es.origen || 'pwa',
    // mirrored frontend shape (English, what the PWA sends)
    name: nombre,
    whatsapp: telefono,
    company: empresa,
    projectType: tipoProyecto,
    description: mensaje,
    storePublish: en.storePublish ?? null,
    urgency: en.urgency ?? null,
    consent: typeof en.consent === 'boolean' ? en.consent : null,
  };
}

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
  const body = req.body || {};
  const record = normalize(body);

  if (!record.nombre) {
    throw new HttpError(400, 'Missing required field', { field: 'name' });
  }
  if (!record.email || !isEmail(record.email)) {
    throw new HttpError(400, 'Invalid or missing email', { field: 'email' });
  }
  if (record.plan && !VALID_PLAN.includes(record.plan)) {
    throw new HttpError(400, 'Invalid plan', { allowed: VALID_PLAN });
  }
  if (record.storePublish && !VALID_STORE_PUBLISH.includes(record.storePublish)) {
    throw new HttpError(400, 'Invalid storePublish', { allowed: VALID_STORE_PUBLISH });
  }
  if (record.consent === false) {
    throw new HttpError(400, 'Consent is required to submit the form', { field: 'consent' });
  }

  const lead = store.create('leads', record, 'lead');
  res.status(201).json({ data: lead });
});

router.patch('/:id', (req, res) => {
  const body = req.body || {};
  const patch = normalize({ ...store.get('leads', req.params.id), ...body });

  if (patch.estatus && !VALID_STATUS.includes(patch.estatus)) {
    throw new HttpError(400, 'Invalid estatus', { allowed: VALID_STATUS });
  }
  const updated = store.update('leads', req.params.id, patch);
  if (!updated) throw new HttpError(404, 'Lead not found');
  res.json({ data: updated });
});

module.exports = router;
