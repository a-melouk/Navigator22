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
        for (let i = 0; i < item.path.length - 2; i++) {
          let distance = map.distance([item.path[i].latitude, item.path[i].longitude], [item.path[i + 1].latitude, item.path[i + 1].longitude])
          if (distance <= 4.6) {
            toUpdate = true
            item.path.splice(i + 1, 1)
          }
        }
        let distance = map.distance(
          [item.path[item.path.length - 2].latitude, item.path[item.path.length - 2].longitude],
          [item.path[item.path.length - 1].latitude, item.path[item.path.length - 1].longitude]
        )
        if (distance <= 4.6) {
          toUpdate = true
          item.path.splice(item.path.length - 2, 1)
        }
        if (toUpdate) {
          finalResult = {
            from: from,
            to: to,
            path: item.path,
            _id: id,
          }
          fetch('http://localhost:4000/segment?id=' + id, {
            method: 'PATCH',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(finalResult),
          })
            .then((data) => data.json())
            .catch((err) => console.log(err))
        }
      })
    })
}
