import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  weightToKg,
  kgToDisplay,
  displayWeight,
  getWeightRange,
  getRecentExerciseNames,
  getFrequencyPairs,
  LB_IN_KG,
} from './fitnessUtils.js';
import { getTodayKey } from '../dateUtils.js';

test('weightToKg converts lb to kg', () => {
  assert.ok(Math.abs(weightToKg(1, 'lb') - LB_IN_KG) < 1e-6);
  assert.equal(weightToKg(100, 'kg'), 100);
});

test('kgToDisplay converts to lb', () => {
  const kg = weightToKg(220, 'lb');
  const back = kgToDisplay(kg, 'lb');
  assert.ok(Math.abs(back - 220) < 0.01);
});

test('displayWeight converts stored value to display unit', () => {
  const kgShow = displayWeight(100, 'kg', 'kg', 'kg');
  assert.ok(Math.abs(kgShow - 100) < 1e-6);
  const lbShow = displayWeight(220, 'lb', 'kg', 'kg');
  assert.ok(Math.abs(lbShow - 99.79) < 0.1);
});

test('getWeightRange pads flat series', () => {
  const { min, max } = getWeightRange([
    { dateKey: 'a', weight: 70 },
    { dateKey: 'b', weight: 70 },
  ]);
  assert.ok(min < 70 && max > 70);
});

test('getRecentExerciseNames orders by frequency', () => {
  const names = getRecentExerciseNames({
    d1: {
      workouts: [
        { id: 'w', exercises: [{ id: 'e', name: 'A', sets: [] }, { id: 'e2', name: 'B', sets: [] }] },
      ],
    },
    d2: {
      workouts: [
        { id: 'w', exercises: [{ id: 'e', name: 'A', sets: [] }] },
      ],
    },
  }, 10);
  assert.deepEqual(names.slice(0, 2), ['A', 'B']);
});

test('getFrequencyPairs counts exercises this week', () => {
  const k = getTodayKey();
  const pairs = getFrequencyPairs(
    {
      [k]: {
        workouts: [
          { id: 'w', exercises: [{ id: 'e', name: 'Squat', bodyPart: 'Legs', sets: [] }] },
        ],
      },
    },
    'week',
    'exercise'
  );
  assert.equal(pairs[0]?.label, 'Squat');
  assert.equal(pairs[0]?.count, 1);
});
