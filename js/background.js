chrome.runtime.onInstalled.addListener(function () {
    /*监听页面切换*/
    chrome.declarativeContent.onPageChanged.removeRules(undefined,function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions:[new chrome.declarativeContent.PageStateMatcher({
                pageUrl:{hostEquals:'fxg.jinritemai.com'}   //在developer.chrome.com域名下使用改工具，并且图标变成彩色
                // pageUrl:{urlPrefix:'http'}   //url的前缀是http可以使用此插件
            })],
            /*显示popup.html页面*/
            actions:[new chrome.declarativeContent.ShowPageAction()]
        }])
    })
})
