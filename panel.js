// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ajax

const sendAjax = {
  post: async ({ data, url }) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "json";
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(data);

    const response = await new Promise((res, rej) => {
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          res(xhr.response);
          return;
        }
      };
    });

    return response;
  },
  get: async ({ data, url }) => {
    const queryString = Object.keys(data)
      .map(key => `${key}=${data[key]}`)
      .join("&");
    const xhr = new XMLHttpRequest();
    xhr.responseType = "json";
    xhr.open("GET", `${url}?${queryString}`);
    xhr.send(null);

    const response = await new Promise((res, rej) => {
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          res(xhr.response);
          return;
        }
      };
    });

    return response;
  }
};

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- channel

// 与当前页面的DevTool Page之间建立一个channel
let channel = null;
channel = chrome.runtime.connect(null, {
  name: chrome.devtools.inspectedWindow.tabId.toString()
});
var page = 0
// 监听channel消息
channel.onMessage.addListener(result => {
  const { isSuccess, data, mssage } = result;
  // if (!isSuccess) {
  //     document.querySelector('#error').innerHTML += mesage;
  //     return;
  // }

  const { method, queryString, url, response } = data;
  // document.querySelector('#result').innerHTML += url + '<br>';
  // if(url.indexOf('api/order/searchlist')> -1){
  if ( url.indexOf("api/order/searchlist") > -1 ) {
    sendMessageToContentScript({type:'list',data:response,queryString}, response => {
        console.log(response)
        if (response == '完成导出') {
            document.getElementById('loading').style.display = "none";
            document.querySelector("#all").innerHTML = page
        }else if(response == '不处理'){
          console.log('不处理')
        } else {
          if (document.querySelector("#page")) {
            document.querySelector("#page").innerHTML = 0;
            document.querySelector("#page").innerHTML = (undefined === response || null === response || undefined === response.page || null === response.page) ? 0 : response.page;
          }
          ++page
          document.querySelector("#all").innerHTML = page
          document.querySelector("#line").innerHTML = 0
        };
    });
  }else if(url.indexOf("receiveinfo") > -1 ){
    if(JSON.parse(data.response).msg == '您的账户存在安全风险，请稍后再试' ){
      document.getElementById('error').style.display = "block";
      document.getElementById('loading').style.display = "none";
    }else{
      sendMessageToContentScript({type:'user',data:data}, response => {
        console.log(response)
          if (response == '完成导出') {
              document.getElementById('loading').style.display = "none";
              document.querySelector("#all").innerHTML = page
          }else{
            document.querySelector("#line").innerHTML = (undefined === response || null === response) ? 0 : response
          };

        });
    }

  }
});
var firstTabID = ''

// 获取首次选项卡ID
function getFirstTabId() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // if (callback) callback(tabs.length ? tabs[0].id : null);
    firstTabID = tabs.length ? tabs[0].id : null
  });
}
getFirstTabId()

// 获取当前选项卡ID
function getCurrentTabId(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (callback) callback(tabs.length ? tabs[0].id : null);
  });
}

function sendMessageToContentScript(message, callback) {
  // getCurrentTabId(tabId => {
    chrome.tabs.sendMessage(firstTabID, message, function (response) {
      if (callback) callback(response);
    });
  // });
}

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- Panel页面中的事件

// 点击按钮，模拟发起ajax请求
document.querySelector("#button").addEventListener("click", async () => {
    page = 1
    document.getElementById('loading').style.display = "block";
    document.getElementById('error').style.display = "none";

    document.querySelector("#all").innerHTML = 0
    getFirstTabId()
    setTimeout(function(){
      sendMessageToContentScript('start', response => {
        if (document.querySelector("#page")) {
          document.querySelector("#page").innerHTML = (undefined === response || null === response) ? 0 : response;
        }
        if (document.querySelector("#start")) {
          document.querySelector("#start").innerHTML = (undefined === response || null === response) ? 0 : response;
        }
      });
    },1000)

});


document.querySelector("#export").addEventListener("click", async () => {
  if(Number(document.querySelector("#all").innerHTML)>0){
    sendMessageToContentScript(
      { type: 'export', userName: document.querySelector("#userName").value, password: document.querySelector("#password").value},
      response => {
    });
  }
});


document.querySelector("#stop").addEventListener("click", async () => {
  document.getElementById('loading').style.display = "none";
  sendMessageToContentScript('stop', response => {
  });
});

document.querySelector("#pageLimit").addEventListener("change", async () => {
  console.log(document.querySelector("#pageLimit").value)
  sendMessageToContentScript({type:'pageLimit',num:document.querySelector("#pageLimit").value}, response => {
  });
});

document.querySelector("#userName").addEventListener("change", async () => {
  console.log(document.querySelector("#userName").value)
  sendMessageToContentScript({type:'userName',num:document.querySelector("#userName").value}, response => {
  });
});

document.querySelector("#password").addEventListener("change", async () => {
  console.log(document.querySelector("#password").value)
  sendMessageToContentScript({type:'password',num:document.querySelector("#password").value}, response => {
  });
});

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
