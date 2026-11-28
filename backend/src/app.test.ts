import { after, test } from 'node:test'
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import app from './app'

// Runs the real app on a different separate port while the test execute


// explantion/notes for fututre me :)
// Start the real app on a random free port (0) so the tests send real HTTP
// requests without clashing with a server already running on 8080. 
const server = app.listen(0);
const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

after(() => {
    server.close();
    server.closeAllConnections();
});

async function postWithoutToken(body: string) {
    const response = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
    });
    const json = (await response.json()) as { error: { code: string } };
    return { status: response.status, code: json.error.code };
}

test('no token and a broken JSON body gets 401, not 400', async () => {
    const result = await postWithoutToken('{this is not json}');
    assert.deepEqual(result, { status: 401, code: 'UNAUTHENTICATED' });
});

test('no token and a body over 1MB gets 401, not 413', async () => {
    const result = await postWithoutToken(JSON.stringify({ name: 'x'.repeat(2 * 1024 * 1024) }));
    assert.deepEqual(result, { status: 401, code: 'UNAUTHENTICATED' });

});

// Review note: Keep this test last. It uses up the rate limit for the rest of this file.
test('repeated project requests without a token eventually get 429', async () => {
    let status = 0;
    let code = '';
    for (let i = 0; i < 200 && status !== 429; i++) {
        const response = await fetch(`${baseUrl}/api/projects`, { method: 'POST' });
        status = response.status;
        code = ((await response.json()) as { error: { code: string } }).error.code;
    }
    assert.equal(status, 429);
    assert.equal(code, 'RATE_LIMITED');
});