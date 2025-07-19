import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CommentEntity } from './entities/comment.entity';
import { WsGuard } from '../common/guards/ws-at.guard';
import { Logger, UseGuards } from '@nestjs/common';

@UseGuards(WsGuard)
@WebSocketGateway({
  namespace: '/comment',
  cors: {
    origin: '*',
  },
})
export class CommentGateway implements OnGatewayInit{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CommentGateway.name);

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

  public broadcastCommentUpdate(matchId: number, payload: CommentEntity) {
    const roomName = this.getRoomName(matchId);
    this.server.to(roomName).emit('updated', payload);
    this.logger.log(`Broadcasting update comment for match ${matchId} in room ${roomName}`);
  }

  public broadcastCommentCreated(matchId: number, payload: CommentEntity) {
    const roomName = this.getRoomName(matchId);
    this.server.to(roomName).emit('created', payload);
    this.logger.log(`Broadcasting update comment for match ${matchId} in room ${roomName}`);
  }

  public broadcastCommentDeleted(matchId: number, payload: CommentEntity) {
    const roomName = this.getRoomName(matchId);
    this.server.to(roomName).emit('deleted', payload);
    this.logger.log(`Broadcasting delete comment for match ${matchId} in room ${roomName}`);
  }
}
