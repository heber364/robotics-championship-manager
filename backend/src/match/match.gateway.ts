import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchEntity } from './entities/match.entity';
import { WsGuard } from '../common/guards/ws-at.guard';
import { UseGuards } from '@nestjs/common';
// import { Roles } from 'src/common/decorators';
// import { Role } from 'src/common/enums';
//import { WsRolesGuard } from 'src/common/guards/ws-roles.guard';

@UseGuards(WsGuard)
@WebSocketGateway({
  namespace: '/match',
  cors: {
    origin: '*',
  },
})
export class MatchGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit(@ConnectedSocket() socket: Socket) {
    console.log('MatchGateway initialized');
    console.log(`Socket ID: ${socket.id}`);
  }

  @SubscribeMessage('joinMatchRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() matchId: number) {
    const roomName = `match-${matchId}`;
    void client.join(roomName);
    client.emit('joinedRoom', roomName);
    console.log(`Client ${client.id} joined room: ${roomName}`);
  }

  @SubscribeMessage('leaveMatchRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { matchId: number }) {
    const roomName = `match-${data.matchId}`;
    client.leave(roomName);
  }

  broadcastMatchUpdate(matchId: number, payload: MatchEntity) {
    const roomName = `match-${matchId}`;
    this.server.to(roomName).emit('matchUpdated', payload);
  }
}
