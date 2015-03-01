(function(){
  var reconnectInterval = 5000;
  var ws;
  var connect = function(){
      console.log("attempting to connect...")
      ws = new WebSocket('ws'+(window.location.protocol === 'https'? 's': "")  +'://localhost:<%= _port %>/');
      ws.onopen = function() {
        console.log("socket open")
        //window.location.reload();
      };
      ws.onerror = function() {
        console.log('socket error. reconnecting...');
        setTimeout(connect, reconnectInterval);
      };
      ws.onclose = function() {
        console.log('socket close. reconnecting...');
        setTimeout(connect, reconnectInterval);
      };
      ws.onmessage =function(message){
        console.log(message)
        switch(message.data){
          case 'reload': window.location.reload(); break;
        }
      };
  };
  connect();
})();
