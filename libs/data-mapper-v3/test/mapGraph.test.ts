import {
  findFunctoidCycleForNewLink,
  findFunctoidCycles,
  formatFunctoidCycle,
  FunctoidCategory,
  LinkEndpointType,
  type MapPage,
  ParameterType,
  reconcilePageFunctoidLinks,
} from '../src/model';

function createPage(): MapPage {
  return {
    id: 'page1',
    name: 'Page 1',
    links: [
      {
        id: 'input-1',
        sourceId: '/Root/First',
        sourcePath: '/Root/First',
        targetId: 'extract',
        sourceType: LinkEndpointType.SchemaNode,
        targetType: LinkEndpointType.Functoid,
      },
      {
        id: 'input-2',
        sourceId: '/Root/Second',
        sourcePath: '/Root/Second',
        targetId: 'extract',
        sourceType: LinkEndpointType.SchemaNode,
        targetType: LinkEndpointType.Functoid,
      },
      {
        id: 'output',
        sourceId: 'extract',
        targetId: '/Root/Result',
        targetPath: '/Root/Result',
        sourceType: LinkEndpointType.Functoid,
        targetType: LinkEndpointType.SchemaNode,
      },
    ],
    functoids: [
      {
        id: 'extract',
        functoidId: 106,
        category: FunctoidCategory.String,
        name: 'String Extract',
        x: 100,
        y: 100,
        inputLinks: ['input-2'],
        outputLinks: [],
        parameters: [{ index: 0, type: ParameterType.Constant, value: '1' }],
      },
    ],
  };
}

describe('functoid graph reconciliation', () => {
  test('synchronizes ordered input parameters and bidirectional link metadata', () => {
    const page = createPage();

    reconcilePageFunctoidLinks(page);

    expect(page.functoids[0].inputLinks).toEqual(['input-2', 'input-1']);
    expect(page.functoids[0].outputLinks).toEqual(['output']);
    expect(page.functoids[0].parameters).toEqual([
      { index: 0, type: ParameterType.Constant, value: '1' },
      { index: 1, type: ParameterType.Link, value: 'input-2' },
      { index: 2, type: ParameterType.Link, value: 'input-1' },
    ]);
  });

  describe('functoid cycle detection', () => {
    const graphPage = (): MapPage => ({
      id: 'cycles',
      name: 'Cycles',
      functoids: ['a', 'b', 'c', 'd'].map((id) => ({
        id,
        functoidId: 107,
        category: FunctoidCategory.String,
        name: `Functoid ${id.toUpperCase()}`,
        x: 0,
        y: 0,
        inputLinks: [],
        outputLinks: [],
        parameters: [],
      })),
      links: [
        {
          id: 'a-b',
          sourceId: 'a',
          targetId: 'b',
          sourceType: LinkEndpointType.Functoid,
          targetType: LinkEndpointType.Functoid,
        },
        {
          id: 'b-c',
          sourceId: 'b',
          targetId: 'c',
          sourceType: LinkEndpointType.Functoid,
          targetType: LinkEndpointType.Functoid,
        },
      ],
    });

    test('detects whether a proposed direct or indirect link would create a cycle', () => {
      const page = graphPage();

      expect(findFunctoidCycleForNewLink(page, 'c', 'a')?.functoidIds).toEqual(['c', 'a', 'b', 'c']);
      expect(findFunctoidCycleForNewLink(page, 'a', 'a')?.functoidIds).toEqual(['a', 'a']);
      expect(findFunctoidCycleForNewLink(page, 'c', 'd')).toBeUndefined();
    });

    test('finds and formats cycles already present in a loaded map', () => {
      const page = graphPage();
      page.links.push({
        id: 'c-a',
        sourceId: 'c',
        targetId: 'a',
        sourceType: LinkEndpointType.Functoid,
        targetType: LinkEndpointType.Functoid,
      });

      const cycles = findFunctoidCycles(page);

      expect(cycles).toHaveLength(1);
      expect(cycles[0].functoidIds[0]).toBe(cycles[0].functoidIds.at(-1));
      expect(formatFunctoidCycle(page, cycles[0])).toContain('Functoid A (a)');
    });

    test('does not report an acyclic graph', () => {
      expect(findFunctoidCycles(graphPage())).toEqual([]);
    });
  });

  test('removes deleted links from functoid metadata and parameters', () => {
    const page = createPage();
    reconcilePageFunctoidLinks(page);
    page.links = page.links.filter((link) => link.id !== 'input-2' && link.id !== 'output');

    reconcilePageFunctoidLinks(page);

    expect(page.functoids[0].inputLinks).toEqual(['input-1']);
    expect(page.functoids[0].outputLinks).toEqual([]);
    expect(page.functoids[0].parameters).toEqual([
      { index: 0, type: ParameterType.Constant, value: '1' },
      { index: 1, type: ParameterType.Link, value: 'input-1' },
    ]);
  });
});
