import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { ProjectModel, projectRepository } from './projectRepository';

const USER_ID = '11111111-2222-4333-8444-555555555555';
const OTHER_USER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

afterEach(() => mock.restoreAll());

describe('project repository', () => {
  it('stores and retrieves all shape properties and scopes reads to the owner', async () => {
    const blocks = [
      {
        id: 1, type: 'cube' as const, color: '#123abc',
        position: { x: 1, y: -2, z: 3 }, rotation: { x: 0.1, y: 1.5, z: -2 },
        scale: 2, dimensions: { w: 1, h: 3, d: 4 },
      },
      {
        id: 2, type: 'sphere' as const, color: '#fedcba',
        position: { x: 4, y: 5, z: 6 }, scale: 0.5,
      },
    ];
    let stored: InstanceType<typeof ProjectModel>;
    mock.method(ProjectModel, 'create', async (value) => {
      stored = new ProjectModel(value);
      await stored.validate();
      return stored;
    });
    mock.method(ProjectModel, 'find', (query) => ({
      sort: () => ({ exec: async () => query.userId === USER_ID ? [stored] : [] }),
    }));
    mock.method(ProjectModel, 'findOne', (query) => ({
      exec: async () => query.userId === USER_ID && query._id === stored._id.toString() ? stored : null,
    }));

    const created = await projectRepository.create({ userId: USER_ID, projectName: 'Model', difficulty: 'Brick', blocks });
    assert.equal(stored!.userId, USER_ID);
    assert.equal(stored!.sceneData.length, 2);
    assert.deepEqual(stored!.sceneData[0].toObject(), {
      shapeId: '1', type: 'cube', colorHex: '#123abc',
      position: blocks[0].position, rotation: blocks[0].rotation,
      scale: 2, dimensions: blocks[0].dimensions,
    });
    assert.deepEqual(await projectRepository.list(USER_ID), [created]);
    assert.deepEqual(await projectRepository.list(OTHER_USER_ID), []);
    assert.equal(await projectRepository.findById(OTHER_USER_ID, created.id), null);
    assert.equal(await projectRepository.findById(USER_ID, 'invalid-id'), null);
    const loaded = await projectRepository.findById(USER_ID, created.id);
    assert.deepEqual(loaded?.design, {
      version: 1,
      blocks: [
        blocks[0],
        { ...blocks[1], rotation: { x: 0, y: 0, z: 0 }, dimensions: { w: 0.5, h: 0.5, d: 0.5 } },
      ],
    });
  });

  it('loads projects saved before scale was stored separately', async () => {
    const stored = new ProjectModel({
      userId: USER_ID, projectName: 'Legacy', difficulty: 'Brick',
      sceneData: [{
        shapeId: '7', type: 'cube', colorHex: '#123456',
        position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 },
        dimensions: { w: 3, h: 3, d: 3 },
      }],
    });
    mock.method(ProjectModel, 'findOne', () => ({ exec: async () => stored }));
    const loaded = await projectRepository.findById(USER_ID, stored._id.toString());
    assert.equal(loaded?.design.blocks[0].scale, 3);
  });
});
