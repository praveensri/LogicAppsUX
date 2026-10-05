import { LinkEndpointType, type MapDocument, type MapFunctoid, type MapPage, ParameterType } from './mapModel';

export interface FunctoidCycle {
  functoidIds: string[];
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values)];
}

function buildFunctoidAdjacency(page: MapPage): Map<string, string[]> {
  const functoidIds = new Set(page.functoids.map((functoid) => functoid.id));
  const adjacency = new Map<string, string[]>(page.functoids.map((functoid) => [functoid.id, []]));
  for (const link of page.links) {
    if (
      link.sourceType === LinkEndpointType.Functoid &&
      link.targetType === LinkEndpointType.Functoid &&
      functoidIds.has(link.sourceId) &&
      functoidIds.has(link.targetId)
    ) {
      adjacency.get(link.sourceId)?.push(link.targetId);
    }
  }
  return adjacency;
}

function findPath(
  adjacency: Map<string, string[]>,
  startId: string,
  targetId: string,
  allowed?: ReadonlySet<string>
): string[] | undefined {
  const visited = new Set<string>();
  const visit = (currentId: string): string[] | undefined => {
    if (currentId === targetId) {
      return [currentId];
    }
    visited.add(currentId);
    for (const nextId of adjacency.get(currentId) || []) {
      if ((allowed && !allowed.has(nextId)) || visited.has(nextId)) {
        continue;
      }
      const path = visit(nextId);
      if (path) {
        return [currentId, ...path];
      }
    }
    return undefined;
  };
  return !allowed || allowed.has(startId) ? visit(startId) : undefined;
}

export function findFunctoidCycleForNewLink(page: MapPage, sourceId: string, targetId: string): FunctoidCycle | undefined {
  if (sourceId === targetId) {
    return { functoidIds: [sourceId, sourceId] };
  }
  const pathToSource = findPath(buildFunctoidAdjacency(page), targetId, sourceId);
  return pathToSource ? { functoidIds: [sourceId, ...pathToSource] } : undefined;
}

export function findFunctoidCycles(page: MapPage): FunctoidCycle[] {
  const adjacency = buildFunctoidAdjacency(page);
  const indexes = new Map<string, number>();
  const lowLinks = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const components: string[][] = [];
  let nextIndex = 0;

  const connect = (functoidId: string): void => {
    indexes.set(functoidId, nextIndex);
    lowLinks.set(functoidId, nextIndex);
    nextIndex++;
    stack.push(functoidId);
    onStack.add(functoidId);

    for (const targetId of adjacency.get(functoidId) || []) {
      if (!indexes.has(targetId)) {
        connect(targetId);
        lowLinks.set(functoidId, Math.min(lowLinks.get(functoidId)!, lowLinks.get(targetId)!));
      } else if (onStack.has(targetId)) {
        lowLinks.set(functoidId, Math.min(lowLinks.get(functoidId)!, indexes.get(targetId)!));
      }
    }

    if (lowLinks.get(functoidId) === indexes.get(functoidId)) {
      const component: string[] = [];
      let member: string | undefined;
      do {
        member = stack.pop();
        if (member) {
          onStack.delete(member);
          component.push(member);
        }
      } while (member && member !== functoidId);
      components.push(component);
    }
  };

  for (const functoid of page.functoids) {
    if (!indexes.has(functoid.id)) {
      connect(functoid.id);
    }
  }

  return components.flatMap((component) => {
    if (component.length === 1) {
      const functoidId = component[0];
      return adjacency.get(functoidId)?.includes(functoidId) ? [{ functoidIds: [functoidId, functoidId] }] : [];
    }

    const componentIds = new Set(component);
    const startId = [...component].sort()[0];
    for (const nextId of adjacency.get(startId) || []) {
      if (!componentIds.has(nextId)) {
        continue;
      }
      const pathToStart = findPath(adjacency, nextId, startId, componentIds);
      if (pathToStart) {
        return [{ functoidIds: [startId, ...pathToStart] }];
      }
    }
    return [];
  });
}

export function formatFunctoidCycle(page: MapPage, cycle: FunctoidCycle): string {
  const names = new Map(page.functoids.map((functoid) => [functoid.id, functoid.name]));
  return cycle.functoidIds.map((id) => `${names.get(id) || 'Functoid'} (${id})`).join(' -> ');
}

export function reconcilePageFunctoidLinks(page: MapPage): void {
  for (const functoid of page.functoids) {
    const incomingLinks = page.links.filter((link) => link.targetType === LinkEndpointType.Functoid && link.targetId === functoid.id);
    const outgoingLinks = page.links.filter((link) => link.sourceType === LinkEndpointType.Functoid && link.sourceId === functoid.id);
    const incomingLinkIds = new Set(incomingLinks.map((link) => link.id));
    const previouslyConnectedLinkIds = new Set(functoid.inputLinks || []);
    const orderedIncomingLinkIds = uniqueValues([
      ...(functoid.parameters || [])
        .filter((parameter) => parameter.type === ParameterType.Link)
        .sort((left, right) => left.index - right.index)
        .map((parameter) => String(parameter.value)),
      ...(functoid.inputLinks || []),
      ...incomingLinks.map((link) => link.id),
    ]).filter((linkId) => incomingLinkIds.has(linkId));

    const usedLinkIds = new Set<string>();
    const seenLinkParameterIds = new Set<string>();
    const inputParameters = (functoid.parameters || [])
      .filter((parameter) => parameter.type === ParameterType.Link || parameter.type === ParameterType.Constant)
      .sort((left, right) => left.index - right.index)
      .filter((parameter) => {
        if (parameter.type === ParameterType.Constant) {
          return true;
        }
        const linkId = String(parameter.value);
        if (seenLinkParameterIds.has(linkId)) {
          return false;
        }
        seenLinkParameterIds.add(linkId);
        if (incomingLinkIds.has(linkId)) {
          usedLinkIds.add(linkId);
          return true;
        }
        return !previouslyConnectedLinkIds.has(linkId);
      });

    for (const linkId of orderedIncomingLinkIds) {
      if (!usedLinkIds.has(linkId)) {
        inputParameters.push({
          index: inputParameters.length,
          type: ParameterType.Link,
          value: linkId,
        });
        usedLinkIds.add(linkId);
      }
    }

    const nonInputParameters = (functoid.parameters || []).filter(
      (parameter) => parameter.type !== ParameterType.Link && parameter.type !== ParameterType.Constant
    );
    functoid.parameters = [...inputParameters.map((parameter, index) => ({ ...parameter, index })), ...nonInputParameters];
    functoid.inputLinks = inputParameters
      .filter((parameter) => parameter.type === ParameterType.Link && incomingLinkIds.has(String(parameter.value)))
      .map((parameter) => String(parameter.value));
    functoid.outputLinks = outgoingLinks.map((link) => link.id);
  }
}

export function reconcileMapFunctoidLinks(map: MapDocument): void {
  for (const page of map.pages) {
    reconcilePageFunctoidLinks(page);
  }
}

export function getConfiguredFunctoidInputCount(page: MapPage, functoid: MapFunctoid): number {
  const incomingLinkCount = page.links.filter(
    (link) => link.targetType === LinkEndpointType.Functoid && link.targetId === functoid.id
  ).length;
  const constantCount = functoid.parameters.filter((parameter) => parameter.type === ParameterType.Constant).length;
  return incomingLinkCount + constantCount;
}
