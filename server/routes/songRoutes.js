const express = require('express');
const { z } = require('zod');
const controller = require('../controllers/songController');
const importController = require('../controllers/importController');
const { validateBody } = require('../middleware/validate');
const { attachUserIfPresent } = require('../middleware/auth');

const router = express.Router();

const chordAnchorSchema = z.object({
  chord: z.string().min(1),
  syllableIndex: z.number().int().min(0),
  charOffset: z.number().int().min(0).default(0),
});

const syllableSchema = z.object({
  text: z.string().default(''),
  wordId: z.string().nullable().optional(),
  isWordStart: z.boolean().optional(),
  isWordEnd: z.boolean().optional(),
  type: z.enum(['lyric', 'space', 'chordSlot']).default('lyric'),
});

const lineSchema = z.object({
  syllables: z.array(syllableSchema).default([]),
  chordAnchors: z.array(chordAnchorSchema).default([]),
});

const sectionSchema = z.object({
  type: z
    .enum([
      'intro', 'verse', 'prechorus', 'chorus', 'postchorus',
      'bridge', 'interlude', 'instrumental', 'solo', 'outro', 'custom',
    ])
    .default('verse'),
  label: z.string().default(''),
  lines: z.array(lineSchema).default([]),
});

const songSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().default(''),
  album: z.string().default(''),
  originalKey: z.string().default(''),
  currentKey: z.string().default(''),
  tempo: z.number().optional(),
  capo: z.number().default(0),
  sections: z.array(sectionSchema).default([]),
  metadata: z
    .object({
      genre: z.string().default(''),
      tags: z.array(z.string()).default([]),
      timeSignature: z.string().default(''),
      notes: z.string().default(''),
    })
    .partial()
    .default({}),
  source: z
    .object({
      type: z.enum(['manual', 'genius', 'paste-import', 'migrated']).default('manual'),
      geniusId: z.number().optional(),
      sourceUrl: z.string().optional(),
      mediaUrl: z.string().optional(),
      imageUrl: z.string().optional(),
      importedAt: z.string().or(z.date()).optional(),
    })
    .partial()
    .default({}),
});

router.get('/', attachUserIfPresent, controller.listSongs);
router.post('/import', attachUserIfPresent, importController.saveImport);
router.get('/:id', controller.getSong);
router.post('/', validateBody(songSchema), controller.createSong);
router.put('/:id', validateBody(songSchema.partial()), controller.updateSong);
router.delete('/:id', controller.deleteSong);
router.post(
  '/:id/transpose',
  validateBody(z.object({ targetKey: z.string().min(1) })),
  controller.transposeSong
);
router.post(
  '/:id/duplicate-section',
  validateBody(z.object({ sectionIndex: z.number().int().min(0) })),
  controller.duplicateSection
);

module.exports = router;
