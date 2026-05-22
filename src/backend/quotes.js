
import net from 'net';
import udpClient from './udp';
import cppmsg, { msg } from 'cppmsg';
import { Buffer } from 'buffer';
import  { receiveData }  from '../ctp/dataStruct';
import { infoLog, errorLog } from './log';

const decodeMsg = new cppmsg.msg(receiveData['SP'])
const endecodeMsg = new cppmsg.msg(receiveData['GZ'])
const PriceData = {

}

const serverList = [];

const historyData= {};

let emitFn = function(){};
function sendParseData(parseData){

     //开盘会有错误数据进入 todo判断正无穷
    //  console.log(parseData)
  if(parseData.OpenPrice >  Number.MAX_SAFE_INTEGER  ||  parseData.LastPrice> Number.MAX_SAFE_INTEGER){
      console.log(parseData.InstrumentID, 'data')
      return
  }
  
  emitFn(parseData)

}
function parseReceiveData(data){
     
  
 
  let parseData;
  
  parseData = decodeMsg.decodeMsg(data);
  // console.log(parseData)
  sendParseData(parseData)
  // console.log(parseData)
  
}
function parseEncodeData(data){
 
  const key = data[0]; 
  for(let i = 1; i<data.length ; i++){
    data[i] = data[i] ^ key;
  }
  
  const parseData = endecodeMsg.decodeMsg(data.slice(1));
  // console.log(parseData)
  sendParseData(parseData)
}

const ReqSubscribeMsg = new cppmsg.msg([
  ['size', 'int32'],
  ['iCmdID', 'int32'],
  ['Stru_ReqSubscribe', 'object', [['RequestID', 'int32'], ['InstrumentID', 'string', '32']]]
])
class TcpClient{
  constructor(args){
    this.args = args;
    this.index = 1;
    this.openInstruments = [];
    this.connectcount = 0
    this.needreconnect = true;
  
  }
  addinstrument(instrument){
    if(!this.openInstruments.includes(instrument)){
      this.openInstruments.push(instrument);
      this.writeinstrument(instrument)
    }
  }
  writeinstrument(instrument){
    this.index ++; 
    const size = this.size;
    const iCmdID = this.iCmdID;
    if(this.tcp_client){
      this.tcp_client.write(ReqSubscribeMsg.encodeMsg2({
        size,
        iCmdID,
        Stru_ReqSubscribe: {
          RequestID: this.index,
          InstrumentID: instrument
        }
      }))
    }
    
  }
  checktype(){
    let {url} = this.args; 
    if(!Array.isArray(url)){
      url = [url]
    }
    const _url = url[0].url.split(':');
    let host= _url[0];
    let port= _url[1];
    let cmd;
     this.type = url[0].type;
    if(url.length >1 && this.type === 'tcp'){
      return new Promise(resolve => {
        console.log('check start')
        const tcp_client = new net.Socket();
        // tcp_client.setTimeout(2000)
        let timeout =  setTimeout(()=>{
          console.log(host, port, 'timeout')
          infoLog(`${host} 检查超时`)
          const _url = url[1].url.split(':');
          this.host= _url[0];
          this.port= _url[1];
          this.type = url[1].type;
          tcp_client.destroy()
          resolve()
        }, 3000)
        tcp_client.on('error',  (e) => {
          console.log(e, 'error')
        })
        tcp_client.connect({host, port},()=>{
          infoLog(`${host} 检查通过`)
          console.log(host, 'check')
          this.port = port;
          this.host = host;
          tcp_client.destroy()
          
          clearTimeout(timeout)
          resolve()
          
        })
      })
    }else{
      this.port = port;
      this.host = host;
      return Promise.resolve()
    }
  }
  connect(){
    let { instrumentIDs,  iCmdID, size = 36, } = this.args
    if(this.connectcount > 5){
      mainWindow.webContents.send('error-msg', {msg:`行情服务${host}:${port} 链接次数过多，请点击强制重连`});
      return;
    }
    this.connectcount ++ 
    
    let tcp_client;
    // host = '127.0.0.1';
    // port = '18899'
    // if(port === '18899'){
    //   host = '111.229.232.221'
    //   port = '18999'
    // }
    
    if(this.type === 'udp'){
      
      console.log(1111)
      tcp_client = new udpClient();
    }else {
     
      tcp_client = new net.Socket()
    }
    const { host , port} = this;
    console.log(tcp_client.bufferSize, '12122')
    this.tcp_client = tcp_client;
    this.instrumentIDs = instrumentIDs;
    this.iCmdID = iCmdID;
    this.size = size;
    tcp_client.setKeepAlive(true, 5*1000);

    tcp_client.connect({host, port},()=>{
     
      this.openInstruments.forEach(this.writeinstrument.bind(this))
    })
  
   
   
    const headMsg = new cppmsg.msg([
      ['size', 'int32'],
      ['CmdID', 'int32'],
    ])
    let cacheArr = [];
    // let time = +new Date();
    tcp_client.on('data',function(data){
      // console.log(111111111111111)
      // console.log(host, port)
      // let _time = +new Date();
      // console.log(`${_time - time}`);
      // console.log(data.length)
      // time = _time;
      // devLog(data)
      if(cacheArr.length){
        cacheArr.push(data);
        const length = cacheArr.reduce((a,b)=> a + b.length, 0);
        // console.log(length)
        data = Buffer.concat(cacheArr, length);
        cacheArr = [];
      }
    
      while(data.length){
        if(data.length < 8){
          cacheArr.push(data)
          return
        } 
        const _head = headMsg.decodeMsg(data.slice(0, 8));
        const {size, CmdID } = _head; 
        // console.log(1111, size, CmdID, data.length)
        if(data.length < size + 8){
      
          cacheArr.push(data)
          return
        }
    
        const parseData = data.slice(8, size+8);
        if(CmdID === 11){
          parseReceiveData(parseData)
        }else if(CmdID === 12){
          parseEncodeData(parseData)
        }
        data = data.slice(size + 8)
        
      }
    
    })
  
    tcp_client.on('end',function(){
      console.log('data end!');
    })
    // tcp_client.setTimeout(tcp_timeout);
    tcp_client.on('timeout',function(){
      
    
        tcp_client.destroy();
       
        console.log('timeout');
        infoLog('timeout')
    })
    tcp_client.on('close',(hadError ) =>{
      console.log('1231231')
      this.tcp_client = null;
      if( mainWindow && !COLOSEALL){
        if(this.needreconnect){ 
          setTimeout(()=> this.connect(), 1000)
        }
      
      
      }
      infoLog(`data close ${JSON.stringify(hadError)}`);
    })
  
    tcp_client.on('error', function (e) {
   
      mainWindow.webContents.send('error-msg', {msg:`行情服务${host}:${port} 链接错误:${e}。正在重连…………`});
      errorLog(`行情服务${host}:${port} 链接错误:${JSON.stringify(e)}`)
      
    })
  }
  destroy(){
    if(this.tcp_client){
      this.tcp_client.destroy()
    }
   
  }
  changeIns(instruments){
   
    this.args.instrumentIDs = instruments;
    this.instrumentIDs = instruments;
    // this.destroy()
  }
}





export function start(args){
   let tcp_client = new TcpClient(args);
    tcp_client.checktype().then(()=>{
    console.log('check-client finish')
    event.sender.send('check-client')
    tcp_client.connect();
  })
 
  serverList.push(tcp_client)
}
export const getQuotsData =() =>  PriceData;

export function addSubscribe(fn){
  subscribeList.push(fn)
};

export function onData(fn){
  emitFn = fn;
}