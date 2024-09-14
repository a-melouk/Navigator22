function checkDoubleWalk(solution) {
  for (let i = 0; i < solution.path.length - 1; i++) {
    let a = JSON.parse(solution.path[i])
    let b = JSON.parse(solution.path[i + 1])
    if (a.label.mean === 'walk' && b.label.mean === 'walk') return true
  }
  return false
}

function removeSuccessiveWalk(solution) {
  while (checkDoubleWalk(solution)) {
    let result = []
    for (let i = 0; i < solution.path.length - 1; i++) {
      let a = JSON.parse(solution.path[i])
      let b = JSON.parse(solution.path[i + 1])
      if (a.label.mean === 'walk' && b.label.mean === 'walk') {
        a.label.path.pop()
        let newSegment = {
          from: a.from,
          to: b.to,
          weight: a.weight + b.weight,
          label: {
            from: a.label.from,
            to: b.label.to,
            path: [...a.label.path, ...b.label.path],
            mean: 'walk',
            distance: a.label.distance + b.label.distance,
          },
        }
        result.push(JSON.stringify(newSegment), ...solution.path.slice(i + 2))
      }
      solution.path = result
    }
  }
  return solution
}

function distance(latitude1, longitude1, latitude2, longitude2) {
  const R = 6371000
  let rad = Math.PI / 180,
    lat1 = latitude1 * rad,
    lat2 = latitude2 * rad,
    sinDLat = Math.sin(((latitude2 - latitude1) * rad) / 2),
    sinDLon = Math.sin(((longitude2 - longitude1) * rad) / 2),
    a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function removeClosePointsBack(path) {
  let initLength = path.length
  for (let i = 0; i < path.length - 2; i++) if (distance(path[i].latitude, path[i].longitude, path[i + 1].latitude, path[i + 1].longitude) < 4.5) path.splice(i + 1, 1)

  if (distance(path[path.length - 2].latitude, path[path.length - 2].longitude, path[path.length - 1].latitude, path[path.length - 1].longitude) < 4.5) path.splice(path.length - 2, 1)

  if (initLength > path.length) console.log('Removed close points')
  return path
}

function calculateDistanceSegment(path) {
  let result = 0
  for (let i = 0; i < path.length - 1; i++) result += distance(path[i].latitude, path[i].longitude, path[i + 1].latitude, path[i + 1].longitude)
  return result
}

function precise(number) {
  return Number(Number.parseFloat(number).toFixed(5))
}

function transform(array) {
  let result = []
  array.forEach(item => {
    let point = {
      latitude: precise(item[1]),
      longitude: precise(item[0]),
    }
    result.push(point)
  })
  return result
}

module.exports = { removeSuccessiveWalk, removeClosePointsBack, calculateDistanceSegment, transform }
