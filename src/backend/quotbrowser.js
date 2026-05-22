import { BrowserWindow} from 'electron';

const quotsList = [];

function getAllList(){
    return quotsList.map( e=> e.win)
}
 function findWin(id){
    return getAllList.find(e=> e.id === id);
}

function oepnQuot(id, query){
    const open = findWin(id);
    if(open){
        open.fouce()
    }else{
        const win = 
        quotsList.push({
            id,
            win
        })
    }
}
function sendData(data){
    const {InstrumentID} = data;
    const  win = findWin(id);
    if(win){
        win.sender.send(`receive-data`, data)
    }
}
export {findWin, getAllList, oepnQuot, sendData} 
 