import express from 'express';
import { __dirname } from './utils.js';
import { errorHandler } from './middlewares/errorHandler.js';
import handlebars from 'express-handlebars';
import { Server } from 'socket.io';
import viewsRouter from './routes/views.router.js';
import MessageManager from './managers/messages.manager.js';

const messageManager = new MessageManager(`${__dirname}/db/messages.json`)

// console.log(process.cwd());

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(__dirname + '/public'));

app.engine('handlebars', handlebars.engine()); 
app.set('view engine', 'handlebars');  
app.set('views', __dirname+'/views');  

app.use('/chat', viewsRouter);

app.use(errorHandler);

const httpServer = app.listen(8080, ()=>{
    console.log('🚀 Server listening on port 8080');
});

const socketServer = new Server(httpServer);

socketServer.on('connection', async(socket)=>{

    socketServer.emit('messages', await messageManager.getAll())
    console.log('New connection', socket.id);
    // console.dir('New connection', socket.id);

    socket.on('disconnect',()=>{
        console.log('User disconnet', socket.id)
    });

    socket.on('newUser', (username)=>{
        console.log(`> ${username} ha iniciado sesión`)
        socket.broadcast.emit('newUser', username) // emite a todos menos al que ingresa 
    });

    socket.on('chat:message', async (newMessage)=>{
        await messageManager.createMsg(newMessage);
        socketServer.emit('messages', await messageManager.getAll())
    })

    socket.on('chat:typing', (username)=>{
        socket.broadcast.emit('chat:typing', username)
    })

    
});


