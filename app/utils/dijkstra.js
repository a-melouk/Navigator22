class Graph {
  constructor() {
    this.nodes = new Set()
    this.edges = new Map()
  }

  addNode(node) {
    this.nodes.add(node)
    if (!this.edges.has(node)) {
      this.edges.set(node, [])
    }
  }

  addEdge(from, to, weight, label) {
    this.edges.get(from).push({ to, weight, label })
  }

  outEdges(node) {
    return this.edges.get(node) || []
  }

  getEdge(from, to) {
    return this.edges.get(from).find(edge => edge.to === to)
  }
}

function dijkstra(graph, source, target) {
  const distances = {}
  const previous = {}
  const queue = new PriorityQueue()

  for (let node of graph.nodes) {
    distances[node] = node === source ? 0 : Infinity
    previous[node] = null
  }

  queue.enqueue(source, 0)

  while (!queue.isEmpty()) {
    const current = queue.dequeue()

    if (current === target) {
      break
    }

    const neighbors = graph.outEdges(current)
    for (let { to, weight, label } of neighbors) {
      const distance = distances[current] + weight
      if (distance < distances[to]) {
        distances[to] = distance
        previous[to] = current
        queue.enqueue(to, distance)
      }
    }
  }

  // Reconstruct path
  const path = []
  let current = target
  while (current !== null) {
    const prev = previous[current]
    if (prev !== null) {
      const edge = graph.getEdge(prev, current)
      path.unshift({
        from: prev,
        to: current,
        weight: edge.weight,
        label: edge.label,
      })
    }
    current = prev
  }

  return {
    cost: distances[target],
    path: path,
  }
}

// Priority Queue implementation
class PriorityQueue {
  constructor() {
    this.elements = []
  }

  enqueue(element, priority) {
    this.elements.push({ element, priority })
    this.elements.sort((a, b) => a.priority - b.priority)
  }

  dequeue() {
    return this.elements.shift().element
  }

  isEmpty() {
    return this.elements.length === 0
  }
}

module.exports = { dijkstra, Graph, PriorityQueue }
