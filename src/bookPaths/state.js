export function createInitialWizardState(initialContext = {}) {
  return {
    currentNodeId: "start",
    style: null,
    derived: {},
    steps: [],
    context: { ...initialContext },
  };
}

export function applyOption(state, node, option) {
  if (!state || !node || !option) return state;

  const updates = { ...(option.set || {}) };
  const explicitStyle = updates.style || null;
  delete updates.style;

  const resolvedStyle = explicitStyle || state.style || node.style || null;

  return {
    ...state,
    style: resolvedStyle,
    derived: {
      ...state.derived,
      ...updates,
    },
    currentNodeId: option.next || state.currentNodeId,
    steps: [
      ...state.steps,
      {
        nodeId: node.id,
        title: node.title,
        choiceLabel: option.label,
      },
    ],
  };
}

export function buildSummary(state) {
  if (!state) {
    return {
      style: null,
      steps: [],
      derived: {},
    };
  }

  return {
    style: state.style,
    steps: state.steps.map((step) => ({
      nodeId: step.nodeId,
      title: step.title,
      choiceLabel: step.choiceLabel,
    })),
    derived: { ...state.derived },
  };
}

export function replayState(decisions, flow, initialContext = {}) {
  let replayed = createInitialWizardState(initialContext);

  for (const decision of decisions) {
    const node = flow[replayed.currentNodeId];
    if (!node || !Array.isArray(node.options)) break;

    const option = node.options.find(
      (candidate) =>
        candidate.label === decision.choiceLabel &&
        decision.nodeId === node.id
    );

    if (!option) break;
    replayed = applyOption(replayed, node, option);
  }

  return replayed;
}
