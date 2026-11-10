// Oxlint plugin `pbp`: SonarSource Cognitive Complexity v1.7, derived from fleet's
// pedro-best-practices oxlint-plugin/pbp.mjs at ee9727e; scores pinned by ../complexity/pbp.test.ts.

const FUNCTIONS = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);
const LOOPS = new Set(["ForStatement", "ForInStatement", "ForOfStatement", "WhileStatement", "DoWhileStatement"]);
const SKIPPED_KEYS = new Set(["parent", "loc", "range", "start", "end", "type", "leadingComments", "trailingComments"]);

function identifierName(node) {
  return node.type === "Identifier" ? node.name : "<anonymous>";
}

function bindingName(parent) {
  switch (parent?.type) {
    case "VariableDeclarator": return identifierName(parent.id);
    case "AssignmentExpression": return identifierName(parent.left);
    case "Property":
    case "MethodDefinition":
    case "PropertyDefinition":
      if (!parent.computed) return parent.key.name ?? String(parent.key.value ?? "<anonymous>");
      return "<anonymous>";
    default: return "<anonymous>";
  }
}

function functionName(node) {
  if (node.id?.name) return node.id.name;
  return bindingName(node.parent);
}

// Call forms that count as recursion for this function. A bare name inside a
// method or object property refers to an outer binding, so those recurse only
// through `this.`.
function ownCallForms(node) {
  const name = functionName(node);
  if (name === "<anonymous>") return new Set();
  if (["MethodDefinition", "PropertyDefinition", "Property"].includes(node.parent?.type)) {
    return new Set([`this.${name}`]);
  }
  return new Set([name]);
}

function callForm(callee) {
  if (callee.type === "Identifier") return callee.name;
  if (callee.type === "MemberExpression" && !callee.computed && callee.object.type === "ThisExpression") {
    return `this.${callee.property.name}`;
  }
  return null;
}

function* childNodes(value) {
  const values = Array.isArray(value) ? value : [value];
  for (const item of values) {
    if (item && typeof item.type === "string") yield item;
  }
}

function* children(node) {
  for (const key of Object.keys(node)) {
    if (!SKIPPED_KEYS.has(key)) yield* childNodes(node[key]);
  }
}

// Operators of a logical chain in source order; `??` and non-logical nodes end it.
function chainOperators(node, seen, operators = []) {
  if (node?.type !== "LogicalExpression" || node.operator === "??") return operators;
  seen.add(node);
  chainOperators(node.left, seen, operators);
  operators.push(node.operator);
  chainOperators(node.right, seen, operators);
  return operators;
}

function runs(operators) {
  return operators.filter((operator, index) => operator !== operators[index - 1]).length;
}

class ComplexityScore {
  total = 0;
  seenChains = new WeakSet();
  frames = [];

  constructor(root) {
    this.root = root;
    this.walk(root, 0);
  }

  walkChildren(node, nesting) {
    for (const child of children(node)) this.walk(child, nesting);
  }

  visitFunction(node, nesting) {
    this.frames.push({ forms: ownCallForms(node), counted: false });
    this.walkChildren(node, node === this.root ? nesting : nesting + 1);
    this.frames.pop();
  }

  visitConditional(node, nesting) {
    this.total += 1 + nesting;
    this.walk(node.test, nesting);
    this.walk(node.consequent, nesting + 1);
    this.walk(node.alternate, nesting + 1);
  }

  visitLoop(node, nesting) {
    this.total += 1 + nesting;
    for (const child of children(node)) {
      this.walk(child, child === node.body ? nesting + 1 : nesting);
    }
  }

  visitSwitch(node, nesting) {
    this.total += 1 + nesting;
    this.walk(node.discriminant, nesting);
    for (const branch of node.cases) this.walkChildren(branch, nesting + 1);
  }

  visitCatch(node, nesting) {
    this.total += 1 + nesting;
    this.walk(node.param, nesting);
    this.walk(node.body, nesting + 1);
  }

  countLogicalChain(node) {
    if (node.operator === "??" || this.seenChains.has(node)) return;
    this.total += runs(chainOperators(node, this.seenChains));
  }

  countRecursion(node) {
    const frame = this.frames[this.frames.length - 1];
    const form = callForm(node.callee);
    if (frame && !frame.counted && form && frame.forms.has(form)) {
      frame.counted = true;
      this.total += 1;
    }
  }

  countJump(node) {
    if (node.label) this.total += 1;
  }

  walk(node, nesting) {
    if (!node) return;
    if (FUNCTIONS.has(node.type)) return this.visitFunction(node, nesting);
    if (LOOPS.has(node.type)) return this.visitLoop(node, nesting);
    switch (node.type) {
      case "IfStatement": return this.visitIf(node, nesting);
      case "ConditionalExpression": return this.visitConditional(node, nesting);
      case "SwitchStatement": return this.visitSwitch(node, nesting);
      case "CatchClause": return this.visitCatch(node, nesting);
      case "LogicalExpression": this.countLogicalChain(node); break;
      case "BreakStatement":
      case "ContinueStatement": this.countJump(node); break;
      case "CallExpression":
      case "NewExpression": this.countRecursion(node); break;
      default: break;
    }
    this.walkChildren(node, nesting);
  }

  visitIf(node, nesting) {
    this.total += 1 + nesting;
    this.walkIfBranches(node, nesting);
  }

  visitElseIf(node, nesting) {
    this.total += 1;
    this.walkIfBranches(node, nesting);
  }

  walkIfBranches(node, nesting) {
    this.walk(node.test, nesting);
    this.walk(node.consequent, nesting + 1);
    if (node.alternate?.type === "IfStatement") return this.visitElseIf(node.alternate, nesting);
    if (node.alternate) {
      this.total += 1;
      this.walk(node.alternate, nesting + 1);
    }
  }
}

function score(root) {
  return new ComplexityScore(root).total;
}

function enclosedByFunction(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (FUNCTIONS.has(parent.type)) return true;
  }
  return false;
}

const cognitiveComplexity = {
  meta: {
    type: "suggestion",
    docs: { description: "Cognitive Complexity of each top-level function, nested functions included." },
    schema: [{ type: "object", properties: { max: { type: "integer", minimum: 0 } }, additionalProperties: false }],
  },
  create(context) {
    const max = context.options[0]?.max ?? 15;
    function check(node) {
      if (enclosedByFunction(node)) return;
      const value = score(node);
      if (value > max) {
        context.report({
          node,
          message: `Function \`${functionName(node)}\` has cognitive complexity ${value}, above the limit of ${max}.`,
        });
      }
    }
    return { FunctionDeclaration: check, FunctionExpression: check, ArrowFunctionExpression: check };
  },
};

export default { meta: { name: "pbp" }, rules: { "cognitive-complexity": cognitiveComplexity } };
