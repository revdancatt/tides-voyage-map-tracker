const fs = require('fs')
const path = require('path')

exports.index = async (req, res) => {
  // Check to see if the imgs directory exists in the public directory
  // If it doesn't, create it
  const imgsDir = path.join(__dirname, '..', '..', 'public', 'imgs')
  if (!fs.existsSync(imgsDir)) fs.mkdirSync(imgsDir)
  // Check to see if a map.png file exists in the imgs directory, if not we need to use canvas to create one
  const mapPath = path.join(imgsDir, 'map.png')
  const { createCanvas, loadImage } = require('canvas')

  console.log(req.body)

  if (!fs.existsSync(mapPath) || (req.body.action && req.body.action === 'new')) {
    const canvas = createCanvas(4800, 4800)
    const ctx = canvas.getContext('2d')
    // Set the origin to the center of the canvas
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    // Fill the background
    ctx.fillStyle = '#fbebd7'
    ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
    // the grid every 100 pixels
    ctx.strokeStyle = '#f7cfa0'
    ctx.lineWidth = 2
    for (let i = -canvas.width / 2; i <= canvas.width / 2; i += 100) {
      ctx.beginPath()
      ctx.moveTo(i, -canvas.height / 2)
      ctx.lineTo(i, canvas.height / 2)
      ctx.moveTo(-canvas.width / 2, i)
      ctx.lineTo(canvas.width / 2, i)
      ctx.stroke()
    }
    // Now do thicker lines every 200 pixels
    ctx.lineWidth = 6
    for (let i = -canvas.width / 2; i <= canvas.width / 2; i += 200) {
      ctx.beginPath()
      ctx.moveTo(i, -canvas.height / 2)
      ctx.lineTo(i, canvas.height / 2)
      ctx.moveTo(-canvas.width / 2, i)
      ctx.lineTo(canvas.width / 2, i)
      ctx.stroke()
    }
    // Finally draw the middle lines
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(0, -canvas.height / 2)
    ctx.lineTo(0, canvas.height / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-canvas.width / 2, 0)
    ctx.lineTo(canvas.width / 2, 0)
    ctx.stroke()
    // Restore the origin
    ctx.restore()
    // Now save the image
    const out = fs.createWriteStream(mapPath)
    const stream = canvas.pngStream()
    // Now we need to save it in an async way
    await new Promise((resolve, reject) => {
      stream.on('data', chunk => out.write(chunk))
      stream.on('end', resolve)
      stream.on('error', reject)
    })
  }

  // If we have an action then we need to draw on the map
  if (req.body.action) {
    // First check we have a coords value in the format x,y, and than the x and y are numbers in the rande -4800 to 4800
    const coords = req.body.coords.split(',')
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]) && coords[0] >= -4800 && coords[0] <= 4800 && coords[1] >= -4800 && coords[1] <= 4800) {
      // Load the map image
      const canvas = createCanvas(4800, 4800)
      const ctx = canvas.getContext('2d')
      const map = await loadImage(mapPath)
      // Draw the map on the canvas
      ctx.drawImage(map, 0, 0)
      // Now set the origin to the center of the canvas
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      // Grab the coords from the request
      const x = parseInt(coords[0], 10) / 2
      const y = parseInt(coords[1], 10) / 2 * -1
      // Then draw on the part of the map that isn't
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
      if (req.body.action === 'north') {
        // Fill in everything south of the coords
        ctx.fillRect(-canvas.width / 2, y, canvas.width, canvas.height)
      }
      if (req.body.action === 'south') {
        // Fill in everything north of the coords
        ctx.fillRect(-canvas.width / 2, y, canvas.width, -canvas.height)
      }
      if (req.body.action === 'east') {
        // Fill in everything west of the coords
        ctx.fillRect(x, -canvas.height / 2, -canvas.width, canvas.height)
      }
      if (req.body.action === 'west') {
        // Fill in everything east of the coords
        ctx.fillRect(x, -canvas.height / 2, canvas.width, canvas.height)
      }
      if (req.body.action === '>2000') {
        // Draw a circle with a radius of 1000 pixels
        ctx.beginPath()
        ctx.arc(x, y, 1000, 0, 2 * Math.PI)
        ctx.fill()
      }
      if (req.body.action === '<2000') {
        // We need to draw outside the cirle, so, copy the whole canvas to a temp canvas
        const tempCanvas = createCanvas(4800, 4800)
        const tempCtx = tempCanvas.getContext('2d')
        tempCtx.drawImage(canvas, 0, 0)
        // Now fill in the whole canvas
        ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
        // Now draw the circle
        ctx.beginPath()
        ctx.arc(x, y, 1000, 0, 2 * Math.PI)
        ctx.clip()
        // Now draw the temp canvas back on
        ctx.drawImage(tempCanvas, -canvas.width / 2, -canvas.height / 2)
      }

      if (req.body.action === '<500') {
        // We need to draw outside the cirle, so, copy the whole canvas to a temp canvas
        const tempCanvas = createCanvas(4800, 4800)
        const tempCtx = tempCanvas.getContext('2d')
        tempCtx.drawImage(canvas, 0, 0)
        // Now fill in the whole canvas
        ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
        // Now draw the circle
        ctx.beginPath()
        ctx.arc(x, y, 250, 0, 2 * Math.PI)
        ctx.clip()
        // Now draw the temp canvas back on
        ctx.drawImage(tempCanvas, -canvas.width / 2, -canvas.height / 2)
      }

      // Restore the origin
      ctx.restore()
      // Now save the image
      const out = fs.createWriteStream(mapPath)
      const stream = canvas.pngStream()
      // Now we need to save it in an async way
      await new Promise((resolve, reject) => {
        stream.on('data', chunk => out.write(chunk))
        stream.on('end', resolve)
        stream.on('error', reject)
      })
    }
    // Redirect to the main page
    return res.redirect('/')
  }
  return res.render('main/index', req.templateValues)
}
