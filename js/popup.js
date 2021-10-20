

var clickBox = document.getElementsByTagName('button');


// JS监听
for(let i=0;i<clickBox.length;i++){
    clickBox[i].addEventListener('click',function(ev){
        var oEvent=ev||event;
        var id=oEvent.target.id

        sendMessageToContentScript(id, (response) => {
            if(response) alert('收到来自content-script的回复：'+response);
        });
    },false);
}

// 获取当前选项卡ID
function getCurrentTabId(callback)
{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
    {
        if(callback) callback(tabs.length ? tabs[0].id: null);
    });
}

function sendMessageToContentScript(message, callback)
{
    getCurrentTabId((tabId) =>
    {
        chrome.tabs.sendMessage(tabId, message, function(response)
        {
            if(callback) callback(response);
        });
    });
}
