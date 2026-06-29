import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { countAvailableSeats } from '../modules/screenings/screening_repository.js';

let io: SocketIOServer;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

  io.on('connection', (socket: Socket) => {
    socket.on('join_screening', (screeningId: string) => {
      socket.join(`screening-${screeningId}`);
    });
    socket.on('leave_screening', (screeningId: string) => {
      socket.leave(`screening-${screeningId}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

export async function emitAvailabilityUpdate(screeningId: number): Promise<void> {
  const { availableSeats, totalSeats } = await countAvailableSeats(screeningId);
  getIO().to(`screening-${screeningId}`).emit('availability_update', {
    screeningId: String(screeningId),
    availableSeats,
    totalSeats,
  });
}