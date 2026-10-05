/* global require */

const { assert, click, createHarness, runScenario } = require('./harness');

function functoid(id, name, x, inputLinks = [], outputLinks = [], parameters = []) {
  return {
    id,
    functoidId: 107,
    category: 'String',
    name,
    x,
    y: 120,
    inputLinks,
    outputLinks,
    parameters,
  };
}

function link(id, sourceId, targetId) {
  return {
    id,
    sourceId,
    targetId,
    sourceType: 'functoid',
    targetType: 'functoid',
  };
}

runScenario('Circular functoid graphs are rejected and diagnosed', async () => {
  const forwardLink = link('a-b', 'a', 'b');
  const map = {
    name: 'Cycle smoke map',
    sourceSchema: { location: 'source.xsd' },
    targetSchema: { location: 'target.xsd' },
    pages: [
      {
        id: 'page1',
        name: 'Page 1',
        links: [forwardLink],
        functoids: [
          functoid('a', 'String Concatenate A', 120, [], ['a-b']),
          functoid('b', 'String Concatenate B', 260, ['a-b'], [], [{ index: 0, type: 'link', value: 'a-b' }]),
        ],
      },
    ],
  };
  const harness = await createHarness({ map });
  try {
    const { document, dom } = harness;
    await harness.waitFor(
      () =>
        !!document.querySelector('.functoid-node[data-id="a"] .input-connector') &&
        !!document.querySelector('.functoid-node[data-id="b"] .output-connector')
    );
    const outputB = document.querySelector('.functoid-node[data-id="b"] .output-connector');
    const inputA = document.querySelector('.functoid-node[data-id="a"] .input-connector');

    click(harness, outputB);
    click(harness, inputA);

    await harness.waitFor(() => document.querySelector('biztalk-mapper-notification')?.textContent.includes('circular functoid graph'));
    assert.equal(map.pages[0].links.length, 1);
    assert.ok(document.querySelector('biztalk-mapper-notification')?.textContent.includes('String Concatenate A'));

    const reverseLink = link('b-a', 'b', 'a');
    const cyclicMap = {
      ...map,
      pages: [
        {
          ...map.pages[0],
          links: [forwardLink, reverseLink],
          functoids: [
            functoid('a', 'String Concatenate A', 120, ['b-a'], ['a-b'], [{ index: 0, type: 'link', value: 'b-a' }]),
            functoid('b', 'String Concatenate B', 260, ['a-b'], ['b-a'], [{ index: 0, type: 'link', value: 'a-b' }]),
          ],
        },
      ],
    };
    dom.window.dispatchEvent(
      new dom.window.MessageEvent('message', {
        data: {
          type: 'init',
          data: {
            map: cyclicMap,
            sourceSchema: null,
            targetSchema: null,
            functoids: [],
          },
        },
      })
    );

    await harness.waitFor(() =>
      document.querySelector('biztalk-mapper-notification')?.textContent.includes('Loaded map contains 1 circular')
    );
    assert.deepEqual(harness.browserErrors, []);
  } finally {
    harness.close();
  }
});
