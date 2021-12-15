var isDev = false;

var commonURL = isDev ? "https://kf.cc.cc" : "https://kf.wtjzy.com";
var timeClick = 2000; //1000=1秒

var isInit = true,
    initData = {},
    commentPageTotal = 0,
    commentPageCurrent = 0;

function getInitData() {
    $.ajax({
        type: "get",
        url:
            "https://fxg.jinritemai.com/common/index/index?_" +
            new Date().getTime(),
        dataType: "json",
        success: function (res) {
            initData = res.data;
        },
    });
}

function nextClick() {
    $($view[viewIndex]).trigger("click");
}

function timeNextClick() {
    setTimeout(function () {
        nextClick();
    }, timeClick);
}

getInitData();
var $view = "",
    $copyButton = [],
    viewIndex = 0,
    pageList = [],
    failTime = 0,
    runFlag = false,
    userInfo = {},
    allList = [],
    sendComplete = null,
    sendListComplete = null,
    userName = "",
    password = "",
    currentPage = 0;

var timeStamp = new Date().getTime();
var batchNo = Number(timestampToTime(timeStamp));
var pageLimit = 100;
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request == "start") {
        sendListComplete = sendResponse;
        sendComplete = sendResponse;
        timeStamp = new Date().getTime();
        batchNo = Number(timestampToTime(timeStamp));
        allList = [];
        pageList = [];
        userInfo = {};
        currentPage = $(".auxo-pagination .auxo-pagination-item-active a")
            .text()
            .replace(/[^0-9]/gi, "");
        failTime = 0;
        runFlag = true;
        sendComplete(currentPage);
        if (currentPage == 1) {
            $("[type='submit']").trigger("click");
        } else {
            handleFirstClick(currentPage - 1);
        }
    } else if (request.type == "list") {
        sendListComplete = sendResponse;
        var reqPage =
            Number(
                request.queryString.filter((item, index) => {
                    return item.name == "page";
                })[0].value
            ) + 1;
        if (runFlag) {
            if (Number(currentPage) == reqPage) {
                console.log("列表数据======================");
                console.log(JSON.parse(request.data));
                pageList = JSON.parse(request.data).data;

                //处理已经手动点击"小眼睛"的数据==================================begin
                $copyButton = $("span[data-kora='复制']"); //点击小眼睛后,出现的 复制"收货地址" 的按钮
                if ($copyButton.length > 0) {
                    console.log("存在手动解密订单======================");
                    var orderIndex = 0; //订单的位置索引
                    $copyButton.each(function (index, value) {
                        orderIndex = $(value)
                            .parents(".mortise-rich-table-row")
                            .index();
                        // pageList[orderIndex].shop_order_id;

                        $user_nickname = $(value) .parent() .parent() .parent() .parent() .prev() .text() ? $(value) .parent() .parent() .parent() .parent() .prev() .text() : "";
                        if ("" !== $user_nickname) {
                            //昵称
                            pageList[orderIndex].user_nickname = $user_nickname;
                        }
                        $receiverInfo = $(value).parent().parent().text() ? $(value).parent().parent().text() : "";
                        $receiverInfoArr = $receiverInfo.split("，");
                        if (
                            undefined !== $receiverInfoArr[0] &&
                            null !== $receiverInfoArr[0]
                        ) {
                            //收货人
                            pageList[orderIndex].receiver_info.post_receiver =
                                $receiverInfoArr[0];
                        }
                        if (
                            undefined !== $receiverInfoArr[1] &&
                            null !== $receiverInfoArr[1]
                        ) {
                            //收货电话
                            pageList[orderIndex].receiver_info.post_tel =
                                $receiverInfoArr[1];
                        }
                        if (
                            undefined !== $receiverInfoArr[2] &&
                            null !== $receiverInfoArr[2]
                        ) {
                            //收货地址
                            var detail = "";
                            for (let i = 2; i < $receiverInfoArr.length; i++) {
                                //有可能","不止两个,将后面的拼接
                                detail += $receiverInfoArr[i];
                            }
                            if ("" !== detail) {
                                for (const k in pageList[orderIndex]
                                    .receiver_info.post_addr) {
                                    //去除省市等已知信息,得到具体的街道
                                    if (
                                        pageList[orderIndex].receiver_info
                                            .post_addr[k].name
                                    ) {
                                        detail = detail.replace(
                                            pageList[orderIndex].receiver_info
                                                .post_addr[k].name,
                                            ""
                                        );
                                    }
                                }
                                pageList[
                                    orderIndex
                                ].receiver_info.post_addr.detail =
                                    detail.trim();
                            }
                        }
                    });
                }

                //处理已经手动点击"小眼睛"的数据==================================end

                allList = [...allList, ...pageList];

                $view = $("[data-kora='view']"); //眼睛DOM
                if ($view.length > 0) {
                    viewIndex = 0; //从第1个"小眼睛"开始点击
                    checkViewData(
                        pageList[
                            $($view[viewIndex])
                                .parents(".mortise-rich-table-row")
                                .index()
                        ],
                        nextClick
                    );
                } else {
                    setTimeout(function () {
                        composeData();
                    }, timeClick);
                }
            } else {
                sendListComplete("不处理");
                --currentPage;
                handleClick();
            }
        }
    } else if (request.type == "user") {
        if (runFlag) {
            sendComplete = sendResponse;
            var response =
                    request.data.response && JSON.parse(request.data.response),
                order_id = "";
            order_id = request.data.queryString.filter((item, index) => {
                return item.name == "order_id";
            })[0].value;
            if (response.data) {
                console.log("解密请求====================");
                console.log(response.data);

                var receive_info = response.data.receive_info;
                if (response.data.nick_name) {
                    receive_info.nick_name = response.data.nick_name;
                }
            }
            if (response && response.msg.indexOf("不允许") > -1) {
                userInfo[order_id] = null;
                ++failTime;
                // if (failTime > 5) {
                if (failTime > 500) {
                    console.log("结束，将数据传给后台");
                    console.log(userInfo);
                    runFlag = false;
                    composeData(true);
                } else {
                    sendComplete(viewIndex);
                    nextView(order_id);
                }
            } else if (receive_info) {
                console.log("获取到用户信息=============================");
                console.log(receive_info);
                userInfo[order_id] = receive_info;
                sendComplete(viewIndex);
                nextView(order_id);
            } else if (request.action) {
                //账户存在安全风险,依然点击下一页
                sendComplete(viewIndex);
                nextView(order_id);
            }
        }
    } else if (request == "stop") {
        runFlag = false;
    } else if (request.type == "pageLimit") {
        pageLimit = Number(request.num);
    } else if (request.type == "userName") {
        userName = String(request.num);
    } else if (request.type == "password") {
        password = String(request.num);
    } else if (request.type == "export") {
        userName = String(request.userName);
        password = String(request.password);
        exportList();
    } else if (request.type == "nextClick") {

    }
    return true;
});

function nextView(order_id) {
    if (pageList[pageList.length - 1].shop_order_id == order_id) {
        composeData();
    } else {
        ++viewIndex;
        checkViewData(
            pageList[
                $($view[viewIndex]).parents(".mortise-rich-table-row").index()
            ],
            timeNextClick
        );
    }
}

function checkViewData(row, func) {
    var param = {
        createTime:
            undefined === row ||
            null === row ||
            undefined === row.create_time ||
            null === row.create_time
                ? ""
                : row.create_time,
        shopOrderId:
            undefined === row ||
            null === row ||
            undefined === row.shop_order_id ||
            null === row.shop_order_id
                ? ""
                : row.shop_order_id,
        douShopId: Number(initData.toutiao_id),
    };
    $.ajax({
        type: "get",
        url: commonURL + "/getOrderReceiverInfo",
        dataType: "json",
        data: param,
        success: function (res) {
            // {"code":0,"msg":"success","requestId":"d0d84cf49ac9","data":{"shopOrderId":"4852661794301281701","receiverInfo":null}}
            if (res.data.receiverInfo) {
                userInfo[res.data.shopOrderId] = res.data.receiverInfo;
                nextView(res.data.shopOrderId);
            } else {
                console.log("点击下一个眼睛======================");
                func();
            }
        },
    });
}
function composeData(isComplete) {
    let ids = Object.keys(userInfo);
    console.log("请求后端======================");
    console.log(pageList);
    let submitList = pageList.filter((item, index) => {
        return (
            ids.includes(item.shop_order_id) ||
            item.receiver_info.post_receiver != "***"
        );
    });
    submitList.forEach((item, index) => {
        if (userInfo[item.shop_order_id]) {
            item.receiver_info = userInfo[item.shop_order_id];
            if (userInfo[item.shop_order_id].nick_name) {
                item.user_nickname = userInfo[item.shop_order_id].nick_name;
            }
        } else {
            item.receiver_info = item.receiver_info;
        }
    });

    if (submitList.length > 0) {
        // if (false) {
        $.ajax({
            type: "POST",
            url: commonURL + "/saveTikTokOrder",
            contentType: "application/json;charset=utf-8",
            data: JSON.stringify({
                data: submitList,
                batchNo: batchNo,
                timeStamp: Number(timeStamp),
                douShopId: Number(initData.toutiao_id),
                douShopName: initData.shop_name,
            }),
            dataType: "json",
            success: function (res) {
                if (isComplete) {
                    exportList();
                } else {
                    console.log(
                        "当前页上传完成，点击下一页============================="
                    );
                    handleClick();
                }
            },
            complete: function (res) {},
        });
    }
}

/**
 * 导出订单
 * @param         {*}
 * @return        {*}
 */
function exportList() {
    if (!userName || !password) {
        return false;
    }
    var param = {
        batchNo: batchNo,
        timeStamp: Number(timeStamp),
        douShopId: Number(initData.toutiao_id),
        douShopName: initData.shop_name,
        username: userName.trim(),
        password: password,
    };
    const queryString = Object.keys(param)
        .map(
            (key) => `$ {
        key
    } = $ {
        param[key]
    }`
        )
        .join("&");
    if (typeof sendComplete === "function") {
        sendComplete("完成导出1");
    }
    if (typeof sendListComplete === "function") {
        sendListComplete("完成导出2");
    }
    var DownLoadFile = function (options) {
        var config = $.extend(true, { method: "post" }, options);
        var $iframe = $('<iframe id="down-file-iframe" />');
        var $form = $(
            '<form target="down-file-iframe" method="' + config.method + '" />'
        );
        $form.attr("action", config.url);
        for (var key in config.data) {
            $form.append(
                '<input type="hidden" name="' +
                    key +
                    '" value="' +
                    config.data[key] +
                    '" />'
            );
        }
        $iframe.append($form);
        $(document.body).append($iframe);
        $form[0].submit();
        $iframe.remove();
    };
    //post
    DownLoadFile({
        url: commonURL + "/downloadTikTokOrder",
        data: param,
    });
}
var itemNum = 0;

function handleFirstClick(page) {
    var clickPageClass = ".auxo-pagination-item-" + page;
    var $clickPage = $(".auxo-pagination").find(clickPageClass);
    $clickPage.trigger("click");
}

/**
 * 点击下一页
 * @param         {*}
 * @return        {*}
 */
function handleClick() {
    var totalNum = $(".auxo-pagination .auxo-pagination-total-text span")
        .text()
        .replace(/[^0-9]/gi, "");
    itemNum = $(
        ".auxo-pagination .auxo-select-selector .auxo-select-selection-item"
    )
        .text()
        .replace(/[^0-9]/gi, "");
    var pageNum = Math.ceil(totalNum / itemNum);
    pageNum = pageNum > pageLimit ? pageLimit : pageNum;
    if (currentPage < pageNum) {
        currentPage++;
        sendListComplete({
            page: currentPage,
            size: itemNum,
        });
        var clickPageClass = ".auxo-pagination-item-" + currentPage;
        var $clickPage = $(".auxo-pagination").find(clickPageClass);
        $clickPage.trigger("click");
    } else {
        console.log("没有下一页，导出当前所有数据");
        runFlag = false;
        exportList();
    }
}
var autoFlag = true;

function handlePageData() {
    var timer1 = null;
    if (timer1) {
        clearTimeout(timer1);
    }
    timer1 = setTimeout(function () {
        var $view = $("[data-kora='view']");
        var $trArr = $("[data-kora='view']").parents(".mortise-rich-table-row");
        $view.each(function (index, item) {
            $(item).trigger("click");
        });
        console.log("获取到用户信息点击按钮");
        var checkVer = setInterval(function () {
            if ($("#fxg_risk_captcha_container").children().length == 0) {
                clearInterval(checkVer);
                console.log("用户通过验证");
                if (!autoFlag) {
                    autoFlag = true;
                    $view.each(function (index, item) {
                        $(item).trigger("click");
                    });
                    handleClick();
                }
            } else {
                autoFlag = false;
                console.log("等待用户操作通过验证");
            }
        }, 2000);
    }, 3000);
}
function checkChildren($item) {
    if ($item.children().length > 0) {
        $item.children().each(function (index, item) {
            checkChildren($(item));
        });
        var text = $item.clone().children().remove().end().text();
        if (text.trim() != "") {
            console.log(text);
        }
    } else {
        if ($item.text().trim() != "") {
            console.log($item.text());
        }
    }
}
function timestampToTime(timestamp, isShowHour) {
    var date = new Date(timestamp);
    var Y = date.getFullYear() + "";
    var M =
        (date.getMonth() + 1 < 10
            ? "0" + (date.getMonth() + 1)
            : date.getMonth() + 1) + "";
    var D = (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + "";
    var D2 = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    var h =
        (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) + "";
    var m =
        (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) +
        "";
    var s =
        date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    var strDate1 = Y + M + D + h + m + s;
    var strDate2 = Y + M + D2;
    if (!isShowHour) {
        return strDate2 + "" + MathRand();
    } else {
        return strDate1 + "" + MathRand();
    }
}
function MathRand() {
    var Num = "";
    for (var i = 0; i < 6; i++) {
        Num += Math.floor(Math.random() * 10);
    }
    return Num;
}
