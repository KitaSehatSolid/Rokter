require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const path = require('path')
const cors = require('cors')
const { performQuestion } = require('./intelligence')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(cors())
app.use('/public', express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'))
})

io.on('connection', async socket => {
    socket.on('join', async () => {
        console.log(`>> [CID: ${socket.id}] joined`)
        // clients.push({id: socket.id, state: 'MAIN'})
        socket.join(socket.id)
    })
    socket.on('disconnect', async () => {
        console.log(`>> [CID: ${socket.id}] disconnected`)
        // clients.filter(c => c.id !== socket.id)
    })
    socket.on('message', async (msg) => {
        console.log(`>> [CID: ${socket.id}]: ${msg}`)
        // if ()
        // io.sockets.in(socket.id).emit('message', {msg: 'Untuk memulai percakapan harap sapa Rokter terlebih dahulu. Seperti hai atau halo'})
        io.sockets.in(socket.id).emit('processing', null)
        const res = await performQuestion(msg)
        io.sockets.in(socket.id).emit('message', res)
    })
})

server.listen(process.env.PORT, () => {
    console.log(`>> Listening on port ${process.env.PORT}`)
})
