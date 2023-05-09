const Edge = (from, to, weight, label) => {
  let edge = {
    from: from,
    to: to,
    weight: weight,
  }
  if (label) edge.label = label
  return edge
}

function otherNodes(allNodes, visited, reached) {
  let merge = [...visited, ...reached]
  return allNodes.filter(x => !merge.includes(x))
}

function outEdgesTos(edges, node) {
  let result = []
  edges.forEach(edge => {
    if (edge.from === node) if (!result.includes(edge.to)) result.push(edge.to)
  })
  return result
}

function indexOfEdge(edges, edge) {
  for (let i = 0; i < edges.length; i++) if (edges[i].from === edge.from && edges[i].to === edge.to) return i
  return -1
}

class Graph {
  constructor(directed) {
    this.nodes = []
    this.edges = []
    this.directed = directed
  }

  setEdge(edge) {
    if (!this.nodes.includes(edge.from)) this.nodes.push(edge.from)
    if (!this.nodes.includes(edge.to)) this.nodes.push(edge.to)
    this.edges.push(edge)
    if (!this.directed) this.edges.push(Edge(edge.to, edge.from, edge.weight, edge.label))
  }

  neighbours(node) {
    let result = []
    this.edges.forEach(edge => {
      if (edge.from === node || edge.to === node) result.push(edge)
    })
    return result
  }

  outEdges(node) {
    let result = []
    this.neighbours(node).forEach(neighbour => {
      if (neighbour.from === node) result.push(neighbour)
    })
    return result
  }

  inEdges(node) {
    let result = []
    this.neighbours(node).forEach(neighbour => {
      if (neighbour.to === node) result.push(neighbour)
    })
    return result
  }

  getEdge(from, to) {
    return graph.edges.filter(edge => edge.from === from && edge.to === to)
  }
}

function compareEdge(edge1, edge2) {
  if (edge1.weight <= edge2.weight) return edge1
  else return edge2
}

function filterOutedgesDuplicates(outedges) {
  let result = []
  for (let j = 0; j < outedges.length; j++) {
    let b = outedges[j]
    let index = indexOfEdge(result, b)
    if (index === -1) result.push(b)
    else result[index] = compareEdge(result[index], b)
  }
  return result
}

function minimalNode(solution, reached) {
  let result = { cost: Number.POSITIVE_INFINITY }
  for (let i = 0; i < solution.length; i++) {
    for (let j = 0; j < reached.length; j++) {
      if (solution[i].to === reached[j]) {
        if (result.cost > solution[i].cost) result = solution[i]
      }
    }
  }
  return result
}

function dijikstra(graph, source, target) {
  //init
  let outEdges = filterOutedgesDuplicates(graph.outEdges(source))
  let result = []
  let visited = [source]
  let reached = outEdgesTos(outEdges, source)
  let others = otherNodes(graph.nodes, visited, reached)

  outEdges.forEach(item => {
    let path = { from: source, to: item.to, weight: item.weight }
    if (item.label) path.label = item.label
    result.push({
      from: source,
      to: item.to,
      cost: item.weight,
      path: [JSON.stringify(path)],
    })
  })

  others.forEach(item => {
    result.push({
      from: source,
      to: item,
      cost: Number.POSITIVE_INFINITY,
      path: [],
    })
  })
  // Init step is over
  let nodesWithoutSource = graph.nodes.filter(x => x !== source)
  for (let k = 0; k < nodesWithoutSource.length; k++) {
    let minEdgeFromVisited = minimalNode(result, reached)
    visited.push(minEdgeFromVisited.to)
    if (visited.includes(target)) break
    outEdges = graph.outEdges(minEdgeFromVisited.to)

    for (let i = 0; i < outEdges.length; i++) if (!reached.includes(outEdges[i].to)) reached.push(outEdges[i].to)
    reached = reached.filter(x => !visited.includes(x))
    others = others.filter(x => !reached.includes(x))

    for (let i = 0; i < outEdges.length; i++)
      for (let j = 0; j < result.length; j++)
        if (outEdges[i].to === result[j].to) {
          let originalCost = result[j].cost
          let candidateEdge = outEdges[i]
          let newCost = minEdgeFromVisited.cost + candidateEdge.weight
          if (newCost < originalCost) {
            result[j] = {
              from: source,
              to: candidateEdge.to,
              cost: newCost,
              path: [...minEdgeFromVisited.path, JSON.stringify(candidateEdge)],
            }
          }
        }
  }

  return result
}

module.exports = {
  Edge,
  Graph,
  dijikstra,
}
