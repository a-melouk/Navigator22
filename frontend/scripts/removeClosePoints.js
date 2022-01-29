function cleanPath(line) {
  let base = 'http://localhost:4000/lines?name=' + line
  let temp
  let finalResult
  fetch(base)
    .then((data) => data.json())
    .catch((err) => console.log(err))
    .then((data) => {
      temp = data[0].route
    })
    .then(() => {
      temp.forEach((item) => {
        let toUpdate = false
        // console.log(item)
        let id = item._id
        let from = item.from
        let to = item.to
        if (removeClosePoints(item.path).length < item.path) {
          toUpdate = true
          item.path = [...removeClosePoints]
        }
        if (toUpdate) {
          finalResult = {
            from: from,
            to: to,
            path: item.path,
            _id: id,
          }
          patchSegment(id, finalResult).then(() => console.log('Removed tight points'))
        }
      })
    })
}
