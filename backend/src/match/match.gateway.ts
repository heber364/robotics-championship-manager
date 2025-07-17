import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
  WsResponse,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchEntity } from './entities/match.entity';
import { WsGuard } from '../common/guards/ws-at.guard';
import { Logger, UseGuards } from '@nestjs/common';

@UseGuards(WsGuard)
@WebSocketGateway({
  namespace: '/match',
  cors: {
    origin: '*',
  },
})
export class MatchGateway implements OnGatewayInit{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MatchGateway.name);

  private getRoomName(matchId: number): string {
    return `match-${matchId}`;
  }

  afterInit(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Gateway initialized for socket ID: ${socket.id}`);
  }


  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() matchId: number,
  ){
    const roomName = this.getRoomName(matchId);
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room ${roomName}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() matchId: number) {
    const roomName = this.getRoomName(matchId);
    client.leave(roomName);
    this.logger.log(`Client ${client.id} left room ${roomName}`);
  }

  public broadcastMatchUpdate(matchId: number, payload: MatchEntity) {
    const roomName = this.getRoomName(matchId);
    this.server.to(roomName).emit('updated', payload);
    this.logger.log(`Broadcasting update for match ${matchId} in room ${roomName}`);
  }
}
