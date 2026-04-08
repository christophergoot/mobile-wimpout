'use strict';

const { createGame } = require('../game.js');

describe('createGame – default state', () => {
  let G;
  beforeEach(() => { G = createGame(['Alice', 'Bob']); });

  test('creates correct number of players', () => {
    expect(G.players).toHaveLength(2);
  });

  test('player names are set correctly', () => {
    expect(G.players[0].name).toBe('Alice');
    expect(G.players[1].name).toBe('Bob');
  });

  test('all players start with score 0', () => {
    G.players.forEach(p => expect(p.score).toBe(0));
  });

  test('no players are eliminated at start', () => {
    G.players.forEach(p => expect(p.eliminated).toBe(false));
  });

  test('no players hold a suicide pact token at start', () => {
    G.players.forEach(p => expect(p.suicidePactToken).toBe(false));
  });

  test('initial phase is preroll', () => {
    expect(G.phase).toBe('preroll');
  });

  test('starts with player 0', () => {
    expect(G.currentPlayerIndex).toBe(0);
  });

  test('committedScore starts at 0', () => {
    expect(G.committedScore).toBe(0);
  });

  test('mustClearFlash starts false', () => {
    expect(G.mustClearFlash).toBe(false);
  });

  test('mustRollAll starts false', () => {
    expect(G.mustRollAll).toBe(false);
  });

  test('last licks inactive at start', () => {
    expect(G.lastLicksActive).toBe(false);
    expect(G.lastLicksInitiator).toBe(-1);
    expect(G.lastLicksDone.size).toBe(0);
  });
});

describe('createGame – dice structure', () => {
  let G;
  beforeEach(() => { G = createGame(['A', 'B']); });

  test('has exactly 5 dice', () => {
    expect(G.dice).toHaveLength(5);
  });

  test('dice 0–3 are white', () => {
    [0, 1, 2, 3].forEach(i => expect(G.dice[i].isBlack).toBe(false));
  });

  test('die 4 is black', () => {
    expect(G.dice[4].isBlack).toBe(true);
  });

  test('all dice start unrolled with null value', () => {
    G.dice.forEach(d => {
      expect(d.state).toBe('unrolled');
      expect(d.value).toBeNull();
    });
  });
});

describe('createGame – default rule options', () => {
  let G;
  beforeEach(() => { G = createGame(['A', 'B']); });

  test('entryRequired defaults to true', () => {
    expect(G.opts.entryRequired).toBe(true);
  });

  test('clearFlashRequired defaults to true', () => {
    expect(G.opts.clearFlashRequired).toBe(true);
  });

  test('allFiveRequired defaults to true', () => {
    expect(G.opts.allFiveRequired).toBe(true);
  });

  test('flashOptional defaults to false', () => {
    expect(G.opts.flashOptional).toBe(false);
  });

  test('suicidePact defaults to false', () => {
    expect(G.opts.suicidePact).toBe(false);
  });
});

describe('createGame – custom rule options', () => {
  test('can disable entryRequired', () => {
    const G = createGame(['A', 'B'], { entryRequired: false });
    expect(G.opts.entryRequired).toBe(false);
  });

  test('can disable clearFlashRequired', () => {
    const G = createGame(['A', 'B'], { clearFlashRequired: false });
    expect(G.opts.clearFlashRequired).toBe(false);
  });

  test('can disable allFiveRequired', () => {
    const G = createGame(['A', 'B'], { allFiveRequired: false });
    expect(G.opts.allFiveRequired).toBe(false);
  });

  test('can enable flashOptional', () => {
    const G = createGame(['A', 'B'], { flashOptional: true });
    expect(G.opts.flashOptional).toBe(true);
  });

  test('can enable suicidePact', () => {
    const G = createGame(['A', 'B'], { suicidePact: true });
    expect(G.opts.suicidePact).toBe(true);
  });

  test('partial opts leave unspecified flags at defaults', () => {
    const G = createGame(['A', 'B'], { flashOptional: true });
    expect(G.opts.entryRequired).toBe(true);
    expect(G.opts.clearFlashRequired).toBe(true);
    expect(G.opts.allFiveRequired).toBe(true);
  });

  test('supports 3–6 players', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F'];
    const G = createGame(names);
    expect(G.players).toHaveLength(6);
    G.players.forEach((p, i) => expect(p.name).toBe(names[i]));
  });
});
