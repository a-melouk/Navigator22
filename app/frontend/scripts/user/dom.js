populateWithAllStations()
/* let getroute = document.getElementById('getroute')


getroute.addEventListener('click', () => {
  clearMap(true)
  const from = JSON.parse(fromElement.value)._id
  const to = JSON.parse(toElement.value)._id
  getRoute(from, to).then(route => {
    route.path.forEach(segment => {
      addStationToMap(segment.from, 'draw', segment.from.line)
      addStationToMap(segment.to, 'draw', segment.to.line)
      if (segment.mean === 'tramway') addPolylineToMap(segment.segment, '#f47e1b', 'draw')
      else if (segment.mean === 'walk') addPolylineToMap(segment.segment, '#1d691f', 'draw')
      else addPolylineToMap(segment.segment, '#3338d2', 'draw')
    })
    drawsLayer.addTo(map)
    map.fitBounds(drawsLayer.getBounds())
  })
})
 */
