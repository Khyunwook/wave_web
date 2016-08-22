var io = require('socket.io'),
    express = require('express');
    http = require('http'),
    connect = require('connect');
    path = require('path');
var app = express();

app.use(express.bodyParser());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(express.static(path.join(__dirname, 'public/www')));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

var httpServer =http.createServer(app).listen(3100, function(req,res){
    console.log('Socket IO server has been started');
});
// upgrade http server to socket.io server
var io = require('socket.io').listen(httpServer);


var socket_ids = [];

//소캣 시작
io.sockets.on('connection',function(socket){
  //서버에 연결되면 welcome msg 전송
  socket.emit('toclient',{msg:'Welcome !'});

//------------------------CCH Message 전송 구간 Start----------------------------

  //connected car에게 broadcast 할 CCH메시지 전송받음.
  socket.on('to_cch_msg',function( data ){
       //해당 connected car 의 socket정보를 socket_ids 배열에 저장.
       socket_ids[data.carnum] = socket.id;
       console.log('Message from client :', data.coordx, data.coordy, data.carnum, data.maneuver);
       socket.broadcast.emit('from_cch_msg',{
                                             carnum : data.carnum,
                                             coordx : data.coordx,
                                             coordy : data.coordy,
                                             maneuver : data.maneuver
                                            }); // 자신을 제외하고 다른 클라이언트에게 보냄

   });
   //일반차량들이 connected car 에게 전송할 CCH메시지를 전송받음.
   socket.on('to_cch_recv',function(data){
     socketid = socket_ids[data.recv_carnum];
     socket_ids[data.send_carnum] = socket.id;
     console.log('to_cch_recv',data.recv_carnum);
     //해당 connected car 에게만 일반차량들에게 받은 CCH응답 메세지를 전송
     socket.broadcast.to(socketid).emit('from_cch_recv',{ carnum : data.send_carnum });

   });
//------------------------CCH Message 전송 구간 End----------------------------



//------------------------SCH Message 전송 구간 Start---------------------------
    socket.on('to_sch_msg',function( data ){
      socketid = socket_ids[data.scarnum];
      console.log('to_sch_msg scarnum',data.scarnum,'rcarnum',data.rcarnum );
      socket.broadcast.to(socketid).emit('from_sch_msg', { scarnum : data.scarnum,
                                                           rcarnum : data.rcarnum,
                                                           fullpath : data.fullpath });
    });

    socket.on('to_sch_recv', function (data){
      socketid = socket_ids[data.rcarnum];
      console.log('to_sch_recv',data.rcarnum, data.scarnum);
      socket.broadcast.to(socketid).emit('from_sch_recv', { scarnum : data.scarnum,
                                                            rcarnum : data.rcarnum,
                                                            sch_packet : data.sch_packet});
    });

//------------------------SCH Message 전송 구간 End-----------------------------

});
//setInterval(function(){ console.log("cch")},1000);
