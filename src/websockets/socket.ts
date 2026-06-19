import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, type Socket } from 'socket.io';

let io: SocketIOServer;

export function initSocket(httpServer: HttpServer): SocketIOServer {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: '*',
        },
    });

    io.on('connection', (socket: Socket) => {
        socket.on('join_screen', (screenId: string) => {
            socket.join(`screen-${screenId}`);
        });
        socket.on('leave_screen', (screenId: string) => {
            socket.leave(`screen-${screenId}`);
        });
    });

    return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}